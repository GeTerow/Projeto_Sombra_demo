import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './index';

const createApp = (): express.Express => {
    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', message: 'API is healthy' });
    });

    app.use('/api/v1', router);

    return app;
};

export const app = createApp();