import { NextFunction, Request, Response } from "express";
import Joi from "joi";

// CREATE 
const createAdminSchema = Joi.object ({
    nama_stan: Joi.string().min(3).required(),
    nama_pemilik: Joi.string().min(3).required(),
    telp: Joi.string().min(10).max(13).required(),
    username: Joi.string().required(),
    password: Joi.string().required()
})

const createAdminValidation = async (
    req : Request, res : Response, next : NextFunction 
) => {
    const validation = createAdminSchema.validate(req.body)
    if(validation.error){
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        })
    }
    return next()
}

// UPDATE
const updateStanSchema = Joi.object ({
    nama_stan: Joi.string().min(3).optional(),
    nama_pemilik: Joi.string().min(3).optional(),
    telp: Joi.string().min(10).max(13).optional(),
    username: Joi.string().optional(),
    password: Joi.string().optional()
})

const updateStanValidation = (req: Request, res: Response, next: NextFunction) => {
    const validation = updateStanSchema.validate(req.body)
    if(validation.error){
        return res.status(400).json({
            message: validation.error.details.map(it => it.message).join()
        })
    }
    return next()
}



export { createAdminValidation, updateStanValidation}