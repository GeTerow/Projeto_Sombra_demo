import { mockSaleswomen } from '../lib/mock-data';

const DEMO_ERROR = {
  statusCode: 403,
  message: 'Funcionalidade desabilitada na versão de demonstração pública.',
};

export const getAllSaleswomen = async () => {
  console.log('[DEMO MODE] Retornando lista de vendedoras mockadas.');
  return mockSaleswomen;
  /*
  // --- LÓGICA ORIGINAL ---
  return prisma.saleswoman.findMany({
    orderBy: { name: 'asc' },
  });
  */
};

export const createSaleswoman = async (name: string, email?: string) => {
  console.log('[DEMO MODE] Bloqueada tentativa de criar vendedora.');
  throw DEMO_ERROR;
};

export const updateSaleswoman = async (id: string, data: { name?: string; email?: string }) => {
  console.log('[DEMO MODE] Bloqueada tentativa de atualizar vendedora.');
  throw DEMO_ERROR;
};

export const deleteSaleswoman = async (id: string) => {
  console.log('[DEMO MODE] Bloqueada tentativa de deletar vendedora.');
  throw DEMO_ERROR;
};

export const generateOnDemandSummary = async (id: string, force: boolean = false) => {
  console.log('[DEMO MODE] Bloqueada tentativa de gerar resumo.');
  throw DEMO_ERROR;
};

export const sendSummaryEmailToSaleswoman = async (id: string) => {
  console.log('[DEMO MODE] Bloqueada tentativa de enviar e-mail.');
  throw DEMO_ERROR;
};

export const getSummaryPdfPath = async (id: string) => {
  const saleswoman = mockSaleswomen.find(s => s.id === id);
  if (!saleswoman || !saleswoman.summaryPdfPath) {
    return null;
  }
  return {
    path: "eh/pra/falhar.pdf",
    name: `Resumo-Demo-${saleswoman.name.replace(/\s/g, '_')}.pdf`,
  };
};