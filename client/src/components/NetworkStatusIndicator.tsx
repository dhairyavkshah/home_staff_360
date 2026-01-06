import { useState, useEffect } from "react";
import { Wifi, WifiOff, CloudOff, Cloud, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { syncQueue } from "@/lib/sync-queue";

interface NetworkStatusIndicatorProps {
  showPendingCount?: boolean;
  compact?: boolean;
}

export function NetworkStatusIndicator({ 
  showPendingCount = true, 
  compact = false 
}: NetworkStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState(syncQueue.isOnline());
  const [pendingCount, setPendingCount] = useState(syncQueue.getPendingCount());

  useEffect(() => {
    const update = () => {
      setIsOnline(syncQueue.isOnline());
      setPendingCount(syncQueue.getPendingCount());
    };

    const unsubscribe = syncQueue.subscribe(update);
    return unsubscribe;
  }, []);

  if (compact) {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <WifiOff className="w-4 h-4" />
        </div>
      );
    }
    if (pendingCount > 0) {
      return (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      );
    }
    return null;
  }

  if (!isOnline) {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
        <WifiOff className="w-3 h-3 mr-1" />
        Offline
      </Badge>
    );
  }

  if (showPendingCount && pendingCount > 0) {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-900/20">
        <Cloud className="w-3 h-3 mr-1" />
        Syncing {pendingCount}
      </Badge>
    );
  }

  return null;
}

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(syncQueue.isOnline());
  const [pendingCount, setPendingCount] = useState(syncQueue.getPendingCount());

  useEffect(() => {
    const update = () => {
      setIsOnline(syncQueue.isOnline());
      setPendingCount(syncQueue.getPendingCount());
    };

    const unsubscribe = syncQueue.subscribe(update);
    return unsubscribe;
  }, []);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`px-4 py-2 text-sm flex items-center justify-center gap-2 ${
      isOnline 
        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
    }`}>
      {!isOnline ? (
        <>
          <CloudOff className="w-4 h-4" />
          <span>You're offline. Changes will sync when connected.</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Syncing {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}...</span>
        </>
      ) : null}
    </div>
  );
}
