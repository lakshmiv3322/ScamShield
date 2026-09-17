// server/routes/notifications.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { getVapidPublicKey, sendPushToSubscription } from '../services/notifications.js';
import { savePushSubscription, getPushSubscriptionsByUserId } from '../db/queries/subscriptions.js';

export const notificationsRouter = Router();

// GET /api/notifications/vapid-public-key — Public VAPID key for service worker subscription
notificationsRouter.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

// POST /api/notifications/subscribe — Save user push subscription
notificationsRouter.post('/subscribe', requireAuth, (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      res.status(400).json({ error: 'Valid PushSubscription object with keys is required.' });
      return;
    }

    savePushSubscription({
      userId: req.user!.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    res.json({ success: true, message: 'Push subscription stored successfully.' });
  } catch (err: any) {
    console.error('Failed to save push subscription:', err);
    res.status(500).json({ error: 'Failed to register push subscription.' });
  }
});

// POST /api/notifications/test — Send test push notification to user
notificationsRouter.post('/test', requireAuth, async (req, res) => {
  try {
    const subs = getPushSubscriptionsByUserId(req.user!.id);
    if (subs.length === 0) {
      res.status(404).json({ error: 'No active push subscriptions found for this account. Enable notifications first.' });
      return;
    }

    let anyDelivered = false;
    for (const sub of subs) {
      const ok = await sendPushToSubscription(sub, {
        title: '🛡️ ScamShield Live Test Alert',
        body: 'Real-time emergency fraud push alerts are activated for your Family Circle!',
        icon: '/icon.svg',
        data: { url: '/' },
      });
      if (ok) anyDelivered = true;
    }

    res.json({ success: anyDelivered, totalEndpoints: subs.length });
  } catch (err: any) {
    console.error('Error sending test push:', err);
    res.status(500).json({ error: 'Failed to send test push notification.' });
  }
});
