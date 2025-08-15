"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasksRouter = void 0;
const express_1 = require("express");
const taskController = __importStar(require("../controllers/task.controller"));
const multer_1 = require("../configs/multer");
const router = (0, express_1.Router)();
exports.tasksRouter = router;
// Rota para o stream de Server-Sent Events
router.get('/stream', taskController.streamTaskEvents);
// Rota para buscar tarefas de uma vendedora específica
router.get('/saleswomen/:saleswomanId', taskController.getTasksBySaleswoman);
// Rota para buscar uma tarefa específica por ID
router.get('/:id', taskController.getTaskById);
// Rota para buscar o ficheiro de áudio de uma tarefa
router.get('/:id/audio', taskController.getTaskAudio);
// Rota para criar uma nova tarefa (com upload de áudio)
router.post('/', multer_1.upload.single('audio'), taskController.createTask);
// Rota para o webhook de atualização de tarefa (usada pelo worker)
router.patch('/:id/complete', taskController.updateTask);
// Rota para o PDF de análise da tarefa
router.get('/:id/pdf', taskController.getTaskPdf);
//# sourceMappingURL=task.routes.js.map