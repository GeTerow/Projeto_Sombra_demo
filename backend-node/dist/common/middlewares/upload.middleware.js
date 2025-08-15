"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFilter = void 0;
// Filtro para validar o tipo de ficheiro
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de arquivo de áudio inválido. Apenas .mp3, .wav, .m4a são permitidos.'));
    }
};
exports.fileFilter = fileFilter;
//# sourceMappingURL=upload.middleware.js.map