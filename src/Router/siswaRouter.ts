import { Router } from "express";
import { checkSiswaActive, createSiswaValidation, updateSiswaValidation } from "../Middleware/siswaValidation";
import { createSiswa, readSiswa, updateSiswabyId, deleteSiswa, updateSiswa } from "../Controller/siswaController";
import { uploadSiswaFoto } from "../Middleware/uploadSiswaFoto";
import { verifyToken } from "../Middleware/auth/verifyToken";
import { verifyAdmin, verifySiswa } from "../Middleware/auth/verifyRole";

const router = Router()

/** route for add new siswa */
router.post(`/`, [uploadSiswaFoto.single("foto"), createSiswaValidation], createSiswa)

/** route for show detail siswa */
router.get(`/me`, [verifyToken], readSiswa)

/**route for show all siswa by admin */
router.get(`/all`, [verifyToken, verifyAdmin], readSiswa)

/**route for update siswa sendiri */
router.put(`/me`, [verifyToken, verifySiswa, uploadSiswaFoto.single("foto"), updateSiswaValidation], updateSiswa)

/** route for update siswa by admin */
router.put(`/admin/:id`, [verifyToken, verifyAdmin, uploadSiswaFoto.single("foto"), checkSiswaActive, updateSiswaValidation], updateSiswabyId)

/** route for remove siswa */
router.delete(`/:id`, [verifyToken, verifyAdmin], deleteSiswa)

export default router