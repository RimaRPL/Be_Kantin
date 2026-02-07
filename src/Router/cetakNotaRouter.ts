import { Router } from "express";
import { cetakNota } from "../Controller/cetakNotaController";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifySiswa } from "../Middleware/auth/verifyRole";

const router = Router()

router.get(`/:id`, [verifyToken, verifySiswa], cetakNota)
export default router