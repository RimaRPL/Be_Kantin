import { Router } from "express";
import { createDiskon, deleteDiskon, readDiskon, updateDiskon } from "../Controller/diskonController";
import { createDiskonValidation, updateDiskonValidation } from "../Middleware/diskonValidation";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin } from "../Middleware/auth/verifyRole";
import { checkStanActive } from "../Middleware/adminStanValidation";

const router = Router()

// Route for create
router.post(`/`, [verifyToken, verifyAdmin, checkStanActive, createDiskonValidation], createDiskon)

// Router for read
router.get(`/`, [verifyToken, verifyAdmin, checkStanActive], readDiskon)

// Router for update
router.put(`/:id`,[verifyToken, verifyAdmin, checkStanActive, updateDiskonValidation], updateDiskon)

// Router for delete
router.delete(`/:id`, [verifyToken, verifyAdmin, checkStanActive], deleteDiskon)

export default router