// src/utils/pushNotifications.ts

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

export async function subscribeUserToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported by this browser.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied.' };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'Failed to initialize service worker.' };
    }

    // Fetch server VAPID public key
    const keyRes = await fetch('/api/notifications/vapid-public-key');
    if (!keyRes.ok) {
      return { success: false, error: 'Failed to retrieve server VAPID key.' };
    }
    const { publicKey } = await keyRes.json();

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // Save to database
    const subRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });

    if (!subRes.ok) {
      return { success: false, error: 'Failed to record push subscription on server.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error subscribing to push notifications:', err);
    return { success: false, error: err.message || 'Push subscription failed.' };
  }
}

export async function sendTestPushNotification(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/notifications/test', { method: 'POST' });
    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : {};
    if (!res.ok) {
      return { success: false, error: data.error || `Server error (${res.status})` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to send test push' };
  }
}
