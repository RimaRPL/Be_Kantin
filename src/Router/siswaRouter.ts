import { Router } from "express";
import { verifyToken, verifyAdmin, verifyAdminorSiswa } from "../Middleware/authorization";
import { checkSiswaActive, createSiswaValidation, updateSiswaValidation } from "../Middleware/siswaValidation";
import { createSiswa, readSiswa, updateSiswa, deleteSiswa } from "../Controller/siswaController";
import { uploadSiswaFoto } from "../Middleware/uploadSiswaFoto";

const router = Router()

/** route for add new siswa */
router.post(`/`, [uploadSiswaFoto.single("foto"), createSiswaValidation], createSiswa)

/** route for show all siswa */
router.get(`/`, [verifyToken, verifyAdmin], readSiswa)

/** route for update siswa */
router.put(`/:id`, [verifyToken, verifyAdminorSiswa, uploadSiswaFoto.single("foto"), checkSiswaActive, updateSiswaValidation], updateSiswa)

/** route for remove siswa */
router.delete(`/:id`, [verifyToken, verifyAdmin], deleteSiswa)

export default router