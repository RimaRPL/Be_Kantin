import { Router } from "express";
import { verifyAdmin, verifyToken } from "../Middleware/authorization";
import { createDiskon, deleteDiskon, readDiskon, updateDiskon } from "../Controller/diskonController";
import { createDiskonValidation, updateDiskonValidation } from "../Middleware/diskonValidation";

const router = Router()

// Route for create
router.post(`/`, [verifyToken, verifyAdmin, createDiskonValidation], createDiskon)

// Router for read
router.get(`/`, [verifyToken, verifyAdmin], readDiskon)

// Router for update
router.put(`/:id`,[verifyToken, verifyAdmin, updateDiskonValidation], updateDiskon)

// Router for delete
router.delete(`/:id`, [verifyToken, verifyAdmin], deleteDiskon)

export default router