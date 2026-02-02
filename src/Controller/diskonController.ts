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
                                nama_makanan: true,
                                harga: true
                            }
                        }
                    }
                }
            }

        })

        const now = new Date()

        const result = diskon.map(d => {
            let status = "sudah hangus"
            if (now < d.tanggal_awal) status = "akan datang"
            else if (now <= d.tanggal_akhir) status = "aktif"

            const menu = d.menu_diskonDetail.map(md => {
                const hargaAwal = md.menu_detail.harga
                const hargaSetelahDiskon =
                    hargaAwal - hargaAwal * (d.persentase_diskon / 100)

                return {
                    id: md.menu_detail.id,
                    nama_makanan: md.menu_detail.nama_makanan,
                    harga_awal: hargaAwal,
                    harga_setelah_diskon: hargaSetelahDiskon
                }
            })

            return {
                id: d.id,
                id_stan: stan.id,
                nama_diskon: d.nama_diskon,
                persentase_diskon: d.persentase_diskon,
                tanggal_awal: d.tanggal_awal,
                tanggal_akhir: d.tanggal_akhir,
                status,
                jumlah_menu: menu.length,
                menu
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
    if (!user || user.role !== "admin_stan") {
      return res.status(403).json({ message: `Akses ditolak` })
    }

    const id_diskon = Number(req.params.id)

    const stan = await prisma.stan.findFirst({
      where: { id_user: user.id, is_active: true }
    })
    if (!stan) {
      return res.status(404).json({ message: `Stan tidak ditemukan` })
    }

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
    if (now > diskon.tanggal_akhir) {
      return res.status(400).json({ message: `Diskon sudah berakhir` })
    }

    const {
      nama_diskon,
      persentase_diskon,
      tanggal_awal,
      tanggal_akhir,
      menu_id
    } = req.body

    await prisma.diskon.update({
      where: { id: id_diskon },
      data: {
        nama_diskon,
        persentase_diskon,
        tanggal_awal: tanggal_awal ? new Date(tanggal_awal) : undefined,
        tanggal_akhir: tanggal_akhir ? new Date(tanggal_akhir) : undefined
      }
    })

    if (now < diskon.tanggal_awal && menu_id) {
      await prisma.menu_diskon.deleteMany({ where: { id_diskon } })
      await prisma.menu_diskon.createMany({
        data: menu_id.map((id_menu: number) => ({ id_menu, id_diskon }))
      })
    }

    const result = await prisma.diskon.findFirst({
      where: { id: id_diskon },
      include: {
        menu_diskonDetail: {
          include: {
            menu_detail: {
              select: {
                id: true,
                id_stan: true,
                nama_makanan: true,
                harga: true
              }
            }
          }
        }
      }
    })

    const status =
      now < result!.tanggal_awal
        ? "akan datang"
        : now <= result!.tanggal_akhir
        ? "aktif"
        : "sudah hangus"

    const menu = result!.menu_diskonDetail.map(md => {
      const harga = md.menu_detail.harga
      return {
        id: md.menu_detail.id,
        nama_makanan: md.menu_detail.nama_makanan,
        harga_awal: harga,
        harga_setelah_diskon: Math.round(
          harga - harga * (result!.persentase_diskon / 100)
        )
      }
    })

    return res.status(200).json({
      message: "Data diskon stan",
      data: [
        {
          id: result!.id,
          id_stan: result!.menu_diskonDetail[0]?.menu_detail.id_stan ?? null,
          nama_diskon: result!.nama_diskon,
          persentase_diskon: result!.persentase_diskon,
          tanggal_awal: result!.tanggal_awal,
          tanggal_akhir: result!.tanggal_akhir,
          status,
          jumlah_menu: menu.length,
          menu
        }
      ]
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Terjadi kesalahan server" })
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

export { createDiskon, readDiskon, updateDiskon, deleteDiskon }