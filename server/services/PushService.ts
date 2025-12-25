import webpush from 'web-push';

// In a real app, these should be environment variables
const VAPID_PUBLIC_KEY = 'BIlt3bJbrihkU-C59ai6O7HTkHv2DDxBQYqCmTf21HXtvnz4AtQoFDNY1Yp-NjkKiZx1EsJmAzvKjXDDsvbJec0';
const VAPID_PRIVATE_KEY = 'WeOUiG99HErtbuK-nDQhlRw4dVwdmfa4usBoFWCWSCE';

// Configure web-push
webpush.setVapidDetails(
    'mailto:admin@buildpro.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

// Mock storage for subscriptions
// In production, this would be a database table: user_id -> subscription_json
const subscriptions: Record<string, webpush.PushSubscription[]> = {};

export const pushService = {
    getPublicKey: () => VAPID_PUBLIC_KEY,

    addSubscription: (userId: string, subscription: webpush.PushSubscription) => {
        if (!subscriptions[userId]) {
            subscriptions[userId] = [];
        }
        // Avoid duplicates
        const exists = subscriptions[userId].some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            subscriptions[userId].push(subscription);
        }
    },

    sendNotification: async (userId: string, payload: any) => {
        const userSubs = subscriptions[userId];
        if (!userSubs || userSubs.length === 0) return;

        const notifications = userSubs.map(sub => {
            return webpush.sendNotification(sub, JSON.stringify(payload))
                .catch(error => {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Subscription is invalid/expired, remove it
                        subscriptions[userId] = subscriptions[userId].filter(s => s.endpoint !== sub.endpoint);
                    }
                    console.error('Push notification failed', error);
                });
        });

        await Promise.all(notifications);
    },

    // Helper to send to all (for testing)
    broadcastNotification: async (payload: any) => {
        const allUsers = Object.keys(subscriptions);
        await Promise.all(allUsers.map(uid => pushService.sendNotification(uid, payload)));
    }
};
