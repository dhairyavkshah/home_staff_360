import { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  serverUsers, 
  devices, 
  collaborationLinks, 
  collaborationMessages, 
  adminUsers,
  collaborationBindings,
  sharedAttendance,
  attendanceRevisions,
  sharedLaundry,
  laundryRevisions,
  notifications,
  insertServerUserSchema,
  insertDeviceSchema,
  insertCollaborationLinkSchema,
  insertCollaborationMessageSchema,
  insertAdminUserSchema,
  insertCollaborationBindingSchema,
  insertSharedAttendanceSchema,
  insertSharedLaundrySchema,
  insertNotificationSchema,
  approvalStatuses
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

function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

function generatePhoneVariants(phone: string): string[] {
  const normalized = normalizePhoneWithCountryCode(phone);
  const digits = extractDigits(normalized);
  
  const variants: string[] = [normalized];
  
  if (normalized.startsWith("+")) {
    variants.push(normalized.slice(1));
  }
  
  if (digits.length >= 10) {
    variants.push(digits);
    variants.push(digits.slice(-10));
    
    if (digits.startsWith("0")) {
      variants.push(digits.slice(1));
    }
    variants.push("0" + digits.slice(-10));
  }
  
  return Array.from(new Set(variants));
}

async function findUserByPhone(phone: string) {
  const normalizedPhone = normalizePhoneWithCountryCode(phone);
  const variants = generatePhoneVariants(phone);
  
  let user = await db.query.serverUsers.findFirst({
    where: eq(serverUsers.phone, normalizedPhone)
  });
  
  if (!user) {
    for (const variant of variants) {
      user = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.phone, variant)
      });
      if (user) {
        await db.update(serverUsers)
          .set({ phone: normalizedPhone })
          .where(eq(serverUsers.id, user.id));
        user = { ...user, phone: normalizedPhone };
        break;
      }
    }
  }
  
  return user;
}

async function findAndMergeDuplicateUsers(phone: string): Promise<typeof serverUsers.$inferSelect | null> {
  const normalizedPhone = normalizePhoneWithCountryCode(phone);
  const variants = generatePhoneVariants(phone);
  
  const duplicateUsers: (typeof serverUsers.$inferSelect)[] = [];
  
  for (const variant of variants) {
    const users = await db.query.serverUsers.findMany({
      where: eq(serverUsers.phone, variant)
    });
    duplicateUsers.push(...users);
  }
  
  const uniqueUsers = duplicateUsers.filter((user, index, self) => 
    self.findIndex(u => u.id === user.id) === index
  );
  
  if (uniqueUsers.length === 0) return null;
  if (uniqueUsers.length === 1) {
    await db.update(serverUsers)
      .set({ phone: normalizedPhone })
      .where(eq(serverUsers.id, uniqueUsers[0].id));
    return { ...uniqueUsers[0], phone: normalizedPhone };
  }
  
  const primaryUser = uniqueUsers.reduce((best, current) => {
    if (current.isVerified && !best.isVerified) return current;
    if (current.displayName && !best.displayName) return current;
    const currentDate = current.createdAt ? new Date(current.createdAt) : new Date();
    const bestDate = best.createdAt ? new Date(best.createdAt) : new Date();
    if (currentDate < bestDate) return current;
    return best;
  });
  
  const duplicateIds = uniqueUsers.filter(u => u.id !== primaryUser.id).map(u => u.id);
  
  for (const dupId of duplicateIds) {
    await db.update(devices)
      .set({ userId: primaryUser.id })
      .where(eq(devices.userId, dupId));
    
    await db.update(collaborationLinks)
      .set({ homeUserId: primaryUser.id })
      .where(eq(collaborationLinks.homeUserId, dupId));
    
    await db.update(collaborationLinks)
      .set({ staffUserId: primaryUser.id })
      .where(eq(collaborationLinks.staffUserId, dupId));
    
    await db.delete(serverUsers).where(eq(serverUsers.id, dupId));
  }
  
  await db.update(serverUsers)
    .set({ phone: normalizedPhone })
    .where(eq(serverUsers.id, primaryUser.id));
  
  console.log(`Merged ${duplicateIds.length} duplicate user records into primary user ${primaryUser.id}`);
  
  return { ...primaryUser, phone: normalizedPhone };
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

    let user = await findUserByPhone(phone);

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

    const mergedUser = await findAndMergeDuplicateUsers(phone);
    if (mergedUser) {
      user = mergedUser;
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

// ============ COLLABORATION BINDINGS API ============

// Create a binding between home person and staff client
router.post("/api/bindings", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { linkId, homePersonId, homePersonName, staffClientId, staffClientName } = req.body;
    
    if (!linkId || !homePersonId || !staffClientId) {
      return res.status(400).json({ error: "linkId, homePersonId, and staffClientId are required" });
    }

    // Verify the collaboration link exists and is active
    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, linkId)
    });

    if (!link || link.status !== 'active') {
      return res.status(404).json({ error: "Active collaboration link not found" });
    }

    const bindingId = uuidv4();
    const now = new Date();

    await db.insert(collaborationBindings).values({
      id: bindingId,
      linkId,
      homePersonId,
      homePersonName: homePersonName || null,
      staffClientId,
      staffClientName: staffClientName || null,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });

    // Create notifications for both users
    await createNotification(link.homeUserId, 'HOME', 'binding_created', 
      'New Staff Linked', `${staffClientName || 'A staff member'} has been linked to your household.`,
      'binding', bindingId);
    
    await createNotification(link.staffUserId, 'STAFF', 'binding_created',
      'New Client Linked', `${homePersonName || 'A client'} has been linked to your account.`,
      'binding', bindingId);

    res.json({ 
      success: true, 
      binding: { id: bindingId, linkId, homePersonId, staffClientId }
    });
  } catch (error) {
    console.error("Create binding error:", error);
    res.status(500).json({ error: "Failed to create binding" });
  }
});

// Get bindings for a user
router.get("/api/bindings", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    // Get all collaboration links for this user
    const userLinks = await db.query.collaborationLinks.findMany({
      where: or(
        eq(collaborationLinks.homeUserId, userId),
        eq(collaborationLinks.staffUserId, userId)
      )
    });

    const linkIds = userLinks.map(l => l.id);
    
    if (linkIds.length === 0) {
      return res.json({ bindings: [] });
    }

    const bindings = await db.query.collaborationBindings.findMany({
      where: sql`${collaborationBindings.linkId} IN (${sql.join(linkIds.map(id => sql`${id}`), sql`, `)})`
    });

    res.json({ bindings });
  } catch (error) {
    console.error("Get bindings error:", error);
    res.status(500).json({ error: "Failed to get bindings" });
  }
});

// ============ SHARED ATTENDANCE API WITH APPROVAL WORKFLOW ============

// Submit attendance (creates pending record)
router.post("/api/shared-attendance", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bindingId, date, status, hoursWorked, note, recordSalaryType, recordRate, recordCurrency } = req.body;

    if (!bindingId || !date || !status) {
      return res.status(400).json({ error: "bindingId, date, and status are required" });
    }

    // Get binding to find the counterparty
    const binding = await db.query.collaborationBindings.findFirst({
      where: eq(collaborationBindings.id, bindingId)
    });

    if (!binding) {
      return res.status(404).json({ error: "Binding not found" });
    }

    // Get the link to determine roles
    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, binding.linkId)
    });

    if (!link) {
      return res.status(404).json({ error: "Collaboration link not found" });
    }

    // Check for existing record on same date (only one allowed)
    const existingRecord = await db.query.sharedAttendance.findFirst({
      where: and(
        eq(sharedAttendance.bindingId, bindingId),
        eq(sharedAttendance.date, date)
      )
    });

    if (existingRecord && existingRecord.approvalStatus === 'approved') {
      return res.status(409).json({ 
        error: "An approved attendance record already exists for this date",
        existingRecordId: existingRecord.id
      });
    }

    // Determine submitter role and counterparty
    const isHomeUser = userId === link.homeUserId;
    const submitterRole = isHomeUser ? 'HOME' : 'STAFF';
    const counterpartyId = isHomeUser ? link.staffUserId : link.homeUserId;
    const counterpartyMode = isHomeUser ? 'STAFF' : 'HOME';

    const attendanceId = uuidv4();
    const revisionId = uuidv4();
    const now = new Date();

    // If there's a pending/rejected record, update it as revised
    if (existingRecord && (existingRecord.approvalStatus === 'pending' || existingRecord.approvalStatus === 'rejected')) {
      await db.update(sharedAttendance)
        .set({
          status,
          hoursWorked: hoursWorked || null,
          note: note || null,
          approvalStatus: 'pending',
          submittedBy: userId,
          submittedByRole: submitterRole,
          actionRequiredBy: counterpartyId,
          revisionCount: (existingRecord.revisionCount || 0) + 1,
          updatedAt: now,
          rejectedAt: null
        })
        .where(eq(sharedAttendance.id, existingRecord.id));

      // Create revision record
      await db.insert(attendanceRevisions).values({
        id: revisionId,
        attendanceId: existingRecord.id,
        revisionNumber: (existingRecord.revisionCount || 0) + 1,
        previousStatus: existingRecord.status,
        newStatus: status,
        action: 'revised',
        actionBy: userId,
        createdAt: now
      });

      // Notify counterparty
      await createNotification(counterpartyId, counterpartyMode, 'attendance_submitted',
        'Attendance Revised', `Attendance for ${date} has been revised. Please review.`,
        'attendance', existingRecord.id, { status, date });

      return res.json({ 
        success: true, 
        attendanceId: existingRecord.id,
        isRevision: true
      });
    }

    // Create new attendance record
    await db.insert(sharedAttendance).values({
      id: attendanceId,
      bindingId,
      date,
      status,
      hoursWorked: hoursWorked || null,
      note: note || null,
      approvalStatus: 'pending',
      submittedBy: userId,
      submittedByRole: submitterRole,
      actionRequiredBy: counterpartyId,
      currentRevisionId: revisionId,
      revisionCount: 0,
      recordSalaryType: recordSalaryType || null,
      recordRate: recordRate || null,
      recordCurrency: recordCurrency || null,
      createdAt: now,
      updatedAt: now
    });

    // Create initial revision record
    await db.insert(attendanceRevisions).values({
      id: revisionId,
      attendanceId,
      revisionNumber: 0,
      newStatus: status,
      action: 'submitted',
      actionBy: userId,
      createdAt: now
    });

    // Notify counterparty for approval
    await createNotification(counterpartyId, counterpartyMode, 'attendance_submitted',
      'Attendance Approval Needed', `Attendance for ${date} needs your approval.`,
      'attendance', attendanceId, { status, date });

    res.json({ success: true, attendanceId });
  } catch (error) {
    console.error("Submit attendance error:", error);
    res.status(500).json({ error: "Failed to submit attendance" });
  }
});

// Get attendance records for a binding
router.get("/api/shared-attendance", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bindingId, startDate, endDate } = req.query;

    if (!bindingId) {
      return res.status(400).json({ error: "bindingId is required" });
    }

    let query = eq(sharedAttendance.bindingId, bindingId as string);

    const records = await db.query.sharedAttendance.findMany({
      where: query,
      orderBy: desc(sharedAttendance.date)
    });

    res.json({ attendance: records });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ error: "Failed to get attendance" });
  }
});

// Get individual attendance record by ID
router.get("/api/shared-attendance/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const record = await db.query.sharedAttendance.findFirst({
      where: eq(sharedAttendance.id, id)
    });

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    // Verify user has access via binding
    const binding = await db.query.collaborationBindings.findFirst({
      where: eq(collaborationBindings.id, record.bindingId)
    });

    if (!binding) {
      return res.status(404).json({ error: "Binding not found" });
    }

    // Get the link to verify user access and check link status
    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, binding.linkId)
    });

    if (!link || (link.homeUserId !== userId && link.staffUserId !== userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check link status - only allow active links
    if (link.status !== 'active') {
      return res.status(403).json({ error: "Collaboration link is not active" });
    }

    // Get revision history
    const revisions = await db.query.attendanceRevisions.findMany({
      where: eq(attendanceRevisions.attendanceId, id),
      orderBy: desc(attendanceRevisions.createdAt)
    });

    res.json({ 
      attendance: record,
      revisions: revisions.map(r => ({
        id: r.id,
        revisionNumber: r.revisionNumber,
        action: r.action,
        actionBy: r.actionBy,
        actionByRole: r.actionBy === link.homeUserId ? 'HOME' : 'STAFF',
        remarks: r.remarks,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error("Get attendance by ID error:", error);
    res.status(500).json({ error: "Failed to get attendance record" });
  }
});

// Approve or reject attendance
router.patch("/api/shared-attendance/:id/action", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === 'reject' && !remarks) {
      return res.status(400).json({ error: "remarks are required when rejecting" });
    }

    const record = await db.query.sharedAttendance.findFirst({
      where: eq(sharedAttendance.id, id)
    });

    if (!record) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    if (record.actionRequiredBy !== userId) {
      return res.status(403).json({ error: "You are not authorized to take action on this record" });
    }

    if (record.approvalStatus !== 'pending') {
      return res.status(400).json({ error: "Record is not pending approval" });
    }

    const now = new Date();
    const revisionId = uuidv4();

    if (action === 'approve') {
      await db.update(sharedAttendance)
        .set({
          approvalStatus: 'approved',
          approvedAt: now,
          updatedAt: now
        })
        .where(eq(sharedAttendance.id, id));

      await db.insert(attendanceRevisions).values({
        id: revisionId,
        attendanceId: id,
        revisionNumber: (record.revisionCount || 0) + 1,
        action: 'approved',
        actionBy: userId,
        createdAt: now
      });

      // Notify submitter
      await createNotification(record.submittedBy, record.submittedByRole as 'HOME' | 'STAFF', 
        'attendance_approved', 'Attendance Approved', 
        `Your attendance submission for ${record.date} has been approved.`,
        'attendance', id);

    } else {
      await db.update(sharedAttendance)
        .set({
          approvalStatus: 'rejected',
          rejectedAt: now,
          actionRequiredBy: record.submittedBy, // Now the submitter needs to revise
          updatedAt: now
        })
        .where(eq(sharedAttendance.id, id));

      await db.insert(attendanceRevisions).values({
        id: revisionId,
        attendanceId: id,
        revisionNumber: (record.revisionCount || 0) + 1,
        remarks,
        action: 'rejected',
        actionBy: userId,
        createdAt: now
      });

      // Notify submitter of rejection
      await createNotification(record.submittedBy, record.submittedByRole as 'HOME' | 'STAFF',
        'attendance_rejected', 'Attendance Rejected',
        `Your attendance for ${record.date} was rejected: ${remarks}`,
        'attendance', id, { remarks });
    }

    res.json({ success: true, action });
  } catch (error) {
    console.error("Attendance action error:", error);
    res.status(500).json({ error: "Failed to process action" });
  }
});

// ============ SHARED LAUNDRY API WITH APPROVAL WORKFLOW ============

// Submit laundry (creates pending record)
router.post("/api/shared-laundry", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { bindingId, date, items, itemsTotal, pickupDelivery, pickupDeliveryCharge, total, serviceType, recordCurrency } = req.body;

    if (!bindingId || !date || !items || total === undefined) {
      return res.status(400).json({ error: "bindingId, date, items, and total are required" });
    }

    const binding = await db.query.collaborationBindings.findFirst({
      where: eq(collaborationBindings.id, bindingId)
    });

    if (!binding) {
      return res.status(404).json({ error: "Binding not found" });
    }

    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, binding.linkId)
    });

    if (!link) {
      return res.status(404).json({ error: "Collaboration link not found" });
    }

    const isHomeUser = userId === link.homeUserId;
    const submitterRole = isHomeUser ? 'HOME' : 'STAFF';
    const counterpartyId = isHomeUser ? link.staffUserId : link.homeUserId;
    const counterpartyMode = isHomeUser ? 'STAFF' : 'HOME';

    const laundryId = uuidv4();
    const revisionId = uuidv4();
    const now = new Date();

    await db.insert(sharedLaundry).values({
      id: laundryId,
      bindingId,
      date,
      items: typeof items === 'string' ? items : JSON.stringify(items),
      itemsTotal: itemsTotal || null,
      pickupDelivery: pickupDelivery || false,
      pickupDeliveryCharge: pickupDeliveryCharge || null,
      total,
      serviceType: serviceType || null,
      approvalStatus: 'pending',
      submittedBy: userId,
      submittedByRole: submitterRole,
      actionRequiredBy: counterpartyId,
      currentRevisionId: revisionId,
      revisionCount: 0,
      recordCurrency: recordCurrency || null,
      createdAt: now,
      updatedAt: now
    });

    await db.insert(laundryRevisions).values({
      id: revisionId,
      laundryId,
      revisionNumber: 0,
      newData: typeof items === 'string' ? items : JSON.stringify(items),
      action: 'submitted',
      actionBy: userId,
      createdAt: now
    });

    await createNotification(counterpartyId, counterpartyMode, 'laundry_submitted',
      'Laundry Approval Needed', `Laundry batch for ${date} needs your approval.`,
      'laundry', laundryId, { total, date });

    res.json({ success: true, laundryId });
  } catch (error) {
    console.error("Submit laundry error:", error);
    res.status(500).json({ error: "Failed to submit laundry" });
  }
});

// Get laundry records for a binding
router.get("/api/shared-laundry", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bindingId } = req.query;

    if (!bindingId) {
      return res.status(400).json({ error: "bindingId is required" });
    }

    const records = await db.query.sharedLaundry.findMany({
      where: eq(sharedLaundry.bindingId, bindingId as string),
      orderBy: desc(sharedLaundry.date)
    });

    res.json({ laundry: records });
  } catch (error) {
    console.error("Get laundry error:", error);
    res.status(500).json({ error: "Failed to get laundry" });
  }
});

// Get individual laundry record by ID
router.get("/api/shared-laundry/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const record = await db.query.sharedLaundry.findFirst({
      where: eq(sharedLaundry.id, id)
    });

    if (!record) {
      return res.status(404).json({ error: "Laundry record not found" });
    }

    // Verify user has access via binding
    const binding = await db.query.collaborationBindings.findFirst({
      where: eq(collaborationBindings.id, record.bindingId)
    });

    if (!binding) {
      return res.status(404).json({ error: "Binding not found" });
    }

    // Get the link to verify user access and check link status
    const link = await db.query.collaborationLinks.findFirst({
      where: eq(collaborationLinks.id, binding.linkId)
    });

    if (!link || (link.homeUserId !== userId && link.staffUserId !== userId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check link status - only allow active links
    if (link.status !== 'active') {
      return res.status(403).json({ error: "Collaboration link is not active" });
    }

    // Get revision history
    const revisions = await db.query.laundryRevisions.findMany({
      where: eq(laundryRevisions.laundryId, id),
      orderBy: desc(laundryRevisions.createdAt)
    });

    // Parse items JSON
    let items = [];
    try {
      items = typeof record.items === 'string' ? JSON.parse(record.items) : record.items;
    } catch { }

    res.json({ 
      laundry: {
        ...record,
        items
      },
      revisions: revisions.map(r => ({
        id: r.id,
        revisionNumber: r.revisionNumber,
        action: r.action,
        actionBy: r.actionBy,
        actionByRole: r.actionBy === link.homeUserId ? 'HOME' : 'STAFF',
        remarks: r.remarks,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error("Get laundry by ID error:", error);
    res.status(500).json({ error: "Failed to get laundry record" });
  }
});

// Approve or reject laundry
router.patch("/api/shared-laundry/:id/action", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { action, remarks } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "action must be 'approve' or 'reject'" });
    }

    if (action === 'reject' && !remarks) {
      return res.status(400).json({ error: "remarks are required when rejecting" });
    }

    const record = await db.query.sharedLaundry.findFirst({
      where: eq(sharedLaundry.id, id)
    });

    if (!record) {
      return res.status(404).json({ error: "Laundry record not found" });
    }

    if (record.actionRequiredBy !== userId) {
      return res.status(403).json({ error: "You are not authorized to take action on this record" });
    }

    const now = new Date();
    const revisionId = uuidv4();

    if (action === 'approve') {
      await db.update(sharedLaundry)
        .set({
          approvalStatus: 'approved',
          approvedAt: now,
          updatedAt: now
        })
        .where(eq(sharedLaundry.id, id));

      await db.insert(laundryRevisions).values({
        id: revisionId,
        laundryId: id,
        revisionNumber: (record.revisionCount || 0) + 1,
        action: 'approved',
        actionBy: userId,
        createdAt: now
      });

      await createNotification(record.submittedBy, record.submittedByRole as 'HOME' | 'STAFF',
        'laundry_approved', 'Laundry Approved',
        `Your laundry submission for ${record.date} has been approved.`,
        'laundry', id);

    } else {
      await db.update(sharedLaundry)
        .set({
          approvalStatus: 'rejected',
          rejectedAt: now,
          actionRequiredBy: record.submittedBy,
          updatedAt: now
        })
        .where(eq(sharedLaundry.id, id));

      await db.insert(laundryRevisions).values({
        id: revisionId,
        laundryId: id,
        revisionNumber: (record.revisionCount || 0) + 1,
        remarks,
        action: 'rejected',
        actionBy: userId,
        createdAt: now
      });

      await createNotification(record.submittedBy, record.submittedByRole as 'HOME' | 'STAFF',
        'laundry_rejected', 'Laundry Rejected',
        `Your laundry for ${record.date} was rejected: ${remarks}`,
        'laundry', id, { remarks });
    }

    res.json({ success: true, action });
  } catch (error) {
    console.error("Laundry action error:", error);
    res.status(500).json({ error: "Failed to process action" });
  }
});

// ============ NOTIFICATIONS API ============

// Get notifications for current user
router.get("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { mode, unreadOnly } = req.query;

    let conditions = [eq(notifications.userId, userId)];
    
    if (mode) {
      conditions.push(eq(notifications.userMode, mode as string));
    }

    const userNotifications = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: desc(notifications.createdAt),
      limit: 50
    });

    // Count unread
    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    res.json({ 
      notifications: userNotifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Mark notification as read
router.patch("/api/notifications/:id/read", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.post("/api/notifications/read-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { mode } = req.body;

    let conditions = [eq(notifications.userId, userId), eq(notifications.isRead, false)];
    if (mode) {
      conditions.push(eq(notifications.userMode, mode));
    }

    await db.update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(...conditions));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Helper function to create notifications
async function createNotification(
  userId: string,
  userMode: 'HOME' | 'STAFF',
  type: string,
  title: string,
  message: string,
  entityType?: string,
  entityId?: string,
  payload?: any
) {
  try {
    await db.insert(notifications).values({
      id: uuidv4(),
      userId,
      userMode,
      type,
      title,
      message,
      entityType: entityType || null,
      entityId: entityId || null,
      payload: payload ? JSON.stringify(payload) : null,
      actionRequired: ['attendance_submitted', 'laundry_submitted', 'connection_request'].includes(type),
      actionType: ['attendance_submitted', 'laundry_submitted'].includes(type) ? 'approve' : 
                  type === 'connection_request' ? 'accept' : 'view',
      isRead: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

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
