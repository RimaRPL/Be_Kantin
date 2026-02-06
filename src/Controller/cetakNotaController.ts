import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { notaHtml } from "../pdf/notaHtml"
import { generatePdf } from "../utils/pdf"

const prisma = new PrismaClient()

const cetakNota = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const transaksiId = Number(req.params.id)

    const siswa = await prisma.siswa.findFirst({
      where: {
        id_user: user.id,
        is_active: true
      }
    })

    if (!siswa) {
      return res.status(404).json({ message: `Siswa tidak ditemukan` })
    }

    const transaksi = await prisma.transaksi.findFirst({
      where: {
        id: transaksiId,
        id_siswa: siswa.id,
        status: "sampai"
      },
      include: {
        stan_detail: {
          select: { nama_stan: true }
        },
        detail_transaksi: {
          include: {
            menu_detail: {
              select: { nama_makanan: true }
            }
          }
        }
      }
    })

    if (!transaksi) {
      return res.status(404).json({ message: `Transaksi tidak ada` })
    }

    const items = transaksi.detail_transaksi.map(item => {
      const subtotal = item.qty * item.harga_beli

      return {
        namaMenu: item.menu_detail.nama_makanan,
        harga_awal: item.harga_awal,
        persentase_diskon: item.persentase_diskon,
        harga_beli: item.harga_beli,
        qty: item.qty,
        subtotal
      }
    })

    const html = notaHtml({
      namaStan: transaksi.stan_detail.nama_stan,
      namaSiswa: siswa.nama_siswa,
      orderId: transaksi.id,
      tanggal: transaksi.tanggal.toLocaleDateString("id-ID"),
      jam: transaksi.tanggal.toLocaleTimeString("id-ID"),
      items
    })

    const pdf = await generatePdf(html)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", "attachment; filename=nota.pdf")
    return res.send(pdf)

  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: `Terjadi kesalahan pada server` })
  }
}

export { cetakNota }
