import { Router } from "express";
import { verifyAdmin, verifyToken } from "../Middleware/authorization";
import { checkMenuActive, checkStanActive, createMenuValidation, updateMenuValidation } from "../Middleware/menuValidation";
import { createMenu, deleteMenu, getMenuById, readMenu, updateMenu } from "../Controller/menuController";
import { uploadMenuFoto } from "../Middleware/uploadMenuFoto";

const router = Router()

// route for create
router.post(`/`, [verifyToken, verifyAdmin, checkStanActive, uploadMenuFoto.single("foto"), createMenuValidation], createMenu)

// router get all menu
router.get(`/`, [verifyToken], readMenu)
// bisa filter 
/**
 * /menu?stan= id_stan => untuk melihat menu di stan itu
 * /menu?jenis=makanan/minuman => filter untuk melohat menu sesuai jenis
 * /menu?search=nama => filter untuk melihat menu langsung
*/

// router get menu by id
router.get(`/:id`, [verifyToken], getMenuById)

// router update
router.put(
    `/:id`, [verifyToken, verifyAdmin, checkMenuActive, uploadMenuFoto.single("foto"), updateMenuValidation], updateMenu
)

// router for delete
router.delete(
    `/:id`, [verifyToken, verifyAdmin, checkMenuActive], deleteMenu
)
export default router