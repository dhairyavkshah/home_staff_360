import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

interface NotificationPayload {
  id: string;
  title: string;
  message?: string;
  type: string;
}

class NotificationAlertService {
  private isNative = Capacitor.isNativePlatform();
  private notificationIdCounter = 1000;
  private shownNotifications = new Set<string>();

  async showPushNotification(notification: NotificationPayload): Promise<void> {
    if (this.shownNotifications.has(notification.id)) {
      return;
    }
    this.shownNotifications.add(notification.id);

    if (this.shownNotifications.size > 100) {
      const iterator = this.shownNotifications.values();
      for (let i = 0; i < 50; i++) {
        const val = iterator.next().value;
        if (val) this.shownNotifications.delete(val);
      }
    }

    if (this.isNative) {
      await this.showNativeNotification(notification);
    } else {
      await this.showWebNotification(notification);
    }
  }

  private async showNativeNotification(notification: NotificationPayload): Promise<void> {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== "granted") {
        return;
      }

      const notificationId = this.notificationIdCounter++;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.message || "",
            id: notificationId,
            sound: undefined,
            smallIcon: "ic_stat_notification",
            largeIcon: "ic_launcher",
            channelId: "app_notifications",
          },
        ],
      });
    } catch (error) {
      console.error("[NotificationAlert] Failed to show native notification:", error);
    }
  }

  private async showWebNotification(notification: NotificationPayload): Promise<void> {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    try {
      new Notification(notification.title, {
        body: notification.message || "",
        icon: "/favicon.ico",
        tag: notification.id,
      });
    } catch (error) {
      console.error("[NotificationAlert] Failed to show web notification:", error);
    }
  }

  async requestPermission(): Promise<boolean> {
    if (this.isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === "granted";
      } catch {
        return false;
      }
    } else {
      if (!("Notification" in window)) {
        return false;
      }
      try {
        const result = await Notification.requestPermission();
        return result === "granted";
      } catch {
        return false;
      }
    }
  }

  async checkPermission(): Promise<boolean> {
    if (this.isNative) {
      try {
        const result = await LocalNotifications.checkPermissions();
        return result.display === "granted";
      } catch {
        return false;
      }
    } else {
      if (!("Notification" in window)) {
        return false;
      }
      return Notification.permission === "granted";
    }
  }
}

export const notificationAlertService = new NotificationAlertService();
