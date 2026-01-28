import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { notaHtml } from "../pdf/notaHtml";
import { generatePdf } from "../utils/pdf";

const prisma = new PrismaClient()

const cetakNota = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        const transaksiId = Number(req.params.id)

        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "siswa") {
            return res.status(403).json({
                message: `siswa yang berhak cetak nota`
            })
        }

        // ambil data siswa
        const siswa = await prisma.siswa.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!siswa) {
            return res.status(404).json({
                message: `siswa tidak ditemukan`
            })
        }

        // ambil transaksi milik siswa
        const transaksi = await prisma.transaksi.findFirst({
            where: {
                id: transaksiId,
                id_siswa: siswa.id,
                status: "sampai"
            },
            include: {
                stan_detail: {
                    select: {
                        nama_stan: true
                    }
                },
                detail_transaksi: {
                    include: {
                        menu_detail: {
                            select: {
                                nama_makanan: true
                            }
                        }
                    }
                }
            }
        })

        if (!transaksi) {
            return res.status(404).json({
                message: `Transaksi tidak ada`
            })
        }

        const items = transaksi.detail_transaksi.map(item => ({
            namaMenu: item.menu_detail.nama_makanan,
            harga: item.harga_beli,
            qty: item.qty,
            subtotal: item.qty * item.harga_beli
        }))

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
        res.setHeader("Content-Disposition", "inline; filename=nota.pdf")
        return res.send(pdf)

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}

export { cetakNota }