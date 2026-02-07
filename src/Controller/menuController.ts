import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs"
import { ROOT_DIRECTORY } from "../config";

const prisma = new PrismaClient({ errorFormat: "minimal" })
type MenuType = "makanan" | "minuman"

// CREATE
const createMenu = async (req: Request, res: Response) => {
  try {
    // stan diambil dari middleware checkStanActive
    const stan = req.stan;

    const nama_makanan: string = req.body.nama_makanan
    const harga: number = Number(req.body.harga)
    const jenis: MenuType = req.body.jenis
    const foto: string = req.file?.filename || ""
    const deskripsi: string = req.body.deskripsi
    const id_stan = stan.id

    // menyimpan data menu
    const newMenu = await prisma.menu.create({
      data: {
        nama_makanan, harga, jenis, foto, deskripsi, id_stan, is_active: true
      },
      select: {
        id: true,
        nama_makanan: true,
        harga: true,
        jenis: true,
        deskripsi: true,
        foto: true,
        stan_detail: {
          select: {
            id: true,
            nama_stan: true,
            nama_pemilik: true,
            telp: true,
            id_user: true
          }
        }
      }
    })
    return res.status(200).json({
      message: `Menu telah dibuat`,
      data: newMenu

    })
  } catch (error) {
    console.log(error)

    // bersihkan file kalau error
    if (req.file) {
      const filePath = `${ROOT_DIRECTORY}/public/foto-menu/${req.file.filename}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return res.status(500).json(error)


  }
}

// READ MENU PUBLIC
const readMenu = async (req: Request, res: Response) => {
  try {
    const search = req.query.search?.toString() ?? "";
    const jenis = req.query.jenis as "makanan" | "minuman" | undefined;
    const stanId = req.query.stan ? Number(req.query.stan) : undefined;
    const today = new Date();

    const allMenu = await prisma.menu.findMany({
      where: {
        is_active: true,
        nama_makanan: {
          contains: search,
        },
        ...(jenis && { jenis }),
        ...(stanId && { id_stan: stanId }),
        stan_detail: {
          deleted_at: null,
          is_active: true,
        },
      },
      include: {
        stan_detail: {
          select: {
            id: true,
            nama_stan: true,
            nama_pemilik: true,
            telp: true
          },
        },
        menu_diskonDetail: {
          where: {
            diskon_detail: {
              tanggal_awal: { lte: today },
              tanggal_akhir: { gte: today },
            },
          },
          include: {
            diskon_detail: {
              select: {
                nama_diskon: true,
                persentase_diskon: true,
              },
            },
          },
        },
      },
    });

    if (allMenu.length === 0) {
      return res.status(200).json({
        message: `Menu tidak ditemukan`,
        data: [],
      });
    }

    const result = allMenu.map((menu) => {
      const harga_awal = menu.harga;

      const diskonRelasi = menu.menu_diskonDetail[0];
      const diskon = diskonRelasi?.diskon_detail;

      const persentase_diskon = diskon?.persentase_diskon ?? 0;
      const harga_setelah_diskon =
        persentase_diskon > 0
          ? Math.round(harga_awal - (harga_awal * persentase_diskon) / 100)
          : harga_awal;

      return {
        id: menu.id,
        nama_makanan: menu.nama_makanan,
        jenis: menu.jenis,
        deskripsi: menu.deskripsi,
        foto: menu.foto,
        harga_awal,
        diskon_detail: {
          nama_diskon: diskon?.nama_diskon ?? null,
          persentase_diskon,
        },
        harga_setelah_diskon,
        stan: menu.stan_detail,
      };
    });

    return res.status(200).json({
      message: "Menu telah ditampilkan",
      total_data: result.length,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server",
    });
  }
};

// READ MENU BY ID
const getMenuById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id)
    const today = new Date()

    if (isNaN(id)) {
      return res.status(400).json({
        message: `ID menu tidak valid`
      })
    }

    const menu = await prisma.menu.findFirst({
      where: {
        id,
        is_active: true,
        stan_detail: {
          is_active: true,
          deleted_at: null
        }
      },
      include: {
        stan_detail: {
          select: {
            id: true,
            nama_stan: true
          }
        },
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
                nama_diskon: true,
                persentase_diskon: true
              }
            }
          }
        }
      }
    })

    if (!menu) {
      return res.status(404).json({
        message: `Menu tidak ditemukan`
      })
    }

    const harga_awal = menu.harga
    const diskonRelasi = menu.menu_diskonDetail[0]
    const diskon = diskonRelasi?.diskon_detail

    const persentase_diskon = diskon?.persentase_diskon ?? 0
    const harga_setelah_diskon =
      persentase_diskon > 0
        ? Math.round(harga_awal - (harga_awal * persentase_diskon) / 100)
        : harga_awal

    return res.status(200).json({
      message: "Detail menu",
      data: {
        id: menu.id,
        nama_makanan: menu.nama_makanan,
        jenis: menu.jenis,
        deskripsi: menu.deskripsi,
        foto: menu.foto,
        harga_awal,
        diskon_detail: {
          nama_diskon: diskon?.nama_diskon ?? null,
          persentase_diskon
        },
        harga_setelah_diskon,
        stan: menu.stan_detail
      }
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: `Terjadi kesalahan pada server`
    })
  }
}

//READ MENU ADMIN 
const readMenuAdmin = async (req: Request, res: Response) => {
  try {
    const stan = (req as any).stan

    const search = req.query.search?.toString() ?? ""
    const jenis = req.query.jenis as "makanan" | "minuman" | undefined
    const today = new Date()

    const menus = await prisma.menu.findMany({
      where: {
        id_stan: stan.id,
        nama_makanan: { contains: search },
        ...(jenis && { jenis }),
      },
      include: {
        menu_diskonDetail: {
          where: {
            diskon_detail: {
              tanggal_awal: { lte: today },
              tanggal_akhir: { gte: today },
            },
          },
          include: {
            diskon_detail: {
              select: {
                nama_diskon: true,
                persentase_diskon: true,
              },
            },
          },
        },
      },
    })

    const result = menus.map(menu => {
      const harga_awal = menu.harga
      const diskon = menu.menu_diskonDetail[0]?.diskon_detail
      const persentase_diskon = diskon?.persentase_diskon ?? 0

      const harga_setelah_diskon =
        persentase_diskon > 0
          ? Math.round(harga_awal - (harga_awal * persentase_diskon) / 100)
          : harga_awal

      return {
        id: menu.id,
        nama_makanan: menu.nama_makanan,
        jenis: menu.jenis,
        harga_awal,
        harga_setelah_diskon,
        diskon_detail: diskon ?? null,
        is_active: menu.is_active,
      }
    })

    return res.status(200).json({
      message: `Menu admin berhasil ditampilkan`,
      total_data: result.length,
      data: result,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: `Terjadi kesalahan pada server`,
    })
  }
}


// UPDATE
const updateMenu = async (req: Request, res: Response) => {
  try {
    const menu = (req as any).menu

    // cek apakah file diganti 
    if (req.file) {
      // diasumsi admin ingin mengganti foto
      // define foto lama
      const oldFileName = menu?.foto
      // define path / lokasi foto lama
      const pathFile = `${ROOT_DIRECTORY}/public/foto-menu/${oldFileName}`
      // cek apakah ada foto
      let existsFile = fs.existsSync(pathFile)

      if (existsFile && oldFileName !== "") {
        // hapus foto lama
        fs.unlinkSync(pathFile)
      }
    }

    const {
      nama_makanan, harga, jenis, deskripsi
    } = req.body

    // update menu
    const saveMenu = await prisma.menu.update({
      where: { id: menu.id },
      data: {
        nama_makanan: nama_makanan ? nama_makanan : menu.nama_makanan,
        harga: harga ? Number(harga) : menu.harga,
        jenis: jenis ?? menu.jenis,
        foto: req.file ? req.file.filename : menu.foto,
        deskripsi: deskripsi ? deskripsi : menu.deskripsi,

      },
      include: { stan_detail: true }
    })

    return res.status(200).json({
      message: `Menu telah diubah`,
      data: saveMenu
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json(error)
  }
}

// DELETE MENU
const deleteMenu = async (req: Request, res: Response) => {
  try {
    const menu = (req as any).menu

    await prisma.menu.update({
      where: { id: menu.id },
      data: {
        is_active: false
      }
    })

    return res.json({
      message: `Menu berhasil dihapus`
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json

  }
}


export { createMenu, readMenu, getMenuById, updateMenu, deleteMenu, readMenuAdmin }