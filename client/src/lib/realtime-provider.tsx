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

interface ConnectionPayload {
  id: number;
  status: string;
  homeUserId?: string;
  staffUserId?: string;
  homeUserName?: string;
  staffUserName?: string;
  personName?: string;
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
  const inviteReceivedHandlerRef = useRef<((data: ConnectionPayload) => void) | null>(null);
  const connectionStatusHandlerRef = useRef<((data: ConnectionPayload) => void) | null>(null);

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
    
    // Show push notification for new chat message
    const senderName = message.senderName || "Someone";
    const messagePreview = message.content.length > 50 
      ? message.content.substring(0, 50) + "..." 
      : message.content;
    
    notificationAlertService.showPushNotification({
      id: `chat-message-${message.id}`,
      title: `New message from ${senderName}`,
      message: messagePreview,
      type: "chat_message",
    });
  }, []);

  const handleInviteReceived = useCallback((connection: ConnectionPayload) => {
    const senderName = connection.homeUserName || connection.staffUserName || "Someone";
    
    notificationAlertService.showPushNotification({
      id: `invite-received-${connection.id}`,
      title: "New Connection Invite",
      message: `${senderName} wants to connect with you`,
      type: "invite_received",
    });
    
    toast({
      title: "New Connection Invite",
      description: `${senderName} wants to connect with you`,
    });
    
    playNotificationSound();
    setUnreadNotificationCount((prev) => prev + 1);
  }, [toast]);

  const handleConnectionStatusChanged = useCallback((connection: ConnectionPayload) => {
    const personName = connection.personName || connection.homeUserName || connection.staffUserName || "Someone";
    
    if (connection.status === "accepted") {
      notificationAlertService.showPushNotification({
        id: `invite-accepted-${connection.id}`,
        title: "Invite Accepted",
        message: `${personName} accepted your connection invite`,
        type: "invite_accepted",
      });
      
      toast({
        title: "Invite Accepted",
        description: `${personName} accepted your connection invite`,
      });
    } else if (connection.status === "rejected") {
      notificationAlertService.showPushNotification({
        id: `invite-rejected-${connection.id}`,
        title: "Invite Declined",
        message: `${personName} declined your connection invite`,
        type: "invite_rejected",
      });
      
      toast({
        title: "Invite Declined",
        description: `${personName} declined your connection invite`,
        variant: "destructive",
      });
    }
    
    playNotificationSound();
  }, [toast]);

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
    inviteReceivedHandlerRef.current = handleInviteReceived;
    connectionStatusHandlerRef.current = handleConnectionStatusChanged;
  }, [handleNewNotification, handleNewMessage, handleInviteReceived, handleConnectionStatusChanged]);

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

    const onInviteReceived = (data: ConnectionPayload) => {
      if (inviteReceivedHandlerRef.current) {
        inviteReceivedHandlerRef.current(data);
      }
    };

    const onConnectionStatusChanged = (data: ConnectionPayload) => {
      if (connectionStatusHandlerRef.current) {
        connectionStatusHandlerRef.current(data);
      }
    };

    const unsubNotification = realtimeService.on("notifications:created", onNotification);
    const unsubMessage = realtimeService.on("chat:new-message", onMessage);
    const unsubInviteReceived = realtimeService.on("connections:invite-received", onInviteReceived);
    const unsubConnectionStatus = realtimeService.on("connections:status-changed", onConnectionStatusChanged);

    return () => {
      unsubNotification();
      unsubMessage();
      unsubInviteReceived();
      unsubConnectionStatus();
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
