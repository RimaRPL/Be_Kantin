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
            return res.status(200)
                .json({
                    message: `username tidak ditemukan`
                })
        }

        const isMatchPassword = await bcrypt.compare(password, findUsers.password)

        if (!isMatchPassword) {
            return res.status(400)
                .json({
                    message: `Password salah`
                })
        }

        const payload = {
            id: findUsers.id,
            username: findUsers.username,
            role: findUsers.role
        }

        const signature = process.env.SECRET || ``

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