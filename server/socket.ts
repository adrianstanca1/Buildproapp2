
import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from './utils/logger.js';

export const setupWebSocketServer = (server: any) => {
    const wss = new WebSocketServer({ server, path: '/api/live' });

    // Store global reference for external broadcasting
    (global as any).wss = wss;
    (global as any).wsClients = new Map<WebSocket, { userId?: string; projectId?: string; isAlive: boolean }>();
    const clients = (global as any).wsClients;

    // Heartbeat to prune dead connections
    const interval = setInterval(() => {
        wss.clients.forEach((ws: any) => {
            if (clients.get(ws)?.isAlive === false) return ws.terminate();
            const client = clients.get(ws);
            if (client) client.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => clearInterval(interval));

    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        logger.info('Client connected to Live View Socket');
        clients.set(ws, { isAlive: true });

        ws.on('pong', () => {
            const client = clients.get(ws);
            if (client) client.isAlive = true;
        });

        ws.on('message', (message: string) => {
            try {
                const data = JSON.parse(message.toString());
                const client = clients.get(ws);

                if (!client) return;

                switch (data.type) {
                    case 'join_project':
                        client.projectId = data.projectId;
                        client.userId = data.userId;
                        logger.info(`User ${data.userId} joined project ${data.projectId}`);

                        // Broadcast presence update to room
                        broadcastToRoom(wss, clients, data.projectId, {
                            type: 'presence_update',
                            userId: data.userId,
                            status: 'online',
                            timestamp: new Date().toISOString()
                        });
                        break;

                    case 'join_user_channel':
                        client.userId = data.userId;
                        logger.info(`User ${data.userId} subscribed to personal notifications`);
                        break;

                    case 'leave_project':
                        if (client.projectId) {
                            const oldRoom = client.projectId;
                            client.projectId = undefined;
                            logger.info(`User ${client.userId} left project ${oldRoom}`);
                        }
                        break;

                    case 'project_update': {
                        const payload = {
                            type: 'project_updated',
                            payload: data.payload,
                            projectId: data.projectId || client.projectId,
                            byUser: client.userId,
                            timestamp: new Date().toISOString()
                        };

                        // 1. Broadcast to specific project room (for details view)
                        if (data.projectId || client.projectId) {
                            broadcastToRoom(wss, clients, data.projectId || client.projectId, payload, ws);
                        }

                        // 2. Broadcast to global dashboard (for portfolio view)
                        broadcastToRoom(wss, clients, 'all_projects', payload, ws);
                        break;
                    }

                    case 'presence_ping':
                        // Keep alive / update status
                        if (client.projectId && client.userId) {
                            // Could throttle this broadcast if needed
                        }
                        break;

                    default:
                        // Echo for basic health checks
                        if (data.setup) {
                            ws.send(JSON.stringify({
                                serverContent: {
                                    turnComplete: true,
                                    outputTranscription: { text: "Backend: Live Connection Active" }
                                }
                            }));
                        }
                        break;
                }

            } catch (e) {
                logger.error('Socket message error:', { error: e });
            }
        });

        ws.on('close', () => {
            const client = clients.get(ws);
            if (client && client.projectId && client.userId) {
                logger.info(`User ${client.userId} disconnected`);
                broadcastToRoom(wss, clients, client.projectId, {
                    type: 'presence_update',
                    userId: client.userId,
                    status: 'offline',
                    timestamp: new Date().toISOString()
                });
            }
            clients.delete(ws);
        });

        ws.on('error', (err) => {
            logger.error('Socket error:', err);
        });
    });

    return wss;
};

// Helper: Broadcast to specific room
const broadcastToRoom = (wss: WebSocketServer, clients: Map<WebSocket, any>, roomId: string, message: any, exclude?: WebSocket) => {
    wss.clients.forEach((client) => {
        const clientData = clients.get(client as WebSocket);
        if (client !== exclude && client.readyState === WebSocket.OPEN && clientData?.projectId === roomId) {
            client.send(JSON.stringify(message));
        }
    });
};

// Helper: Broadcast to specific user (across all their devices/tabs)
export const broadcastToUser = (userId: string, message: any) => {
    const wss = (global as any).wss as WebSocketServer;
    const clients = (global as any).wsClients as Map<WebSocket, any>;

    if (!wss || !clients) return;

    wss.clients.forEach((client) => {
        const clientData = clients.get(client as WebSocket);
        if (client.readyState === WebSocket.OPEN && clientData?.userId === userId) {
            client.send(JSON.stringify(message));
        }
    });
};
