import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import fs from "fs"
import { ROOT_DIRECTORY } from "../config";
import bcrypt from "bcrypt"

const prisma = new PrismaClient({ errorFormat: "minimal" });

// CREATE
const createSiswa = async (req: Request, res: Response) => {
    try {
        const nama_siswa: string = req.body.nama_siswa
        const alamat: string = req.body.alamat
        const telp: string = req.body.telp
        const foto: string = req.file?.filename || ""

        // ini untuk bagian tabel users
        const username: string = req.body.username
        const password: string = req.body.password

        // mengecek username sudah ada atau belum
        const findUsername = await prisma.users.findFirst({ where: { username } })
        if (findUsername) {
            return res.status(409).json({ message: `Username sudah ada` })
        }

        const hashPassword = await bcrypt.hash(password, 12)
        const newSiswa = await prisma.users.create({
            data: {
                username,
                password: hashPassword,
                role: "siswa",
                siswa_detail: {
                    create: {
                        nama_siswa, alamat, telp, foto
                    }
                }
            },
            include: {
                siswa_detail: true
            }
        })
        return res.status(200).json({
            message: `Siswa telah dibuat`,
            data: newSiswa
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

// READ
const readSiswa = async (req: Request, res: Response) => {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : ""

        const allSiswa = await prisma.siswa.findMany({
            where: {
                nama_siswa: {
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
            message: `Siswa telah ditampilkan`,
            data: allSiswa
        })
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
}

// UPDATE
const updateSiswa = async (req: Request, res: Response) => {
    try {
        // membaca id dari url param
        const id = req.params.id

        // mengecek apakah ada siswa
        const findSiswa = await prisma.siswa.findFirst({
            where: { id: Number(id),
                deleted_at: null
             },
            include: {
                users_detail: true
            }
        })

        if (!findSiswa) {
            res.status(404).json({
                message: `Siswa tidak ada`
            })
            return
        }

        // cek apakah file diganti 
        if (req.file) {
            // diasumsi siswa ingin mengganti foto
            // define foto lama
            const oldFileName = findSiswa?.foto
            // define path / lokasi foto lama
            const pathFile = `${ROOT_DIRECTORY}/public/foto-siswa/${oldFileName}`
            // cek apakah ada foto
            let existsFile = fs.existsSync(pathFile)

            if (existsFile && oldFileName !== "") {
                // hapus foto lama
                fs.unlinkSync(pathFile)
            }
        }

        const {
            nama_siswa, alamat, telp, username, password
        } = req.body

        // mengecek username 
        if (username && username !== findSiswa.users_detail.username) {
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
        let newPassword = findSiswa.users_detail.password
        if (password) {
            newPassword = await bcrypt.hash(password, 10)
        }

        // update users dan siswa
        const saveSiswa = await prisma.siswa.update({
            where: { id: Number(id) },
            data: {
                nama_siswa: nama_siswa ? nama_siswa : findSiswa.nama_siswa,
                alamat: alamat ? alamat : findSiswa.alamat,
                telp: telp ? telp : findSiswa.telp,
                foto: req.file ? req.file.filename : findSiswa.foto,
                users_detail: {
                    update: {
                        username: username ? username : findSiswa.users_detail.username,
                        password: newPassword
                    }
                }

            },
            include: { users_detail: true }
        })

        return res.status(200).json({
            message: `Siswa telah diubah`,
            data: saveSiswa
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
}

// DELETE
const deleteSiswa = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id)

        const siswa = await prisma.siswa.findFirst({
            where: {
                id,
                deleted_at: null
            },
            include: {
                users_detail: true
            }
        })

        if (!siswa) {
            return res.status(404).json({
                message: `Siswa tidak ditemukan`
            })
        }

        // soft delete siswa
        await prisma.siswa.update({
            where: { id },
            data: {
                is_active: false,
                deleted_at: new Date()
            }
        })

        // nonaktifkan akun login juga
        await prisma.users.update({
            where: { id: siswa.id_user },
            data: {
                is_active: false
            }
        })

        return res.json({
            message: `Siswa berhasil dihapus`
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message: `Terjadi kesalahan server`
        })
    }
}

export { createSiswa, readSiswa, updateSiswa, deleteSiswa }