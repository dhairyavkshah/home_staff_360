import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const STORAGE_KEYS = {
  LAST_DONATION_AT: "hm_last_donation_at",
  LAST_DONATION_REMINDER: "hm_last_donation_reminder",
} as const;

const NOTIFICATION_ID = 9999;
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function getLastDonationTimestamp(): number | null {
  const value = localStorage.getItem(STORAGE_KEYS.LAST_DONATION_AT);
  return value ? parseInt(value, 10) : null;
}

export function getLastReminderTimestamp(): number | null {
  const value = localStorage.getItem(STORAGE_KEYS.LAST_DONATION_REMINDER);
  return value ? parseInt(value, 10) : null;
}

export function getDaysSinceLastDonation(): number {
  const lastDonation = getLastDonationTimestamp();
  if (!lastDonation) {
    return Infinity;
  }
  const now = Date.now();
  const diffMs = now - lastDonation;
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export function checkShouldShowReminder(): boolean {
  const now = Date.now();
  const lastDonation = getLastDonationTimestamp();
  const lastReminder = getLastReminderTimestamp();

  const donatedWithin6Months = lastDonation && (now - lastDonation < SIX_MONTHS_MS);
  if (donatedWithin6Months) {
    return false;
  }

  const reminderShownThisMonth = lastReminder && (now - lastReminder < ONE_MONTH_MS);
  if (reminderShownThisMonth) {
    return false;
  }

  return true;
}

export function markReminderShown(): void {
  localStorage.setItem(STORAGE_KEYS.LAST_DONATION_REMINDER, Date.now().toString());
}

export function markDonationComplete(): void {
  const now = Date.now();
  localStorage.setItem(STORAGE_KEYS.LAST_DONATION_AT, now.toString());
  localStorage.removeItem(STORAGE_KEYS.LAST_DONATION_REMINDER);
  
  cancelDonationNotification();
  scheduleDonationNotification(now + SIX_MONTHS_MS);
}

async function cancelDonationNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch (error) {
    console.warn("Failed to cancel donation notification:", error);
  }
}

async function scheduleDonationNotification(triggerTime: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  try {
    const permResult = await LocalNotifications.checkPermissions();
    if (permResult.display !== "granted") {
      return;
    }
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: "Support the App",
          body: "Your support helps us improve. Consider a small donation to keep the app growing.",
          schedule: { at: new Date(triggerTime) },
          smallIcon: "ic_launcher",
          largeIcon: "ic_launcher",
        },
      ],
    });
  } catch (error) {
    console.warn("Failed to schedule donation notification:", error);
  }
}

export async function initializeDonationNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  
  const lastDonation = getLastDonationTimestamp();
  const now = Date.now();
  
  if (lastDonation) {
    const timeSinceDonation = now - lastDonation;
    if (timeSinceDonation >= SIX_MONTHS_MS) {
      scheduleDonationNotification(now + ONE_MONTH_MS);
    }
  } else {
    scheduleDonationNotification(now + ONE_MONTH_MS);
  }
}
