import { Router } from "express";
import { verifyAdmin, verifyToken } from "../Middleware/authorization";
import { createDiskon, deleteDiskon, readDiskon, updateDiskon } from "../Controller/diskonController";
import { createDiskonValidation, updateDiskonValidation } from "../Middleware/diskonValidation";
import { checkStanActive } from "../Middleware/menuValidation";

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