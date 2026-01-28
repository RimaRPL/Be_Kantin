import { Router } from "express";
import { authentication } from "../Controller/authController";
import { authValidation } from "../Middleware/authorization";

const router = Router()

router.post (`/auth`, [authValidation], authentication)

export default router