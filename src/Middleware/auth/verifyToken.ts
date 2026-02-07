import jwt from "jsonwebtoken"
import { NextFunction, Request, Response } from "express"

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

export { verifyToken }