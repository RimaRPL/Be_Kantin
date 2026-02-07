import { NextFunction, Request, Response } from "express"
import Joi from "joi";

// vaidasi untuk login
const authSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
})

const authValidation = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const validation = authSchema.validate(req.body)
  if (validation.error) {
    res.status(400)
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