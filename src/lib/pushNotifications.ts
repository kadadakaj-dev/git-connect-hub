import { supabase } from '@/integrations/supabase/client';

/**
 * Converts a base64 URL string to a Uint8Array (required for applicationServerKey).
 */
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

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
  return 'PushManager' in window && 'serviceWorker' in navigator && !!VAPID_PUBLIC_KEY;
}

/**
 * Get the current push notification permission state.
 */
export function getPushPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Subscribe the user to push notifications.
 * Returns the PushSubscription if successful, null otherwise.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  // Store subscription on server via Supabase
  await saveSubscriptionToServer(subscription);

  return subscription;
}

/**
 * Unsubscribe from push notifications.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return true;

  const success = await subscription.unsubscribe();
  if (success) {
    await removeSubscriptionFromServer(subscription);
  }
  return success;
}

/**
 * Check if the user is currently subscribed to push.
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

/**
 * Save the push subscription to the Supabase backend.
 * This requires a `push_subscriptions` table or edge function on the server.
 */
async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('push_subscriptions').upsert(
    {
      endpoint: subscription.endpoint,
      keys: JSON.stringify(subscription.toJSON().keys),
      user_id: user?.id ?? null,
    },
    { onConflict: 'endpoint' }
  );
}

/**
 * Remove the push subscription from the server.
 */
async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
}
