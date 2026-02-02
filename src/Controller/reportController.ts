import { Request, Response } from "express";
import { PrismaClient, StatusType } from "@prisma/client";

const prisma = new PrismaClient()

// Untuk melihat rekap pemasukan bulanan hanya untuk admin 
const rekapPemasukanBulanan = async (
    req: Request, res: Response
) => {
    try {
        const user = (req as any).user

        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "admin_stan") {
            return res.status(403).json({
                message: `Hanya admin stan yang dapat mengakses ini`
            })
        }

        // ini untuk bulan dan tahun
        const bulan = Number(req.query.bulan) // 1 - 12
        const tahun = Number(req.query.tahun)

        if (!bulan || bulan < 1 || bulan > 12 || !tahun) {
            return res.status(400).json({
                message: `Bulan dan tahun wajib diisi`
            })
        }

        // ambil stan milik admin
        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(404).json({
                message: `Stan tidak ditemukan`
            })
        }

        // range tanggal
        const startDate = new Date(tahun, bulan - 1, 1)
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

        // ambil transaksi yang sudah selesai
        const transaksi = await prisma.transaksi.findMany({
            where: {
                id_stan: stan.id,
                status: StatusType.sampai,
                tanggal: {
                    gte: startDate, lte: endDate
                }
            },
            select: {
                id: true,
                tanggal: true,
                detail_transaksi: {
                    select: {
                        qty: true,
                        harga_beli: true
                    }
                }
            }
        })

        if (transaksi.length === 0) {
            return res.status(200).json({
                message: `tidak ada pemasukkan di periode ini`,
                meta: {
                    bulan,
                    tahun,
                    id_stan: stan.id,
                    nama_stan: stan.nama_stan
                },
                ringkasan: {
                    total_transaksi: 0,
                    total_pemasukan: 0
                },
                rekap_harian: []
            })
        }

        // hitung total pemasukkan dan rekap harian
        let totalPemasukan = 0
        const rekapHarian: Record<string, number> = {}

        transaksi.forEach(trx => {
            // ambil tanggal format tahun-bulan-hari
            const tanggal = trx.tanggal.toISOString().split("T")[0]

            trx.detail_transaksi.forEach(item => {
                // hitung subtotal per item
                const subtotal = item.qty * item.harga_beli
                totalPemasukan += subtotal

                rekapHarian[tanggal] =
                    (rekapHarian[tanggal] || 0) + subtotal
            })
        })

        const rekapPerHari = Object.keys(rekapHarian).map(tgl => ({
            tanggal: tgl,
            pemasukan: rekapHarian[tgl]
        }))

        return res.status(200).json({
            message: `Rekap pemasukan berhasil diambil`,
            meta: {
                bulan,
                tahun,
                id_stan: stan.id,
                nama_stan: stan.nama_stan
            },
            rekap_total: {
                total_transaksi: transaksi.length,
                total_pemasukan: totalPemasukan
            },
            rekap_harian: rekapPerHari
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}


export { rekapPemasukanBulanan}