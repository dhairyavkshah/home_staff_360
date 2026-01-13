import * as admin from "firebase-admin";
import { db } from "./db";
import { devices } from "@shared/schema";
import { eq } from "drizzle-orm";

let firebaseApp: admin.app.App | null = null;
let isInitialized = false;
let initializationAttempted = false;

function initializeFirebase(): boolean {
  if (initializationAttempted) {
    return isInitialized;
  }
  
  initializationAttempted = true;
  
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      console.warn("[PushService] FIREBASE_SERVICE_ACCOUNT_JSON not configured. Push notifications disabled.");
      return false;
    }
    
    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error("[PushService] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", parseError);
      return false;
    }
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    isInitialized = true;
    console.log("[PushService] Firebase Admin SDK initialized successfully");
    return true;
  } catch (error) {
    console.error("[PushService] Failed to initialize Firebase Admin SDK:", error);
    return false;
  }
}

export interface PushNotificationData {
  type?: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  notificationId?: string;
  [key: string]: string | undefined;
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
  if (!initializeFirebase()) {
    return { success: false, sent: 0, failed: 0, errors: ["Firebase not configured"] };
  }
  
  try {
    const userDevices = await db.query.devices.findMany({
      where: eq(devices.userId, userId),
    });
    
    const tokens = userDevices
      .map(d => d.pushToken)
      .filter((token): token is string => !!token && token.length > 0);
    
    if (tokens.length === 0) {
      console.log(`[PushService] No push tokens found for user ${userId}`);
      return { success: true, sent: 0, failed: 0, errors: [] };
    }
    
    const messaging = admin.messaging(firebaseApp!);
    
    const stringData: { [key: string]: string } = {};
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          stringData[key] = String(value);
        }
      });
    }
    
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: stringData,
      android: {
        priority: "high",
        notification: {
          channelId: "app_notifications",
          icon: "ic_stat_notification",
          color: "#0078D4",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: "default",
          },
        },
      },
    };
    
    const response = await messaging.sendEachForMulticast(message);
    
    const errors: string[] = [];
    const tokensToRemove: string[] = [];
    
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        errors.push(`Token ${idx}: ${resp.error.message}`);
        
        if (
          errorCode === "messaging/invalid-registration-token" ||
          errorCode === "messaging/registration-token-not-registered"
        ) {
          tokensToRemove.push(tokens[idx]);
        }
      }
    });
    
    if (tokensToRemove.length > 0) {
      console.log(`[PushService] Removing ${tokensToRemove.length} invalid tokens for user ${userId}`);
      for (const token of tokensToRemove) {
        try {
          await db.update(devices)
            .set({ pushToken: null })
            .where(eq(devices.pushToken, token));
        } catch (dbError) {
          console.error("[PushService] Failed to remove invalid token:", dbError);
        }
      }
    }
    
    console.log(`[PushService] Sent push to user ${userId}: ${response.successCount} success, ${response.failureCount} failed`);
    
    return {
      success: response.successCount > 0,
      sent: response.successCount,
      failed: response.failureCount,
      errors,
    };
  } catch (error) {
    console.error("[PushService] Error sending push notification:", error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: PushNotificationData
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;
  
  for (const userId of userIds) {
    const result = await sendPushNotification(userId, title, body, data);
    totalSent += result.sent;
    totalFailed += result.failed;
  }
  
  return { totalSent, totalFailed };
}

export function isPushServiceEnabled(): boolean {
  return initializeFirebase();
}
