import { Router } from "express";
import { rekapPemasukanBulanan } from "../Controller/reportController";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin } from "../Middleware/auth/verifyRole";
import { checkStanActive } from "../Middleware/adminStanValidation";

const router = Router()

router.get (`/`, [verifyToken, verifyAdmin, checkStanActive], rekapPemasukanBulanan)

export default router