import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { tasksRouter } from './routes/tasks.routes';
import { saleswomenRouter } from './routes/saleswomen.routes';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/saleswomen', saleswomenRouter); 

// Rota para Tarefas
app.use('/api/v1/tasks', tasksRouter);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Principal (Node.js) rodando na porta ${PORT}`);
});