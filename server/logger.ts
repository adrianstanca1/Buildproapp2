import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export const logInfo = (message: string, meta?: any) => {
    logger.info(message, meta);
};

export const logError = (message: string, error?: any) => {
    logger.error(message, error);
};

export const logWarn = (message: string, meta?: any) => {
    logger.warn(message, meta);
};

export default logger;
