// src/utils/createServiceProxy.ts
import { Options } from 'http-proxy-middleware';
import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import logger from '../config/logger';

export const getRequestId = (req: IncomingMessage): string => {
    return (req as any).requestId || 'unknown';
};

export interface ServiceProxyOptions {
    target: string;
    serviceName: string;
    pathRewrite?: { [pattern: string]: string };
    routeType?: string;
}

export function createServiceProxy(options: ServiceProxyOptions): Options {
    const { target, serviceName, pathRewrite, routeType = 'default' } = options;

    return {
        target,
        changeOrigin: true,
        pathRewrite,
        on: {
            proxyReq: (proxyReq, req: IncomingMessage): void => {
                logger.debug(`${serviceName} ${routeType} Proxy Request`, {
                    requestId: getRequestId(req),
                    target: `${target}${(proxyReq as any).path || ''}`,
                    method: req.method
                });
            },
            proxyRes: (proxyRes, req: IncomingMessage): void => {
                logger.debug(`${serviceName} ${routeType} Proxy Response`, {
                    requestId: getRequestId(req),
                    statusCode: proxyRes.statusCode,
                    path: (req as any).originalUrl || req.url
                });
            },
            error: (err: Error, req: IncomingMessage, res: ServerResponse<IncomingMessage> | Socket): void => {
                logger.error(`${serviceName} ${routeType} Proxy Error`, {
                    requestId: getRequestId(req),
                    error: err.message,
                    path: (req as any).originalUrl || req.url
                });

                if ('setHeader' in res && 'end' in res) {
                    res.statusCode = 502;
                    res.setHeader('Content-Type', 'application/json');

                    res.end(JSON.stringify({
                        message: `${serviceName} service unavailable`,
                        requestId: getRequestId(req)
                    }));
                } else if (!('destroyed' in res) || !(res as Socket).destroyed) {
                    (res as Socket).destroy();
                }
            }
        }
    };
}