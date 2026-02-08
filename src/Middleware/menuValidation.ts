import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import path from "path";
import { ROOT_DIRECTORY } from "../config";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// CREATE MENU 
/** buat validasi menambah menu */
const createMenuSchema = Joi.object({
    nama_makanan: Joi.string().min(3).required(),
    harga: Joi.number().min(1000).required(),
    jenis: Joi.string().valid("makanan", "minuman").required(),
    deskripsi: Joi.string().min(10).required()
})

const createMenuValidation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validation = createMenuSchema.validate(req.body);

    if (validation.error) {
        /** menghapus file  */
        let fileName: string = req.file?.filename || "";
        let pathFile: string = path.join(ROOT_DIRECTORY, "public", "menu-photo", fileName);

        let fileExists = fs.existsSync(pathFile);

        if (fileExists && fileName !== "") {
            fs.unlinkSync(pathFile);
        }
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        });
    }

    if (!req.file) {
        return res.status(400).json({
            message: `Foto menu wajib diupload`
        });
    }

    return next();
}

// UPDATE MENU
/** buat a validasi untuk mengupdate menu */
const updateMenuSchema = Joi.object({
    nama_makanan: Joi.string().min(3).optional(),
    harga: Joi.number().min(1000).optional(),
    jenis: Joi.string().valid("makanan", "minuman").optional(),
    deskripsi: Joi.string().min(10).optional()
})

const updateMenuValidation = (req: Request, res: Response, next: NextFunction): any => {
    const validation = updateMenuSchema.validate(req.body);
    if (validation.error) {
        /** menghapus file sekarang jika ada */
        if (req.file) {
            const fileName: string = req.file.filename;
            const pathFile = path.join(ROOT_DIRECTORY, "public", "foto-menu", fileName);

            /** check if file exists */
            if (fs.existsSync(pathFile)) {
                /** delete file */
                fs.unlinkSync(pathFile);
            }
        }
        return res.status(400).json({
            message: validation.error.details.map(item => item.message).join()
        })
    }
    return next()
}

// CEK MENU MASIH ADA DAN MILIK ADMIN ITU SENDIRI
const checkMenuActive = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const user = (req as any).user
    const menuId = Number(req.params.id)

    //cari menu di database
    const menu = await prisma.menu.findFirst({
        where: {
            id: menuId,
            is_active: true,
            stan_detail: {
                id_user: user.id,
                is_active: true,
                deleted_at: null
            }
        },
        include: {
            stan_detail: true
        }
    })

    if (!menu) {
        return res.status(403).json({
            message: `Menu tidak ditemukan atau bukan milik Anda`
        })
    }

    // inject supaya controller tidak query ulang
    ; (req as any).menu = menu

    return next()
}

export { createMenuValidation, updateMenuValidation, checkMenuActive }

