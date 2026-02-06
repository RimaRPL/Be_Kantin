import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import path from "path";
import { ROOT_DIRECTORY } from "../config";
import fs from "fs";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// CREATE SISWA
/** buat a validasi untuk menambah siswa */
const createSiswaSchema = Joi.object({
    nama_siswa: Joi.string().min(3).required(),
    alamat: Joi.string().min(5).required(),
    telp: Joi.string().min(10).max(13).required(),
    username: Joi.string().required(),
    password: Joi.string().required()
})

const createSiswaValidation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const validation = createSiswaSchema.validate(req.body);
    if (validation.error) {
        /** menghapus file  */
        let fileName: string = req.file?.filename || "";
        let pathFile: string = path.join(ROOT_DIRECTORY, "public", "siswa-photo", fileName);

        let fileExists = fs.existsSync(pathFile);

        if (fileExists && fileName !== "") {
            fs.unlinkSync(pathFile);
        }
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        });
    }
    return next();
}

// UPDATE SISWA
/** buat a validasi untuk mengupdate siswa */
const updateSiswaSchema = Joi.object({
    nama_siswa: Joi.string().min(3).optional(),
    alamat: Joi.string().min(5).optional(),
    telp: Joi.string().min(10).max(13).optional(),
    username: Joi.string().optional(),
    password: Joi.string().optional()
})

const updateSiswaValidation = (req: Request, res: Response, next: NextFunction): any => {
    const validation = updateSiswaSchema.validate(req.body);
    if (validation.error) {
        /** menghapus file sekarang jika ada */
        if (req.file) {
            const fileName: string = req.file.filename;
            const pathFile = path.join(ROOT_DIRECTORY, "public", "foto-siswa", fileName);

            /**cek apa ada file terbaru*/
            if (fs.existsSync(pathFile)) {
                /** hapus file lama */
                fs.unlinkSync(pathFile);
            }
        }
        return res.status(400).json({
            message: validation.error.details.map(item => item.message).join()
        })
    }
    return next()
}

// CEK SISWA ACTIVE
const checkSiswaActive = async (
    req: Request, res: Response, next: NextFunction
) => {
    const id = Number(req.params.id);

    if(Number.isNaN(id)){
        return res.status(400).json({
            message: `id tidak valid `
        })
    }

    const siswa = await prisma.siswa.findFirst({
        where: {
            id,
            deleted_at:null
        }
    })

    if(!siswa){
        return res.status(404).json({
            message: `Siswa sudah dihapus`
        })
    }
    return next()
}

export { createSiswaValidation, updateSiswaValidation, checkSiswaActive }