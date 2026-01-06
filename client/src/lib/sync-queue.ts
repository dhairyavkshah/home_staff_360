import { 
  type SyncQueueItem, 
  type SyncOperationType, 
  type SyncQueueStatus 
} from "@shared/schema";

const SYNC_QUEUE_KEY = "hm_sync_queue";
const SYNC_PENDING_NOTIFICATIONS_KEY = "hm_pending_notifications";
const NETWORK_CHECK_INTERVAL = 30000; // 30 seconds

type NetworkStatus = "online" | "offline" | "unknown";

interface PendingNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  syncedAt?: string;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getISOString(): string {
  return new Date().toISOString();
}

class SyncQueueService {
  private listeners: Set<() => void> = new Set();
  private networkStatus: NetworkStatus = "unknown";
  private isProcessing = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private apiBaseUrl = "/api/collaboration";

  constructor() {
    this.initNetworkListeners();
  }

  private initNetworkListeners() {
    if (typeof window !== "undefined") {
      this.networkStatus = navigator.onLine ? "online" : "offline";

      window.addEventListener("online", () => {
        this.networkStatus = "online";
        this.notifyListeners();
        this.processQueue();
      });

      window.addEventListener("offline", () => {
        this.networkStatus = "offline";
        this.notifyListeners();
      });

      // Check periodically in case events are missed
      this.checkInterval = setInterval(() => {
        const wasOnline = this.networkStatus === "online";
        this.networkStatus = navigator.onLine ? "online" : "offline";
        if (!wasOnline && this.networkStatus === "online") {
          this.processQueue();
        }
      }, NETWORK_CHECK_INTERVAL);
    }
  }

  isOnline(): boolean {
    return this.networkStatus === "online";
  }

  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  private getQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: SyncQueueItem[]) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    this.notifyListeners();
  }

  getPendingCount(): number {
    return this.getQueue().filter(
      (item) => item.status === "pending" || item.status === "failed"
    ).length;
  }

  getQueueItems(): SyncQueueItem[] {
    return this.getQueue();
  }

  getPendingNotifications(): PendingNotification[] {
    try {
      const data = localStorage.getItem(SYNC_PENDING_NOTIFICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private savePendingNotifications(notifications: PendingNotification[]) {
    localStorage.setItem(
      SYNC_PENDING_NOTIFICATIONS_KEY,
      JSON.stringify(notifications)
    );
  }

  addPendingNotification(notification: Omit<PendingNotification, "id" | "createdAt">) {
    const notifications = this.getPendingNotifications();
    notifications.push({
      ...notification,
      id: generateId(),
      createdAt: getISOString(),
    });
    this.savePendingNotifications(notifications);
  }

  clearSyncedNotifications() {
    const notifications = this.getPendingNotifications().filter(
      (n) => !n.syncedAt
    );
    this.savePendingNotifications(notifications);
  }

  enqueue(params: {
    operationType: SyncOperationType;
    endpoint: string;
    method: "POST" | "PATCH" | "DELETE";
    payload: Record<string, unknown>;
    entityType?: string;
    entityId?: string;
    bindingId?: string;
    baseVersion?: number;
  }): SyncQueueItem {
    const item: SyncQueueItem = {
      id: generateId(),
      operationType: params.operationType,
      endpoint: params.endpoint,
      method: params.method,
      payload: JSON.stringify(params.payload),
      entityType: params.entityType,
      entityId: params.entityId,
      bindingId: params.bindingId,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: getISOString(),
      clientRequestId: generateId(),
      baseVersion: params.baseVersion,
    };

    const queue = this.getQueue();
    queue.push(item);
    this.saveQueue(queue);

    // Try to process immediately if online
    if (this.isOnline()) {
      this.processQueue();
    }

    return item;
  }

  updateItemStatus(itemId: string, status: SyncQueueStatus, errorMessage?: string) {
    const queue = this.getQueue();
    const item = queue.find((q) => q.id === itemId);
    if (item) {
      item.status = status;
      item.lastAttemptAt = getISOString();
      if (status === "completed") {
        item.completedAt = getISOString();
      }
      if (errorMessage) {
        item.errorMessage = errorMessage;
      }
      this.saveQueue(queue);
    }
  }

  removeCompleted() {
    const queue = this.getQueue().filter((item) => item.status !== "completed");
    this.saveQueue(queue);
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline()) {
      return;
    }

    const token = this.getAuthToken();
    if (!token) {
      return;
    }

    this.isProcessing = true;

    try {
      const queue = this.getQueue();
      const pendingItems = queue.filter(
        (item) =>
          (item.status === "pending" || item.status === "failed") &&
          item.retryCount < item.maxRetries
      );

      for (const item of pendingItems) {
        try {
          this.updateItemStatus(item.id, "in_progress");

          const response = await fetch(this.apiBaseUrl + item.endpoint, {
            method: item.method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Client-Request-Id": item.clientRequestId,
            },
            body: item.payload,
          });

          if (response.ok) {
            this.updateItemStatus(item.id, "completed");

            // Mark related pending notifications as synced
            const notifications = this.getPendingNotifications();
            const updated = notifications.map((n) => {
              if (n.entityId === item.entityId) {
                return { ...n, syncedAt: getISOString() };
              }
              return n;
            });
            this.savePendingNotifications(updated);
          } else if (response.status === 409) {
            // Conflict - needs manual resolution
            this.updateItemStatus(item.id, "conflict", "Record was modified by another user");
          } else {
            const updatedQueue = this.getQueue();
            const updatedItem = updatedQueue.find((q) => q.id === item.id);
            if (updatedItem) {
              updatedItem.retryCount++;
              updatedItem.status = updatedItem.retryCount >= item.maxRetries ? "failed" : "pending";
              updatedItem.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
              this.saveQueue(updatedQueue);
            }
          }
        } catch (error) {
          const updatedQueue = this.getQueue();
          const updatedItem = updatedQueue.find((q) => q.id === item.id);
          if (updatedItem) {
            updatedItem.retryCount++;
            updatedItem.status = "pending";
            updatedItem.errorMessage = error instanceof Error ? error.message : "Network error";
            this.saveQueue(updatedQueue);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  private getAuthToken(): string | null {
    try {
      return localStorage.getItem("hm_collab_token");
    } catch {
      return null;
    }
  }

  hasConflicts(): boolean {
    return this.getQueue().some((item) => item.status === "conflict");
  }

  getConflictItems(): SyncQueueItem[] {
    return this.getQueue().filter((item) => item.status === "conflict");
  }

  resolveConflict(itemId: string, action: "retry" | "discard") {
    const queue = this.getQueue();
    const itemIndex = queue.findIndex((q) => q.id === itemId);
    if (itemIndex === -1) return;

    if (action === "discard") {
      queue.splice(itemIndex, 1);
    } else {
      queue[itemIndex].status = "pending";
      queue[itemIndex].retryCount = 0;
      queue[itemIndex].errorMessage = undefined;
    }
    this.saveQueue(queue);

    if (action === "retry" && this.isOnline()) {
      this.processQueue();
    }
  }

  clearAll() {
    this.saveQueue([]);
    this.savePendingNotifications([]);
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

export const syncQueue = new SyncQueueService();

// Hook for React components
export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(syncQueue.getPendingCount());
  const [isOnline, setIsOnline] = useState(syncQueue.isOnline());
  const [hasConflicts, setHasConflicts] = useState(syncQueue.hasConflicts());

  useEffect(() => {
    const update = () => {
      setPendingCount(syncQueue.getPendingCount());
      setIsOnline(syncQueue.isOnline());
      setHasConflicts(syncQueue.hasConflicts());
    };

    const unsubscribe = syncQueue.subscribe(update);
    return unsubscribe;
  }, []);

  return {
    pendingCount,
    isOnline,
    hasConflicts,
    processQueue: () => syncQueue.processQueue(),
    getQueueItems: () => syncQueue.getQueueItems(),
    getConflictItems: () => syncQueue.getConflictItems(),
    resolveConflict: (itemId: string, action: "retry" | "discard") =>
      syncQueue.resolveConflict(itemId, action),
  };
}

// Need to import these for the hook
import { useState, useEffect } from "react";
