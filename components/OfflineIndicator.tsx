import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setIsVisible(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setIsVisible(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if (!navigator.onLine) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline || !isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 bg-zinc-900 border border-zinc-700 text-white p-4 rounded-lg shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-full">
                    <WifiOff className="w-5 h-5 text-red-400" />
                </div>
                <div>
                    <h3 className="font-medium text-sm">You are offline</h3>
                    <p className="text-xs text-zinc-400">Changes will be synced when you reconnect.</p>
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
                <X className="w-4 h-4 text-zinc-400" />
            </button>
        </div>
    );
};
