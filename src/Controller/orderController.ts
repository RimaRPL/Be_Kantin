import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusType } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "minimal" })

// CREATE
const createTransaksi = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user

        if (!user) {
            return res.status(401).json({ message: "Tidak dikenal" })
        }

        if (user.role !== "siswa") {
            return res.status(403).json({
                message: "Hanya siswa yang dapat melakukan transaksi"
            })
        }

        // ambil siswa + nama
        const siswa = await prisma.siswa.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            },
            select: {
                id: true,
                nama_siswa: true
            }
        })

        if (!siswa) {
            return res.status(400).json({
                message: `Siswa tidak ditemukan`
            })
        }

        const id_stan = Number(req.body.id_stan)
        const detail_transaksi = req.body.detail_transaksi
        const status = StatusType.belum_dikonfirmasi

        const arrMenuId = detail_transaksi.map(
            (item: any) => item.id_menu
        )

        // cek stan
        const stan = await prisma.stan.findFirst({
            where: {
                id: id_stan,
                is_active: true
            },
            select: {
                id: true,
                nama_stan: true
            }
        })

        if (!stan) {
            return res.status(400).json({
                message: "Stan tidak ditemukan"
            })
        }

        const today = new Date()

        // ambil menu + diskon aktif
        const menus = await prisma.menu.findMany({
            where: {
                id: { in: arrMenuId },
                id_stan,
                is_active: true
            },
            include: {
                menu_diskonDetail: {
                    where: {
                        diskon_detail: {
                            tanggal_awal: { lte: today },
                            tanggal_akhir: { gte: today }
                        }
                    },
                    include: {
                        diskon_detail: {
                            select: {
                                persentase_diskon: true
                            }
                        }
                    }
                }
            }
        })

        // validasi menu
        const invalidMenu = arrMenuId.filter(
            (id: number) => !menus.map(m => m.id).includes(id)
        )

        if (invalidMenu.length > 0) {
            return res.status(400).json({
                message: "Terdapat menu yang tidak tersedia"
            })
        }

        // buat transaksi (kepala)
        const transaksi = await prisma.transaksi.create({
            data: {
                id_siswa: siswa.id,
                id_stan,
                status
            }
        })

        let detailDB: any[] = []
        let detailResponse: any[] = []

        for (const item of detail_transaksi) {
            const menu = menus.find(m => m.id === item.id_menu)!
            const harga_awal = menu.harga

            const diskonAktif = menu.menu_diskonDetail[0]
            const persentase_diskon =
                diskonAktif?.diskon_detail.persentase_diskon ?? 0

            const harga_setelah_diskon =
                persentase_diskon > 0
                    ? harga_awal - (harga_awal * persentase_diskon) / 100
                    : harga_awal

            const subtotal = harga_setelah_diskon * item.qty

            // simpan ke DB (sesuai schema)
            detailDB.push({
                id_transaksi: transaksi.id,
                id_menu: item.id_menu,
                qty: item.qty,
                harga_beli: harga_setelah_diskon
            })

            // response (bebas & informatif)
            detailResponse.push({
                id_menu: item.id_menu,
                qty: item.qty,
                harga_awal,
                persentase_diskon,
                harga_beli: harga_setelah_diskon,
                subtotal
            })
        }

        await prisma.detail_transaksi.createMany({
            data: detailDB
        })

        const total_harga = detailResponse.reduce(
            (total, item) => total + item.subtotal,
            0
        )

        return res.status(200).json({
            message: "Transaksi berhasil dibuat",
            data: {
                transaksi: {
                    id: transaksi.id,
                    tanggal: transaksi.tanggal,
                    status: transaksi.status,
                    siswa: siswa.nama_siswa,
                    stan: stan.nama_stan
                },
                detail: detailResponse,
                total_harga
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
}


// HELPER UPDATE STATUS
const updateStatusTransaksi = async (
    req: Request,
    res: Response,
    prevStatus: StatusType,
    nextStatus: StatusType,
    successMessage: string
) => {
    try {
        const userId = (req as any).user.id
        const transaksiId = Number(req.params.id)

        // 1. Ambil transaksi
        const transaksi = await prisma.transaksi.findUnique({
            where: { id: transaksiId }
        })

        if (!transaksi) {
            return res.status(404).json({
                message: `Transaksi tidak ditemukan`
            })
        }

        // stan
        const stan = await prisma.stan.findFirst({
            where: {
                id: transaksi.id_stan,
                id_user: userId,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(403).json({
                message: `Anda tidak memiliki akses`
            })
        }

        // 3. Validasi status
        if (transaksi.status !== prevStatus) {
            return res.status(400).json({
                message: `Transaksi tidak bisa diproses`
            })
        }

        // 4. Update status
        const updatedStatusTransaksi = await prisma.transaksi.update({
            where: { id: transaksiId },
            data: { status: nextStatus },
            include: {
                siswa_detail: {
                    select: {
                        nama_siswa: true
                    }
                },
                detail_transaksi: {
                    select: {
                        qty: true,
                        menu_detail: {
                            select: {
                                nama_makanan: true
                            }
                        }
                    }
                }
            }
        })


        return res.status(200).json({
            message: successMessage,
            data: updatedStatusTransaksi
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}


// UPDATE PER STEP JADI GA LANGSUNG DAN INI URUT HANYA UNTUK ADMIN 
const masakStatus = (req: Request, res: Response) =>
    updateStatusTransaksi(
        req,
        res,
        StatusType.belum_dikonfirmasi,
        StatusType.dimasak,
        `Pesanan sedang dimasak`
    )

const antarStatus = (req: Request, res: Response) =>
    updateStatusTransaksi(
        req,
        res,
        StatusType.dimasak,
        StatusType.diantar,
        `Pesanan sedang diantar`
    )

const sampaiStatus = (req: Request, res: Response) =>
    updateStatusTransaksi(
        req,
        res,
        StatusType.diantar,
        StatusType.sampai,
        `Pesanan sudah sampai`
    )


// READ UNTUK SISWA 
const readTransaksiSiswa = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        const type = req.query.type // untuk filter berdasarkan jenis status
        const bulan = Number(req.query.bulan)
        let tahun = Number(req.query.tahun)

        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "siswa") {
            return res.status(403).json({
                message: `Hanya siswa yang dapat mengakses data ini`
            })
        }

        // mengambil data siswa 
        const siswa = await prisma.siswa.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!siswa) {
            return res.status(400).json({
                message: `siswa tidak ditemukan`
            })
        }

        // FILTER STATUS
        let statusFilter: any

        if (type === "history") {
            statusFilter = {
                in: [StatusType.sampai]
            }
        } else {
            statusFilter = {
                in: [StatusType.belum_dikonfirmasi,
                StatusType.dimasak,
                StatusType.diantar
                ]
            }
        }

        // FILTER BULAN
        let dateFilter: any = undefined

        if (type === "history") {
            if (!bulan || bulan < 1 || bulan > 12) {
                return res.status(400).json({
                    message: `Bulan wajib diisi untuk melihat histori`
                })
            }

            if (!tahun) {
                tahun = new Date().getFullYear()
            }

            dateFilter = {
                gte: new Date(tahun, bulan - 1, 1),
                lte: new Date(tahun, bulan, 0, 23, 59, 59)
            }
        }

        const transaksi = await prisma.transaksi.findMany({
            where: {
                id_siswa: siswa.id,
                status: statusFilter,
                 ...(dateFilter && { tanggal: dateFilter })
            },
            orderBy: { tanggal: "desc" },
            select: {
                id: true,
                tanggal: true,
                status: true,
                stan_detail: {
                    select: {
                        id: true,
                        nama_stan: true,
                        nama_pemilik: true
                    }
                },
                detail_transaksi: {
                    select: {
                        qty: true,
                        harga_beli: true,
                        menu_detail: {
                            select: {
                                id: true,
                                nama_makanan: true
                            }
                        }
                    }
                }
            }
        })


        // untuk menampilkan total transaksi ( krn tidak ada dischema)
        const result = transaksi.map(trx => {
            let total_harga = 0

            const detail = trx.detail_transaksi.map(item => {
                const subtotal = item.qty * item.harga_beli
                total_harga += subtotal

                return {
                    id: item.menu_detail.id,
                    nama_makanan: item.menu_detail.nama_makanan,
                    qty: item.qty,
                    harga_beli: item.harga_beli,
                    subtotal
                }
            })

            return {
                id: trx.id,
                tanggal: trx.tanggal,
                status: trx.status,
                stan: trx.stan_detail,
                detail,
                total_harga
            }
        })


        return res.status(200).json({
            message: type === "history"
                ? `Riwayat transaksi`
                : `Transaksi dalam proses`,
            data: result
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

// READ UNTUK ADMIN ( DIFILTER BERDASARKAN BULAN)
const readTransaksiByBulanAdmin = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user

        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "admin_stan") {
            return res.status(403).json({
                message: `Hanya Admin yang dapat mengakses data ini`
            })
        }

        // untuk filter bulan dan tahun
        const bulan = Number(req.query.bulan) // 1 - 12
        const tahun = Number(req.query.tahun)

        if (!bulan || !tahun) {
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

        // untuk menentukan range tanggal
        const startDate = new Date(tahun, bulan - 1, 1)  // krn js index nya 0 maka bulan -1
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59) //0 untuk hari terakhir pada bulan itu, 23,59,59 itu untuk jam

        // ambil transaksi
        const transaksi = await prisma.transaksi.findMany({
            where: {
                id_stan: stan.id,
                tanggal: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                tanggal: "desc"
            },
            select: {
                id: true,
                id_stan: true,
                tanggal: true,
                status: true,
                siswa_detail: {
                    select: {
                        id: true,
                        nama_siswa: true
                    }
                },
                detail_transaksi: {
                    select: {
                        id: true,
                        id_transaksi: true,
                        qty: true,
                        harga_beli: true,
                        menu_detail: {
                            select: {
                                id: true,
                                nama_makanan: true
                            }
                        }
                    }
                }
            }
        })


        const result = transaksi.map(trx => {
            let total_harga = 0

            const detail = trx.detail_transaksi.map(item => {
                const subtotal = item.qty * item.harga_beli
                total_harga += subtotal

                return {
                    nama_makanan: item.menu_detail.nama_makanan,
                    qty: item.qty,
                    harga_beli: item.harga_beli,
                    subtotal
                }
            })

            return {
                id: trx.id,
                tanggal: trx.tanggal,
                status: trx.status,
                siswa: trx.siswa_detail.nama_siswa,
                detail,
                total_harga
            }
        })
        return res.status(200).json({
            message: `Data transaksi berhasil diambil`,
            data: result
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

export { createTransaksi, masakStatus, antarStatus, sampaiStatus, readTransaksiSiswa, readTransaksiByBulanAdmin }
