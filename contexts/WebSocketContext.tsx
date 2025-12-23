
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface WebSocketContextType {
    isConnected: boolean;
    joinRoom: (projectId: string) => void;
    leaveRoom: () => void;
    sendMessage: (type: string, payload: any) => void;
    lastMessage: any;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, refreshPermissions } = useAuth();
    const { addToast } = useToast();
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const currentRoomRef = useRef<string | null>(null);

    const connect = () => {
        // In Vercel prod, WS might fail or need external provider.
        // We use relative path which proxies to backend in dev, or fails gracefully in serverless if not supported
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // e.g. localhost:5173 or my-app.vercel.app

        // Use environment var or fallback to relative path (handled by proxy in dev and prod)
        // In local dev, Vite proxies /api/live -> localhost:3002
        // In prod Vercel, Vercel proxies /api/live -> Cloud Run
        const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}/api/live`;

        console.log('Connecting to WS:', wsUrl);

        try {
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WS Protected Connection Established');
                setIsConnected(true);
                // Re-join room if we had one
                if (currentRoomRef.current && user) {
                    joinRoom(currentRoomRef.current);
                }
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);

                    if (data.type === 'project_updated') {
                        addToast(`Project updated by another user`, 'info');
                    }

                    if (data.type === 'rbac_updated') {
                        refreshPermissions();
                        addToast('Permissions updated.', 'info');
                    }
                } catch (e) {
                    console.error('WS Parse Error', e);
                }
            };

            socket.onclose = () => {
                console.log('WS Disconnected');
                setIsConnected(false);
                // Auto reconnect
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            socket.onerror = (err) => {
                console.error('WS Error', err);
                socket.close();
            };

            socketRef.current = socket;

        } catch (e) {
            console.error('WS Connection Failed', e);
        }
    };

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            clearTimeout(reconnectTimeoutRef.current);
        };
    }, []); // Run once on mount

    const joinRoom = (projectId: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN && user) {
            currentRoomRef.current = projectId;
            socketRef.current.send(JSON.stringify({
                type: 'join_project',
                projectId,
                userId: user.id
            }));
        }
    };

    const leaveRoom = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'leave_project' }));
            currentRoomRef.current = null;
        }
    };

    const sendMessage = (type: string, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                type,
                payload,
                projectId: currentRoomRef.current, // Context aware
                userId: user?.id
            }));
        }
    };

    return (
        <WebSocketContext.Provider value={{ isConnected, joinRoom, leaveRoom, sendMessage, lastMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};
