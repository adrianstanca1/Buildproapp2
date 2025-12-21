import { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';
import { AppError } from '../utils/AppError.js';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        logger.error('DEV ERROR:', {
            statusCode: err.statusCode,
            status: err.status,
            message: err.message,
            stack: err.stack,
            error: err
        });

        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production
        if (err.isOperational) {
            // Trusted operational error: send message to client
            logger.warn('OPERATIONAL ERROR:', { message: err.message, statusCode: err.statusCode });
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            // Programming or other unknown error: don't leak details
            logger.error('PROGRAMMING ERROR:', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};

export default errorHandler;
