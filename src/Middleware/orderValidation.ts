import { NextFunction, Request, Response } from "express"
import Joi from "joi"

const detailSchema = Joi.object({
  id_menu: Joi.number().required(),
  qty: Joi.number().min(1).required()
})

const orderSchema = Joi.object({
  id_stan: Joi.number().required(),
  detail_transaksi: Joi.array()
    .items(detailSchema)
    .min(1)
    .required()
})

const createTransaksiSchema = Joi.object({
  orders: Joi.array()
    .items(orderSchema)
    .min(1)
    .required()
})

const createTransaksiValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const validation = createTransaksiSchema.validate(req.body)

  if (validation.error) {
    return res.status(400).json({
      message: validation.error.details
        .map(it => it.message)
        .join(", ")
    })
  }

  return next()
}

export { createTransaksiValidation }
