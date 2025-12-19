
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from './utils/logger.js';

export const setupWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server, path: '/api/live' });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        logger.info('Client connected to Live View Socket');

        ws.on('message', (message: string) => {
            // For now, valid JSON parsing is enough to keep connection alive
            try {
                const data = JSON.parse(message.toString());
                logger.info('Received:', data);

                // Simple echo/ack for now to prevent frontend timeouts
                if (data.setup) {
                    ws.send(JSON.stringify({
                        serverContent: {
                            turnComplete: true,
                            outputTranscription: { text: "Backend: Live Connection Established (Mock)" }
                        }
                    }));
                }

            } catch (e) {
                logger.error('Socket message error:', { error: e });
            }
        });

        ws.on('close', () => {
            logger.info('Client disconnected');
        });

        ws.on('error', (err) => {
            logger.error('Socket error:', err);
        });
    });

    return wss;
};
