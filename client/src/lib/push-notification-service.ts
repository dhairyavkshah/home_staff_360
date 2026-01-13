import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { collaborationService } from "./collaboration-service";

let isInitialized = false;
let currentToken: string | null = null;

export async function initPushNotifications(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log("[PushNotifications] Not a native platform, skipping initialization");
    return false;
  }
  
  if (isInitialized) {
    console.log("[PushNotifications] Already initialized");
    return true;
  }
  
  try {
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    
    if (permStatus.receive !== "granted") {
      console.log("[PushNotifications] Permission not granted");
      return false;
    }
    
    await setupPushListeners();
    
    await PushNotifications.register();
    
    isInitialized = true;
    console.log("[PushNotifications] Initialized successfully");
    return true;
  } catch (error) {
    console.error("[PushNotifications] Failed to initialize:", error);
    return false;
  }
}

async function setupPushListeners(): Promise<void> {
  await PushNotifications.addListener("registration", async (token: Token) => {
    console.log("[PushNotifications] Registration token received:", token.value);
    currentToken = token.value;
    
    await sendTokenToServer(token.value);
  });
  
  await PushNotifications.addListener("registrationError", (error: any) => {
    console.error("[PushNotifications] Registration error:", error);
  });
  
  await PushNotifications.addListener("pushNotificationReceived", async (notification: PushNotificationSchema) => {
    console.log("[PushNotifications] Push received in foreground:", notification);
    
    await showLocalNotification(notification);
  });
  
  await PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
    console.log("[PushNotifications] Push action performed:", action);
    
    handleNotificationTap(action.notification);
  });
}

async function showLocalNotification(notification: PushNotificationSchema): Promise<void> {
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== "granted") {
      console.log("[PushNotifications] Local notification permission not granted");
      return;
    }
    
    const notificationId = Math.floor(Math.random() * 100000);
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: notification.title || "New Notification",
          body: notification.body || "",
          sound: undefined,
          smallIcon: "ic_stat_notification",
          largeIcon: "ic_launcher",
          channelId: "app_notifications",
          extra: notification.data,
        },
      ],
    });
    
    console.log("[PushNotifications] Local notification shown");
  } catch (error) {
    console.error("[PushNotifications] Failed to show local notification:", error);
  }
}

function handleNotificationTap(notification: PushNotificationSchema): void {
  const data = notification.data || {};
  
  const entityType = data.entityType as string | undefined;
  const entityId = data.entityId as string | undefined;
  const type = data.type as string | undefined;
  
  let targetPath = "/";
  
  if (type === "connection_request" || entityType === "connection_invite") {
    targetPath = "/collaboration";
  } else if (type === "attendance_submitted" || entityType === "attendance") {
    targetPath = "/attendance";
  } else if (type === "laundry_submitted" || entityType === "laundry") {
    targetPath = "/laundry";
  } else if (type === "message" || entityType === "chat") {
    targetPath = entityId ? `/chat/${entityId}` : "/messages";
  } else if (entityType === "notification") {
    targetPath = "/notifications";
  }
  
  console.log("[PushNotifications] Navigating to:", targetPath);
  
  setTimeout(() => {
    window.location.href = targetPath;
  }, 100);
}

async function sendTokenToServer(token: string): Promise<void> {
  try {
    const deviceId = await getDeviceId();
    
    await collaborationService.fetchWithAuth("/user/push-token", {
      method: "POST",
      body: JSON.stringify({
        token,
        deviceId,
        platform: Capacitor.getPlatform(),
      }),
    });
    
    console.log("[PushNotifications] Token registered with server");
  } catch (error) {
    console.error("[PushNotifications] Error sending token to server:", error);
  }
}

async function getDeviceId(): Promise<string> {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}

export async function registerPushToken(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  
  try {
    const initialized = await initPushNotifications();
    if (!initialized) {
      return false;
    }
    
    if (currentToken) {
      await sendTokenToServer(currentToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[PushNotifications] Failed to register push token:", error);
    return false;
  }
}

export async function unregisterPushToken(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }
  
  try {
    const deviceId = await getDeviceId();
    
    await collaborationService.fetchWithAuth("/user/push-token", {
      method: "DELETE",
      body: JSON.stringify({ deviceId }),
    });
    
    console.log("[PushNotifications] Token unregistered from server");
    
    currentToken = null;
    
    return true;
  } catch (error) {
    console.error("[PushNotifications] Failed to unregister push token:", error);
    return false;
  }
}

export function getCurrentToken(): string | null {
  return currentToken;
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}
