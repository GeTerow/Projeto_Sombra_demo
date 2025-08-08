import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes';
import { saleswomenRouter } from './routes/saleswomen.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middlewares essenciais
app.use(cors()); // Permite que o frontend acesse esta API
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/saleswomen', saleswomenRouter); // <<< USE A NOVA ROTA

// Rota para Tarefas
app.use('/api/v1/tasks', tasksRouter);

// Rota de health check para verificar se o servidor está no ar
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend Principal (Node.js) rodando na porta ${PORT}`);
    console.log(`🔗 Acesse o Health Check em http://localhost:${PORT}/health`);
});