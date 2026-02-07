import { Router } from "express";
import { checkMenuActive, createMenuValidation, updateMenuValidation } from "../Middleware/menuValidation";
import { createMenu, deleteMenu, getMenuById, readMenu, readMenuAdmin, updateMenu } from "../Controller/menuController";
import { uploadMenuFoto } from "../Middleware/uploadMenuFoto";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin } from "../Middleware/auth/verifyRole";
import { checkStanActive } from "../Middleware/adminStanValidation";

const router = Router()

// route for create
router.post(`/`, [verifyToken, verifyAdmin, checkStanActive, uploadMenuFoto.single("foto"), createMenuValidation], createMenu)

// router get all menu
router.get(`/all`, [verifyToken], readMenu)
// bisa filter 
/**
 * /menu?stan= id_stan => untuk melihat menu di stan itu
 * /menu?jenis=makanan/minuman => filter untuk melohat menu sesuai jenis
 * /menu?search=nama => filter untuk melihat menu langsung
*/

// router get menu by id
router.get(`/:id`, [verifyToken], getMenuById)

//router get menu by admin
router.get(`/`, [verifyToken, verifyAdmin, checkStanActive], readMenuAdmin)

// router update
router.put(
    `/:id`, [verifyToken, verifyAdmin, checkMenuActive, uploadMenuFoto.single("foto"), updateMenuValidation], updateMenu
)

// router for delete
router.delete(
    `/:id`, [verifyToken, verifyAdmin, checkMenuActive], deleteMenu
)
export default router