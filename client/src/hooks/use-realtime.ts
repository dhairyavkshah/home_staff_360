import { useEffect, useState, useRef, useCallback } from "react";
import { realtimeService } from "@/lib/realtime-service";
import { collaborationService } from "@/lib/collaboration-service";

export function useRealtime(event: string, callback: (data: any) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (data: any) => {
      callbackRef.current(data);
    };

    const unsubscribe = realtimeService.on(event, handler);

    return () => {
      unsubscribe();
    };
  }, [event]);
}

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const token = collaborationService.getToken();
    
    if (!token) {
      setIsConnected(false);
      return;
    }

    setIsConnecting(true);

    realtimeService
      .connect(token)
      .then(() => {
        setIsConnected(true);
        setIsConnecting(false);
      })
      .catch((error) => {
        console.error("[useRealtimeConnection] Failed to connect:", error);
        setIsConnected(false);
        setIsConnecting(false);
      });

    return () => {
      realtimeService.release();
      setIsConnected(false);
    };
  }, []);

  return { isConnected, isConnecting };
}

export function useRealtimeChat(chatId: string | null) {
  useEffect(() => {
    if (!chatId) return;

    realtimeService.joinChat(chatId);

    return () => {
      realtimeService.leaveChat(chatId);
    };
  }, [chatId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!chatId) return;
      realtimeService.sendTyping(chatId, isTyping);
    },
    [chatId]
  );

  return { sendTyping };
}
