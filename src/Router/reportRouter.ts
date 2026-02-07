import { Router } from "express";
import { rekapPemasukanBulanan } from "../Controller/reportController";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin } from "../Middleware/auth/verifyRole";

const router = Router()

router.get (`/`, [verifyToken, verifyAdmin], rekapPemasukanBulanan)

export default router