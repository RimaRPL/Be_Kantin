import { Router } from "express";
import { createAdminStan, readAdminStan, updateAdminStan, deleteAdminStan } from "../Controller/adminStanController";
import { createAdminValidation, updateStanValidation } from "../Middleware/adminStanValidation";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin } from "../Middleware/auth/verifyRole";

const router = Router()

router.post(`/`, [createAdminValidation], createAdminStan)

router.get(`/me`, [verifyToken, verifyAdmin], readAdminStan)

router.put(`/me`, [verifyToken, verifyAdmin, updateStanValidation], updateAdminStan)

router.delete(`/me`, [verifyToken, verifyAdmin], deleteAdminStan)

export default router