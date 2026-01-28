import { Router } from "express";
import { verifyToken, verifyAdmin, verifySiswa } from "../Middleware/authorization";
import { createTransaksiValidation } from "../Middleware/orderValidation";
import { createTransaksi, masakStatus, antarStatus, sampaiStatus, readTransaksiSiswa, readTransaksiByBulanAdmin } from "../Controller/orderController";

const router = Router()

/** route for add new order */
router.post(`/`, [verifyToken, verifySiswa, createTransaksiValidation], createTransaksi)

/** route for status */
// dimasak
router.patch(
    `/:id/masak`, [verifyToken, verifyAdmin], masakStatus
)
// diantar
router.patch(
    `/:id/antar`, [verifyToken, verifyAdmin], antarStatus
)
// sampai
router.patch(
    `/:id/sampai`, [verifyToken, verifyAdmin], sampaiStatus
)

// router by siswa
router.get(
    `/siswa`, [verifyToken, verifySiswa], readTransaksiSiswa
)

router.get(
    `/admin`, [verifyToken, verifyAdmin], readTransaksiByBulanAdmin
)

export default router
