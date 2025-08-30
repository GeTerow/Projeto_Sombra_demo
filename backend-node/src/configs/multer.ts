import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileFilter } from "../common/middlewares/upload.middleware"

const UPLOAD_DIR = path.resolve('/app/uploads'); 

// Garante que o diretório de uploads exista, se não, cria-o
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});


export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 50 // Limite de 50 MB
  },
  fileFilter,
});