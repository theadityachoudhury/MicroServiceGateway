import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler';
import { existsSync, mkdirSync } from 'fs';
import { requestLogger } from './middlewares/logger';
import logger from './config/logger';
import authRoute from './routes/auth.route';
import healthRoute from './routes/health.route';
import { customRequest } from './types';
import { getConfig } from './config';
import corsConfig from './utils/cors';

if (!existsSync('./logs')) {
    mkdirSync('./logs');
}

dotenv.config();
const { NODE_ENV, PORT } = getConfig();

const app = express();

app.use(corsConfig);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Add the request logger middleware

// Log application startup
logger.info(`API Gateway initializing`, {
    environment: NODE_ENV || 'development',
    port: PORT || 3000
});

//health check route
app.use('/health', healthRoute);

app.use('/api/auth', authRoute)


// 404 route
app.use((req, res) => {
    console.log(req)
    logger.warn(`Route not found`, {
        requestId: (req as customRequest).requestId || 'unknown',
        method: req.method,
        url: req.originalUrl
    });
    res.status(404).json({
        message: 'Route not found',
        timestamp: new Date().toLocaleString(),
        status: 'NOT_FOUND'
    });
});

app.use(errorHandler);

export default app;