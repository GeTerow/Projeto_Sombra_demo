import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'node:path';
import fs from 'node:fs';

// Define o diretório onde os uploads serão guardados
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');

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

// Filtro para validar o tipo de ficheiro
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo de áudio inválido. Apenas .mp3, .wav, .m4a são permitidos.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 50 // Limite de 50 MB
  },
  fileFilter,
});