import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { realtimeService } from "@/lib/realtime-service";
import { collaborationService } from "@/lib/collaboration-service";
import { useToast } from "@/hooks/use-toast";
import { notificationAlertService } from "@/lib/notification-alert-service";
import { Capacitor } from "@capacitor/core";

interface NotificationPayload {
  id: string;
  title: string;
  message?: string;
  type: string;
}

interface MessagePayload {
  id: number;
  chatId: number;
  senderId: string;
  content: string;
  createdAt: string;
  senderName?: string;
}

interface RealtimeContextValue {
  isConnected: boolean;
  unreadNotificationCount: number;
  unreadMessageCount: number;
  incrementNotificationCount: () => void;
  decrementNotificationCount: () => void;
  setNotificationCount: (count: number) => void;
  incrementMessageCount: () => void;
  decrementMessageCount: () => void;
  setMessageCount: (count: number) => void;
  reconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  unreadNotificationCount: 0,
  unreadMessageCount: 0,
  incrementNotificationCount: () => {},
  decrementNotificationCount: () => {},
  setNotificationCount: () => {},
  incrementMessageCount: () => {},
  decrementMessageCount: () => {},
  setMessageCount: () => {},
  reconnect: () => {},
});

export function useRealtimeContext() {
  return useContext(RealtimeContext);
}

function playNotificationSound() {
  try {
    if (Capacitor.isNativePlatform()) {
      return;
    }
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
  }
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const connectionAttemptRef = useRef(false);
  const notificationHandlerRef = useRef<((data: NotificationPayload) => void) | null>(null);
  const messageHandlerRef = useRef<((data: MessagePayload) => void) | null>(null);

  const handleNewNotification = useCallback((notification: NotificationPayload) => {
    setUnreadNotificationCount((prev) => prev + 1);

    toast({
      title: notification.title,
      description: notification.message,
    });

    notificationAlertService.showPushNotification(notification);

    playNotificationSound();
  }, [toast]);

  const handleNewMessage = useCallback((message: MessagePayload) => {
    setUnreadMessageCount((prev) => prev + 1);
    playNotificationSound();
  }, []);

  const fetchInitialCounts = useCallback(async () => {
    try {
      const result = await collaborationService.getNotifications("HOME");
      setUnreadNotificationCount(result.unreadCount || 0);
    } catch {
    }
  }, []);

  const connectIfAuthenticated = useCallback(() => {
    const token = collaborationService.getToken();
    if (!token) {
      setIsConnected(false);
      return;
    }

    if (realtimeService.isConnected()) {
      setIsConnected(true);
      return;
    }

    if (connectionAttemptRef.current) return;
    connectionAttemptRef.current = true;

    realtimeService
      .connect(token)
      .then(() => {
        setIsConnected(true);
        connectionAttemptRef.current = false;
        fetchInitialCounts();
      })
      .catch((error) => {
        console.error("[RealtimeProvider] Connection failed:", error);
        setIsConnected(false);
        connectionAttemptRef.current = false;
      });
  }, [fetchInitialCounts]);

  useEffect(() => {
    notificationHandlerRef.current = handleNewNotification;
    messageHandlerRef.current = handleNewMessage;
  }, [handleNewNotification, handleNewMessage]);

  useEffect(() => {
    const onNotification = (data: NotificationPayload) => {
      if (notificationHandlerRef.current) {
        notificationHandlerRef.current(data);
      }
    };

    const onMessage = (data: MessagePayload) => {
      if (messageHandlerRef.current) {
        messageHandlerRef.current(data);
      }
    };

    realtimeService.on("notifications:created", onNotification);
    realtimeService.on("chat:new-message", onMessage);

    return () => {
      realtimeService.off("notifications:created", onNotification);
      realtimeService.off("chat:new-message", onMessage);
    };
  }, []);

  useEffect(() => {
    connectIfAuthenticated();

    const interval = setInterval(() => {
      const token = collaborationService.getToken();
      if (token && !realtimeService.isConnected()) {
        connectIfAuthenticated();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [connectIfAuthenticated]);

  const incrementNotificationCount = useCallback(() => {
    setUnreadNotificationCount((prev) => prev + 1);
  }, []);

  const decrementNotificationCount = useCallback(() => {
    setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
  }, []);

  const setNotificationCount = useCallback((count: number) => {
    setUnreadNotificationCount(count);
  }, []);

  const incrementMessageCount = useCallback(() => {
    setUnreadMessageCount((prev) => prev + 1);
  }, []);

  const decrementMessageCount = useCallback(() => {
    setUnreadMessageCount((prev) => Math.max(0, prev - 1));
  }, []);

  const setMessageCount = useCallback((count: number) => {
    setUnreadMessageCount(count);
  }, []);

  const reconnect = useCallback(() => {
    connectionAttemptRef.current = false;
    connectIfAuthenticated();
  }, [connectIfAuthenticated]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        unreadNotificationCount,
        unreadMessageCount,
        incrementNotificationCount,
        decrementNotificationCount,
        setNotificationCount,
        incrementMessageCount,
        decrementMessageCount,
        setMessageCount,
        reconnect,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
