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
exports.saleswomenRouter = void 0;
const express_1 = require("express");
const saleswomanController = __importStar(require("../controllers/saleswoman.controller"));
const router = (0, express_1.Router)();
exports.saleswomenRouter = router;
// Rota para listar todas as vendedoras.
router.get('/', saleswomanController.listSaleswomen);
// Rota para criar uma nova vendedora.
router.post('/', saleswomanController.createNewSaleswoman);
// Rota para atualizar uma vendedora existente.
router.put('/:id', saleswomanController.updateSaleswoman);
// Rota para deletar uma vendedora.
router.delete('/:id', saleswomanController.deleteSaleswoman);
// Rota para gerar um novo resumo em PDF.
router.post('/:id/generate-summary-pdf', saleswomanController.generateSummaryPdf);
// Rota para baixar o PDF de resumo.
router.get('/:id/download-summary-pdf', saleswomanController.downloadSummaryPdf);
//# sourceMappingURL=saleswomen.routes.js.map