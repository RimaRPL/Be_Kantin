import multer from "multer";
import { Request } from "express";
import { ROOT_DIRECTORY } from "../config";

/** define storage to save uploaded file */

const storage = multer.diskStorage({
    destination: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void
    ) => {
        const storagePath = `${ROOT_DIRECTORY}/public/foto-siswa/`
        callback(null, storagePath)
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, destination: string) => void
    ) => {
        const fileName = `${Math.random()}-${file.originalname}`
        callback(null, fileName)
    }
})

/** define function to filtering file */
const filterFile = (
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
) => {
    /** define allowed extension */
    const allowedFile = /png|jpg|jpeg|gif/
    /** check extension of uploaded file */
    const isAllow = allowedFile.test(file.mimetype)
    
    if(isAllow){
        callback(null, true)
    }else{
        callback(new Error(`Your file is not allow to upload`))
    }

}

const uploadSiswaFoto = multer ({
    storage,
    fileFilter: filterFile,
    limits: {fileSize: 2 * 1024 * 1024} //2MB
})

export { uploadSiswaFoto }