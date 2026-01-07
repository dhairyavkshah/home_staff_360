import { useState, useEffect, useCallback } from "react";
import { autoSyncService, SyncStatus, SyncDataType, SyncPayload } from "@/lib/auto-sync-service";
import { collaborationService } from "@/lib/collaboration-service";
import { useRealtime, useRealtimeConnection } from "@/hooks/use-realtime";

interface ConnectedUser {
  userId: string;
  displayName?: string;
  isOnline: boolean;
}

interface AutoSyncState {
  status: SyncStatus;
  connectedUsers: ConnectedUser[];
  isLoading: boolean;
  error: string | null;
}

export function useAutoSync() {
  // Initialize with current service status
  const [state, setState] = useState<AutoSyncState>(() => ({
    status: autoSyncService.getStatus(),
    connectedUsers: [],
    isLoading: true,
    error: null,
  }));

  useRealtimeConnection();

  const loadSyncStatus = useCallback(async () => {
    if (!collaborationService.isAuthenticated()) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const result = await collaborationService.fetchWithAuth("/sync/status");
      setState(prev => ({
        ...prev,
        connectedUsers: result.connectedUsers || [],
        status: {
          ...autoSyncService.getStatus(),
          isOnline: result.isUserOnline || false,
        },
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Failed to load sync status:", error);
      setState(prev => ({
        ...prev,
        status: autoSyncService.getStatus(),
        isLoading: false,
        error: "Failed to load sync status",
      }));
    }
  }, []);

  const handleUserOnline = useCallback((data: { userId: string }) => {
    setState(prev => ({
      ...prev,
      connectedUsers: prev.connectedUsers.map(u =>
        u.userId === data.userId ? { ...u, isOnline: true } : u
      ),
    }));
  }, []);

  const handleUserOffline = useCallback((data: { userId: string }) => {
    setState(prev => ({
      ...prev,
      connectedUsers: prev.connectedUsers.map(u =>
        u.userId === data.userId ? { ...u, isOnline: false } : u
      ),
    }));
  }, []);

  const handleDataChanged = useCallback((payload: SyncPayload) => {
    setState(prev => ({
      ...prev,
      status: {
        ...prev.status,
        lastSyncAt: new Date(),
      },
    }));
  }, []);

  useRealtime("sync:user-online", handleUserOnline);
  useRealtime("sync:user-offline", handleUserOffline);
  useRealtime("sync:data-changed", handleDataChanged);

  useEffect(() => {
    loadSyncStatus();
    autoSyncService.startListening();

    // Subscribe to status changes from the service
    const unsubscribe = autoSyncService.onStatusChange(() => {
      setState(prev => ({
        ...prev,
        status: autoSyncService.getStatus(),
      }));
    });

    return () => {
      unsubscribe();
      autoSyncService.stopListening();
    };
  }, [loadSyncStatus]);

  const pushChange = useCallback(
    async (type: SyncDataType, action: "create" | "update" | "delete", data: any) => {
      return autoSyncService.pushChange(type, action, data);
    },
    []
  );

  const refreshStatus = useCallback(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  const onlineCount = state.connectedUsers.filter(u => u.isOnline).length;

  return {
    ...state,
    onlineCount,
    pushChange,
    refreshStatus,
    isEnabled: autoSyncService.isEnabled(),
    setEnabled: autoSyncService.setEnabled.bind(autoSyncService),
  };
}
