// src/routes/authRoutes.ts
import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import http from 'http';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import logger from '../config/logger';
import serviceRegistry from '../utils/service.registry';
import { createServiceProxy } from '../utils/createProxyService';

const router = Router();

interface ProxyErrorResponse {
    message: string;
    requestId: string;
}

// Use proxy middleware for all auth routes
router.use('/', createProxyMiddleware(createServiceProxy({
    target: serviceRegistry.auth,
    serviceName: 'auth',
    pathRewrite: {
        '^/api/auth': ''
    }
})));

export default router;