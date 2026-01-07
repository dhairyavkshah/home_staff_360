import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "home-staff-360-jwt-secret-key-2024";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userPhone?: string;
}

let io: SocketIOServer | null = null;

const userSockets = new Map<number, Set<string>>();

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
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; phone: string };
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

    socket.on("chat:join", (chatId: number) => {
      socket.join(`chat:${chatId}`);
      console.log(`[Realtime] User ${userId} joined chat:${chatId}`);
    });

    socket.on("chat:leave", (chatId: number) => {
      socket.leave(`chat:${chatId}`);
      console.log(`[Realtime] User ${userId} left chat:${chatId}`);
    });

    socket.on("chat:typing", ({ chatId, isTyping }: { chatId: number; isTyping: boolean }) => {
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

export function emitToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToChat(chatId: number, event: string, data: any) {
  if (io) {
    io.to(`chat:${chatId}`).emit(event, data);
  }
}

export function emitNewMessage(chatId: number, message: any, participantIds: number[]) {
  if (io) {
    io.to(`chat:${chatId}`).emit("chat:new-message", message);
    
    participantIds.forEach((userId) => {
      io!.to(`user:${userId}`).emit("chat:message-received", { chatId, message });
    });
  }
}

export function emitNotification(userId: number, notification: any) {
  emitToUser(userId, "notifications:created", notification);
}

export function emitNotificationRead(userId: number, notificationId: number) {
  emitToUser(userId, "notifications:read", { id: notificationId });
}

export function emitAllNotificationsRead(userId: number) {
  emitToUser(userId, "notifications:all-read", {});
}

export function emitConnectionInvite(toUserId: number, connection: any) {
  emitToUser(toUserId, "connections:invite-received", connection);
}

export function emitConnectionUpdated(userId1: number, userId2: number, connection: any) {
  emitToUser(userId1, "connections:status-changed", connection);
  emitToUser(userId2, "connections:status-changed", connection);
}

export function emitConnectionRemoved(userId1: number, userId2: number, connectionId: number) {
  emitToUser(userId1, "connections:removed", { id: connectionId });
  emitToUser(userId2, "connections:removed", { id: connectionId });
}
