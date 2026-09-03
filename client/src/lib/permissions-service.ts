import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";

export type PermissionType = "camera" | "storage" | "notifications" | "location" | "media";

export interface PermissionStatus {
  camera: "granted" | "denied" | "prompt" | "unavailable";
  storage: "granted" | "denied" | "prompt" | "unavailable";
  notifications: "granted" | "denied" | "prompt" | "unavailable";
  location: "granted" | "denied" | "prompt" | "unavailable";
  media: "granted" | "denied" | "prompt" | "unavailable";
}

export interface PermissionInfo {
  id: PermissionType;
  name: string;
  description: string;
  icon: string;
  required: boolean;
}

const isNativePlatform = Capacitor.isNativePlatform();

// Detect if running in an iframe (e.g., Replit preview)
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // If access is blocked, we're in a cross-origin iframe
  }
};

export const REQUIRED_PERMISSIONS: PermissionInfo[] = [
  {
    id: "location",
    name: "Location Access",
    description: "Detect your country to set the correct currency and regional settings automatically.",
    icon: "map-pin",
    required: false,
  },
  {
    id: "storage",
    name: "Storage Access",
    description: "Save and access backup files and exported reports. All data stays on your device for complete privacy.",
    icon: "folder",
    required: true,
  },
  {
    id: "media",
    name: "Media Access",
    description: "Access photos and images for staff profiles and document attachments.",
    icon: "image",
    required: true,
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Receive reminders for pending payments, attendance tracking, and important updates.",
    icon: "bell",
    required: true,
  },
  {
    id: "camera",
    name: "Camera Access",
    description: "Take photos for staff profiles and document scanning. This helps you quickly capture and store important information.",
    icon: "camera",
    required: false,
  },
];

class PermissionsService {
  private isNative = Capacitor.isNativePlatform();

  async checkAllPermissions(): Promise<PermissionStatus> {
    const status: PermissionStatus = {
      camera: "prompt",
      storage: "prompt",
      notifications: "prompt",
      location: "prompt",
      media: "prompt",
    };

    status.location = await this.checkLocationPermission();

    if (this.isNative) {
      // Android's system file picker grants access to the selected file only,
      // so broad media permission is not required. Camera access is requested
      // by the WebView only when the user starts a capture.
      status.camera = await this.checkWebCameraPermission();
      status.media = "granted";

      try {
        const fsStatus = await Filesystem.checkPermissions();
        status.storage = this.mapCapacitorStatus(fsStatus.publicStorage);
      } catch {
        status.storage = "prompt";
      }

      try {
        const notifStatus = await LocalNotifications.checkPermissions();
        status.notifications = this.mapCapacitorStatus(notifStatus.display);
      } catch {
        status.notifications = "prompt";
      }
    } else {
      status.camera = await this.checkWebCameraPermission();
      status.storage = "granted";
      status.media = "granted";
      
      // In iframes (like Replit preview), notification permissions are blocked
      if (isInIframe()) {
        status.notifications = "unavailable";
      } else if ("Notification" in window) {
        status.notifications = this.mapWebNotificationStatus(Notification.permission);
      } else {
        status.notifications = "unavailable";
      }
    }

    if (!this.isNative) {
      this.saveLastCheckedStatus(status);
    }

    return status;
  }

  private async checkLocationPermission(): Promise<"granted" | "denied" | "prompt" | "unavailable"> {
    if (!navigator.permissions) {
      return "prompt";
    }
    
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      switch (result.state) {
        case "granted":
          return "granted";
        case "denied":
          return "denied";
        default:
          return "prompt";
      }
    } catch {
      return "prompt";
    }
  }

  private saveLastCheckedStatus(status: PermissionStatus): void {
    localStorage.setItem("hs360_permissions_status", JSON.stringify(status));
  }

  private getLastCheckedStatus(): PermissionStatus | null {
    const stored = localStorage.getItem("hs360_permissions_status");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  async verifyRequiredPermissions(): Promise<boolean> {
    const status = await this.checkAllPermissions();
    return this.areRequiredPermissionsGranted(status);
  }

  async requestCameraPermission(): Promise<"granted" | "denied"> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return "granted";
    } catch {
      return "denied";
    }
  }

  async requestMediaPermission(): Promise<"granted" | "denied"> {
    // The system file picker scopes access to files selected by the user.
    return "granted";
  }

  async requestStoragePermission(): Promise<"granted" | "denied"> {
    if (this.isNative) {
      try {
        const result = await Filesystem.requestPermissions();
        return result.publicStorage === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    } else {
      return "granted";
    }
  }

  async requestNotificationPermission(): Promise<"granted" | "denied"> {
    if (this.isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    } else {
      if (!("Notification" in window)) {
        return "denied";
      }
      
      try {
        const result = await Notification.requestPermission();
        return result === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    }
  }

  async requestLocationPermission(): Promise<"granted" | "denied"> {
    if (!("geolocation" in navigator)) {
      return "denied";
    }
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve("granted"),
        () => resolve("denied"),
        { timeout: 10000 }
      );
    });
  }

  async requestPermission(type: PermissionType): Promise<"granted" | "denied"> {
    switch (type) {
      case "camera":
        return this.requestCameraPermission();
      case "storage":
        return this.requestStoragePermission();
      case "media":
        return this.requestMediaPermission();
      case "notifications":
        return this.requestNotificationPermission();
      case "location":
        return this.requestLocationPermission();
      default:
        return "denied";
    }
  }

  areRequiredPermissionsGranted(status: PermissionStatus): boolean {
    const requiredPerms = REQUIRED_PERMISSIONS.filter(p => p.required);
    // A permission is considered satisfied if it's granted OR unavailable (can't be granted in this environment)
    return requiredPerms.every(perm => 
      status[perm.id] === "granted" || status[perm.id] === "unavailable"
    );
  }

  isPermissionGranted(status: PermissionStatus, type: PermissionType): boolean {
    return status[type] === "granted";
  }

  getSkippedPermissions(status: PermissionStatus): PermissionType[] {
    return REQUIRED_PERMISSIONS
      .filter(p => status[p.id] !== "granted")
      .map(p => p.id);
  }

  private mapCapacitorStatus(status: string | undefined): "granted" | "denied" | "prompt" | "unavailable" {
    if (!status) return "prompt";
    switch (status) {
      case "granted":
      case "limited":
        return "granted";
      case "denied":
        return "denied";
      case "prompt":
      case "prompt-with-rationale":
        return "prompt";
      default:
        return "prompt";
    }
  }

  private mapWebNotificationStatus(status: NotificationPermission): "granted" | "denied" | "prompt" {
    switch (status) {
      case "granted":
        return "granted";
      case "denied":
        return "denied";
      default:
        return "prompt";
    }
  }

  private async checkWebCameraPermission(): Promise<"granted" | "denied" | "prompt" | "unavailable"> {
    if (!navigator.permissions) {
      return "prompt";
    }
    
    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      switch (result.state) {
        case "granted":
          return "granted";
        case "denied":
          return "denied";
        default:
          return "prompt";
      }
    } catch {
      return "prompt";
    }
  }

  getPermissionsStorageKey(): string {
    return "hs360_permissions_granted";
  }

  savePermissionsGranted(): void {
    localStorage.setItem(this.getPermissionsStorageKey(), "true");
  }

  hasCompletedPermissionsFlow(): boolean {
    return localStorage.getItem(this.getPermissionsStorageKey()) === "true";
  }

  clearPermissionsGranted(): void {
    localStorage.removeItem(this.getPermissionsStorageKey());
  }
}

export const permissionsService = new PermissionsService();
