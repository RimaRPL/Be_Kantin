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
        if (!stan) {
            return res.status(403).json({
                message: `Stan tidak ditemukan`
            });
        }

        const nama_makanan: string = req.body.nama_makanan
        const harga: number = Number(req.body.harga)
        const jenis: MenuType = req.body.jenis
        const foto: string = req.file?.filename || ""
        const deskripsi: string = req.body.deskripsi
        const id_stan = stan.id

        // memastikan stan ada
        const findStan = await prisma.stan.findUnique({
            where: { id: Number(id_stan), is_active: true }
        });

        if (!findStan) {
            if (req.file) {
                const filePath = `${ROOT_DIRECTORY}/public/foto-menu/${req.file.filename}`;
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            return res.status(404).json({
                message: `Stan tidak ditemukan`
            });
        }

        // menyimpan data menu
        const newMenu = await prisma.menu.create({
            data: {
                nama_makanan, harga, jenis, foto, deskripsi, id_stan, is_active: true
            },
            include: {
                stan_detail: true
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

// READ
// READ
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
        message: "Menu tidak ditemukan",
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


// UPDATE
const updateMenu = async (req: Request, res: Response) => {
    try {

        const findMenu = (req as any).menu

        // cek apakah file diganti 
        if (req.file) {
            // diasumsi admin ingin mengganti foto
            // define foto lama
            const oldFileName = findMenu?.foto
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
            where: { id: findMenu.id },
            data: {
                nama_makanan: nama_makanan ? nama_makanan : findMenu.nama_makanan,
                harga: harga ? Number(harga) : findMenu.harga,
                jenis: jenis ?? findMenu.jenis,
                foto: req.file ? req.file.filename : findMenu.foto,
                deskripsi: deskripsi ? deskripsi : findMenu.deskripsi,

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


export { createMenu, readMenu, updateMenu, deleteMenu }