import { NextFunction, Request, Response } from "express"
import Joi from "joi";

// vaidasi untuk login
const authSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(8).required()
})

const authValidation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  //mengecek apakah request sesuai schema.
  const validation = authSchema.validate(req.body)
  if (validation.error) {
    return res.status(400)
      .json({
        message: validation
          .error
          .details
          .map(it => it.message).join()
      })
  }
  next()
}

export { authValidation }