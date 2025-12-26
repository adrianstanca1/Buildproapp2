
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    addNotification: (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const { addToast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // Initial fetch (mock for now, real implementation would fetch from API)
    useEffect(() => {
        if (user) {
            // TODO: Fetch existing notifications from backend API
            // For now, start empty
        }
    }, [user]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // WebSocket Connection
    useEffect(() => {
        if (!user || !token) return;

        // Determine WS URL
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // e.g. localhost:3002
        const wsUrl = `${protocol}//${host}/api/live`;

        let ws: WebSocket;
        let pingInterval: any;

        const connect = () => {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Notification Socket Connected');
                // Join user-specific channel
                ws.send(JSON.stringify({
                    type: 'join_user_channel',
                    userId: user.id
                }));

                pingInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'presence_ping' }));
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        const newNote: Notification = {
                            id: data.id,
                            type: data.notificationType,
                            title: data.title,
                            message: data.message,
                            link: data.link,
                            isRead: false,
                            createdAt: data.createdAt
                        };

                        setNotifications(prev => [newNote, ...prev]);

                        // Show Toast immediately
                        addToast(data.title, data.notificationType === 'error' ? 'error' : data.notificationType === 'success' ? 'success' : 'info');
                    }
                } catch (err) {
                    console.error('Notification Parse Error', err);
                }
            };

            ws.onclose = () => {
                console.log('Notification Socket Disconnected');
                clearInterval(pingInterval);
                // Reconnect logic could go here
            };

            setSocket(ws);
        };

        connect();

        return () => {
            if (ws) ws.close();
            clearInterval(pingInterval);
        };
    }, [user, token]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        // TODO: Call API to mark as read
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const addNotification = (n: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
        const newNote: Notification = {
            ...n,
            id: Math.random().toString(36).substr(2, 9),
            isRead: false,
            createdAt: new Date().toISOString()
        };
        setNotifications(prev => [newNote, ...prev]);
        addToast(n.title, n.type === 'error' ? 'error' : n.type === 'success' ? 'success' : 'info');
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
