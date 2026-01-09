import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { storage } from "@/lib/storage";
import { type BackupFrequency } from "@shared/schema";

const BACKUP_STORAGE_KEYS = {
  FREQUENCY: "hm_backup_frequency",
  LAST_BACKUP_TIME: "hm_last_backup_time",
  LAST_BACKUP_FILE: "hm_last_backup_file",
} as const;

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
}

export function getLastBackupTime(): number | null {
  const value = localStorage.getItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME);
  return value ? parseInt(value, 10) : null;
}

function setLastBackupTime(timestamp: number): void {
  localStorage.setItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME, timestamp.toString());
}

export function getLastBackupFilename(): string | null {
  return localStorage.getItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_FILE);
}

function setLastBackupFilename(filename: string): void {
  localStorage.setItem(BACKUP_STORAGE_KEYS.LAST_BACKUP_FILE, filename);
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

export function shouldPerformAutoBackup(): boolean {
  const frequency = getBackupFrequency();
  if (frequency === "off") {
    return false;
  }

  const lastBackup = getLastBackupTime();
  if (!lastBackup) {
    return true;
  }

  const interval = getFrequencyInterval(frequency);
  const now = Date.now();
  return (now - lastBackup) >= interval;
}

export function getNextBackupTime(): Date | null {
  const frequency = getBackupFrequency();
  if (frequency === "off") {
    return null;
  }

  const lastBackup = getLastBackupTime();
  if (!lastBackup) {
    return new Date();
  }

  const interval = getFrequencyInterval(frequency);
  return new Date(lastBackup + interval);
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

export async function performAutoBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const backup = storage.exportBackup();
    const json = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `homestaff360-auto-backup-${dateStr}.hs360`;

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: `HomeStaff360Backups/${filename}`,
        data: json,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } else {
      const existingBackups = localStorage.getItem("hm_local_backups");
      const backups: Record<string, string> = existingBackups ? JSON.parse(existingBackups) : {};
      const sortedKeys = Object.keys(backups).sort();
      while (sortedKeys.length >= 5) {
        const oldestKey = sortedKeys.shift();
        if (oldestKey) {
          delete backups[oldestKey];
        }
      }
      backups[filename] = json;
      localStorage.setItem("hm_local_backups", JSON.stringify(backups));
    }

    setLastBackupTime(Date.now());
    setLastBackupFilename(filename);

    return { success: true, filename };
  } catch (error) {
    console.error("Auto-backup failed:", error);
    return { success: false, error: (error as Error).message };
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
          const match = file.name.match(/auto-backup-(\d{4}-\d{2}-\d{2})/);
          const date = match ? new Date(match[1]) : new Date();
          backups.push({ name: file.name, date });
        }
      }
    } catch {
      // No backup directory found or empty
    }
  } else {
    const existingBackups = localStorage.getItem("hm_local_backups");
    if (existingBackups) {
      const backupData = JSON.parse(existingBackups) as Record<string, string>;
      for (const filename of Object.keys(backupData)) {
        const match = filename.match(/auto-backup-(\d{4}-\d{2}-\d{2})/);
        const date = match ? new Date(match[1]) : new Date();
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
      const result = await performAutoBackup();
      if (!result.success) {
        console.error("Auto-backup failed:", result.error);
      }
    }
  };

  checkAndBackup();

  autoBackupInterval = setInterval(checkAndBackup, 60 * 60 * 1000);
}

export function stopAutoBackup(): void {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
}
