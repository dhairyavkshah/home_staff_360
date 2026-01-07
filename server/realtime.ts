import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("CRITICAL: JWT_SECRET environment variable is required for security. Please set it in your environment.");
  }
  return secret;
})();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userPhone?: string;
}

let io: SocketIOServer | null = null;

const userSockets = new Map<string, Set<string>>();

export function initRealtime(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; phone: string };
      socket.userId = decoded.userId;
      socket.userPhone = decoded.phone;
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    socket.join(`user:${userId}`);
    
    console.log(`[Realtime] User ${userId} connected (socket: ${socket.id})`);

    socket.on("chat:join", (chatId: string | number) => {
      socket.join(`chat:${chatId}`);
      console.log(`[Realtime] User ${userId} joined chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId: string | number) => {
      socket.leave(`chat:${chatId}`);
      console.log(`[Realtime] User ${userId} left chat:${chatId}`);
    });

    socket.on("chat:typing", ({ chatId, isTyping }: { chatId: string | number; isTyping: boolean }) => {
      socket.to(`chat:${chatId}`).emit("chat:typing", {
        chatId,
        userId,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`[Realtime] User ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToChat(chatId: string | number, event: string, data: any) {
  if (io) {
    io.to(`chat:${chatId}`).emit(event, data);
  }
}

export function emitNewMessage(chatId: string | number, message: any, participantIds: string[]) {
  if (io) {
    io.to(`chat:${chatId}`).emit("chat:new-message", message);
    console.log(`[Realtime] Emitting chat:new-message to chat:${chatId}`, message.id);
    
    participantIds.forEach((userId) => {
      io!.to(`user:${userId}`).emit("chat:message-received", { chatId, message });
    });
  }
}

export function emitMessageUpdated(chatId: string | number, messageId: string, data: any, participantIds: string[]) {
  if (io) {
    io.to(`chat:${chatId}`).emit("chat:message-updated", data);
    console.log(`[Realtime] Emitting chat:message-updated to chat:${chatId}`, messageId);
    
    participantIds.forEach((userId) => {
      io!.to(`user:${userId}`).emit("chat:message-updated", { chatId, ...data });
    });
  }
}

export function emitMessageDeleted(chatId: string | number, messageId: string, participantIds: string[]) {
  if (io) {
    const data = { chatId, messageId, deletedAt: new Date().toISOString() };
    io.to(`chat:${chatId}`).emit("chat:message-deleted", data);
    console.log(`[Realtime] Emitting chat:message-deleted to chat:${chatId}`, messageId);
    
    participantIds.forEach((userId) => {
      io!.to(`user:${userId}`).emit("chat:message-deleted", data);
    });
  }
}

export function emitNotification(userId: string, notification: any) {
  emitToUser(userId, "notifications:created", notification);
}

export function emitNotificationRead(userId: string, notificationId: string) {
  emitToUser(userId, "notifications:read", { id: notificationId });
}

export function emitAllNotificationsRead(userId: string) {
  emitToUser(userId, "notifications:all-read", {});
}

export function emitConnectionInvite(toUserId: string, connection: any) {
  emitToUser(toUserId, "connections:invite-received", connection);
}

export function emitConnectionUpdated(userId1: string, userId2: string, connection: any) {
  emitToUser(userId1, "connections:status-changed", connection);
  emitToUser(userId2, "connections:status-changed", connection);
}

export function emitConnectionRemoved(userId1: string, userId2: string, connectionId: string) {
  emitToUser(userId1, "connections:removed", { id: connectionId });
  emitToUser(userId2, "connections:removed", { id: connectionId });
}

export function emitSyncData(toUserIds: string[], payload: any) {
  toUserIds.forEach((userId) => {
    emitToUser(userId, "sync:data-changed", payload);
  });
}

// Live collaboration events for shared data
export function emitAttendanceUpdate(toUserIds: string[], action: 'created' | 'updated' | 'deleted', data: any) {
  toUserIds.forEach((userId) => {
    emitToUser(userId, "collab:attendance-update", { action, data });
  });
}

export function emitLaundryUpdate(toUserIds: string[], action: 'created' | 'updated' | 'deleted', data: any) {
  toUserIds.forEach((userId) => {
    emitToUser(userId, "collab:laundry-update", { action, data });
  });
}

export function emitExpenseUpdate(toUserIds: string[], action: 'created' | 'updated' | 'deleted', data: any) {
  toUserIds.forEach((userId) => {
    emitToUser(userId, "collab:expense-update", { action, data });
  });
}

export function emitHouseholdUpdate(toUserIds: string[], action: 'member-added' | 'member-removed' | 'updated', data: any) {
  toUserIds.forEach((userId) => {
    emitToUser(userId, "collab:household-update", { action, data });
  });
}

export function emitUserOnline(toUserIds: string[], userId: string) {
  toUserIds.forEach((targetId) => {
    emitToUser(targetId, "sync:user-online", { userId });
  });
}

export function emitUserOffline(toUserIds: string[], userId: string) {
  toUserIds.forEach((targetId) => {
    emitToUser(targetId, "sync:user-offline", { userId });
  });
}

export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && (userSockets.get(userId)?.size || 0) > 0;
}

export function getOnlineUserIds(): string[] {
  return Array.from(userSockets.keys());
}
