import jwt from "jsonwebtoken"
import { NextFunction, Request, Response } from "express"
import Joi from "joi";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

// bentuk data dari isi token
interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    /** membaca token dari header */
    const header = req.headers.authorization

    // memecah token dan type
    const [type, token] = header ? header.split(" ") : []

    if (type !== "Bearer") {
      return res.status(401).json({ message: `Tipe token salah` })
    }

    if (!token) {
      return res.status(401).json({
        message: `Token tidak ditemukan`
      })
    }

    /** memferifikasi token */
    const signature = process.env.SECRET || ""
    const decoded = jwt.verify(token, signature) as JwtPayload

    if (!decoded.id) {
      return res.status(401).json({
        message: `Token tidak valid`
      })
    }

    // menempelkan hasil decode token ke request, untuk memverifikasi role
    (req as any).user = decoded

    next()
  } catch (error) {
    res.status(401).json({
      message: `Tidak terdeteksi: ${error}`
    })
  }
}

const verifyAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user
  if (user && user.role === "admin_stan") {
    next()
  } else {
    res.status(403).json({
      message: `Hanya admin yang memiliki akses`
    })
  }
}

const verifySiswa = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user
  if (user && user.role === "siswa") {
    next()
  } else {
    res.status(403).json({
      message: `Hanya siswa yang memiliki akses`
    })
  }
}

// verifikasi jika yang bisa akases hanya admin dan siswa id itu sendiri
const verifyAdminorSiswa = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user
  const targetSiswaId = Number(req.params.id)

  if (user.role === "admin_stan") return next()

  if (user.role === "siswa") {
    const siswa = await prisma.siswa.findUnique({
      where: { id: targetSiswaId }
    })

    if (!siswa) {
      return res.status(404).json({ message: `Siswa tidak ditemukan` })
    }

    if (siswa.id_user === user.id) {
      return next()
    }

    return res.status(403).json({
      message: `Anda tidak memiliki akses`
    })
  }

  return res.status(403).json({ message: `Anda tidak memiliki akses` })
}

// verifikasi jika yg bisa akses hanya admin id itu sendiri
const adminSelf = async (
  req: Request, res: Response, next: NextFunction
) => {
  const user = (req as any).user
  const targetAdminId = Number(req.params.id)

  if (user.role !== "admin_stan") {
    return res.status(403).json({ message: `Tidak memiliki akses` })
  }

  if (user.role === "admin_stan") {
    const admin = await prisma.stan.findUnique({
      where: { id: targetAdminId }
    })

    if (!admin) {
      return res.status(404).json({ message: `Stan tidak ditemukan` })
    }

    if (admin.id_user === user.id) {
      return next()
    }

    return res.status(403).json({
      message: `Anda tidak memiliki akses`
    })
  }
  return next()
}

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


export { verifyToken, verifyAdmin, verifySiswa, verifyAdminorSiswa, adminSelf, authValidation }