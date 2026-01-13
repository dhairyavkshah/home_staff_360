import { storage } from "@/lib/storage";

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

interface BackupSchedulerPlugin {
  scheduleBackup(options: { frequency: string; backupData?: string }): Promise<{ success: boolean }>;
  cancelBackup(): Promise<{ success: boolean }>;
  performBackupNow(options: { backupData: string }): Promise<{ success: boolean }>;
}

async function getBackupScheduler(): Promise<BackupSchedulerPlugin | null> {
  if (!isNativePlatform()) return null;
  try {
    const { registerPlugin } = await import("@capacitor/core");
    return registerPlugin<BackupSchedulerPlugin>("BackupScheduler");
  } catch (error) {
    console.error("Failed to get BackupScheduler plugin:", error);
    return null;
  }
}

export async function scheduleNativeBackup(frequency: "daily" | "weekly" | "monthly"): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("Native backup scheduler not available on web");
    return false;
  }

  try {
    const BackupScheduler = await getBackupScheduler();
    if (!BackupScheduler) return false;

    const backupData = JSON.stringify(storage.exportBackup());
    
    const result = await BackupScheduler.scheduleBackup({ 
      frequency,
      backupData 
    });
    console.log("Native backup scheduled:", frequency, result);
    return result.success;
  } catch (error) {
    console.error("Failed to schedule native backup:", error);
    return false;
  }
}

export async function cancelNativeBackup(): Promise<boolean> {
  if (!isNativePlatform()) {
    return false;
  }

  try {
    const BackupScheduler = await getBackupScheduler();
    if (!BackupScheduler) return false;

    const result = await BackupScheduler.cancelBackup();
    console.log("Native backup cancelled:", result);
    return result.success;
  } catch (error) {
    console.error("Failed to cancel native backup:", error);
    return false;
  }
}

export async function performNativeBackupNow(): Promise<boolean> {
  if (!isNativePlatform()) {
    console.log("Native backup not available on web");
    return false;
  }

  try {
    const BackupScheduler = await getBackupScheduler();
    if (!BackupScheduler) return false;

    const backupData = JSON.stringify(storage.exportBackup());
    
    const result = await BackupScheduler.performBackupNow({ backupData });
    console.log("Native backup performed:", result);
    return result.success;
  } catch (error) {
    console.error("Failed to perform native backup:", error);
    return false;
  }
}

export function isNativeBackupAvailable(): boolean {
  return isNativePlatform();
}
