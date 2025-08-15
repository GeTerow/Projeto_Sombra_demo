import { Router } from 'express';
import * as saleswomanController from '../controllers/saleswoman.controller';

const router = Router();

// Rota para listar todas as vendedoras.
router.get('/', saleswomanController.listSaleswomen);

// Rota para criar uma nova vendedora.
router.post('/', saleswomanController.createNewSaleswoman);

// Rota para gerar um novo resumo em PDF.
router.post('/:id/generate-summary-pdf', saleswomanController.generateSummaryPdf);

// Rota para baixar o PDF de resumo.
router.get('/:id/download-summary-pdf', saleswomanController.downloadSummaryPdf);

export { router as saleswomenRouter };