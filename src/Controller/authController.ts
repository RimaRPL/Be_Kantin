import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient({ errorFormat: "minimal" });

const authentication = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body
        /** cek username */
        const findUsers = await prisma.users.findFirst({
            where: {
                username, 
                deleted_at: null,
                is_active: true
            }
        })

        if (!findUsers) {
            return res.status(404)
                .json({
                    message: `Username tidak ditemukan`
                })
        }

        /** cek password */
        const isMatchPassword = await bcrypt.compare(password, findUsers.password)

        if (!isMatchPassword) {
            return res.status(400)
                .json({
                    message: `Password salah`
                })
        }

        //Payload data identitas user yang dimasukkan ke dalam JWT token.
        const payload = {
            id: findUsers.id,
            username: findUsers.username,
            role: findUsers.role
        }

        // mengambil secret data
        const signature = process.env.SECRET || ``

        // membuat token jwt dengan batas berlaku 1 hari
        const token = jwt.sign(payload, signature, {
            expiresIn: "1d"
        });

        return res.status(200).json({
            logged: true,
            token,
            id: findUsers.id,
            username: findUsers.username,
            role: findUsers.role
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json(error)
    }
}

export { authentication }