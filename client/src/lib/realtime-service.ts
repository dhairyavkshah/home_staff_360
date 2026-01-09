import { io, Socket } from "socket.io-client";

type RealtimeEventHandler = (data: any) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<RealtimeEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentChatId: string | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionRefCount = 0;
  private currentToken: string | null = null;
  private listenersSetup = false;

  connect(token: string): Promise<void> {
    this.currentToken = token;
    
    // If socket exists (even if not connected), don't create a new one
    // Socket.io will handle auto-reconnection
    if (this.socket) {
      if (this.socket.connected) {
        return Promise.resolve();
      }
      // Socket exists but disconnected - wait for auto-reconnection
      // or return the existing connection promise
      if (this.connectionPromise) {
        return this.connectionPromise;
      }
      // Socket is disconnected and no promise - try to reconnect manually
      this.socket.connect();
      return Promise.resolve();
    }

    this.connectionRefCount++;

    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
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
      this.listenersSetup = true;
    });

    return this.connectionPromise;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    const events = [
      "chat:new-message",
      "chat:message-received",
      "chat:typing",
      "notifications:created",
      "notifications:read",
      "notifications:all-read",
      "connections:invite-received",
      "connections:status-changed",
      "connections:removed",
      "sync:data-changed",
      "sync:user-online",
      "sync:user-offline",
      "sync:request-sync",
      "collab:attendance-update",
      "collab:laundry-update",
      "collab:payment-update",
      "collab:expense-update",
      "collab:household-update",
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  release() {
    this.connectionRefCount = Math.max(0, this.connectionRefCount - 1);
    
    if (this.connectionRefCount === 0) {
      this.disconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
    this.currentChatId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.connectionRefCount = 0;
    this.currentToken = null;
    this.listenersSetup = false;
  }

  forceDisconnect() {
    this.connectionRefCount = 0;
    this.disconnect();
  }

  joinChat(chatId: string) {
    this.currentChatId = chatId;
    console.log("[Realtime] joinChat called for", chatId, "socket connected:", this.socket?.connected);
    if (this.socket?.connected) {
      this.socket.emit("chat:join", chatId);
      console.log("[Realtime] Emitted chat:join for", chatId);
    } else {
      console.log("[Realtime] Socket not connected, will join on reconnect");
    }
  }

  leaveChat(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit("chat:leave", chatId);
    }
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  sendTyping(chatId: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit("chat:typing", { chatId, isTyping });
    }
  }

  getCurrentChatId(): string | null {
    return this.currentChatId;
  }

  on(event: string, handler: RealtimeEventHandler): () => void {
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
  
  getRefCount(): number {
    return this.connectionRefCount;
  }
}

export const realtimeService = new RealtimeService();
