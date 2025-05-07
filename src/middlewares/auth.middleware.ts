// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { customRequest } from '../types';
import { getConfig } from '../config';

interface TokenPayload {
    userId: string;
    role: string;
    email: string;
    iat?: number;
    exp?: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        if ((req as customRequest).routeInfo?.authorized) {
            logger.info(`Route requires authorization: ${req.method} ${req.path}`, {
                requestId: (req as customRequest).requestId || 'unknown'
            });

            const { JWT_SECRET } = getConfig();
            const token = extractTokenFromRequest(req);

            if (!token) {
                logger.warn('Authentication failed: No token provided', {
                    requestId: (req as customRequest).requestId || 'unknown',
                    path: req.originalUrl
                });

                res.status(401).json({
                    message: 'Authentication required',
                    status: 'UNAUTHORIZED',
                    timestamp: new Date().toISOString()
                });
                return;
            }

            // Verify the token
            if (!JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in the configuration');
            }
            const decoded = jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;

            // Add user data to request object for downstream use
            (req as customRequest).user = {
                id: decoded.userId,
                role: decoded.role,
                email: decoded.email
            };

            // Add user info to headers for microservices
            req.headers['x-user-id'] = decoded.userId;
            req.headers['x-user-role'] = decoded.role;
            req.headers['x-user-email'] = decoded.email;

            logger.info('Authentication successful', {
                requestId: (req as customRequest).requestId || 'unknown',
                userId: decoded.userId,
                role: decoded.role,
                path: req.originalUrl
            });

            next();
        } else {
            logger.info(`Route is public: ${req.method} ${req.path}`, {
                requestId: (req as customRequest).requestId || 'unknown'
            });
            return next();
        }
    } catch (error) {
        const err = error as Error;

        if (err.name === 'TokenExpiredError') {
            logger.warn('Authentication failed: Token expired', {
                requestId: (req as customRequest).requestId || 'unknown',
                path: req.originalUrl
            });

            res.status(401).json({
                message: 'Token expired',
                status: 'UNAUTHORIZED',
                timestamp: new Date().toISOString()
            });
            return;
        }

        logger.error('Authentication error', {
            requestId: (req as customRequest).requestId || 'unknown',
            error: err.message,
            path: req.originalUrl
        });

        res.status(401).json({
            message: 'Invalid authentication token',
            status: 'UNAUTHORIZED',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Extract token from various request locations 
 * (Authorization header, query param, or cookie)
 */
function extractTokenFromRequest(req: Request): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    // Check query parameter
    if (req.query && req.query.token) {
        return req.query.token as string;
    }

    // Check cookies
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }

    return null;
}

export default authMiddleware;