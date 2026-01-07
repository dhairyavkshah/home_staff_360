import { useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { notificationAlertService } from "@/lib/notification-alert-service";
import { realtimeService } from "@/lib/realtime-service";
import { collaborationService } from "@/lib/collaboration-service";

interface NotificationPayload {
  id: string;
  title: string;
  message?: string;
  type: string;
}

export function useNotificationAlerts() {
  const { toast } = useToast();
  const handlerRef = useRef<((notification: NotificationPayload) => void) | null>(null);

  const handleNewNotification = useCallback((notification: NotificationPayload) => {
    if (!collaborationService.isAuthenticated()) {
      return;
    }
    
    toast({
      title: notification.title,
      description: notification.message,
    });

    notificationAlertService.showPushNotification(notification);
  }, [toast]);

  useEffect(() => {
    handlerRef.current = handleNewNotification;

    const onNotification = (notification: NotificationPayload) => {
      if (handlerRef.current) {
        handlerRef.current(notification);
      }
    };

    realtimeService.on("notifications:created", onNotification);

    return () => {
      realtimeService.off("notifications:created", onNotification);
    };
  }, [handleNewNotification]);
}
