import { Capacitor, registerPlugin } from "@capacitor/core";
import { storage } from "@/lib/storage";

interface BackupSchedulerPlugin {
  scheduleBackup(options: { frequency: string; backupData?: string }): Promise<{ success: boolean }>;
  cancelBackup(): Promise<{ success: boolean }>;
  performBackupNow(options: { backupData: string }): Promise<{ success: boolean }>;
}

const BackupScheduler = registerPlugin<BackupSchedulerPlugin>("BackupScheduler");

export async function scheduleNativeBackup(frequency: "daily" | "weekly" | "monthly"): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log("Native backup scheduler not available on web");
    return false;
  }

  try {
    // Get current backup data to pass to native
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
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await BackupScheduler.cancelBackup();
    console.log("Native backup cancelled:", result);
    return result.success;
  } catch (error) {
    console.error("Failed to cancel native backup:", error);
    return false;
  }
}

export async function performNativeBackupNow(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log("Native backup not available on web");
    return false;
  }

  try {
    // Get current backup data
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
  return Capacitor.isNativePlatform();
}
