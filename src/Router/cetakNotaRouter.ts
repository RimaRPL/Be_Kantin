import { Router } from "express";
import { verifyToken, verifySiswa } from "../Middleware/authorization";
import { cetakNota } from "../Controller/cetakNotaController";

const router = Router()

router.get(`/:id`, [verifyToken, verifySiswa], cetakNota)
export default router