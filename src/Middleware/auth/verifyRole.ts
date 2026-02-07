import { NextFunction, Request, Response } from "express"

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

export {verifyAdmin, verifySiswa}