import { realtimeService } from "./realtime-service";
import { collaborationService } from "./collaboration-service";
import { storage } from "./storage";

export type SyncDataType = 
  | "attendance" 
  | "laundry" 
  | "expense" 
  | "person" 
  | "transaction"
  | "settings";

export interface SyncPayload {
  type: SyncDataType;
  action: "create" | "update" | "delete";
  data: any;
  timestamp: number;
  senderId: string;
}

export interface SyncStatus {
  lastSyncAt: Date | null;
  pendingChanges: number;
  isOnline: boolean;
  isSyncing: boolean;
}

type SyncEventHandler = (payload: SyncPayload) => void;

const AUTO_SYNC_ENABLED_KEY = "hm_auto_sync_enabled";
const PENDING_SYNC_KEY = "hm_pending_sync";

class AutoSyncService {
  private enabled = true;
  private syncHandlers: Map<SyncDataType, Set<SyncEventHandler>> = new Map();
  private pendingChanges: SyncPayload[] = [];
  private isSyncing = false;
  private lastSyncAt: Date | null = null;
  private connectedUserIds: Set<string> = new Set();
  private isListening = false;

  constructor() {
    this.loadSettings();
    this.loadPendingChanges();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(AUTO_SYNC_ENABLED_KEY);
      if (saved !== null) {
        this.enabled = saved === "true";
      }
    } catch (error) {
      console.error("[AutoSync] Failed to load settings:", error);
    }
  }

  private loadPendingChanges(): void {
    try {
      const saved = localStorage.getItem(PENDING_SYNC_KEY);
      if (saved) {
        this.pendingChanges = JSON.parse(saved);
      }
    } catch (error) {
      console.error("[AutoSync] Failed to load pending changes:", error);
      this.pendingChanges = [];
    }
  }

  private savePendingChanges(): void {
    try {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.pendingChanges));
    } catch (error) {
      console.error("[AutoSync] Failed to save pending changes:", error);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.error("[AutoSync] Failed to save enabled state:", error);
    }
    this.notifyStatusChange();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private boundHandlers: {
    incomingSync: ((payload: SyncPayload) => void) | null;
    userOnline: ((data: { userId: string }) => void) | null;
    userOffline: ((data: { userId: string }) => void) | null;
    syncRequest: ((data: { requesterId: string; dataTypes: SyncDataType[] }) => void) | null;
  } = { incomingSync: null, userOnline: null, userOffline: null, syncRequest: null };

  private statusChangeCallbacks: Set<() => void> = new Set();

  onStatusChange(callback: () => void): () => void {
    this.statusChangeCallbacks.add(callback);
    return () => this.statusChangeCallbacks.delete(callback);
  }

  private notifyStatusChange(): void {
    this.statusChangeCallbacks.forEach(cb => cb());
  }

  startListening(): void {
    if (this.isListening) return;
    this.isListening = true;

    this.boundHandlers.incomingSync = this.handleIncomingSync.bind(this);
    this.boundHandlers.userOnline = this.handleUserOnline.bind(this);
    this.boundHandlers.userOffline = this.handleUserOffline.bind(this);
    this.boundHandlers.syncRequest = this.handleSyncRequest.bind(this);

    realtimeService.on("sync:data-changed", this.boundHandlers.incomingSync);
    realtimeService.on("sync:user-online", this.boundHandlers.userOnline);
    realtimeService.on("sync:user-offline", this.boundHandlers.userOffline);
    realtimeService.on("sync:request-sync", this.boundHandlers.syncRequest);

    console.log("[AutoSync] Started listening for sync events");
  }

  stopListening(): void {
    if (!this.isListening) return;
    this.isListening = false;

    if (this.boundHandlers.incomingSync) {
      realtimeService.off("sync:data-changed", this.boundHandlers.incomingSync);
    }
    if (this.boundHandlers.userOnline) {
      realtimeService.off("sync:user-online", this.boundHandlers.userOnline);
    }
    if (this.boundHandlers.userOffline) {
      realtimeService.off("sync:user-offline", this.boundHandlers.userOffline);
    }
    if (this.boundHandlers.syncRequest) {
      realtimeService.off("sync:request-sync", this.boundHandlers.syncRequest);
    }

    console.log("[AutoSync] Stopped listening for sync events");
  }

  private handleIncomingSync(payload: SyncPayload): void {
    if (!this.enabled) return;

    // Skip our own sync events
    const profile = storage.getProfile();
    if (profile?.id && profile.id === payload.senderId) {
      console.log("[AutoSync] Ignoring own sync event");
      return;
    }

    console.log("[AutoSync] Received sync data:", payload.type, payload.action);

    const handlers = this.syncHandlers.get(payload.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error("[AutoSync] Handler error:", error);
        }
      });
    }

    this.lastSyncAt = new Date();
    this.notifyStatusChange();
  }

  private handleUserOnline(data: { userId: string }): void {
    this.connectedUserIds.add(data.userId);
    console.log("[AutoSync] User came online:", data.userId);

    if (this.pendingChanges.length > 0) {
      this.flushPendingChanges();
    }
  }

  private handleUserOffline(data: { userId: string }): void {
    this.connectedUserIds.delete(data.userId);
    console.log("[AutoSync] User went offline:", data.userId);
  }

  private handleSyncRequest(data: { requesterId: string; dataTypes: SyncDataType[] }): void {
    console.log("[AutoSync] Sync request from:", data.requesterId);
  }

  onDataChange(type: SyncDataType, handler: SyncEventHandler): () => void {
    if (!this.syncHandlers.has(type)) {
      this.syncHandlers.set(type, new Set());
    }
    this.syncHandlers.get(type)!.add(handler);

    return () => {
      this.syncHandlers.get(type)?.delete(handler);
    };
  }

  async pushChange(
    type: SyncDataType,
    action: "create" | "update" | "delete",
    data: any
  ): Promise<boolean> {
    if (!this.enabled) return false;

    const profile = storage.getProfile();
    if (!profile?.id) return false;

    const payload: SyncPayload = {
      type,
      action,
      data,
      timestamp: Date.now(),
      senderId: profile.id,
    };

    if (!realtimeService.isConnected()) {
      this.pendingChanges.push(payload);
      this.savePendingChanges();
      console.log("[AutoSync] Queued change for later sync:", type);
      return false;
    }

    try {
      await collaborationService.fetchWithAuth("/sync/push", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("[AutoSync] Pushed change:", type, action);
      return true;
    } catch (error) {
      console.error("[AutoSync] Failed to push change:", error);
      this.pendingChanges.push(payload);
      this.savePendingChanges();
      return false;
    }
  }

  async flushPendingChanges(): Promise<number> {
    if (this.pendingChanges.length === 0 || this.isSyncing) {
      return 0;
    }

    if (!realtimeService.isConnected()) {
      return 0;
    }

    this.isSyncing = true;
    let syncedCount = 0;

    try {
      const changes = [...this.pendingChanges];
      
      for (const payload of changes) {
        try {
          await collaborationService.fetchWithAuth("/sync/push", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          
          const index = this.pendingChanges.indexOf(payload);
          if (index > -1) {
            this.pendingChanges.splice(index, 1);
          }
          syncedCount++;
        } catch (error) {
          console.error("[AutoSync] Failed to sync pending change:", error);
        }
      }

      this.savePendingChanges();
      this.lastSyncAt = new Date();
      console.log("[AutoSync] Flushed", syncedCount, "pending changes");
    } finally {
      this.isSyncing = false;
    }

    return syncedCount;
  }

  getStatus(): SyncStatus {
    return {
      lastSyncAt: this.lastSyncAt,
      pendingChanges: this.pendingChanges.length,
      isOnline: realtimeService.isConnected(),
      isSyncing: this.isSyncing,
    };
  }

  getPendingChangesCount(): number {
    return this.pendingChanges.length;
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUserIds);
  }

  clearPendingChanges(): void {
    this.pendingChanges = [];
    this.savePendingChanges();
  }
}

export const autoSyncService = new AutoSyncService();
