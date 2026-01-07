import { io, Socket } from "socket.io-client";
import { queryClient } from "./queryClient";

type RealtimeEventHandler = (data: any) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<RealtimeEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentChatId: number | null = null;
  private isConnecting = false;

  connect(token: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      
      this.socket = io(`${window.location.origin}`, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[Realtime] Connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        if (this.currentChatId) {
          this.joinChat(this.currentChatId);
        }
        
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("[Realtime] Connection error:", error.message);
        this.isConnecting = false;
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[Realtime] Disconnected:", reason);
      });

      this.setupEventListeners();
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("chat:new-message", (message) => {
      console.log("[Realtime] New message received:", message);
      this.emit("chat:new-message", message);
      
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      if (message.chatId) {
        queryClient.invalidateQueries({ queryKey: ["/api/chats", message.chatId, "messages"] });
      }
    });

    this.socket.on("chat:message-received", ({ chatId, message }) => {
      console.log("[Realtime] Message received for chat:", chatId);
      this.emit("chat:message-received", { chatId, message });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    });

    this.socket.on("chat:typing", ({ chatId, userId, isTyping }) => {
      this.emit("chat:typing", { chatId, userId, isTyping });
    });

    this.socket.on("notifications:created", (notification) => {
      console.log("[Realtime] New notification:", notification);
      this.emit("notifications:created", notification);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    });

    this.socket.on("notifications:read", ({ id }) => {
      this.emit("notifications:read", { id });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    });

    this.socket.on("notifications:all-read", () => {
      this.emit("notifications:all-read", {});
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    });

    this.socket.on("connections:invite-received", (connection) => {
      console.log("[Realtime] Invite received:", connection);
      this.emit("connections:invite-received", connection);
      queryClient.invalidateQueries({ queryKey: ["/api/connections/invites/received"] });
    });

    this.socket.on("connections:status-changed", (connection) => {
      console.log("[Realtime] Connection status changed:", connection);
      this.emit("connections:status-changed", connection);
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/invites/sent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/connections/invites/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    });

    this.socket.on("connections:removed", ({ id }) => {
      console.log("[Realtime] Connection removed:", id);
      this.emit("connections:removed", { id });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
    this.currentChatId = null;
    this.isConnecting = false;
  }

  joinChat(chatId: number) {
    this.currentChatId = chatId;
    if (this.socket?.connected) {
      this.socket.emit("chat:join", chatId);
    }
  }

  leaveChat(chatId: number) {
    if (this.socket?.connected) {
      this.socket.emit("chat:leave", chatId);
    }
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  sendTyping(chatId: number, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit("chat:typing", { chatId, isTyping });
    }
  }

  on(event: string, handler: RealtimeEventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    
    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: RealtimeEventHandler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const realtimeService = new RealtimeService();
