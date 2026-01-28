import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"

const prisma = new PrismaClient({ errorFormat: "minimal" })

// CREATE
const createAdminStan = async (req: Request, res: Response) => {
    try {
        const nama_stan: string = req.body.nama_stan
        const nama_pemilik: string = req.body.nama_pemilik
        const telp: string = req.body.telp

        // ini untuk users
        const username: string = req.body.username
        const password: string = req.body.password

        // mengecek apa username sudah ada atau belum
        const findUsername = await prisma.users.findFirst({ where: { username } })
        if (findUsername) {
            return res.status(409).json({ message: `username sudah ada` })
        }

        const hashPassword = await bcrypt.hash(password, 12)

        // data output 
        const newStan = await prisma.users.create({
            data: {
                username,
                password: hashPassword,
                role: "admin_stan",
                stan_detail: {
                    create: {
                        nama_stan, nama_pemilik, telp
                    }
                }
            },
            include: {
                stan_detail: true
            }
        })
        return res.status(200).json({
            message: `Admin stan telah dibuat`,
            data: newStan
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

// READ 
const readAdminStan = async (req: Request, res: Response) => {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : ""

        const allStan = await prisma.stan.findMany({
            where: {
                nama_stan: {
                    contains: search
                },
                deleted_at: null
            },
            include: {
                users_detail: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }
                }
            }
        })
        return res.status(200).json({
            message: `Stan telah ditampilkan`,
            data: allStan
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json(error)

    }
}

// UPDATE 
const updateAdminStan = async (req: Request, res: Response) => {
    try {
        // membaca id dari url param
        const id = req.params.id

        // mengecek apakah ada stan
        const findStan = await prisma.stan.findFirst({
            where: { id: Number(id) },
            include: {
                users_detail: true
            }
        })

        if (!findStan) {
            res.status(404).json({
                message: `Admin stan tidak ada`
            })
            return
        }

        const {
            nama_stan, nama_pemilik, telp, username, password
        } = req.body

        // mengecek username 
        if (username && username !== findStan.users_detail.username) {
            const cekUsername = await prisma.users.findFirst({
                where: { username }
            })

            if (cekUsername) {
                return res.status(400).json({
                    message: `Username sudah digunakan `
                })
            }
        }

        //Update password
        let newPassword = findStan.users_detail.password
        if (password) {
            newPassword = await bcrypt.hash(password, 10)
        }

        const saveStan = await prisma.stan.update({
            where: { id: Number(id) },
            data: {
                nama_stan: nama_stan ? nama_stan : findStan.nama_stan,
                nama_pemilik: nama_pemilik ? nama_pemilik : findStan.nama_pemilik,
                telp: telp ? telp : findStan.telp,
                users_detail: {
                    update: {
                        username: username ? username : findStan.users_detail.username,
                        password: newPassword
                    }
                }

            },
            include: { users_detail: true }
        })

        return res.status(200).json({
            message: `Stan telah diubah`,
            data: saveStan
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

// DELETE
const deleteAdminStan = async (req: Request, res: Response) => {
    try {
       
        const id = Number(req.params.id)
        const Stan = await prisma.stan.findFirst({
            where: { id, deleted_at: null }, include: {
                users_detail: true
            }
        })

        if (!Stan) {
            return res.status(200).json({
                message: `Stan tidak ditemukan`
            })
        }

        // soft delete siswa
        await prisma.stan.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date()
            }
        })

        // nonaktifkan akun login juga
        await prisma.users.update({
            where: { id: Stan.id_user },
            data: {
                is_active: false
            }
        })


        return res.status(200).json({
            message: `Stan telah dihapus`
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json(error);
    }
}

export { createAdminStan, readAdminStan, updateAdminStan, deleteAdminStan }