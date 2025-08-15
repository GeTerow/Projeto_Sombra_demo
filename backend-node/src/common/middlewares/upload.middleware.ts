import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Filtro para validar o tipo de ficheiro
export const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo de áudio inválido. Apenas .mp3, .wav, .m4a são permitidos.'));
  }
};
