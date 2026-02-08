import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// CREATE 
const createAdminSchema = Joi.object({
    nama_stan: Joi.string().min(3).required(),
    nama_pemilik: Joi.string().trim().min(3).required(),
    telp: Joi.string().pattern(/^[0-9]+$/).min(10).max(13).required(),
    username: Joi.string().trim().min(3).required(),
    password: Joi.string().min(8).required()
})

const createAdminValidation = async (
    req: Request, res: Response, next: NextFunction
) => {
    const validation = createAdminSchema.validate(req.body)
    if (validation.error) {
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        })
    }
    return next()
}

// UPDATE
const updateStanSchema = Joi.object({
    nama_stan: Joi.string().trim().min(3).optional(),
    nama_pemilik: Joi.string().trim().min(3).optional(),
    telp: Joi.string().pattern(/^[0-9]+$/).min(10).max(13).optional(),
    username: Joi.string().trim().min(3).optional(),
    password: Joi.string().min(8).optional()
})

const updateStanValidation = (req: Request, res: Response, next: NextFunction) => {
    const validation = updateStanSchema.validate(req.body)
    if (validation.error) {
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        })
    }
    return next()
}

// CEK stan active
const checkStanActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // ambil user dari middleware verifyToken
        const user = (req as any).user

        // cari stan milik user yang masih aktif
        const stan = await prisma.stan.findFirst({
            where: {
                id_user: user.id,
                is_active: true,
                deleted_at: null
            }
        })

        // jika stan tidak ditemukan atau tidak aktif
        if (!stan) {
            return res.status(400).json({
                message: `Stan tidak ditemukan atau tidak aktif`
            })
        }

        // simpan data stan ke request agar bisa dipakai controller
        ; (req as any).stan = stan

        next()
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: `Terjadi kesalahan pada server`
        })
    }
}

export { createAdminValidation, updateStanValidation, checkStanActive }