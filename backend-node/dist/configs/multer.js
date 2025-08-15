"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const upload_middleware_1 = require("../common/middlewares/upload.middleware");
// Define o diretório onde os uploads serão guardados
const UPLOAD_DIR = node_path_1.default.resolve(__dirname, '..', '..', '..', 'uploads');
// Garante que o diretório de uploads exista, se não, cria-o
node_fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = node_path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    },
});
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 50 // Limite de 50 MB
    },
    fileFilter: upload_middleware_1.fileFilter,
});
//# sourceMappingURL=multer.js.map