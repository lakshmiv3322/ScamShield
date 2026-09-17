// server/services/notifications.ts
import webpush from 'web-push';
import { getPushSubscriptionsByUserIds, deletePushSubscription } from '../db/queries/subscriptions.js';
import { getFamilyMembers } from '../db/queries/family.js';
import { getUserById } from '../db/queries/auth.js';
import { sendEmailAlert } from './email.js';

// VAPID keys setup — use env vars if provided, otherwise generate a deterministic or stable default pair
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
  // Generate valid default VAPID keys so push works out of the box
  const generated = webpush.generateVAPIDKeys();
  vapidPublicKey = generated.publicKey;
  vapidPrivateKey = generated.privateKey;
  console.log('🔑 [Web Push] Generated default VAPID key pair for session.');
}

const vapidEmail = process.env.VAPID_SUBJECT || 'mailto:security@scamshield.local';

webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

export function getVapidPublicKey(): string {
  return vapidPublicKey!;
}

export interface PushAlertPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    messageId?: string;
    url?: string;
    riskLevel?: string;
  };
}

export async function sendPushToSubscription(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushAlertPayload
): Promise<boolean> {
  try {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    console.log(`[Web Push] Successfully sent push notification to ${sub.endpoint.slice(0, 35)}...`);
    return true;
  } catch (err: any) {
    console.warn(`[Web Push] Push notification failed (${err.statusCode || err.message})`);
    // 410 Gone or 404 Not Found means the subscription is expired or cancelled
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log(`[Web Push] Pruning inactive push endpoint: ${sub.endpoint.slice(0, 35)}...`);
      deletePushSubscription(sub.endpoint);
    }
    return false;
  }
}

export async function dispatchFamilyThreatAlert(params: {
  familyId: string;
  alert: {
    id: string;
    messageId: string;
    riskLevel: string;
    title: string;
    description: string;
    affectedMemberName: string;
    affectedMemberRelation: string;
    scamType: string;
  };
  originalText?: string;
  actionableAdvice?: string;
}): Promise<{ pushCount: number; emailCount: number }> {
  const { familyId, alert, originalText, actionableAdvice } = params;

  // 1. Find all members of this family who have receive_alerts = 1
  const members = getFamilyMembers(familyId).filter((m) => Boolean(m.receive_alerts));
  if (members.length === 0) return { pushCount: 0, emailCount: 0 };

  const userIds = members.map((m) => m.user_id);
  const subscriptions = getPushSubscriptionsByUserIds(userIds);

  // Group subscriptions by user_id
  const subsByUserId = new Map<string, typeof subscriptions>();
  for (const s of subscriptions) {
    const existing = subsByUserId.get(s.user_id) || [];
    existing.push(s);
    subsByUserId.set(s.user_id, existing);
  }

  let pushSuccessCount = 0;
  let emailSuccessCount = 0;

  const pushPayload: PushAlertPayload = {
    title: `🚨 ${alert.title}`,
    body: `${alert.affectedMemberName}: ${alert.description}`,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {
      messageId: alert.messageId,
      url: `/?messageId=${alert.messageId}`,
      riskLevel: alert.riskLevel,
    },
  };

  for (const member of members) {
    const userSubs = subsByUserId.get(member.user_id) || [];
    let memberReceivedPush = false;

    if (userSubs.length > 0) {
      for (const sub of userSubs) {
        const sent = await sendPushToSubscription(sub, pushPayload);
        if (sent) {
          memberReceivedPush = true;
          pushSuccessCount++;
        }
      }
    }

    // Fallback: If member has not enabled push or push failed, dispatch via Resend Email!
    if (!memberReceivedPush) {
      const user = getUserById(member.user_id);
      if (user && user.email) {
        const emailResult = await sendEmailAlert({
          to: user.email,
          memberName: alert.affectedMemberName,
          scamType: alert.scamType,
          riskScore: alert.riskLevel === 'scam' ? 95 : 60,
          riskLevel: alert.riskLevel,
          summary: originalText || alert.description,
          actionableAdvice: actionableAdvice || 'Verify independently before taking action on this message.',
          messageId: alert.messageId,
        });

        if (emailResult.success) {
          emailSuccessCount++;
        }
      }
    }
  }

  console.log(`[Alert Notification Dispatch] Dispatched to family ${familyId}: ${pushSuccessCount} push, ${emailSuccessCount} email fallback`);
  return { pushCount: pushSuccessCount, emailCount: emailSuccessCount };
}
