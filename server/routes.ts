import { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  serverUsers, 
  devices, 
  collaborationLinks, 
  collaborationMessages, 
  adminUsers,
  insertServerUserSchema,
  insertDeviceSchema,
  insertCollaborationLinkSchema,
  insertCollaborationMessageSchema,
  insertAdminUserSchema
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "homestaff360-secret-key";
const OTP_EXPIRY_MINUTES = 30;
const MAX_OTP_ATTEMPTS_PER_HOUR = 5;
const OTP_COOLDOWN_SECONDS = 60;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneWithCountryCode(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, "");
  if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }
  return normalized;
}

async function findUserByPhone(phone: string) {
  const normalizedPhone = normalizePhoneWithCountryCode(phone);
  
  let user = await db.query.serverUsers.findFirst({
    where: eq(serverUsers.phone, normalizedPhone)
  });
  
  if (!user) {
    const phoneWithoutPlus = normalizedPhone.startsWith("+") ? normalizedPhone.slice(1) : normalizedPhone;
    user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.phone, phoneWithoutPlus)
    });
    
    if (user) {
      await db.update(serverUsers)
        .set({ phone: normalizedPhone })
        .where(eq(serverUsers.id, user.id));
      user = { ...user, phone: normalizedPhone };
    }
  }
  
  return user;
}

function canRequestOtp(user: { otpAttemptCount: number | null; otpAttemptResetAt: Date | null; otpLastSentAt: Date | null }): {
  allowed: boolean;
  reason?: string;
  waitSeconds?: number;
} {
  const now = new Date();
  
  if (user.otpLastSentAt) {
    const cooldownEndTime = new Date(user.otpLastSentAt.getTime() + OTP_COOLDOWN_SECONDS * 1000);
    if (now < cooldownEndTime) {
      const waitSeconds = Math.ceil((cooldownEndTime.getTime() - now.getTime()) / 1000);
      return { allowed: false, reason: "Please wait before requesting another OTP", waitSeconds };
    }
  }
  
  const attemptCount = user.otpAttemptCount || 0;
  const resetAt = user.otpAttemptResetAt;
  
  if (resetAt && now > resetAt) {
    return { allowed: true };
  }
  
  if (attemptCount >= MAX_OTP_ATTEMPTS_PER_HOUR) {
    const resetTime = resetAt ? resetAt : new Date(now.getTime() + 60 * 60 * 1000);
    const waitSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);
    return { allowed: false, reason: "Maximum OTP requests reached. Please try again later.", waitSeconds };
  }
  
  return { allowed: true };
}

router.post("/api/auth/request-otp", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: "Valid phone number with country code is required" });
    }

    const normalizedPhone = normalizePhoneWithCountryCode(phone);
    
    if (!normalizedPhone.match(/^\+\d{10,15}$/)) {
      return res.status(400).json({ error: "Phone number must include country code (e.g., +1234567890)" });
    }

    let user = await findUserByPhone(phone);

    if (!user) {
      const userId = uuidv4();
      const now = new Date();
      const [newUser] = await db.insert(serverUsers).values({
        id: userId,
        phone: normalizedPhone,
        isVerified: false,
        otpAttemptCount: 0,
        otpAttemptResetAt: new Date(now.getTime() + 60 * 60 * 1000),
      }).returning();
      user = newUser;
    }

    const rateLimitCheck = canRequestOtp(user);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ 
        error: rateLimitCheck.reason,
        waitSeconds: rateLimitCheck.waitSeconds
      });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const now = new Date();
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    const currentAttemptCount = user.otpAttemptCount || 0;
    const resetAt = user.otpAttemptResetAt;
    const shouldResetCounter = resetAt && now > resetAt;
    
    const newAttemptCount = shouldResetCounter ? 1 : currentAttemptCount + 1;
    const newResetAt = shouldResetCounter ? new Date(now.getTime() + 60 * 60 * 1000) : (resetAt || new Date(now.getTime() + 60 * 60 * 1000));

    await db.update(serverUsers)
      .set({ 
        otpHash, 
        otpExpiresAt,
        otpAttemptCount: newAttemptCount,
        otpAttemptResetAt: newResetAt,
        otpLastSentAt: now,
      })
      .where(eq(serverUsers.id, user.id));

    if (process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_ACCOUNT_SID) {
      try {
        await twilioClient.messages.create({
          body: `Your OTP for phone number verification is: ${otp} (Note: Please keep it valid only for ${OTP_EXPIRY_MINUTES} minutes.)`,
          to: normalizedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        if (process.env.NODE_ENV === "development") {
          console.log("DEV MODE - OTP:", otp);
        }
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log("DEV MODE - OTP:", otp);
    }

    const remainingAttempts = MAX_OTP_ATTEMPTS_PER_HOUR - newAttemptCount;

    res.json({ 
      success: true, 
      message: "OTP sent successfully",
      userId: user.id,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      remainingAttempts,
      cooldownSeconds: OTP_COOLDOWN_SECONDS
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: "No OTP request found" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    const isValidOTP = await bcrypt.compare(otp, user.otpHash);
    
    if (!isValidOTP) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await db.update(serverUsers)
      .set({ 
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        lastLoginAt: new Date(),
        lastActiveAt: new Date()
      })
      .where(eq(serverUsers.id, user.id));

    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        userType: user.userType,
        isVerified: true
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    (req as any).user = decoded;
    next();
  });
}

router.get("/api/user/profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user.id,
      phone: user.phone,
      displayName: user.displayName,
      userType: user.userType,
      isVerified: user.isVerified,
      preferredLanguage: user.preferredLanguage,
      connectCount: user.connectCount,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.patch("/api/user/profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { displayName, userType, preferredLanguage, deviceInfo } = req.body;

    const updateData: any = { lastActiveAt: new Date() };
    if (displayName !== undefined) updateData.displayName = displayName;
    if (userType !== undefined) updateData.userType = userType;
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
    if (deviceInfo !== undefined) updateData.deviceInfo = deviceInfo;

    await db.update(serverUsers)
      .set(updateData)
      .where(eq(serverUsers.id, userId));

    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/api/devices/register", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { deviceId, platform, deviceName, pushToken } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }

    const existingDevice = await db.query.devices.findFirst({
      where: and(
        eq(devices.userId, userId),
        eq(devices.deviceId, deviceId)
      )
    });

    if (existingDevice) {
      await db.update(devices)
        .set({ 
          platform, 
          deviceName, 
          pushToken,
          lastSyncAt: new Date()
        })
        .where(eq(devices.id, existingDevice.id));

      return res.json({ success: true, deviceId: existingDevice.id });
    }

    const id = uuidv4();
    const [newDevice] = await db.insert(devices).values({
      id,
      userId,
      deviceId,
      platform,
      deviceName,
      pushToken,
      lastSyncAt: new Date()
    }).returning();

    res.json({ success: true, deviceId: newDevice.id });
  } catch (error) {
    console.error("Register device error:", error);
    res.status(500).json({ error: "Failed to register device" });
  }
});

router.post("/api/collaboration/create-link", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { homeAccountId, staffAccountId, isHomeUser } = req.body;

    const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const id = uuidv4();
    const linkData: any = {
      id,
      status: "pending",
      invitationCode,
      expiresAt,
    };

    if (isHomeUser) {
      linkData.homeUserId = userId;
      linkData.homeAccountId = homeAccountId;
      linkData.staffUserId = userId;
      linkData.staffAccountId = "";
    } else {
      linkData.staffUserId = userId;
      linkData.staffAccountId = staffAccountId;
      linkData.homeUserId = userId;
      linkData.homeAccountId = "";
    }

    const [link] = await db.insert(collaborationLinks).values(linkData).returning();

    res.json({
      success: true,
      invitationCode,
      linkId: link.id,
      expiresAt
    });
  } catch (error) {
    console.error("Create collaboration link error:", error);
    res.status(500).json({ error: "Failed to create collaboration link" });
  }
});

router.post("/api/collaboration/accept-link", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { invitationCode, accountId } = req.body;

    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.invitationCode, invitationCode)
    });

    if (!link) {
      return res.status(404).json({ error: "Invalid invitation code" });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(400).json({ error: "Invitation has expired" });
    }

    if (link.status !== "pending") {
      return res.status(400).json({ error: "Invitation already used" });
    }

    const updateData: any = {
      status: "active",
      updatedAt: new Date()
    };

    if (!link.staffAccountId) {
      updateData.staffUserId = userId;
      updateData.staffAccountId = accountId;
    } else {
      updateData.homeUserId = userId;
      updateData.homeAccountId = accountId;
    }

    await db.update(collaborationLinks)
      .set(updateData)
      .where(eq(collaborationLinks.id, link.id));

    res.json({ success: true, linkId: link.id });
  } catch (error) {
    console.error("Accept collaboration link error:", error);
    res.status(500).json({ error: "Failed to accept collaboration link" });
  }
});

router.get("/api/collaboration/links", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const links = await db.query.collaborationLinks.findMany({
      where: or(
        eq(collaborationLinks.homeUserId, userId),
        eq(collaborationLinks.staffUserId, userId)
      ),
      orderBy: desc(collaborationLinks.createdAt)
    });

    res.json({ links });
  } catch (error) {
    console.error("Get collaboration links error:", error);
    res.status(500).json({ error: "Failed to get collaboration links" });
  }
});

router.delete("/api/collaboration/links/:linkId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { linkId } = req.params;

    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, linkId)
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    if (link.homeUserId !== userId && link.staffUserId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this link" });
    }

    await db.update(collaborationLinks)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(collaborationLinks.id, linkId));

    res.json({ success: true });
  } catch (error) {
    console.error("Revoke collaboration link error:", error);
    res.status(500).json({ error: "Failed to revoke collaboration link" });
  }
});

router.post("/api/collaboration/messages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { linkId, messageType, payload, fromDeviceId } = req.body;

    const id = uuidv4();
    const [message] = await db.insert(collaborationMessages).values({
      id,
      linkId,
      fromDeviceId,
      messageType,
      payload: JSON.stringify(payload),
      stateVersion: 1,
      isProcessed: false
    }).returning();

    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("Send collaboration message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.get("/api/collaboration/:linkId/messages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { since } = req.query;

    let query = db.select().from(collaborationMessages)
      .where(eq(collaborationMessages.linkId, linkId))
      .orderBy(desc(collaborationMessages.createdAt));

    const messages = await query;

    res.json(messages);
  } catch (error) {
    console.error("Get collaboration messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

function authenticateAdmin(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Admin authentication required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err || !decoded.isAdmin) {
      return res.status(403).json({ error: "Admin access denied" });
    }
    (req as any).admin = decoded;
    next();
  });
}

router.post("/api/admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email)
    });

    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await db.update(adminUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminUsers.id, admin.id));

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role, isAdmin: true },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/api/admin/stats", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(serverUsers);
    const [verifiedCountResult] = await db.select({ count: sql<number>`count(*)` }).from(serverUsers).where(eq(serverUsers.isVerified, true));
    const [deviceCountResult] = await db.select({ count: sql<number>`count(*)` }).from(devices);
    const [linkCountResult] = await db.select({ count: sql<number>`count(*)` }).from(collaborationLinks);
    const [activeLinkCountResult] = await db.select({ count: sql<number>`count(*)` }).from(collaborationLinks).where(eq(collaborationLinks.status, "active"));

    res.json({
      totalUsers: Number(userCountResult.count),
      verifiedUsers: Number(verifiedCountResult.count),
      totalDevices: Number(deviceCountResult.count),
      totalLinks: Number(linkCountResult.count),
      activeLinks: Number(activeLinkCountResult.count)
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/api/admin/users", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "50", search } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const users = await db.query.serverUsers.findMany({
      limit: parseInt(limit as string),
      offset,
      orderBy: desc(serverUsers.createdAt)
    });

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(serverUsers);

    res.json({
      users: users.map(u => ({
        id: u.id,
        phone: u.phone,
        displayName: u.displayName,
        userType: u.userType,
        isVerified: u.isVerified,
        isActive: u.isActive,
        connectCount: u.connectCount,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt
      })),
      total: Number(countResult.count),
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ error: "Failed to get users" });
  }
});

router.patch("/api/admin/users/:userId", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    await db.update(serverUsers)
      .set({ isActive })
      .where(eq(serverUsers.id, userId));

    res.json({ success: true });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

async function initializeDefaultAdmin() {
  const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL;
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!defaultEmail || !defaultPassword) {
    console.log("No default admin credentials configured");
    return;
  }

  const existingAdmin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, defaultEmail)
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    await db.insert(adminUsers).values({
      id: uuidv4(),
      email: defaultEmail,
      passwordHash,
      name: "Super Admin",
      role: "super_admin",
      isActive: true
    });
    console.log("Default admin user created");
  }
}

initializeDefaultAdmin().catch(console.error);

export default router;
