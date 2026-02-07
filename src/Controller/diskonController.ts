import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({ errorFormat: "minimal" })

// CREATE
const createDiskon = async (req: Request, res: Response) => {
    try {
        const stan = (req as any).stan

        const {
            nama_diskon,
            persentase_diskon,
            tanggal_awal,
            tanggal_akhir,
            menu_id
        } = req.body

        const startDate = new Date(tanggal_awal)
        const endDate = new Date(tanggal_akhir)
        endDate.setHours(23, 59, 59, 999)

        const now = new Date()
        if (startDate >= endDate) {
            return res.status(400).json({ message: `Tanggal tidak benar` })
        }

        if (endDate < now) {
            return res.status(400).json({
                message: `Tanggal diskon tidak boleh di masa lalu`
            })
        }

        if (persentase_diskon <= 0 || persentase_diskon >= 100) {
            return res.status(400).json({ message: `Persentase diskon tidak benar` })
        }

        const menus = await prisma.menu.findMany({
            where: {
                id: { in: menu_id },
                id_stan: stan.id,
                is_active: true
            }
        })

        if (menus.length !== menu_id.length) {
            return res.status(400).json({ message: `Menu tidak valid` })
        }

        const overlap = await prisma.menu_diskon.findFirst({
            where: {
                id_menu: { in: menu_id },
                diskon_detail: {
                    tanggal_awal: { lte: endDate },
                    tanggal_akhir: { gte: startDate }
                }
            }
        })

        if (overlap) {
            return res.status(400).json({
                message: `Menu sudah memiliki diskon `
            })
        }

        const diskon = await prisma.diskon.create({
            data: {
                nama_diskon,
                persentase_diskon,
                tanggal_awal: startDate,
                tanggal_akhir: endDate
            }
        })

        await prisma.menu_diskon.createMany({
            data: menu_id.map((id_menu: number) => ({
                id_menu,
                id_diskon: diskon.id
            }))
        })

        return res.status(200).json({
            message: `Diskon berhasil dibuat`,
            data: {
                diskon,
                jumlah_menu: menu_id.length
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `Terjadi kesalahan server` })
    }
}

/*READ*/
const readDiskon = async (req: Request, res: Response) => {
    try {
        const stan = (req as any).stan
        const search = req.query.search?.toString() ?? ""
        const status = req.query.status?.toString()
        const now = new Date()

        const diskon = await prisma.diskon.findMany({
            where: {
                nama_diskon: { contains: search },
                // Filter status waktu 
                ...(status === "aktif" && {
                    tanggal_awal: { lte: now },
                    tanggal_akhir: { gte: now },
                }),
                ...(status === "akan datang" && {
                    tanggal_awal: { gt: now },
                }),
                ...(status === "sudah hangus" && {
                    tanggal_akhir: { lt: now },
                }),
                menu_diskonDetail: {
                    some: {
                        menu_detail: { id_stan: stan.id }
                    }
                }
            },
            include: {
                menu_diskonDetail: {
                    include: {
                        menu_detail: true 
                    }
                }
            },
            orderBy: { tanggal_awal: 'desc' }
        })

        const result = diskon.map(d => {
            // status
            let labelStatus = "sudah hangus"
            if (now < d.tanggal_awal) labelStatus = "akan datang"
            else if (now <= d.tanggal_akhir) labelStatus = "aktif"

            const menu = d.menu_diskonDetail.map(md => {
                const hargaAwal = md.menu_detail.harga
                return {
                    id: md.menu_detail.id,
                    nama_makanan: md.menu_detail.nama_makanan,
                    harga_awal: hargaAwal,
                    harga_setelah_diskon: Math.round(
                        hargaAwal - (hargaAwal * d.persentase_diskon) / 100
                    )
                }
            })

            return {
                id: d.id,
                nama_diskon: d.nama_diskon,
                persentase_diskon: d.persentase_diskon,
                tanggal_awal: d.tanggal_awal,
                tanggal_akhir: d.tanggal_akhir,
                status: labelStatus,
                jumlah_menu: menu.length,
                menu
            }
        })

        return res.status(200).json({
            message: `Data diskon berhasil ditampilkan`,
            data: result
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: `Terjadi kesalahan server` })
    }
}

/* UPDATE */
const updateDiskon = async (req: Request, res: Response) => {
    try {
        const stan = (req as any).stan
        const id_diskon = Number(req.params.id)

        // cek diskon milik stan
        const diskon = await prisma.diskon.findFirst({
            where: {
                id: id_diskon,
                menu_diskonDetail: {
                    some: {
                        menu_detail: {
                            id_stan: stan.id
                        }
                    }
                }
            }
        })

        if (!diskon) {
            return res.status(404).json({
                message: `Diskon tidak ditemukan`
            })
        }

        const now = new Date()

        if (now > diskon.tanggal_akhir) {
            return res.status(400).json({
                message: `Diskon sudah berakhir`
            })
        }

        const {
            nama_diskon,
            persentase_diskon,
            tanggal_awal,
            tanggal_akhir,
            menu_id
        } = req.body

        const akanDatang = now < diskon.tanggal_awal
        const aktif = now >= diskon.tanggal_awal && now <= diskon.tanggal_akhir

        // diskon aktif hanya boleh ubah nama
        if (
            aktif &&
            (persentase_diskon !== undefined ||
                tanggal_awal !== undefined ||
                tanggal_akhir !== undefined)
        ) {
            return res.status(400).json({
                message: `Diskon aktif hanya boleh mengubah nama diskon`
            })
        }

        const dataUpdate: any = {}

        if (nama_diskon !== undefined) {
            dataUpdate.nama_diskon = nama_diskon
        }

        if (akanDatang) {
            if (persentase_diskon !== undefined) {
                if (persentase_diskon <= 0 || persentase_diskon >= 100) {
                    return res.status(400).json({
                        message: `Persentase diskon tidak benar`
                    })
                }
                dataUpdate.persentase_diskon = persentase_diskon
            }

            let newStart = diskon.tanggal_awal
            let newEnd = diskon.tanggal_akhir

            if (tanggal_awal) newStart = new Date(tanggal_awal)
            if (tanggal_akhir) {
                newEnd = new Date(tanggal_akhir)
                newEnd.setHours(23, 59, 59, 999)
            }

            if (newStart >= newEnd) {
                return res.status(400).json({
                    message: `Tanggal tidak benar`
                })
            }

            dataUpdate.tanggal_awal = newStart
            dataUpdate.tanggal_akhir = newEnd
        }

        // update relasi menu jika perlu
        if (menu_id && akanDatang) {
            const menus = await prisma.menu.findMany({
                where: {
                    id: { in: menu_id },
                    id_stan: stan.id,
                    is_active: true
                }
            })

            if (menus.length !== menu_id.length) {
                return res.status(400).json({
                    message: `Menu tidak valid`
                })
            }

            await prisma.menu_diskon.deleteMany({
                where: { id_diskon }
            })

            await prisma.menu_diskon.createMany({
                data: menu_id.map((id_menu: number) => ({
                    id_menu,
                    id_diskon
                }))
            })
        }

        // ambil data TERBARU + relasi (buat response)
        const diskonTerbaru = await prisma.diskon.findUnique({
            where: { id: id_diskon },
            include: {
                menu_diskonDetail: {
                    select: {
                        id: true,
                        id_menu: true,
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
            message: `Diskon berhasil diperbarui`,
            data: diskonTerbaru
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan server`
        })
    }
}


/*DELETE*/
const deleteDiskon = async (req: Request, res: Response) => {
    try {
        const stan = (req as any).stan
        const id_diskon = Number(req.params.id)

        const diskon = await prisma.diskon.findFirst({
            where: {
                id: id_diskon,
                menu_diskonDetail: {
                    some: { menu_detail: { id_stan: stan.id } }
                }
            }
        })

        if (!diskon) {
            return res.status(404).json({ message: `Diskon tidak ditemukan` })
        }

        const now = new Date()
        if (now >= diskon.tanggal_awal) {
            return res.status(400).json({
                message: `Hanya diskon yang akan datang yang bisa dihapus`
            })
        }

        await prisma.menu_diskon.deleteMany({ where: { id_diskon } })
        await prisma.diskon.delete({ where: { id: id_diskon } })

        return res.status(200).json({ message: `Diskon berhasil dihapus` })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `Terjadi kesalahan server` })
    }
}

export { createDiskon, readDiskon, updateDiskon, deleteDiskon }
