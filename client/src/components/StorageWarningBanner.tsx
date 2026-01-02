import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, X, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { storage } from "@/lib/storage";
import { useI18n } from "@/lib/i18n/i18n-context";

export function StorageWarningBanner() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const [storageStatus, setStorageStatus] = useState(() => storage.getStorageStatus());

  const checkStorage = useCallback(() => {
    const newStatus = storage.getStorageStatus();
    setStorageStatus(prev => {
      if (prev.totalRecords !== newStatus.totalRecords || prev.status !== newStatus.status) {
        if (newStatus.status !== 'ok') {
          setDismissed(false);
        }
        return newStatus;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    checkStorage();
    
    const interval = setInterval(checkStorage, 5000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStorage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkStorage]);

  if (dismissed || storageStatus.status === 'ok') {
    return null;
  }

  const isLimit = storageStatus.status === 'limit';
  const title = isLimit ? t('storageLimitReached') : t('storageAlmostFull');
  const message = isLimit 
    ? t('storageLimitMessage')
        .replace('{limit}', String(storageStatus.softLimitThreshold))
    : t('storageWarningMessage')
        .replace('{percent}', String(storageStatus.percentUsed))
        .replace('{current}', String(storageStatus.totalRecords))
        .replace('{limit}', String(storageStatus.softLimitThreshold));

  return (
    <div 
      className={`mx-4 mt-2 p-3 rounded-lg border ${
        isLimit 
          ? 'bg-destructive/10 border-destructive/30' 
          : 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-600/10 dark:border-amber-600/30'
      }`}
      data-testid="banner-storage-warning"
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full ${isLimit ? 'bg-destructive/20' : 'bg-amber-500/20 dark:bg-amber-600/20'}`}>
          {isLimit ? (
            <Database className="h-4 w-4 text-destructive" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-medium ${isLimit ? 'text-destructive' : 'text-amber-700 dark:text-amber-400'}`}>
              {title}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setDismissed(true)}
              data-testid="button-dismiss-storage-warning"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {message}
          </p>
          
          <div className="mt-2 flex items-center gap-2">
            <Progress 
              value={storageStatus.percentUsed} 
              className={`h-1.5 flex-1 ${isLimit ? '[&>div]:bg-destructive' : '[&>div]:bg-amber-500 dark:[&>div]:bg-amber-600'}`}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {storageStatus.totalRecords}/{storageStatus.softLimitThreshold}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
