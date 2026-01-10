import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { storage } from "@/lib/storage";
import { type BackupFrequency } from "@shared/schema";

const BACKUP_STORAGE_KEYS = {
  FREQUENCY: "hm_backup_frequency",
  LAST_BACKUP_TIME: "hm_last_backup_time",
  NEXT_SCHEDULED_TIME: "hm_next_scheduled_time",
  SCHEDULED_NOTIFICATION_ID: "hm_scheduled_notification_id",
} as const;

const AUTO_BACKUP_FILENAME = "homestaff360-auto-backup.hs360";
const BACKUP_NOTIFICATION_ID = 999;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;
const ONE_MONTH_MS = 30 * ONE_DAY_MS;

export function getBackupFrequency(): BackupFrequency {
  const value = localStorage.getItem(BACKUP_STORAGE_KEYS.FREQUENCY);
  if (value === "daily" || value === "weekly" || value === "monthly") {
    return value;
  }
  return "off";
}

export function setBackupFrequency(frequency: BackupFrequency): void {
  localStorage.setItem(BACKUP_STORAGE_KEYS.FREQUENCY, frequency);
  
  if (frequency === "off") {
    cancelScheduledBackup();
    localStorage.removeItem(BACKUP_STORAGE_KEYS.NEXT_SCHEDULED_TIME);
  } else {
    scheduleNextBackup(frequency);
  }
}

export function getLastBackupTime(): number | null {
  const value = localStorage.getItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME);
  return value ? parseInt(value, 10) : null;
}

function setLastBackupTime(timestamp: number): void {
  localStorage.setItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME, timestamp.toString());
}

export function getNextScheduledTime(): number | null {
  const value = localStorage.getItem(BACKUP_STORAGE_KEYS.NEXT_SCHEDULED_TIME);
  return value ? parseInt(value, 10) : null;
}

function setNextScheduledTime(timestamp: number): void {
  localStorage.setItem(BACKUP_STORAGE_KEYS.NEXT_SCHEDULED_TIME, timestamp.toString());
}

function getFrequencyInterval(frequency: BackupFrequency): number {
  switch (frequency) {
    case "daily":
      return ONE_DAY_MS;
    case "weekly":
      return ONE_WEEK_MS;
    case "monthly":
      return ONE_MONTH_MS;
    default:
      return Infinity;
  }
}

function calculateNextMidnight(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function calculateNextBackupTime(frequency: BackupFrequency): Date {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  
  switch (frequency) {
    case "daily": {
      const next = calculateNextMidnight();
      return next;
    }
    case "weekly": {
      const next = calculateNextMidnight();
      const daysUntilNextWeek = 7 - now.getDay();
      next.setDate(next.getDate() + (daysUntilNextWeek === 0 ? 7 : daysUntilNextWeek));
      return next;
    }
    case "monthly": {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      return next;
    }
    default:
      return new Date(now.getTime() + ONE_DAY_MS);
  }
}

export function shouldPerformAutoBackup(): boolean {
  const frequency = getBackupFrequency();
  if (frequency === "off") {
    return false;
  }

  const nextScheduled = getNextScheduledTime();
  if (!nextScheduled) {
    return true;
  }

  const now = Date.now();
  return now >= nextScheduled;
}

export function getNextBackupTime(): Date | null {
  const frequency = getBackupFrequency();
  if (frequency === "off") {
    return null;
  }

  const nextScheduled = getNextScheduledTime();
  if (nextScheduled) {
    return new Date(nextScheduled);
  }

  return calculateNextBackupTime(frequency);
}

export function formatLastBackupTime(): string {
  const lastBackup = getLastBackupTime();
  if (!lastBackup) {
    return "Never";
  }
  return new Date(lastBackup).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNextBackupTime(): string {
  const nextBackup = getNextBackupTime();
  if (!nextBackup) {
    return "";
  }
  return nextBackup.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function deleteExistingAutoBackup(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.deleteFile({
        path: `HomeStaff360Backups/${AUTO_BACKUP_FILENAME}`,
        directory: Directory.Documents,
      });
    } catch {
      // File doesn't exist, that's fine
    }
  } else {
    const existingBackups = localStorage.getItem("hm_local_backups");
    if (existingBackups) {
      const backups: Record<string, string> = JSON.parse(existingBackups);
      delete backups[AUTO_BACKUP_FILENAME];
      localStorage.setItem("hm_local_backups", JSON.stringify(backups));
    }
  }
}

export async function performAutoBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const backup = storage.exportBackup();
    const json = JSON.stringify(backup, null, 2);

    await deleteExistingAutoBackup();

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: `HomeStaff360Backups/${AUTO_BACKUP_FILENAME}`,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else {
      const existingBackups = localStorage.getItem("hm_local_backups");
      const backups: Record<string, string> = existingBackups ? JSON.parse(existingBackups) : {};
      backups[AUTO_BACKUP_FILENAME] = json;
      localStorage.setItem("hm_local_backups", JSON.stringify(backups));
    }

    const now = Date.now();
    setLastBackupTime(now);
    
    const frequency = getBackupFrequency();
    if (frequency !== "off") {
      scheduleNextBackup(frequency);
    }

    return { success: true, filename: AUTO_BACKUP_FILENAME };
  } catch (error) {
    console.error("Auto-backup failed:", error);
    return { success: false, error: (error as Error).message };
  }
}

async function scheduleNextBackup(frequency: BackupFrequency): Promise<void> {
  const nextTime = calculateNextBackupTime(frequency);
  setNextScheduledTime(nextTime.getTime());

  if (Capacitor.isNativePlatform()) {
    try {
      const permissions = await LocalNotifications.checkPermissions();
      if (permissions.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      await LocalNotifications.cancel({ notifications: [{ id: BACKUP_NOTIFICATION_ID }] });

      await LocalNotifications.schedule({
        notifications: [
          {
            id: BACKUP_NOTIFICATION_ID,
            title: "Auto Backup Scheduled",
            body: "Your data backup is ready to be created",
            schedule: { at: nextTime },
            sound: undefined,
            actionTypeId: "",
            extra: { action: "auto_backup" },
          },
        ],
      });
      
      console.log("Scheduled backup notification for:", nextTime.toLocaleString());
    } catch (error) {
      console.error("Failed to schedule backup notification:", error);
    }
  }
}

async function cancelScheduledBackup(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: BACKUP_NOTIFICATION_ID }] });
    } catch (error) {
      console.error("Failed to cancel backup notification:", error);
    }
  }
}

export async function listLocalBackups(): Promise<Array<{ name: string; date: Date }>> {
  const backups: Array<{ name: string; date: Date }> = [];

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.readdir({
        path: "HomeStaff360Backups",
        directory: Directory.Documents,
      });

      for (const file of result.files) {
        if (file.name.endsWith(".hs360")) {
          const lastBackup = getLastBackupTime();
          const date = file.name === AUTO_BACKUP_FILENAME && lastBackup 
            ? new Date(lastBackup) 
            : new Date();
          backups.push({ name: file.name, date });
        }
      }
    } catch (error) {
      console.log("No backup directory found or empty");
    }
  } else {
    const existingBackups = localStorage.getItem("hm_local_backups");
    if (existingBackups) {
      const backupData = JSON.parse(existingBackups) as Record<string, string>;
      for (const filename of Object.keys(backupData)) {
        const lastBackup = getLastBackupTime();
        const date = filename === AUTO_BACKUP_FILENAME && lastBackup 
          ? new Date(lastBackup) 
          : new Date();
        backups.push({ name: filename, date });
      }
    }
  }

  return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function loadLocalBackup(filename: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Filesystem.readFile({
        path: `HomeStaff360Backups/${filename}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return result.data as string;
    } catch (error) {
      console.error("Failed to read backup file:", error);
      return null;
    }
  } else {
    const existingBackups = localStorage.getItem("hm_local_backups");
    if (existingBackups) {
      const backupData = JSON.parse(existingBackups) as Record<string, string>;
      return backupData[filename] || null;
    }
    return null;
  }
}

export async function deleteLocalBackup(filename: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Filesystem.deleteFile({
        path: `HomeStaff360Backups/${filename}`,
        directory: Directory.Documents,
      });
      return true;
    } catch (error) {
      console.error("Failed to delete backup file:", error);
      return false;
    }
  } else {
    const existingBackups = localStorage.getItem("hm_local_backups");
    if (existingBackups) {
      const backupData = JSON.parse(existingBackups) as Record<string, string>;
      if (backupData[filename]) {
        delete backupData[filename];
        localStorage.setItem("hm_local_backups", JSON.stringify(backupData));
        return true;
      }
    }
    return false;
  }
}

let autoBackupInterval: ReturnType<typeof setInterval> | null = null;

export function initializeAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
  }

  const checkAndBackup = async () => {
    if (shouldPerformAutoBackup()) {
      console.log("Performing scheduled auto-backup...");
      const result = await performAutoBackup();
      if (result.success) {
        console.log("Auto-backup completed:", result.filename);
      } else {
        console.error("Auto-backup failed:", result.error);
      }
    }
  };

  checkAndBackup();

  autoBackupInterval = setInterval(checkAndBackup, 60 * 60 * 1000);

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.addListener('localNotificationReceived', async (notification) => {
      if (notification.extra?.action === 'auto_backup') {
        console.log("Backup notification received, performing backup...");
        await performAutoBackup();
      }
    });

    LocalNotifications.addListener('localNotificationActionPerformed', async (notification) => {
      if (notification.notification.extra?.action === 'auto_backup') {
        console.log("Backup notification action performed, performing backup...");
        await performAutoBackup();
      }
    });
  }
}

export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
}
