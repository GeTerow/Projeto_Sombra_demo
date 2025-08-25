import { Router } from 'express';
import * as saleswomanController from '../controllers/saleswoman.controller';
import { authenticateToken, authorizeAdmin } from '../common/middlewares/auth.middleware';

const router = Router();

// Rota para listar todas as vendedoras.
router.get('/', authenticateToken, saleswomanController.listSaleswomen);

// Rota para criar uma nova vendedora.
router.post('/', authenticateToken, authorizeAdmin, saleswomanController.createNewSaleswoman);

// Rota para atualizar uma vendedora existente.
router.put('/:id', authenticateToken, authorizeAdmin, saleswomanController.updateSaleswoman);

// Rota para deletar uma vendedora.
router.delete('/:id', authenticateToken, authorizeAdmin, saleswomanController.deleteSaleswoman);

// Rota para gerar um novo resumo em PDF.
router.post('/:id/generate-summary-pdf', authenticateToken, saleswomanController.generateSummaryPdf);

// Rota para baixar o PDF de resumo.
router.get('/:id/download-summary-pdf', authenticateToken, saleswomanController.downloadSummaryPdf);

// Rota para enviar o resumo por e-mail.
router.post('/:id/send-summary-email', authenticateToken, saleswomanController.sendSummaryEmail);

export { router as saleswomenRouter };