import { NextFunction, Request, Response } from "express"
import Joi from "joi"

const createDiskonSchema = Joi.object({
  nama_diskon: Joi.string().min(3).required(),
  persentase_diskon: Joi.number()
    .greater(0)
    .max(100)
    .required(),
  tanggal_awal: Joi.date().required(),
  tanggal_akhir: Joi.date().required(),
  menu_id: Joi.array()
    .items(Joi.number())
    .min(1)
    .required()
})

const createDiskonValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = createDiskonSchema.validate(req.body, {
    abortEarly: false
  })

  if (error) {
    return res.status(400).json({
      message: error.details.map(it => it.message).join(", ")
    })
  }

  return next()
}

// UPDATE
const updateDiskonSchema = Joi.object({
    nama_diskon: Joi.string().min(3).optional(),

    persentase_diskon: Joi.number()
        .greater(0)
        .less(100)
        .optional(),

    tanggal_awal: Joi.date().timestamp().optional(),

    tanggal_akhir: Joi.date().timestamp().optional(),

    menu_id: Joi.array()
        .items(Joi.number())
        .min(1)
        .optional()
}).min(1) // minimal harus ada 1 field yang diupdate

const updateDiskonValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { error } = updateDiskonSchema.validate(req.body, {
        abortEarly: false
    })

    if (error) {
        return res.status(400).json({
            message: error.details.map(d => d.message).join(", ")
        })
    }

    return next()
}

export { createDiskonValidation, updateDiskonValidation }
