import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { storage } from "@/lib/storage";
import type { Screen } from "@/lib/navigation";

const STORAGE_KEYS = {
  ENABLED: "hm_attendance_reminder_enabled",
  TIME: "hm_attendance_reminder_time",
} as const;

const NOTIFICATION_ID = 1001;
const CHANNEL_ID = "attendance_reminder";
const DEFAULT_TIME = "20:00";

type NavigateFunction = (screen: Screen, data?: Record<string, unknown>) => void;

let navigateFunction: NavigateFunction | null = null;

class AttendanceReminderService {
  private isNative = Capacitor.isNativePlatform();
  private listenerRegistered = false;

  isReminderEnabled(): boolean {
    return localStorage.getItem(STORAGE_KEYS.ENABLED) === "true";
  }

  setReminderEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ENABLED, String(enabled));
    if (enabled) {
      this.scheduleReminder();
    } else {
      this.cancelReminder();
    }
  }

  getReminderTime(): string {
    return localStorage.getItem(STORAGE_KEYS.TIME) || DEFAULT_TIME;
  }

  setReminderTime(time: string): void {
    localStorage.setItem(STORAGE_KEYS.TIME, time);
    if (this.isReminderEnabled()) {
      this.scheduleReminder();
    }
  }

  checkAttendanceForToday(): boolean {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    
    const profile = storage.getProfile();
    const isStaffMode = profile?.type === "STAFF";

    if (isStaffMode) {
      const selfAttendance = storage.getSelfAttendance();
      return selfAttendance.some((a) => a.date === todayString);
    } else {
      const attendance = storage.getAttendance();
      return attendance.some((a) => a.date === todayString);
    }
  }

  async scheduleReminder(): Promise<void> {
    if (!this.isReminderEnabled()) {
      return;
    }

    await this.cancelReminder();

    const timeStr = this.getReminderTime();
    const [hours, minutes] = timeStr.split(":").map(Number);
    
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    if (this.isNative) {
      await this.scheduleNativeNotification(scheduledTime);
    } else {
      this.scheduleWebNotification(scheduledTime);
    }
  }

  private async scheduleNativeNotification(scheduledTime: Date): Promise<void> {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== "granted") {
        const result = await LocalNotifications.requestPermissions();
        if (result.display !== "granted") {
          return;
        }
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIFICATION_ID,
            title: "Attendance Reminder",
            body: "Don't forget to mark today's attendance!",
            schedule: { at: scheduledTime },
            channelId: CHANNEL_ID,
            smallIcon: "ic_stat_notification",
            largeIcon: "ic_launcher",
          },
        ],
      });
    } catch (error) {
      console.error("[AttendanceReminder] Failed to schedule native notification:", error);
    }
  }

  private webTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private scheduleWebNotification(scheduledTime: Date): void {
    if (this.webTimeoutId) {
      clearTimeout(this.webTimeoutId);
      this.webTimeoutId = null;
    }

    const delay = scheduledTime.getTime() - Date.now();
    if (delay <= 0) {
      return;
    }

    this.webTimeoutId = setTimeout(async () => {
      // Show notification only if attendance not already marked
      if (!this.checkAttendanceForToday()) {
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            const notification = new Notification("Attendance Reminder", {
              body: "Don't forget to mark today's attendance!",
              icon: "/favicon.png",
              tag: "attendance-reminder",
            });

            notification.onclick = () => {
              window.focus();
              this.handleNotificationTap();
              notification.close();
            };
          } catch (error) {
            console.error("[AttendanceReminder] Failed to show web notification:", error);
          }
        }
      }

      // Reschedule for tomorrow regardless of whether we showed the notification
      this.webTimeoutId = null;
      this.scheduleReminder();
    }, delay);
  }

  async cancelReminder(): Promise<void> {
    if (this.webTimeoutId) {
      clearTimeout(this.webTimeoutId);
      this.webTimeoutId = null;
    }

    if (this.isNative) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
      } catch (error) {
        console.error("[AttendanceReminder] Failed to cancel notification:", error);
      }
    }
  }

  private handleNotificationTap(): void {
    const profile = storage.getProfile();
    const isStaffMode = profile?.type === "STAFF";
    const screen = isStaffMode ? "staff-attendance" : "attendance";
    
    if (navigateFunction) {
      navigateFunction(screen);
    }
  }

  async initializeReminder(): Promise<void> {
    if (!this.isReminderEnabled()) {
      return;
    }

    if (this.isNative && !this.listenerRegistered) {
      this.listenerRegistered = true;
      
      // When notification is received (shown), reschedule for next day
      LocalNotifications.addListener("localNotificationReceived", (notification) => {
        if (notification.id === NOTIFICATION_ID) {
          // Reschedule for tomorrow
          setTimeout(() => this.scheduleReminder(), 1000);
        }
      });
      
      // When notification is tapped, navigate to attendance screen
      LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        if (action.notification.id === NOTIFICATION_ID) {
          if (!this.checkAttendanceForToday()) {
            this.handleNotificationTap();
          }
        }
      });

      try {
        await LocalNotifications.createChannel({
          id: CHANNEL_ID,
          name: "Attendance Reminder",
          importance: 4,
          visibility: 1,
          sound: "default",
        });
      } catch {
      }
    }

    await this.scheduleReminder();
  }

  setNavigateFunction(fn: NavigateFunction): void {
    navigateFunction = fn;
  }
}

export const attendanceReminderService = new AttendanceReminderService();
