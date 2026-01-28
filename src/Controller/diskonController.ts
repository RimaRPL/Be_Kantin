import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ errorFormat: "minimal" })


// CREATE
const createDiskon = async (req: Request, res: Response) => {
    try {

        // validasi user dari middleware verifyToken
        const user = (req as any).user
        if (!user) {
            return res.status(401).json({
                message: `user tidak dikenal`
            })
        }

        // Hanya admin stan yang bisa memasang diskon
        if (user.role !== "admin_stan") {
            return res.status(403).json({
                message: `Hanya admin yang memiliki akses`
            })
        }

        // cek stan aktif
        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(400).json({
                message: `Stan tidak ditemukan`
            })
        }

        // ambil data request 
        const {
            nama_diskon,
            persentase_diskon,
            tanggal_awal,
            tanggal_akhir,
            menu_id
        } = req.body

        // validasi tanggal
        const startDate = new Date(tanggal_awal)
        const endDate = new Date(tanggal_akhir)

        if (startDate >= endDate) {
            return res.status(400).json({
                message: `tanggal tidak benar`
            })
        }

        // validasi diskon
        if (persentase_diskon <= 0 || persentase_diskon >= 100) {
            return res.status(400).json({
                message: `Persentase diskon tidak benar`
            })
        }

        // memastikam menu milik stan tersebut
        const menus = await prisma.menu.findMany({
            where: {
                id: { in: menu_id },
                id_stan: stan.id,
                is_active: true

            }
        })

        // mengecek menu
        if (menus.length !== menu_id.length) {
            return res.status(400).json({
                message: `Menu tidak valid`
            })
        }

        // cek 1 menu hanya 1 diskon
        const overlap = await prisma.menu_diskon.findFirst({
            where: {
                id_menu: {
                    in: menu_id
                },
                diskon_detail: {
                    tanggal_awal: { lte: endDate },
                    tanggal_akhir: { gte: startDate }
                }
            },
            include: {
                diskon_detail: true
            }
        })

        if (overlap) {
            return res.status(400).json({
                message: ` menu sudah ada diskon aktif`
            })
        }

        // create 
        const newDiskon = await prisma.diskon.create({
            data: {
                nama_diskon,
                persentase_diskon,
                tanggal_awal: new Date(tanggal_awal),
                tanggal_akhir: new Date(tanggal_akhir)
            }
        })

        // relasi menu ke diskon
        const menuDiskonData = menu_id.map((id_menu: number) => ({
            id_menu,
            id_diskon: newDiskon.id
        }))

        await prisma.menu_diskon.createMany({
            data: menuDiskonData
        })

        return res.status(200).json({
            message: `Diskon berhasil dibuat`,
            data: {
                diskon: newDiskon,
                jumlah_menu: menu_id.length  //menu yang memiliki diskon ini ada berapa 
            }
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}

// READ

const readDiskon = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user

        if (!user) {
            return res.status(400).json({
                message: `Tidak Dikenal`
            })
        }

        if (user.role !== "admin_stan") {
            return res.status(400).json({
                message: `Hanya stan yang dapat mengakses`
            })
        }

        // mengambil data stan
        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(400).json({
                message: `stan tidak ditemukan`
            })
        }

        // ambil diskon yang ada di stan ini
        // some digunakan minimal 1 menu yang diskon di stan ini
        const diskon = await prisma.diskon.findMany({
            where: {
                menu_diskonDetail: {
                    some: {
                        menu_detail: {
                            id_stan: stan.id
                        }
                    }
                }
            },
            include: {
                // mengambil relasi menu diskon dan ada menu detailnya
                menu_diskonDetail: {
                    include: {
                        menu_detail: {
                            select: {
                                id: true,
                                id_stan: true,
                                nama_makanan: true
                            }
                        }
                    }
                }
            }

        })

        // buat nambah status
        const now = new Date()

        const result = diskon.map(d => {
            let status = "sudah hangus"
            if (now < d.tanggal_awal) status = "akan datang"
            else if (now >= d.tanggal_awal && now <= d.tanggal_akhir) status = "aktif"

            return {
                id: d.id,
                nama_diskon: d.nama_diskon,
                persentase_diskon: d.persentase_diskon,
                tanggal_awal: d.tanggal_awal,
                tanggal_akhir: d.tanggal_akhir,
                status,
                // menu yang terkena diskon
                menu: d.menu_diskonDetail.map(md => md.menu_detail)
            }
        })

        return res.status(200).json({
            message: "Data diskon stan",
            data: result
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })

    }
}

// UPDATE
const updateDiskon = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "admin_stan") {
            return res.status(403).json({
                message: `Hanya admin stan yang dapat mengakses`
            })
        }

        const id_diskon = Number(req.params.id)

        const diskon = await prisma.diskon.findFirst({
            where: { id: id_diskon },
            include: {
                menu_diskonDetail: {
                    include: {
                        menu_detail: {
                            select: {
                                id: true,
                                id_stan: true,
                                nama_makanan: true
                            }
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

        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(400).json({
                message: `Stan tidak ditemukan`
            })
        }

        const isOwner = diskon.menu_diskonDetail.some(
            md => md.menu_detail.id_stan === stan.id
        )

        if (!isOwner) {
            return res.status(403).json({
                message: `Diskon bukan milik stan Anda`
            })
        }

        const now = new Date()
        const isUpcoming = now < diskon.tanggal_awal
        const isActive =
            now >= diskon.tanggal_awal && now <= diskon.tanggal_akhir
        const isExpired = now > diskon.tanggal_akhir

        const {
            nama_diskon,
            persentase_diskon,
            tanggal_awal,
            tanggal_akhir,
            menu_id
        } = req.body

        if (isExpired) {
            return res.status(400).json({
                message: `Diskon sudah berakhir dan tidak dapat diupdate`
            })
        }

        if (isActive) {
            if (
                persentase_diskon !== undefined ||
                tanggal_awal !== undefined ||
                menu_id !== undefined
            ) {
                return res.status(400).json({
                    message:
                        `Diskon aktif hanya boleh mengubah nama dan tanggal akhir`
                })
            }
        }

        if (tanggal_awal && tanggal_akhir) {
            if (new Date(tanggal_awal) >= new Date(tanggal_akhir)) {
                return res.status(400).json({
                    message: `Tanggal diskon tidak valid`
                })
            }
        }

        if (persentase_diskon !== undefined) {
            if (persentase_diskon <= 0 || persentase_diskon >= 100) {
                return res.status(400).json({
                    message: `Persentase diskon tidak valid`
                })
            }
        }

        const updatedDiskon = await prisma.diskon.update({
            where: { id: id_diskon },
            data: {
                nama_diskon,
                persentase_diskon,
                tanggal_awal: tanggal_awal
                    ? new Date(tanggal_awal)
                    : undefined,
                tanggal_akhir: tanggal_akhir
                    ? new Date(tanggal_akhir)
                    : undefined
            }
        })

        if (isUpcoming && menu_id) {
            await prisma.menu_diskon.deleteMany({
                where: { id_diskon }
            })

            const menuDiskonData = menu_id.map((id_menu: number) => ({
                id_menu,
                id_diskon
            }))

            await prisma.menu_diskon.createMany({
                data: menuDiskonData
            })
        }

        return res.status(200).json({
            message: `Diskon berhasil diperbarui`,
            data: updatedDiskon
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}

// DELETE
const deleteDiskon = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        if (!user) {
            return res.status(401).json({
                message: `Tidak dikenal`
            })
        }

        if (user.role !== "admin_stan") {
            return res.status(403).json({
                message: `Hanya admin stan yang dapat mengakses`
            })
        }

        const id_diskon = Number(req.params.id)

        const diskon = await prisma.diskon.findFirst({
            where: { id: id_diskon },
            include: {
                menu_diskonDetail: {
                    include: {
                        menu_detail: {
                            select: {
                                id_stan: true
                            }
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

        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true
            }
        })

        if (!stan) {
            return res.status(400).json({
                message: `Stan tidak ditemukan`
            })
        }

        const isOwner = diskon.menu_diskonDetail.some(
            md => md.menu_detail.id_stan === stan.id
        )

        if (!isOwner) {
            return res.status(403).json({
                message: `Diskon bukan milik stan Anda`
            })
        }

        const now = new Date()
        const isUpcoming = now < diskon.tanggal_awal

        if (!isUpcoming) {
            return res.status(400).json({
                message: `Hanya diskon yang akan datang yang bisa dihapus`
            })
        }

        await prisma.menu_diskon.deleteMany({
            where: { id_diskon }
        })

        await prisma.diskon.delete({
            where: { id: id_diskon }
        })

        return res.status(200).json({
            message: `Diskon berhasil dihapus`
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}

export { createDiskon, readDiskon, updateDiskon, deleteDiskon}