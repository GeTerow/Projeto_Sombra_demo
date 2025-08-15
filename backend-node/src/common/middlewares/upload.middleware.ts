import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

// Define o diretório onde os uploads serão guardados
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');

// Garante que o diretório de uploads exista, se não, cria-o
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Cria um nome de ficheiro único para evitar conflitos
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

export const upload = multer({ storage });