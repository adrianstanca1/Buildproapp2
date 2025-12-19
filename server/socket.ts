
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';

export const setupWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server, path: '/api/live' });

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        console.log('Client connected to Live View Socket');

        ws.on('message', (message: string) => {
            // For now, valid JSON parsing is enough to keep connection alive
            try {
                const data = JSON.parse(message.toString());
                console.log('Received:', data);

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
                console.error('Socket message error:', e);
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });

        ws.on('error', (err) => {
            console.error('Socket error:', err);
        });
    });

    return wss;
};
