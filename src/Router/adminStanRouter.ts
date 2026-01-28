import { Router } from "express";
import { verifyToken, verifyAdmin, adminSelf } from "../Middleware/authorization";
import { createAdminStan, readAdminStan, updateAdminStan, deleteAdminStan } from "../Controller/adminStanController";
import { createAdminValidation, updateStanValidation } from "../Middleware/adminStanValidation";

const router = Router()

router.post(`/`, [createAdminValidation], createAdminStan)

router.get(`/`, [verifyToken, verifyAdmin], readAdminStan)

router.put(`/:id`, [verifyToken, adminSelf, updateStanValidation], updateAdminStan)

router.delete(`/:id`, [verifyToken, adminSelf], deleteAdminStan)

export default router