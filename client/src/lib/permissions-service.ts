import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType } from "@capacitor/camera";

export type PermissionType = "camera" | "storage" | "notifications" | "location";

export interface PermissionStatus {
  camera: "granted" | "denied" | "prompt" | "unavailable";
  storage: "granted" | "denied" | "prompt" | "unavailable";
  notifications: "granted" | "denied" | "prompt" | "unavailable";
  location: "granted" | "denied" | "prompt" | "unavailable";
}

export interface PermissionInfo {
  id: PermissionType;
  name: string;
  description: string;
  icon: string;
  required: boolean;
}

const isNativePlatform = Capacitor.isNativePlatform();

// Test mode bypass - disabled for production
const isTestBypassEnabled = (): boolean => {
  return false;
};

// Permissions - users can skip during onboarding and grant later when needed
// The 'required' flag indicates if the permission is essential for a core feature
export const REQUIRED_PERMISSIONS: PermissionInfo[] = [
  {
    id: "location",
    name: "Location Access",
    description: "Detect your country to set the correct currency and regional settings automatically.",
    icon: "map-pin",
    required: false, // Optional - country can be selected manually
  },
  {
    id: "storage",
    name: "Storage Access",
    description: "Save and access your data, photos, and backup files. All data stays on your device for complete privacy.",
    icon: "folder",
    required: true, // Required for backup/restore and document attachments
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Receive reminders for pending payments, attendance tracking, and important updates.",
    icon: "bell",
    required: false, // Optional - app works without notifications
  },
  {
    id: "camera",
    name: "Camera Access",
    description: "Take photos for staff profiles and document scanning. This helps you quickly capture and store important information.",
    icon: "camera",
    required: false, // Optional - can add photos from gallery
  },
];

class PermissionsService {
  private isNative = Capacitor.isNativePlatform();

  async checkAllPermissions(): Promise<PermissionStatus> {
    const status: PermissionStatus = {
      camera: "unavailable",
      storage: "unavailable",
      notifications: "unavailable",
      location: "prompt",
    };

    status.location = await this.checkLocationPermission();

    if (this.isNative) {
      try {
        const cameraStatus = await Camera.checkPermissions();
        status.camera = this.mapCapacitorStatus(cameraStatus.camera);
        status.storage = this.mapCapacitorStatus(cameraStatus.photos);
      } catch {
        status.camera = "unavailable";
        status.storage = "unavailable";
      }

      try {
        if ("Notification" in window) {
          status.notifications = this.mapWebNotificationStatus(Notification.permission);
        }
      } catch {
        status.notifications = "unavailable";
      }
    } else {
      status.camera = await this.checkWebCameraPermission();
      status.storage = "granted";
      
      if ("Notification" in window) {
        status.notifications = this.mapWebNotificationStatus(Notification.permission);
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
    if (this.isNative) {
      try {
        const result = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
        return result.camera === "granted" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return "granted";
      } catch {
        return "denied";
      }
    }
  }

  async requestStoragePermission(): Promise<"granted" | "denied"> {
    if (this.isNative) {
      try {
        const result = await Camera.requestPermissions({ permissions: ["photos"] });
        return result.photos === "granted" || result.photos === "limited" ? "granted" : "denied";
      } catch {
        return "denied";
      }
    } else {
      return "granted";
    }
  }

  async requestNotificationPermission(): Promise<"granted" | "denied"> {
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
      case "notifications":
        return this.requestNotificationPermission();
      case "location":
        return this.requestLocationPermission();
      default:
        return "denied";
    }
  }

  areRequiredPermissionsGranted(status: PermissionStatus): boolean {
    // Check if truly required permissions are granted
    const requiredPerms = REQUIRED_PERMISSIONS.filter(p => p.required);
    return requiredPerms.every(perm => status[perm.id] === "granted");
  }

  // Check if a specific permission is granted
  isPermissionGranted(status: PermissionStatus, type: PermissionType): boolean {
    return status[type] === "granted";
  }

  // Get list of skipped permissions that weren't granted
  getSkippedPermissions(status: PermissionStatus): PermissionType[] {
    return REQUIRED_PERMISSIONS
      .filter(p => status[p.id] !== "granted")
      .map(p => p.id);
  }

  private mapCapacitorStatus(status: string): "granted" | "denied" | "prompt" | "unavailable" {
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
        return "unavailable";
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
