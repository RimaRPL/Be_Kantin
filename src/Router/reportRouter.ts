import { Router } from "express";
import { verifyToken, verifyAdmin } from "../Middleware/authorization";
import { rekapPemasukanBulanan } from "../Controller/reportController";

const router = Router()

router.get (`/`, [verifyToken, verifyAdmin], rekapPemasukanBulanan)

export default router