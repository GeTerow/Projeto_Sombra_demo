"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSseEvent = exports.removeSseClient = exports.addSseClient = void 0;
// Lista que armazena todos os clientes SSE ativos.
let clients = [];
const addSseClient = (res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const clientId = Date.now();
    const newClient = { id: clientId, response: res };
    clients.push(newClient);
    console.log(`[SSE] Cliente ${clientId} conectado. Total de clientes: ${clients.length}`);
    // Envia uma mensagem inicial de conexão
    res.write(`data: ${JSON.stringify({ message: "Conectado ao stream de status." })}\n\n`);
    // Retorna o ID do cliente para que possa ser removido ao desconectar
    return clientId;
};
exports.addSseClient = addSseClient;
const removeSseClient = (clientId) => {
    clients = clients.filter(client => client.id !== clientId);
    console.log(`[SSE] Cliente ${clientId} desconectado. Total de clientes: ${clients.length}`);
};
exports.removeSseClient = removeSseClient;
const sendSseEvent = (data) => {
    console.log(`[SSE] Enviando atualização para ${clients.length} cliente(s):`, data.id, data.status);
    clients.forEach(client => client.response.write(`data: ${JSON.stringify(data)}\n\n`));
};
exports.sendSseEvent = sendSseEvent;
//# sourceMappingURL=sse.service.js.map