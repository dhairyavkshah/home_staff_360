import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import {
  emitNewMessage,
  emitNotification,
  emitNotificationRead,
  emitAllNotificationsRead,
  emitConnectionInvite,
  emitConnectionUpdated,
  emitConnectionRemoved
} from "./realtime";
import { 
  serverUsers, 
  devices, 
  collaborationLinks, 
  collaborationMessages, 
  adminUsers,
  adminRolesTable,
  adminInvitations,
  collaborationBindings,
  sharedAttendance,
  attendanceRevisions,
  sharedLaundry,
  laundryRevisions,
  notifications,
  collabConnectionInvites,
  collabConnections,
  collabChats,
  chatParticipants,
  chatMessages,
  householdShares,
  householdShareMembers,
  businessShares,
  businessShareMembers,
  advertisements,
  adImpressions,
  adSettings,
  insertServerUserSchema,
  insertDeviceSchema,
  insertCollaborationLinkSchema,
  insertCollaborationMessageSchema,
  insertAdminUserSchema,
  insertCollaborationBindingSchema,
  insertSharedAttendanceSchema,
  insertSharedLaundrySchema,
  insertNotificationSchema,
  insertAdvertisementSchema,
  insertAdImpressionSchema,
  insertAdSettingsSchema,
  adOrientations,
  approvalStatuses,
  userBackups,
  backupLogs,
  insertUserBackupSchema,
  insertBackupLogSchema,
  backupTypes,
  backupStatuses,
  backupLogActions,
  maintenanceWindows,
  maintenanceBroadcasts,
  maintenanceSessions,
  insertMaintenanceWindowSchema,
  insertMaintenanceBroadcastSchema,
  insertMaintenanceSessionSchema,
  maintenanceSeverities,
  maintenanceRecurrenceTypes,
  maintenanceStatuses,
  systemBackups,
  insertSystemBackupSchema,
  systemBackupStatuses,
  userInvitations
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { v4 as uuidv4 } from "uuid";
import libphonenumber from "google-libphonenumber";
const PhoneNumberUtil = libphonenumber.PhoneNumberUtil;
const PhoneNumberFormat = libphonenumber.PhoneNumberFormat;

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "homestaff360-secret-key";
const OTP_EXPIRY_MINUTES = 30;
const MAX_OTP_ATTEMPTS_PER_HOUR = 5;
const OTP_COOLDOWN_SECONDS = 60;

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const phoneUtil = PhoneNumberUtil.getInstance();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Validate and format phone number to E.164 format using libphonenumber
interface PhoneValidationResult {
  isValid: boolean;
  e164: string | null;
  error?: string;
}

function validateAndFormatPhone(phone: string, defaultRegion: string = 'IN'): PhoneValidationResult {
  try {
    // Clean the input
    let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
    
    // Try to parse with the country code if provided
    let parsedNumber;
    if (cleaned.startsWith('+')) {
      parsedNumber = phoneUtil.parse(cleaned);
    } else {
      // Try to parse with default region
      parsedNumber = phoneUtil.parse(cleaned, defaultRegion);
    }
    
    // Check if the number is valid
    if (!phoneUtil.isValidNumber(parsedNumber)) {
      const regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber) || defaultRegion;
      return {
        isValid: false,
        e164: null,
        error: `Invalid phone number format for ${regionCode}. Please include country code (e.g., +91 for India, +1 for US).`
      };
    }
    
    // Format to E.164
    const e164 = phoneUtil.format(parsedNumber, PhoneNumberFormat.E164);
    
    return {
      isValid: true,
      e164
    };
  } catch (error: any) {
    return {
      isValid: false,
      e164: null,
      error: "Invalid phone number. Please include country code (e.g., +919876543210 for India)."
    };
  }
}

function normalizePhoneWithCountryCode(phone: string): string {
  // Try to validate and format properly
  const result = validateAndFormatPhone(phone);
  if (result.isValid && result.e164) {
    return result.e164;
  }
  
  // Fallback to simple normalization for backwards compatibility
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

    // Validate and format phone number using libphonenumber
    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.isValid || !phoneValidation.e164) {
      return res.status(400).json({ 
        error: phoneValidation.error || "Invalid phone number format. Please include country code (e.g., +919876543210 for India, +12025551234 for US)."
      });
    }

    const normalizedPhone = phoneValidation.e164;

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

    let smsSent = false;
    if (process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_ACCOUNT_SID) {
      try {
        await twilioClient.messages.create({
          body: `Your OTP for phone number verification is: ${otp} (Note: Please keep it valid only for ${OTP_EXPIRY_MINUTES} minutes.)`,
          to: normalizedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
        smsSent = true;
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

    // In development mode, include OTP in response for testing when SMS fails
    const response: any = { 
      success: true, 
      message: smsSent ? "OTP sent successfully" : "OTP generated (check server logs in dev mode)",
      userId: user.id,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      remainingAttempts,
      cooldownSeconds: OTP_COOLDOWN_SECONDS
    };
    
    // Return OTP in dev mode when SMS fails (for testing)
    if (process.env.NODE_ENV === "development" && !smsSent) {
      response.devOtp = otp;
    }

    res.json(response);
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

    const isNewUser = !user.passwordHash;
    const needsOnboarding = !user.onboardingCompleted;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        userType: user.userType,
        isVerified: true,
        isNewUser,
        needsOnboarding,
        hasPassword: !!user.passwordHash
      }
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

// Set password for new users (after OTP verification)
router.post("/api/auth/set-password", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.update(serverUsers)
      .set({ 
        passwordHash,
        isNewUser: false
      })
      .where(eq(serverUsers.id, userId));

    res.json({ success: true, message: "Password set successfully" });
  } catch (error) {
    console.error("Set password error:", error);
    res.status(500).json({ error: "Failed to set password" });
  }
});

// Sign in with phone + password (for returning users)
router.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: "Phone and password are required" });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.status(404).json({ error: "User not found. Please sign up first." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ 
        error: "No password set. Please verify with OTP first.",
        needsOtp: true 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    await db.update(serverUsers)
      .set({ 
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
        isVerified: user.isVerified,
        needsOnboarding: !user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Check if phone exists and has password
router.post("/api/auth/check-phone", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.json({ 
        exists: false,
        hasPassword: false,
        message: "New user - OTP verification required"
      });
    }

    return res.json({
      exists: true,
      hasPassword: !!user.passwordHash,
      isVerified: user.isVerified,
      displayName: user.displayName,
      message: user.passwordHash 
        ? "Existing user - can login with password" 
        : "User exists but needs to set password"
    });
  } catch (error) {
    console.error("Check phone error:", error);
    res.status(500).json({ error: "Failed to check phone" });
  }
});

// Logout endpoint - invalidates session on server side
router.post("/api/auth/logout", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Clear any server-side session data if needed
    // For JWT-based auth, the client simply needs to discard the token
    // This endpoint exists for any future server-side session invalidation
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, error: "Failed to logout" });
  }
});

const PASSWORD_RESET_OTP_EXPIRY_MINUTES = 10;

router.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: "Valid phone number is required" });
    }

    // Validate and format phone number using libphonenumber
    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.isValid || !phoneValidation.e164) {
      return res.status(400).json({ 
        error: phoneValidation.error || "Invalid phone number format. Please include country code."
      });
    }

    const normalizedPhone = phoneValidation.e164;

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.json({ 
        success: true, 
        message: "If an account exists with this phone number, you will receive an OTP shortly",
        cooldownSeconds: OTP_COOLDOWN_SECONDS
      });
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
    const otpExpiresAt = new Date(now.getTime() + PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000);
    
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
          body: `Your password reset code is: ${otp} (Valid for ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes only)`,
          to: normalizedPhone,
          from: process.env.TWILIO_PHONE_NUMBER
        });
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        if (process.env.NODE_ENV === "development") {
          console.log("DEV MODE - Password Reset OTP:", otp);
        }
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log("DEV MODE - Password Reset OTP:", otp);
    }

    res.json({ 
      success: true, 
      message: "If an account exists with this phone number, you will receive an OTP shortly",
      cooldownSeconds: OTP_COOLDOWN_SECONDS
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
});

router.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ error: "Phone, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await findUserByPhone(phone);

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: "Reset code has expired" });
    }

    const isValidOTP = await bcrypt.compare(otp, user.otpHash);
    
    if (!isValidOTP) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.update(serverUsers)
      .set({ 
        passwordHash,
        otpHash: null,
        otpExpiresAt: null,
        isVerified: true,
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
      message: "Password reset successfully",
      token,
      user: {
        id: user.id,
        phone: user.phone,
        displayName: user.displayName,
        isVerified: true,
        needsOnboarding: !user.onboardingCompleted
      }
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Mark onboarding as completed
router.post("/api/user/complete-onboarding", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    await db.update(serverUsers)
      .set({ 
        onboardingCompleted: true,
        isNewUser: false
      })
      .where(eq(serverUsers.id, userId));

    res.json({ success: true, message: "Onboarding completed" });
  } catch (error) {
    console.error("Complete onboarding error:", error);
    res.status(500).json({ error: "Failed to complete onboarding" });
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
      isNewUser: user.isNewUser,
      onboardingCompleted: user.onboardingCompleted,
      hasPassword: !!user.passwordHash,
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

// Change password
router.put("/api/user/password", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If user has a password, verify current password
    if (user.passwordHash) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.update(serverUsers)
      .set({ passwordHash: newPasswordHash })
      .where(eq(serverUsers.id, userId));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Verify password (for confirming dangerous actions like clearing data)
router.post("/api/user/verify-password", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "No password set for this account" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Incorrect password", success: false });
    }

    res.json({ success: true, message: "Password verified" });
  } catch (error) {
    console.error("Verify password error:", error);
    res.status(500).json({ error: "Failed to verify password" });
  }
});

// Simple in-memory rate limiter for phone change requests
const phoneChangeRateLimiter = new Map<string, { count: number; resetAt: number }>();

// In-memory store for pending phone change OTPs (userId -> { newPhone, otpHash, expiresAt, attempts })
interface PendingPhoneChange {
  newPhone: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
}
const pendingPhoneChanges = new Map<string, PendingPhoneChange>();

function checkPhoneChangeRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = phoneChangeRateLimiter.get(userId);
  
  if (!limit || limit.resetAt < now) {
    phoneChangeRateLimiter.set(userId, { count: 1, resetAt: now + 3600000 }); // 1 hour window
    return true;
  }
  
  if (limit.count >= 3) { // Max 3 phone change requests per hour
    return false;
  }
  
  limit.count++;
  return true;
}

// Request phone number change (sends OTP to new phone)
router.post("/api/user/phone/request-change", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { newPhone, currentPassword } = req.body;

    // Rate limiting check
    if (!checkPhoneChangeRateLimit(userId)) {
      return res.status(429).json({ error: "Too many phone change requests. Please try again later." });
    }

    if (!newPhone || newPhone.length < 10) {
      return res.status(400).json({ error: "Valid phone number is required" });
    }

    const normalizedNewPhone = normalizePhoneWithCountryCode(newPhone);

    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Require password verification for phone change (always require for security)
    if (!currentPassword) {
      return res.status(400).json({ error: "Password verification is required" });
    }
    
    if (user.passwordHash) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Verification failed" });
      }
    }

    // Check if new phone is already in use
    const existingUser = await findUserByPhone(normalizedNewPhone);
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: "This phone number is already registered" });
    }

    // Generate OTP and store in memory
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending phone change
    pendingPhoneChanges.set(userId, {
      newPhone: normalizedNewPhone,
      otpHash,
      expiresAt,
      attempts: 0
    });

    // Send OTP via Twilio
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your Home Staff 360 phone change verification code is: ${otp}. This code will expire in 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: normalizedNewPhone
        });
      } catch (twilioError: any) {
        console.error("Twilio error:", twilioError);
        // In dev mode, log OTP even if Twilio fails
        if (process.env.NODE_ENV === "development") {
          console.log(`[DEV] Phone change OTP for ${normalizedNewPhone}: ${otp}`);
        }
      }
    } else if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Phone change OTP for ${normalizedNewPhone}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: "Verification code sent to new phone number",
      expiresIn: 600
    });
  } catch (error) {
    console.error("Request phone change error:", error);
    res.status(500).json({ error: "Failed to request phone change" });
  }
});

// Confirm phone number change with OTP
router.post("/api/user/phone/confirm", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { newPhone, otp } = req.body;

    if (!newPhone || !otp) {
      return res.status(400).json({ error: "Phone number and OTP are required" });
    }

    const normalizedNewPhone = normalizePhoneWithCountryCode(newPhone);

    // Get pending phone change from memory
    const pending = pendingPhoneChanges.get(userId);

    if (!pending) {
      return res.status(400).json({ error: "No verification code found. Please request a new one." });
    }

    if (pending.newPhone !== normalizedNewPhone) {
      return res.status(400).json({ error: "Phone number mismatch. Please request a new verification code." });
    }

    if (pending.expiresAt < new Date()) {
      pendingPhoneChanges.delete(userId);
      return res.status(400).json({ error: "Verification code has expired" });
    }

    if (pending.attempts >= 5) {
      pendingPhoneChanges.delete(userId);
      return res.status(429).json({ error: "Too many failed attempts. Please request a new code." });
    }

    const isValidOTP = await bcrypt.compare(otp, pending.otpHash);
    if (!isValidOTP) {
      pending.attempts++;
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // OTP verified, remove from pending
    pendingPhoneChanges.delete(userId);

    // Get user for notifications
    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const oldPhone = user.phone;

    // Wrap all mutations in a transaction for atomicity
    await db.transaction(async (tx) => {
      // Update user's phone number
      await tx.update(serverUsers)
        .set({ phone: normalizedNewPhone })
        .where(eq(serverUsers.id, userId));

      // Create notification for user about phone change
      await tx.insert(notifications).values({
        id: uuidv4(),
        userId,
        userMode: user.userType || 'HOME',
        category: 'system',
        type: 'system',
        title: 'Phone Number Changed',
        message: `Your phone number has been changed from ${oldPhone} to ${normalizedNewPhone}`,
        payload: JSON.stringify({ oldPhone, newPhone: normalizedNewPhone }),
        createdAt: new Date()
      });

      // Notify connections about the phone change
      const userConnections = await tx.query.collabConnections.findMany({
        where: or(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, userId)
        )
      });

      for (const connection of userConnections) {
        const otherUserId = connection.userAId === userId ? connection.userBId : connection.userAId;
        await tx.insert(notifications).values({
          id: uuidv4(),
          userId: otherUserId,
          userMode: 'HOME',
          category: 'system',
          type: 'system',
          title: 'Contact Updated',
          message: `${user.displayName || 'A contact'} has updated their phone number`,
          payload: JSON.stringify({ connectionId: connection.id, userId }),
          createdAt: new Date()
        });
      }
    });

    // Generate new JWT with updated phone (after successful transaction)
    const newToken = jwt.sign(
      { userId: user.id, phone: normalizedNewPhone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      message: "Phone number updated successfully",
      token: newToken,
      phone: normalizedNewPhone
    });
  } catch (error) {
    console.error("Confirm phone change error:", error);
    res.status(500).json({ error: "Failed to update phone number" });
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
      { adminId: admin.id, email: admin.email, roleId: admin.roleId, isAdmin: true },
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
        roleId: admin.roleId
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

    console.log("Notifications API called:", { userId, mode, unreadOnly });

    let conditions = [eq(notifications.userId, userId)];
    
    if (mode) {
      conditions.push(eq(notifications.userMode, mode as string));
    }

    const userNotifications = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: desc(notifications.createdAt),
      limit: 50
    });

    console.log(`Found ${userNotifications.length} notifications for user ${userId} with mode ${mode}`);

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

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (!isNaN(numericUserId)) {
      emitNotificationRead(numericUserId, typeof id === 'string' ? parseInt(id, 10) : id);
    }

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

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (!isNaN(numericUserId)) {
      emitAllNotificationsRead(numericUserId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

// Delete a single notification
router.delete("/api/notifications/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    await db.delete(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Clear all notifications
router.delete("/api/notifications", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const mode = req.query.mode as string | undefined;

    let conditions = [eq(notifications.userId, userId)];
    if (mode) {
      conditions.push(eq(notifications.userMode, mode));
    }

    await db.delete(notifications)
      .where(and(...conditions));

    res.json({ success: true });
  } catch (error) {
    console.error("Clear all notifications error:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
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
  payload?: any,
  category?: string
) {
  try {
    const derivedCategory = category || 
      (type.includes('connection') ? 'collaboration' :
       type.includes('attendance') ? 'attendance' :
       type.includes('laundry') ? 'laundry' : 'system');
    
    const notificationId = uuidv4();
    const createdAt = new Date();
    
    await db.insert(notifications).values({
      id: notificationId,
      userId,
      userMode,
      category: derivedCategory,
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
      createdAt
    });

    // Emit real-time notification
    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (!isNaN(numericUserId)) {
      emitNotification(numericUserId, {
        id: notificationId,
        userId,
        userMode,
        category: derivedCategory,
        type,
        title,
        message,
        entityType: entityType || null,
        entityId: entityId || null,
        payload: payload ? JSON.stringify(payload) : null,
        isRead: false,
        createdAt
      });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

// ============ CONNECTIONS API ============

// Rate limiting for phone search (simple in-memory)
const phoneSearchRateLimit = new Map<string, { count: number; resetAt: number }>();
const PHONE_SEARCH_LIMIT = 10;
const PHONE_SEARCH_WINDOW = 60 * 1000; // 1 minute

function checkPhoneSearchRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = phoneSearchRateLimit.get(userId);
  
  if (!limit || now > limit.resetAt) {
    phoneSearchRateLimit.set(userId, { count: 1, resetAt: now + PHONE_SEARCH_WINDOW });
    return true;
  }
  
  if (limit.count >= PHONE_SEARCH_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Search for user by phone number
router.get("/api/connections/search", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { phone, mode } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: "Phone number is required" });
    }

    if (!checkPhoneSearchRateLimit(userId)) {
      return res.status(429).json({ error: "Too many search requests. Please try again later." });
    }

    const normalizedPhone = normalizePhoneWithCountryCode(phone);
    const variants = generatePhoneVariants(phone);

    let foundUser = null;
    for (const variant of variants) {
      foundUser = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.phone, variant)
      });
      if (foundUser) break;
    }

    if (!foundUser || foundUser.id === userId) {
      return res.json({ user: null });
    }

    // Check if already connected
    const existingConnection = await db.query.collabConnections.findFirst({
      where: or(
        and(eq(collabConnections.userAId, userId), eq(collabConnections.userBId, foundUser.id)),
        and(eq(collabConnections.userAId, foundUser.id), eq(collabConnections.userBId, userId))
      )
    });

    // Check for pending invite
    const pendingInvite = await db.query.collabConnectionInvites.findFirst({
      where: and(
        eq(collabConnectionInvites.senderId, userId),
        eq(collabConnectionInvites.targetUserId, foundUser.id),
        eq(collabConnectionInvites.status, 'pending')
      )
    });

    res.json({
      user: {
        id: foundUser.id,
        displayName: foundUser.displayName,
        phone: foundUser.phone.slice(0, -4) + '****', // Mask last 4 digits
        isVerified: foundUser.isVerified
      },
      alreadyConnected: !!existingConnection,
      pendingInvite: !!pendingInvite
    });
  } catch (error) {
    console.error("Search user error:", error);
    res.status(500).json({ error: "Failed to search for user" });
  }
});

// Get pending connection invites (received)
router.get("/api/connections/invites/received", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const invites = await db.query.collabConnectionInvites.findMany({
      where: and(
        eq(collabConnectionInvites.targetUserId, userId),
        eq(collabConnectionInvites.status, 'pending')
      ),
      orderBy: desc(collabConnectionInvites.createdAt)
    });

    // Enrich with sender info
    const enrichedInvites = await Promise.all(invites.map(async (invite) => {
      const sender = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, invite.senderId)
      });
      return {
        ...invite,
        senderName: sender?.displayName,
        senderPhone: sender?.phone ? sender.phone.slice(0, -4) + '****' : undefined
      };
    }));

    res.json({ invites: enrichedInvites });
  } catch (error) {
    console.error("Get received invites error:", error);
    res.status(500).json({ error: "Failed to get invites" });
  }
});

// Get pending connection invites (sent)
router.get("/api/connections/invites/sent", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const invites = await db.query.collabConnectionInvites.findMany({
      where: and(
        eq(collabConnectionInvites.senderId, userId),
        eq(collabConnectionInvites.status, 'pending')
      ),
      orderBy: desc(collabConnectionInvites.createdAt)
    });

    // Enrich with target info
    const enrichedInvites = await Promise.all(invites.map(async (invite) => {
      const target = invite.targetUserId ? await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, invite.targetUserId)
      }) : null;
      return {
        ...invite,
        targetName: target?.displayName,
        targetPhoneMasked: invite.targetPhone ? invite.targetPhone.slice(0, -4) + '****' : undefined
      };
    }));

    res.json({ invites: enrichedInvites });
  } catch (error) {
    console.error("Get sent invites error:", error);
    res.status(500).json({ error: "Failed to get invites" });
  }
});

// Accept connection invite
router.post("/api/connections/invites/:id/accept", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { receiverMode } = req.body;

    const invite = await db.query.collabConnectionInvites.findFirst({
      where: and(
        eq(collabConnectionInvites.id, id),
        eq(collabConnectionInvites.targetUserId, userId),
        eq(collabConnectionInvites.status, 'pending')
      )
    });

    if (!invite) {
      return res.status(404).json({ error: "Invite not found or already processed" });
    }

    const now = new Date();

    // Update invite status
    await db.update(collabConnectionInvites)
      .set({ status: 'accepted', respondedAt: now })
      .where(eq(collabConnectionInvites.id, id));

    // Create connection
    const connectionId = uuidv4();
    await db.insert(collabConnections).values({
      id: connectionId,
      userAId: invite.senderId,
      userAMode: invite.senderMode,
      userBId: userId,
      userBMode: receiverMode || 'HOME',
      status: 'accepted',
      initiatedBy: invite.senderId,
      createdAt: now,
      updatedAt: now
    });

    // Create direct chat for the connection
    const chatId = uuidv4();
    await db.insert(collabChats).values({
      id: chatId,
      type: 'direct',
      connectionId,
      createdAt: now,
      updatedAt: now
    });

    // Add both users as chat participants
    const currentUser = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    await db.insert(chatParticipants).values([
      {
        id: uuidv4(),
        chatId,
        userId: invite.senderId,
        userMode: invite.senderMode,
        role: 'member',
        joinedAt: now
      },
      {
        id: uuidv4(),
        chatId,
        userId,
        userMode: receiverMode || 'HOME',
        role: 'member',
        joinedAt: now
      }
    ]);

    // Notify sender
    await createNotification(
      invite.senderId,
      invite.senderMode as 'HOME' | 'STAFF',
      'connection_accepted',
      'Connection Accepted',
      `${currentUser?.displayName || 'Someone'} accepted your connection request.`,
      'connection',
      connectionId
    );

    // Emit real-time connection update event
    const senderNumId = typeof invite.senderId === 'string' ? parseInt(invite.senderId, 10) : invite.senderId;
    const acceptorNumId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (!isNaN(senderNumId) && !isNaN(acceptorNumId)) {
      emitConnectionUpdated(senderNumId, acceptorNumId, {
        id: connectionId,
        status: 'accepted',
        chatId
      });
    }

    res.json({ success: true, connectionId, chatId });
  } catch (error) {
    console.error("Accept invite error:", error);
    res.status(500).json({ error: "Failed to accept invite" });
  }
});

// Reject connection invite
router.post("/api/connections/invites/:id/reject", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const invite = await db.query.collabConnectionInvites.findFirst({
      where: and(
        eq(collabConnectionInvites.id, id),
        eq(collabConnectionInvites.targetUserId, userId),
        eq(collabConnectionInvites.status, 'pending')
      )
    });

    if (!invite) {
      return res.status(404).json({ error: "Invite not found or already processed" });
    }

    await db.update(collabConnectionInvites)
      .set({ status: 'blocked', respondedAt: new Date() })
      .where(eq(collabConnectionInvites.id, id));

    // Optionally notify sender
    await createNotification(
      invite.senderId,
      invite.senderMode as 'HOME' | 'STAFF',
      'connection_rejected',
      'Connection Request Declined',
      'Your connection request was declined.',
      'connection',
      id
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Reject invite error:", error);
    res.status(500).json({ error: "Failed to reject invite" });
  }
});

// Get all connections
router.get("/api/connections", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const connections = await db.query.collabConnections.findMany({
      where: or(
        eq(collabConnections.userAId, userId),
        eq(collabConnections.userBId, userId)
      ),
      orderBy: desc(collabConnections.createdAt)
    });

    // Enrich with user info and chat ID
    const enrichedConnections = await Promise.all(connections.map(async (conn) => {
      const otherUserId = conn.userAId === userId ? conn.userBId : conn.userAId;
      const otherUserMode = conn.userAId === userId ? conn.userBMode : conn.userAMode;
      
      const otherUser = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, otherUserId)
      });

      // Get chat for this connection
      const chat = await db.query.collabChats.findFirst({
        where: eq(collabChats.connectionId, conn.id)
      });

      return {
        id: conn.id,
        otherUser: {
          id: otherUserId,
          displayName: otherUser?.displayName,
          phone: otherUser?.phone ? otherUser.phone.slice(0, -4) + '****' : undefined,
          mode: otherUserMode
        },
        nickname: conn.nickname,
        chatId: chat?.id,
        lastMessageAt: chat?.lastMessageAt,
        lastMessagePreview: chat?.lastMessagePreview,
        status: conn.status,
        createdAt: conn.createdAt
      };
    }));

    res.json({ connections: enrichedConnections });
  } catch (error) {
    console.error("Get connections error:", error);
    res.status(500).json({ error: "Failed to get connections" });
  }
});

// Remove connection
router.delete("/api/connections/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const connection = await db.query.collabConnections.findFirst({
      where: and(
        eq(collabConnections.id, id),
        or(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, userId)
        )
      )
    });

    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    // Get associated chat
    const chat = await db.query.collabChats.findFirst({
      where: eq(collabChats.connectionId, id)
    });

    if (chat) {
      // Delete chat participants
      await db.delete(chatParticipants).where(eq(chatParticipants.chatId, chat.id));
      // Delete messages
      await db.delete(chatMessages).where(eq(chatMessages.chatId, chat.id));
      // Delete chat
      await db.delete(collabChats).where(eq(collabChats.id, chat.id));
    }

    // Get user IDs before deleting
    const userAId = typeof connection.userAId === 'string' ? parseInt(connection.userAId, 10) : connection.userAId;
    const userBId = typeof connection.userBId === 'string' ? parseInt(connection.userBId, 10) : connection.userBId;

    // Delete connection
    await db.delete(collabConnections).where(eq(collabConnections.id, id));

    // Emit real-time connection removed event
    if (!isNaN(userAId) && !isNaN(userBId)) {
      const connectionNumId = typeof id === 'string' ? parseInt(id, 10) : id;
      emitConnectionRemoved(userAId, userBId, connectionNumId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(500).json({ error: "Failed to remove connection" });
  }
});

// ============ MESSAGING API ============

// Get all chats for current user
router.get("/api/chats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    console.log("Chats API called for user:", userId);

    // Get all chats where user is a participant
    const participations = await db.query.chatParticipants.findMany({
      where: and(
        eq(chatParticipants.userId, userId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });
    console.log("Found participations:", participations.length);

    const chatIds = participations.map(p => p.chatId);
    
    if (chatIds.length === 0) {
      return res.json({ chats: [] });
    }

    // Get chats with details
    const chats = await Promise.all(chatIds.map(async (chatId) => {
      const chat = await db.query.collabChats.findFirst({
        where: eq(collabChats.id, chatId)
      });
      
      if (!chat) return null;

      // Get other participants
      const allParticipants = await db.query.chatParticipants.findMany({
        where: eq(chatParticipants.chatId, chatId)
      });

      const otherParticipants = await Promise.all(
        allParticipants
          .filter(p => p.userId !== userId)
          .map(async (p) => {
            const user = await db.query.serverUsers.findFirst({
              where: eq(serverUsers.id, p.userId)
            });
            return {
              userId: p.userId,
              displayName: user?.displayName,
              mode: p.userMode
            };
          })
      );

      // Get unread count
      const myParticipation = participations.find(p => p.chatId === chatId);
      let unreadCount = 0;
      if (myParticipation?.lastReadAt) {
        const unreadMessages = await db.query.chatMessages.findMany({
          where: and(
            eq(chatMessages.chatId, chatId),
            sql`${chatMessages.createdAt} > ${myParticipation.lastReadAt}`,
            sql`${chatMessages.senderId} != ${userId}`
          )
        });
        unreadCount = unreadMessages.length;
      } else {
        const allMessages = await db.query.chatMessages.findMany({
          where: and(
            eq(chatMessages.chatId, chatId),
            sql`${chatMessages.senderId} != ${userId}`
          )
        });
        unreadCount = allMessages.length;
      }

      return {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        connectionId: chat.connectionId,
        lastMessageAt: chat.lastMessageAt,
        lastMessagePreview: chat.lastMessagePreview,
        participants: otherParticipants,
        unreadCount,
        isMuted: myParticipation?.isMuted || false
      };
    }));

    // Filter nulls and sort by last message
    const validChats = chats.filter(c => c !== null);
    validChats.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    res.json({ chats: validChats });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ error: "Failed to get chats" });
  }
});

// Get single chat info
router.get("/api/chats/:chatId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { chatId } = req.params;

    // Verify user is a participant
    const participation = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });

    if (!participation) {
      return res.status(403).json({ error: "Not a participant of this chat" });
    }

    const chat = await db.query.collabChats.findFirst({
      where: eq(collabChats.id, chatId)
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Get other participants
    const allParticipants = await db.query.chatParticipants.findMany({
      where: eq(chatParticipants.chatId, chatId)
    });

    const otherParticipants = await Promise.all(
      allParticipants
        .filter(p => p.userId !== userId)
        .map(async (p) => {
          const user = await db.query.serverUsers.findFirst({
            where: eq(serverUsers.id, p.userId)
          });
          return {
            userId: p.userId,
            displayName: user?.displayName,
            mode: p.userMode
          };
        })
    );

    res.json({
      chat: {
        id: chat.id,
        type: chat.type,
        name: chat.name,
        connectionId: chat.connectionId,
        lastMessageAt: chat.lastMessageAt,
        lastMessagePreview: chat.lastMessagePreview,
        participants: otherParticipants,
        isMuted: participation.isMuted || false
      }
    });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ error: "Failed to get chat" });
  }
});

// Get messages for a chat
router.get("/api/chats/:chatId/messages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { chatId } = req.params;
    const { before, limit = '50' } = req.query;

    // Verify user is a participant
    const participation = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });

    if (!participation) {
      return res.status(403).json({ error: "Not a participant of this chat" });
    }

    // Get messages
    let conditions = [eq(chatMessages.chatId, chatId)];
    if (before) {
      conditions.push(sql`${chatMessages.createdAt} < ${new Date(before as string)}`);
    }

    const messages = await db.query.chatMessages.findMany({
      where: and(...conditions),
      orderBy: desc(chatMessages.createdAt),
      limit: parseInt(limit as string)
    });

    // Enrich with sender info
    const enrichedMessages = await Promise.all(messages.map(async (msg) => {
      const sender = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, msg.senderId)
      });
      return {
        ...msg,
        senderName: sender?.displayName,
        isOwn: msg.senderId === userId
      };
    }));

    // Reverse to show oldest first in the response
    enrichedMessages.reverse();

    res.json({ messages: enrichedMessages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Send a message
router.post("/api/chats/:chatId/messages", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { chatId } = req.params;
    const { content, senderMode, clientMessageId, replyToId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Verify user is a participant
    const participation = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });

    if (!participation) {
      return res.status(403).json({ error: "Not a participant of this chat" });
    }

    // Check for duplicate (idempotency)
    if (clientMessageId) {
      const existing = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.clientMessageId, clientMessageId)
      });
      if (existing) {
        return res.json({ success: true, messageId: existing.id, duplicate: true });
      }
    }

    const now = new Date();
    const messageId = uuidv4();

    await db.insert(chatMessages).values({
      id: messageId,
      chatId,
      senderId: userId,
      senderMode: senderMode || participation.userMode,
      content: content.trim(),
      status: 'sent',
      clientMessageId: clientMessageId || null,
      replyToId: replyToId || null,
      createdAt: now
    });

    // Update chat last message
    const preview = content.length > 200 ? content.substring(0, 197) + '...' : content;
    await db.update(collabChats)
      .set({
        lastMessageAt: now,
        lastMessagePreview: preview,
        updatedAt: now
      })
      .where(eq(collabChats.id, chatId));

    // Create notifications for other participants
    const otherParticipants = await db.query.chatParticipants.findMany({
      where: and(
        eq(chatParticipants.chatId, chatId),
        sql`${chatParticipants.userId} != ${userId}`,
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });

    const sender = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    for (const participant of otherParticipants) {
      if (!participant.isMuted) {
        await createNotification(
          participant.userId,
          participant.userMode as 'HOME' | 'STAFF',
          'chat_message',
          `Message from ${sender?.displayName || 'Someone'}`,
          preview,
          'chat',
          chatId,
          { messageId, senderId: userId }
        );
      }
    }

    // Emit real-time message event
    const allParticipantIds = await db.query.chatParticipants.findMany({
      where: and(
        eq(chatParticipants.chatId, chatId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });
    const participantUserIds = allParticipantIds.map(p => {
      const id = typeof p.userId === 'string' ? parseInt(p.userId, 10) : p.userId;
      return isNaN(id) ? 0 : id;
    }).filter(id => id > 0);

    emitNewMessage(
      parseInt(chatId, 10),
      {
        id: messageId,
        chatId,
        senderId: userId,
        senderName: sender?.displayName,
        content: content.trim(),
        createdAt: now,
        isOwn: false
      },
      participantUserIds
    );

    res.json({ success: true, messageId });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Mark messages as read
router.post("/api/chats/:chatId/read", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { chatId } = req.params;
    const { lastMessageId } = req.body;

    const now = new Date();

    await db.update(chatParticipants)
      .set({
        lastReadAt: now,
        lastReadMessageId: lastMessageId || null
      })
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// Mute/unmute chat
router.patch("/api/chats/:chatId/mute", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { chatId } = req.params;
    const { muted } = req.body;

    await db.update(chatParticipants)
      .set({ isMuted: muted })
      .where(and(
        eq(chatParticipants.chatId, chatId),
        eq(chatParticipants.userId, userId)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error("Mute chat error:", error);
    res.status(500).json({ error: "Failed to update mute setting" });
  }
});

// Get chat by connection ID (useful for opening chat from connections list)
router.get("/api/chats/by-connection/:connectionId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { connectionId } = req.params;

    // Verify user is part of this connection
    const connection = await db.query.collabConnections.findFirst({
      where: and(
        eq(collabConnections.id, connectionId),
        or(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, userId)
        )
      )
    });

    if (!connection) {
      return res.status(403).json({ error: "Not part of this connection" });
    }

    const chat = await db.query.collabChats.findFirst({
      where: eq(collabChats.connectionId, connectionId)
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found for this connection" });
    }

    res.json({ chat });
  } catch (error) {
    console.error("Get chat by connection error:", error);
    res.status(500).json({ error: "Failed to get chat" });
  }
});

// ============ SHARED SPACES API (Household/Business) ============

// Get all shared spaces for current user
router.get("/api/shared-spaces", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { type } = req.query; // 'household' or 'business'

    const results: any[] = [];

    if (!type || type === 'household') {
      // Get households I own
      const ownedHouseholds = await db.query.householdShares.findMany({
        where: eq(householdShares.ownerId, userId)
      });

      for (const h of ownedHouseholds) {
        const members = await db.query.householdShareMembers.findMany({
          where: eq(householdShareMembers.shareId, h.id)
        });
        
        const enrichedMembers = await Promise.all(members.map(async (m) => {
          const user = await db.query.serverUsers.findFirst({
            where: eq(serverUsers.id, m.userId)
          });
          return {
            ...m,
            displayName: user?.displayName,
            phone: user?.phone ? user.phone.slice(0, -4) + '****' : undefined
          };
        }));

        results.push({
          id: h.id,
          type: 'household',
          name: h.householdName,
          localId: h.localHouseholdId,
          ownerId: h.ownerId,
          isOwner: true,
          role: 'admin',
          memberCount: members.filter(m => m.status === 'accepted').length + 1,
          members: enrichedMembers,
          createdAt: h.createdAt
        });
      }

      // Get households I'm a member of
      const memberShips = await db.query.householdShareMembers.findMany({
        where: and(
          eq(householdShareMembers.userId, userId),
          eq(householdShareMembers.status, 'accepted')
        )
      });

      for (const m of memberShips) {
        const h = await db.query.householdShares.findFirst({
          where: eq(householdShares.id, m.shareId)
        });
        if (h && h.ownerId !== userId) {
          const owner = await db.query.serverUsers.findFirst({
            where: eq(serverUsers.id, h.ownerId)
          });
          results.push({
            id: h.id,
            type: 'household',
            name: h.householdName,
            localId: h.localHouseholdId,
            ownerId: h.ownerId,
            ownerName: owner?.displayName,
            isOwner: false,
            role: m.role,
            createdAt: h.createdAt
          });
        }
      }
    }

    if (!type || type === 'business') {
      // Get businesses I own
      const ownedBusinesses = await db.query.businessShares.findMany({
        where: eq(businessShares.ownerId, userId)
      });

      for (const b of ownedBusinesses) {
        const members = await db.query.businessShareMembers.findMany({
          where: eq(businessShareMembers.shareId, b.id)
        });
        
        const enrichedMembers = await Promise.all(members.map(async (m) => {
          const user = await db.query.serverUsers.findFirst({
            where: eq(serverUsers.id, m.userId)
          });
          return {
            ...m,
            displayName: user?.displayName,
            phone: user?.phone ? user.phone.slice(0, -4) + '****' : undefined
          };
        }));

        results.push({
          id: b.id,
          type: 'business',
          name: b.businessName,
          localId: b.localBusinessId,
          ownerId: b.ownerId,
          isOwner: true,
          role: 'admin',
          memberCount: members.filter(m => m.status === 'accepted').length + 1,
          members: enrichedMembers,
          createdAt: b.createdAt
        });
      }

      // Get businesses I'm a member of
      const businessMemberShips = await db.query.businessShareMembers.findMany({
        where: and(
          eq(businessShareMembers.userId, userId),
          eq(businessShareMembers.status, 'accepted')
        )
      });

      for (const m of businessMemberShips) {
        const b = await db.query.businessShares.findFirst({
          where: eq(businessShares.id, m.shareId)
        });
        if (b && b.ownerId !== userId) {
          const owner = await db.query.serverUsers.findFirst({
            where: eq(serverUsers.id, b.ownerId)
          });
          results.push({
            id: b.id,
            type: 'business',
            name: b.businessName,
            localId: b.localBusinessId,
            ownerId: b.ownerId,
            ownerName: owner?.displayName,
            isOwner: false,
            role: m.role,
            createdAt: b.createdAt
          });
        }
      }
    }

    res.json({ spaces: results });
  } catch (error) {
    console.error("Get shared spaces error:", error);
    res.status(500).json({ error: "Failed to get shared spaces" });
  }
});

// Create a shared space
router.post("/api/shared-spaces", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { type, name, localId } = req.body;

    if (!type || !name || !localId) {
      return res.status(400).json({ error: "Type, name, and local ID are required" });
    }

    const now = new Date();
    const id = uuidv4();

    if (type === 'household') {
      await db.insert(householdShares).values({
        id,
        ownerId: userId,
        localHouseholdId: localId,
        householdName: name,
        createdAt: now,
        updatedAt: now
      });
    } else if (type === 'business') {
      await db.insert(businessShares).values({
        id,
        ownerId: userId,
        localBusinessId: localId,
        businessName: name,
        createdAt: now,
        updatedAt: now
      });
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'household' or 'business'" });
    }

    res.json({ success: true, id, type });
  } catch (error) {
    console.error("Create shared space error:", error);
    res.status(500).json({ error: "Failed to create shared space" });
  }
});

// Invite someone to a shared space
router.post("/api/shared-spaces/:id/invite", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { type, targetUserId, role = 'viewer' } = req.body;

    if (!type || !targetUserId) {
      return res.status(400).json({ error: "Type and target user ID are required" });
    }

    const now = new Date();

    if (type === 'household') {
      const share = await db.query.householdShares.findFirst({
        where: and(eq(householdShares.id, id), eq(householdShares.ownerId, userId))
      });
      
      if (!share) {
        return res.status(403).json({ error: "You don't have permission to invite members" });
      }

      // Check if already invited
      const existing = await db.query.householdShareMembers.findFirst({
        where: and(
          eq(householdShareMembers.shareId, id),
          eq(householdShareMembers.userId, targetUserId)
        )
      });

      if (existing) {
        return res.status(400).json({ error: "User already invited or is a member" });
      }

      const memberId = uuidv4();
      await db.insert(householdShareMembers).values({
        id: memberId,
        shareId: id,
        userId: targetUserId,
        role,
        status: 'pending',
        invitedAt: now,
        createdAt: now
      });

      // Notify target
      const inviter = await db.query.serverUsers.findFirst({ where: eq(serverUsers.id, userId) });
      await createNotification(
        targetUserId, 'HOME', 'share_invitation',
        'Household Invitation',
        `${inviter?.displayName || 'Someone'} invited you to join their household "${share.householdName}"`,
        'household', id
      );

      res.json({ success: true, memberId });
    } else if (type === 'business') {
      const share = await db.query.businessShares.findFirst({
        where: and(eq(businessShares.id, id), eq(businessShares.ownerId, userId))
      });
      
      if (!share) {
        return res.status(403).json({ error: "You don't have permission to invite members" });
      }

      const existing = await db.query.businessShareMembers.findFirst({
        where: and(
          eq(businessShareMembers.shareId, id),
          eq(businessShareMembers.userId, targetUserId)
        )
      });

      if (existing) {
        return res.status(400).json({ error: "User already invited or is a member" });
      }

      const memberId = uuidv4();
      await db.insert(businessShareMembers).values({
        id: memberId,
        shareId: id,
        userId: targetUserId,
        role,
        status: 'pending',
        invitedAt: now,
        createdAt: now
      });

      const inviter = await db.query.serverUsers.findFirst({ where: eq(serverUsers.id, userId) });
      await createNotification(
        targetUserId, 'STAFF', 'share_invitation',
        'Business Invitation',
        `${inviter?.displayName || 'Someone'} invited you to join their business "${share.businessName}"`,
        'business', id
      );

      res.json({ success: true, memberId });
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
  } catch (error) {
    console.error("Invite to shared space error:", error);
    res.status(500).json({ error: "Failed to invite member" });
  }
});

// Get pending share invitations for current user
router.get("/api/shared-spaces/invitations", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const results: any[] = [];

    // Household invitations
    const householdInvites = await db.query.householdShareMembers.findMany({
      where: and(
        eq(householdShareMembers.userId, userId),
        eq(householdShareMembers.status, 'pending')
      )
    });

    for (const inv of householdInvites) {
      const share = await db.query.householdShares.findFirst({
        where: eq(householdShares.id, inv.shareId)
      });
      const owner = share ? await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, share.ownerId)
      }) : null;

      results.push({
        id: inv.id,
        type: 'household',
        shareId: inv.shareId,
        spaceName: share?.householdName,
        ownerName: owner?.displayName,
        role: inv.role,
        invitedAt: inv.invitedAt
      });
    }

    // Business invitations
    const businessInvites = await db.query.businessShareMembers.findMany({
      where: and(
        eq(businessShareMembers.userId, userId),
        eq(businessShareMembers.status, 'pending')
      )
    });

    for (const inv of businessInvites) {
      const share = await db.query.businessShares.findFirst({
        where: eq(businessShares.id, inv.shareId)
      });
      const owner = share ? await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, share.ownerId)
      }) : null;

      results.push({
        id: inv.id,
        type: 'business',
        shareId: inv.shareId,
        spaceName: share?.businessName,
        ownerName: owner?.displayName,
        role: inv.role,
        invitedAt: inv.invitedAt
      });
    }

    res.json({ invitations: results });
  } catch (error) {
    console.error("Get share invitations error:", error);
    res.status(500).json({ error: "Failed to get invitations" });
  }
});

// Accept share invitation
router.post("/api/shared-spaces/invitations/:id/accept", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { type } = req.body;

    const now = new Date();

    if (type === 'household') {
      const inv = await db.query.householdShareMembers.findFirst({
        where: and(
          eq(householdShareMembers.id, id),
          eq(householdShareMembers.userId, userId),
          eq(householdShareMembers.status, 'pending')
        )
      });

      if (!inv) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await db.update(householdShareMembers)
        .set({ status: 'accepted', acceptedAt: now })
        .where(eq(householdShareMembers.id, id));

      // Notify owner
      const share = await db.query.householdShares.findFirst({ where: eq(householdShares.id, inv.shareId) });
      const accepter = await db.query.serverUsers.findFirst({ where: eq(serverUsers.id, userId) });
      if (share) {
        await createNotification(
          share.ownerId, 'HOME', 'share_accepted',
          'Invitation Accepted',
          `${accepter?.displayName || 'Someone'} joined your household "${share.householdName}"`,
          'household', share.id
        );
      }

      res.json({ success: true });
    } else if (type === 'business') {
      const inv = await db.query.businessShareMembers.findFirst({
        where: and(
          eq(businessShareMembers.id, id),
          eq(businessShareMembers.userId, userId),
          eq(businessShareMembers.status, 'pending')
        )
      });

      if (!inv) {
        return res.status(404).json({ error: "Invitation not found" });
      }

      await db.update(businessShareMembers)
        .set({ status: 'accepted', acceptedAt: now })
        .where(eq(businessShareMembers.id, id));

      const share = await db.query.businessShares.findFirst({ where: eq(businessShares.id, inv.shareId) });
      const accepter = await db.query.serverUsers.findFirst({ where: eq(serverUsers.id, userId) });
      if (share) {
        await createNotification(
          share.ownerId, 'STAFF', 'share_accepted',
          'Invitation Accepted',
          `${accepter?.displayName || 'Someone'} joined your business "${share.businessName}"`,
          'business', share.id
        );
      }

      res.json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
  } catch (error) {
    console.error("Accept share invitation error:", error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// Decline/leave shared space
router.delete("/api/shared-spaces/:shareId/member/:memberId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { shareId, memberId } = req.params;
    const { type } = req.query;

    if (type === 'household') {
      // Check if user is owner or the member being removed
      const share = await db.query.householdShares.findFirst({
        where: eq(householdShares.id, shareId)
      });
      
      const member = await db.query.householdShareMembers.findFirst({
        where: eq(householdShareMembers.id, memberId)
      });

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const isOwner = share?.ownerId === userId;
      const isSelf = member.userId === userId;

      if (!isOwner && !isSelf) {
        return res.status(403).json({ error: "Not authorized to remove this member" });
      }

      await db.delete(householdShareMembers).where(eq(householdShareMembers.id, memberId));
      res.json({ success: true });
    } else if (type === 'business') {
      const share = await db.query.businessShares.findFirst({
        where: eq(businessShares.id, shareId)
      });
      
      const member = await db.query.businessShareMembers.findFirst({
        where: eq(businessShareMembers.id, memberId)
      });

      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const isOwner = share?.ownerId === userId;
      const isSelf = member.userId === userId;

      if (!isOwner && !isSelf) {
        return res.status(403).json({ error: "Not authorized to remove this member" });
      }

      await db.delete(businessShareMembers).where(eq(businessShareMembers.id, memberId));
      res.json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Delete shared space (owner only)
router.delete("/api/shared-spaces/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { type } = req.query;

    if (type === 'household') {
      const share = await db.query.householdShares.findFirst({
        where: and(eq(householdShares.id, id), eq(householdShares.ownerId, userId))
      });

      if (!share) {
        return res.status(403).json({ error: "Not authorized to delete this space" });
      }

      // Delete all members first
      await db.delete(householdShareMembers).where(eq(householdShareMembers.shareId, id));
      await db.delete(householdShares).where(eq(householdShares.id, id));
      
      res.json({ success: true });
    } else if (type === 'business') {
      const share = await db.query.businessShares.findFirst({
        where: and(eq(businessShares.id, id), eq(businessShares.ownerId, userId))
      });

      if (!share) {
        return res.status(403).json({ error: "Not authorized to delete this space" });
      }

      await db.delete(businessShareMembers).where(eq(businessShareMembers.shareId, id));
      await db.delete(businessShares).where(eq(businessShares.id, id));
      
      res.json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid type" });
    }
  } catch (error) {
    console.error("Delete shared space error:", error);
    res.status(500).json({ error: "Failed to delete space" });
  }
});

// Delete user account and all associated data
router.post("/api/user/delete-account", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "No password set for this account" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Delete all user data in a transaction
    await db.transaction(async (tx) => {
      // 1. Delete notifications
      await tx.delete(notifications).where(eq(notifications.userId, userId));

      // 2. Delete chat messages where user is sender
      await tx.delete(chatMessages).where(eq(chatMessages.senderId, userId));

      // 3. Delete chat participants where user is participant
      await tx.delete(chatParticipants).where(eq(chatParticipants.userId, userId));

      // 4. Get connections involving the user and delete related chats
      const userConnections = await tx.query.collabConnections.findMany({
        where: or(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, userId)
        )
      });
      
      const connectionIds = userConnections.map(c => c.id);
      
      // Delete chats linked to these connections
      for (const connId of connectionIds) {
        // First delete messages and participants for chats in this connection
        const chatsToDelete = await tx.query.collabChats.findMany({
          where: eq(collabChats.connectionId, connId)
        });
        
        for (const chat of chatsToDelete) {
          await tx.delete(chatMessages).where(eq(chatMessages.chatId, chat.id));
          await tx.delete(chatParticipants).where(eq(chatParticipants.chatId, chat.id));
        }
        
        await tx.delete(collabChats).where(eq(collabChats.connectionId, connId));
      }

      // 5. Delete collab connections where user is involved
      await tx.delete(collabConnections).where(
        or(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, userId)
        )
      );

      // 6. Delete collab connection invites where user is sender or target
      await tx.delete(collabConnectionInvites).where(
        or(
          eq(collabConnectionInvites.senderId, userId),
          eq(collabConnectionInvites.targetUserId, userId)
        )
      );

      // 7. Get collaboration links for this user
      const userLinks = await tx.query.collaborationLinks.findMany({
        where: or(
          eq(collaborationLinks.homeUserId, userId),
          eq(collaborationLinks.staffUserId, userId)
        )
      });
      
      const linkIds = userLinks.map(l => l.id);

      // 8. Delete laundry revisions for laundry submitted by user or where user is actionBy
      await tx.delete(laundryRevisions).where(eq(laundryRevisions.actionBy, userId));

      // 9. Delete attendance revisions where user is actionBy
      await tx.delete(attendanceRevisions).where(eq(attendanceRevisions.actionBy, userId));

      // 10. For each link, delete shared laundry and attendance records
      for (const linkId of linkIds) {
        // Get bindings for this link
        const linkBindings = await tx.query.collaborationBindings.findMany({
          where: eq(collaborationBindings.linkId, linkId)
        });
        
        const bindingIds = linkBindings.map(b => b.id);
        
        // Delete laundry revisions for laundry in these bindings
        for (const bindingId of bindingIds) {
          const laundryRecords = await tx.query.sharedLaundry.findMany({
            where: eq(sharedLaundry.bindingId, bindingId)
          });
          
          for (const laundry of laundryRecords) {
            await tx.delete(laundryRevisions).where(eq(laundryRevisions.laundryId, laundry.id));
          }
          
          const attendanceRecords = await tx.query.sharedAttendance.findMany({
            where: eq(sharedAttendance.bindingId, bindingId)
          });
          
          for (const attendance of attendanceRecords) {
            await tx.delete(attendanceRevisions).where(eq(attendanceRevisions.attendanceId, attendance.id));
          }
          
          // Delete shared laundry and attendance
          await tx.delete(sharedLaundry).where(eq(sharedLaundry.bindingId, bindingId));
          await tx.delete(sharedAttendance).where(eq(sharedAttendance.bindingId, bindingId));
        }
        
        // Delete collaboration bindings
        await tx.delete(collaborationBindings).where(eq(collaborationBindings.linkId, linkId));
        
        // Delete collaboration messages
        await tx.delete(collaborationMessages).where(eq(collaborationMessages.linkId, linkId));
      }

      // 11. Delete collaboration links
      await tx.delete(collaborationLinks).where(
        or(
          eq(collaborationLinks.homeUserId, userId),
          eq(collaborationLinks.staffUserId, userId)
        )
      );

      // 12. Delete household share members where user is member
      await tx.delete(householdShareMembers).where(eq(householdShareMembers.userId, userId));

      // 13. Delete household shares owned by user (and their members first)
      const userHouseholdShares = await tx.query.householdShares.findMany({
        where: eq(householdShares.ownerId, userId)
      });
      
      for (const share of userHouseholdShares) {
        await tx.delete(householdShareMembers).where(eq(householdShareMembers.shareId, share.id));
      }
      await tx.delete(householdShares).where(eq(householdShares.ownerId, userId));

      // 14. Delete business share members where user is member
      await tx.delete(businessShareMembers).where(eq(businessShareMembers.userId, userId));

      // 15. Delete business shares owned by user (and their members first)
      const userBusinessShares = await tx.query.businessShares.findMany({
        where: eq(businessShares.ownerId, userId)
      });
      
      for (const share of userBusinessShares) {
        await tx.delete(businessShareMembers).where(eq(businessShareMembers.shareId, share.id));
      }
      await tx.delete(businessShares).where(eq(businessShares.ownerId, userId));

      // 16. Delete devices
      await tx.delete(devices).where(eq(devices.userId, userId));

      // 17. Finally delete the user record
      await tx.delete(serverUsers).where(eq(serverUsers.id, userId));
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ============ TEST DATA SEEDING ENDPOINT ============

router.post("/api/admin/seed-test-data", async (req: Request, res: Response) => {
  try {
    const TEST_PASSWORD = "Test123!";
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    
    const summary = {
      homeUsersCreated: 0,
      staffUsersCreated: 0,
      connectionsCreated: 0,
      collaborationLinksCreated: 0,
      bindingsCreated: 0,
      attendanceRecordsCreated: 0,
      laundryRecordsCreated: 0,
      notificationsCreated: 0,
      skippedExisting: 0,
    };

    // Helper function to generate dates for records
    const getRandomDate = (daysBack: number): string => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
      return date.toISOString().split('T')[0];
    };

    // Create 12 home users
    const homeUsers: { id: string; phone: string }[] = [];
    for (let i = 1; i <= 12; i++) {
      const phone = `+9199000010${i.toString().padStart(2, '0')}`;
      const userId = `test_home_${i}`;
      
      const existingUser = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.phone, phone)
      });
      
      if (existingUser) {
        homeUsers.push({ id: existingUser.id, phone });
        summary.skippedExisting++;
      } else {
        await db.insert(serverUsers).values({
          id: userId,
          phone,
          passwordHash,
          userType: 'HOME',
          displayName: `Test Home User ${i}`,
          isVerified: true,
          onboardingCompleted: true,
          isActive: true,
        });
        homeUsers.push({ id: userId, phone });
        summary.homeUsersCreated++;
      }
    }

    // Create 13 staff users
    const staffUsers: { id: string; phone: string }[] = [];
    for (let i = 1; i <= 13; i++) {
      const phone = `+9199000020${i.toString().padStart(2, '0')}`;
      const userId = `test_staff_${i}`;
      
      const existingUser = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.phone, phone)
      });
      
      if (existingUser) {
        staffUsers.push({ id: existingUser.id, phone });
        summary.skippedExisting++;
      } else {
        await db.insert(serverUsers).values({
          id: userId,
          phone,
          passwordHash,
          userType: 'STAFF',
          displayName: `Test Staff User ${i}`,
          isVerified: true,
          onboardingCompleted: true,
          isActive: true,
        });
        staffUsers.push({ id: userId, phone });
        summary.staffUsersCreated++;
      }
    }

    // Create connections pattern:
    // Home user 1 connects with Staff users 1-4
    // Home user 2 connects with Staff users 2-5
    // ... continues
    // Leave home users 11-12 and staff users 11-13 without connections
    
    const connectionPairs: { homeIdx: number; staffIdx: number }[] = [];
    for (let homeIdx = 0; homeIdx < 10; homeIdx++) {
      for (let offset = 0; offset < 4 && (homeIdx + offset) < 10; offset++) {
        const staffIdx = homeIdx + offset;
        if (staffIdx < 10) {
          connectionPairs.push({ homeIdx, staffIdx });
        }
      }
    }

    // Limit to 20 connections
    const connectionsToCreate = connectionPairs.slice(0, 20);

    for (const { homeIdx, staffIdx } of connectionsToCreate) {
      const homeUser = homeUsers[homeIdx];
      const staffUser = staffUsers[staffIdx];
      
      // Check if connection already exists
      const existingConnection = await db.query.collabConnections.findFirst({
        where: or(
          and(
            eq(collabConnections.userAId, homeUser.id),
            eq(collabConnections.userBId, staffUser.id)
          ),
          and(
            eq(collabConnections.userAId, staffUser.id),
            eq(collabConnections.userBId, homeUser.id)
          )
        )
      });
      
      if (existingConnection) {
        summary.skippedExisting++;
        continue;
      }
      
      const connectionId = uuidv4();
      await db.insert(collabConnections).values({
        id: connectionId,
        userAId: homeUser.id,
        userAMode: 'HOME',
        userBId: staffUser.id,
        userBMode: 'STAFF',
        status: 'accepted',
        initiatedBy: homeUser.id,
      });
      summary.connectionsCreated++;

      // Create collaboration link for this connection
      const linkId = uuidv4();
      const homeAccountId = `home_account_${homeIdx + 1}`;
      const staffAccountId = `staff_account_${staffIdx + 1}`;
      
      const existingLink = await db.query.collaborationLinks.findFirst({
        where: and(
          eq(collaborationLinks.homeUserId, homeUser.id),
          eq(collaborationLinks.staffUserId, staffUser.id)
        )
      });
      
      if (!existingLink) {
        await db.insert(collaborationLinks).values({
          id: linkId,
          homeUserId: homeUser.id,
          homeAccountId,
          staffUserId: staffUser.id,
          staffAccountId,
          status: 'active',
        });
        summary.collaborationLinksCreated++;

        // Create binding for this link
        const bindingId = uuidv4();
        const homePersonId = `person_${homeIdx + 1}_${staffIdx + 1}`;
        const staffClientId = `client_${staffIdx + 1}_${homeIdx + 1}`;
        
        await db.insert(collaborationBindings).values({
          id: bindingId,
          linkId,
          homePersonId,
          homePersonName: `Staff Person ${staffIdx + 1}`,
          staffClientId,
          staffClientName: `Home Client ${homeIdx + 1}`,
          isActive: true,
        });
        summary.bindingsCreated++;

        // Create 5 shared attendance records for each binding using raw SQL
        // (database has additional required columns not in Drizzle schema)
        for (let a = 0; a < 5; a++) {
          const attendanceId = uuidv4();
          const attendanceDate = getRandomDate(30);
          const statuses = ['FULL', 'HALF', 'ABSENT'];
          const status = statuses[Math.floor(Math.random() * 3)];
          const submittedByRole = Math.random() > 0.5 ? 'HOME' : 'STAFF';
          const submittedBy = submittedByRole === 'HOME' ? homeUser.id : staffUser.id;
          const actionRequiredBy = submittedByRole === 'HOME' ? staffUser.id : homeUser.id;
          const hoursWorked = status === 'FULL' ? 8 : status === 'HALF' ? 4 : 0;
          
          await db.execute(sql`
            INSERT INTO shared_attendance (
              id, home_user_id, staff_user_id, binding_id, date, status, hours_worked, note,
              approval_status, submitted_by, submitted_by_role, action_required_by,
              record_salary_type, record_rate, record_currency, revision_count
            ) VALUES (
              ${attendanceId}, ${homeUser.id}, ${staffUser.id}, ${bindingId}, ${attendanceDate},
              ${status}, ${hoursWorked}, ${'Test attendance record ' + (a + 1)},
              'pending', ${submittedBy}, ${submittedByRole}, ${actionRequiredBy},
              'DAILY', 500, 'INR', 0
            )
          `);
          summary.attendanceRecordsCreated++;
        }

        // Create 3 shared laundry records for each binding using raw SQL
        for (let l = 0; l < 3; l++) {
          const laundryId = uuidv4();
          const laundryDate = getRandomDate(30);
          const submittedByRole = Math.random() > 0.5 ? 'HOME' : 'STAFF';
          const submittedBy = submittedByRole === 'HOME' ? homeUser.id : staffUser.id;
          const actionRequiredBy = submittedByRole === 'HOME' ? staffUser.id : homeUser.id;
          
          const items = JSON.stringify([
            { id: uuidv4(), type: 'Shirt', quantity: 3, rate: 20, subtotal: 60 },
            { id: uuidv4(), type: 'Pants', quantity: 2, rate: 30, subtotal: 60 },
          ]);
          
          await db.execute(sql`
            INSERT INTO shared_laundry (
              id, home_user_id, staff_user_id, binding_id, date, items, items_total,
              pickup_delivery, pickup_delivery_charge, total, service_type,
              approval_status, submitted_by, submitted_by_role, action_required_by,
              record_currency, revision_count
            ) VALUES (
              ${laundryId}, ${homeUser.id}, ${staffUser.id}, ${bindingId}, ${laundryDate},
              ${items}, 120, false, 0, 120, 'Wash & Fold',
              'pending', ${submittedBy}, ${submittedByRole}, ${actionRequiredBy},
              'INR', 0
            )
          `);
          summary.laundryRecordsCreated++;
        }

        // Create random notification records using raw SQL
        // (database has different column names than Drizzle schema)
        const notificationCategories = ['attendance_submitted', 'laundry_submitted'];
        const numNotifications = Math.floor(Math.random() * 3) + 1;
        
        for (let n = 0; n < numNotifications; n++) {
          const notificationCategory = notificationCategories[Math.floor(Math.random() * 2)];
          const targetUser = Math.random() > 0.5 ? homeUser : staffUser;
          const targetMode = targetUser.id === homeUser.id ? 'HOME' : 'STAFF';
          const title = notificationCategory === 'attendance_submitted' 
            ? 'New Attendance Record' 
            : 'New Laundry Record';
          const message = `A new ${notificationCategory === 'attendance_submitted' ? 'attendance' : 'laundry'} record requires your review.`;
          const entityType = notificationCategory === 'attendance_submitted' ? 'attendance' : 'laundry';
          const notificationId = uuidv4();
          
          await db.execute(sql`
            INSERT INTO notifications (
              id, user_id, category, title, message, status, user_mode,
              action_required, action_type, is_read, entity_type
            ) VALUES (
              ${notificationId}, ${targetUser.id}, ${notificationCategory}, ${title}, ${message},
              'unread', ${targetMode}, true, 'approve', false, ${entityType}
            )
          `);
          summary.notificationsCreated++;
        }
      }
    }

    res.json({
      success: true,
      message: "Test data seeded successfully",
      summary,
      testCredentials: {
        password: TEST_PASSWORD,
        homeUsers: homeUsers.map((u, i) => ({ 
          phone: u.phone, 
          displayName: `Test Home User ${i + 1}`,
          hasConnections: i < 10 
        })),
        staffUsers: staffUsers.map((u, i) => ({ 
          phone: u.phone, 
          displayName: `Test Staff User ${i + 1}`,
          hasConnections: i < 10 
        })),
      }
    });
  } catch (error) {
    console.error("Seed test data error:", error);
    res.status(500).json({ 
      error: "Failed to seed test data", 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
});

// ============================================
// Advertisement Endpoints
// ============================================

// GET /api/ads/settings - Get global ad settings (public)
router.get("/api/ads/settings", async (req: Request, res: Response) => {
  try {
    const settings = await db.query.adSettings.findFirst();
    
    if (!settings) {
      return res.json({ adsEnabled: true });
    }
    
    res.json({ adsEnabled: settings.adsEnabled });
  } catch (error) {
    console.error("Get ad settings error:", error);
    res.status(500).json({ error: "Failed to get ad settings" });
  }
});

// GET /api/ads/next - Get next ad to display (weighted random selection)
router.get("/api/ads/next", async (req: Request, res: Response) => {
  try {
    const deviceId = req.query.deviceId as string | undefined;
    
    // Check global ads enabled setting
    const settings = await db.query.adSettings.findFirst();
    if (settings && !settings.adsEnabled) {
      return res.status(404).json({ error: "Ads are disabled", adsDisabled: true });
    }
    
    const now = new Date();
    
    // Get all active ads within valid date range
    const activeAds = await db.query.advertisements.findMany({
      where: and(
        eq(advertisements.isActive, true),
        or(
          sql`${advertisements.startDate} IS NULL`,
          sql`${advertisements.startDate} <= ${now}`
        ),
        or(
          sql`${advertisements.endDate} IS NULL`,
          sql`${advertisements.endDate} >= ${now}`
        )
      )
    });

    if (activeAds.length === 0) {
      return res.status(404).json({ error: "No ads available" });
    }

    // Filter out ads that have exceeded maxPlayCount for this device
    let eligibleAds = activeAds;
    if (deviceId) {
      const adPlayCounts = await db.select({
        adId: adImpressions.adId,
        playCount: sql<number>`count(*)`
      })
      .from(adImpressions)
      .where(eq(adImpressions.deviceId, deviceId))
      .groupBy(adImpressions.adId);
      
      const playCountMap = new Map(adPlayCounts.map(pc => [pc.adId, Number(pc.playCount)]));
      
      eligibleAds = activeAds.filter(ad => {
        if (ad.maxPlayCount === null || ad.maxPlayCount === undefined) {
          return true; // Unlimited plays
        }
        const currentCount = playCountMap.get(ad.id) || 0;
        return currentCount < ad.maxPlayCount;
      });
    }

    if (eligibleAds.length === 0) {
      return res.status(404).json({ error: "No ads available" });
    }

    // Weighted random selection
    const totalWeight = eligibleAds.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    let selectedAd = eligibleAds[0];
    for (const ad of eligibleAds) {
      random -= ad.weight || 1;
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }

    res.json({
      id: selectedAd.id,
      title: selectedAd.title,
      videoUrl: selectedAd.videoUrl,
      thumbnailUrl: selectedAd.thumbnailUrl,
      duration: selectedAd.duration,
      targetUrl: selectedAd.targetUrl,
      orientation: selectedAd.orientation
    });
  } catch (error) {
    console.error("Get next ad error:", error);
    res.status(500).json({ error: "Failed to get next ad" });
  }
});

// POST /api/ads/impression - Record an ad impression
router.post("/api/ads/impression", async (req: Request, res: Response) => {
  try {
    const validationResult = insertAdImpressionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid impression data",
        details: validationResult.error.issues 
      });
    }

    const data = validationResult.data;

    // Verify ad exists
    const ad = await db.query.advertisements.findFirst({
      where: eq(advertisements.id, data.adId)
    });

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    const impressionId = uuidv4();

    await db.insert(adImpressions).values({
      id: impressionId,
      adId: data.adId,
      userId: data.userId || null,
      sessionId: data.sessionId || null,
      deviceId: data.deviceId || null,
      watchedDuration: data.watchedDuration || 0,
      completed: data.completed || false,
      skipped: data.skipped || false,
      skippedAt: data.skippedAt || null,
      clickedThrough: data.clickedThrough || false
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Record impression error:", error);
    res.status(500).json({ error: "Failed to record impression" });
  }
});

// ============================================
// Admin Advertisement Endpoints
// ============================================

// GET /api/admin/ads - List all ads with pagination
router.get("/api/admin/ads", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const ads = await db.query.advertisements.findMany({
      limit: limitNum,
      offset,
      orderBy: desc(advertisements.createdAt)
    });

    const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(advertisements);
    const total = Number(countResult.count);

    res.json({
      ads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("List ads error:", error);
    res.status(500).json({ error: "Failed to list ads" });
  }
});

// GET /api/admin/ads/analytics - Get aggregated analytics
router.get("/api/admin/ads/analytics", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    // Get all ads with impression stats
    const adsWithStats = await db.select({
      id: advertisements.id,
      title: advertisements.title,
      isActive: advertisements.isActive,
      totalImpressions: sql<number>`count(${adImpressions.id})`,
      totalCompleted: sql<number>`sum(case when ${adImpressions.completed} then 1 else 0 end)`,
      totalSkipped: sql<number>`sum(case when ${adImpressions.skipped} then 1 else 0 end)`,
      totalClicks: sql<number>`sum(case when ${adImpressions.clickedThrough} then 1 else 0 end)`,
      avgWatchDuration: sql<number>`avg(${adImpressions.watchedDuration})`
    })
    .from(advertisements)
    .leftJoin(adImpressions, eq(advertisements.id, adImpressions.adId))
    .groupBy(advertisements.id, advertisements.title, advertisements.isActive);

    // Calculate rates for each ad
    const analytics = adsWithStats.map(ad => ({
      adId: ad.id,
      title: ad.title,
      isActive: ad.isActive,
      totalImpressions: Number(ad.totalImpressions) || 0,
      completionRate: ad.totalImpressions ? 
        (Number(ad.totalCompleted) / Number(ad.totalImpressions) * 100).toFixed(2) + '%' : '0%',
      skipRate: ad.totalImpressions ? 
        (Number(ad.totalSkipped) / Number(ad.totalImpressions) * 100).toFixed(2) + '%' : '0%',
      clickThroughRate: ad.totalImpressions ? 
        (Number(ad.totalClicks) / Number(ad.totalImpressions) * 100).toFixed(2) + '%' : '0%',
      avgWatchDuration: Number(ad.avgWatchDuration)?.toFixed(2) || '0'
    }));

    // User breakdown - which users saw which ads how many times
    const userBreakdown = await db.select({
      adId: adImpressions.adId,
      adTitle: advertisements.title,
      userId: adImpressions.userId,
      impressionCount: sql<number>`count(*)`,
      completedCount: sql<number>`sum(case when ${adImpressions.completed} then 1 else 0 end)`,
      clickedCount: sql<number>`sum(case when ${adImpressions.clickedThrough} then 1 else 0 end)`
    })
    .from(adImpressions)
    .innerJoin(advertisements, eq(adImpressions.adId, advertisements.id))
    .where(sql`${adImpressions.userId} IS NOT NULL`)
    .groupBy(adImpressions.adId, advertisements.title, adImpressions.userId);

    // Overall totals
    const [overallStats] = await db.select({
      totalImpressions: sql<number>`count(*)`,
      totalCompleted: sql<number>`sum(case when ${adImpressions.completed} then 1 else 0 end)`,
      totalSkipped: sql<number>`sum(case when ${adImpressions.skipped} then 1 else 0 end)`,
      totalClicks: sql<number>`sum(case when ${adImpressions.clickedThrough} then 1 else 0 end)`
    })
    .from(adImpressions);

    res.json({
      overview: {
        totalImpressions: Number(overallStats?.totalImpressions) || 0,
        overallCompletionRate: overallStats?.totalImpressions ? 
          (Number(overallStats.totalCompleted) / Number(overallStats.totalImpressions) * 100).toFixed(2) + '%' : '0%',
        overallSkipRate: overallStats?.totalImpressions ? 
          (Number(overallStats.totalSkipped) / Number(overallStats.totalImpressions) * 100).toFixed(2) + '%' : '0%',
        overallClickThroughRate: overallStats?.totalImpressions ? 
          (Number(overallStats.totalClicks) / Number(overallStats.totalImpressions) * 100).toFixed(2) + '%' : '0%'
      },
      perAdAnalytics: analytics,
      userBreakdown: userBreakdown.map(row => ({
        adId: row.adId,
        adTitle: row.adTitle,
        userId: row.userId,
        impressionCount: Number(row.impressionCount),
        completedCount: Number(row.completedCount),
        clickedCount: Number(row.clickedCount)
      }))
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// GET /api/admin/ads/settings - Get ad settings (admin)
router.get("/api/admin/ads/settings", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await db.query.adSettings.findFirst();
    
    if (!settings) {
      return res.json({ adsEnabled: true, updatedAt: null, updatedBy: null });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Get admin ad settings error:", error);
    res.status(500).json({ error: "Failed to get ad settings" });
  }
});

// PATCH /api/admin/ads/settings - Update ad settings (admin only)
router.patch("/api/admin/ads/settings", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const validationResult = insertAdSettingsSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid settings data",
        details: validationResult.error.issues 
      });
    }
    
    const { adsEnabled } = validationResult.data;
    
    const existingSettings = await db.query.adSettings.findFirst();
    
    if (existingSettings) {
      await db.update(adSettings)
        .set({ 
          adsEnabled,
          updatedAt: new Date(),
          updatedBy: adminId || null
        })
        .where(eq(adSettings.id, existingSettings.id));
    } else {
      await db.insert(adSettings).values({
        adsEnabled,
        updatedBy: adminId || null
      });
    }
    
    res.json({ success: true, adsEnabled });
  } catch (error) {
    console.error("Update ad settings error:", error);
    res.status(500).json({ error: "Failed to update ad settings" });
  }
});

// GET /api/admin/ads/:id - Get single ad details
router.get("/api/admin/ads/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ad = await db.query.advertisements.findFirst({
      where: eq(advertisements.id, id)
    });

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    res.json(ad);
  } catch (error) {
    console.error("Get ad error:", error);
    res.status(500).json({ error: "Failed to get ad" });
  }
});

// POST /api/admin/ads - Create new ad
router.post("/api/admin/ads", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const validationResult = insertAdvertisementSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid ad data",
        details: validationResult.error.issues 
      });
    }

    const data = validationResult.data;
    const adId = uuidv4();

    const [newAd] = await db.insert(advertisements).values({
      id: adId,
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl || null,
      duration: data.duration || 30,
      weight: data.weight || 1,
      isActive: data.isActive ?? true,
      advertiser: data.advertiser || null,
      targetUrl: data.targetUrl || null,
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      maxPlayCount: data.maxPlayCount ?? null,
      orientation: data.orientation || "landscape"
    }).returning();

    res.status(201).json(newAd);
  } catch (error) {
    console.error("Create ad error:", error);
    res.status(500).json({ error: "Failed to create ad" });
  }
});

// PATCH /api/admin/ads/:id - Update ad
router.patch("/api/admin/ads/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingAd = await db.query.advertisements.findFirst({
      where: eq(advertisements.id, id)
    });

    if (!existingAd) {
      return res.status(404).json({ error: "Ad not found" });
    }

    const updateData: Partial<typeof advertisements.$inferInsert> = {};

    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.videoUrl !== undefined) updateData.videoUrl = req.body.videoUrl;
    if (req.body.thumbnailUrl !== undefined) updateData.thumbnailUrl = req.body.thumbnailUrl;
    if (req.body.duration !== undefined) updateData.duration = req.body.duration;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.advertiser !== undefined) updateData.advertiser = req.body.advertiser;
    if (req.body.targetUrl !== undefined) updateData.targetUrl = req.body.targetUrl;
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
    if (req.body.endDate !== undefined) updateData.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
    if (req.body.maxPlayCount !== undefined) updateData.maxPlayCount = req.body.maxPlayCount;
    if (req.body.orientation !== undefined) updateData.orientation = req.body.orientation;
    updateData.updatedAt = new Date();

    const [updatedAd] = await db.update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id))
      .returning();

    res.json(updatedAd);
  } catch (error) {
    console.error("Update ad error:", error);
    res.status(500).json({ error: "Failed to update ad" });
  }
});

// DELETE /api/admin/ads/:id - Delete ad (soft delete if has impressions, hard delete otherwise)
router.delete("/api/admin/ads/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingAd = await db.query.advertisements.findFirst({
      where: eq(advertisements.id, id)
    });

    if (!existingAd) {
      return res.status(404).json({ error: "Ad not found" });
    }

    // Check if ad has any impressions
    const [impressionCount] = await db.select({ count: sql<number>`count(*)` })
      .from(adImpressions)
      .where(eq(adImpressions.adId, id));

    if (Number(impressionCount.count) > 0) {
      // Soft delete - set isActive to false
      await db.update(advertisements)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(advertisements.id, id));

      res.json({ 
        success: true, 
        message: "Ad deactivated (soft delete - has impressions)",
        softDelete: true
      });
    } else {
      // Hard delete - no impressions exist
      await db.delete(advertisements).where(eq(advertisements.id, id));

      res.json({ 
        success: true, 
        message: "Ad permanently deleted",
        softDelete: false
      });
    }
  } catch (error) {
    console.error("Delete ad error:", error);
    res.status(500).json({ error: "Failed to delete ad" });
  }
});

// ============ ADMIN MANAGEMENT API ============

// GET /api/admin/admins - List all admin users with their roles
router.get("/api/admin/admins", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await db.query.adminUsers.findMany({
      orderBy: desc(adminUsers.createdAt),
      with: {
        role: true,
        invitedByAdmin: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get all roles for reference
    const roles = await db.query.adminRolesTable.findMany({
      orderBy: (adminRolesTable, { asc }) => [asc(adminRolesTable.precedence)]
    });

    res.json({
      admins: admins.map(admin => ({
        ...admin,
        passwordHash: undefined
      })),
      roles
    });
  } catch (error) {
    console.error("List admins error:", error);
    res.status(500).json({ error: "Failed to list admins" });
  }
});

// POST /api/admin/admins/invite - Invite a new admin
router.post("/api/admin/admins/invite", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const inviterId = (req as any).adminId;
    const { email, name, roleId, password } = req.body;

    if (!email || !name || !roleId || !password) {
      return res.status(400).json({ error: "Email, name, roleId, and password are required" });
    }

    // Get the inviter's role to check hierarchy
    const inviter = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, inviterId),
      with: { role: true }
    });

    if (!inviter || !inviter.role) {
      return res.status(403).json({ error: "Cannot determine inviter role" });
    }

    // Get the target role
    const targetRole = await db.query.adminRolesTable.findFirst({
      where: eq(adminRolesTable.id, roleId)
    });

    if (!targetRole) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check hierarchy - can only invite roles with higher precedence (lower privilege)
    if (targetRole.precedence <= inviter.role.precedence) {
      return res.status(403).json({ 
        error: "Cannot invite admin with equal or higher privileges than yourself" 
      });
    }

    // Check if email already exists
    const existing = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email)
    });

    if (existing) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    // Create the admin user directly
    const adminId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    const [newAdmin] = await db.insert(adminUsers).values({
      id: adminId,
      email,
      name,
      passwordHash,
      roleId,
      invitedBy: inviterId,
      isActive: true
    }).returning();

    res.json({
      success: true,
      admin: {
        ...newAdmin,
        passwordHash: undefined
      }
    });
  } catch (error) {
    console.error("Invite admin error:", error);
    res.status(500).json({ error: "Failed to invite admin" });
  }
});

// PATCH /api/admin/admins/:id - Update an admin (role, status)
router.patch("/api/admin/admins/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { roleId, isActive, name } = req.body;

    // Get the acting admin's role
    const actingAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
      with: { role: true }
    });

    if (!actingAdmin || !actingAdmin.role) {
      return res.status(403).json({ error: "Cannot determine your role" });
    }

    // Get the target admin
    const targetAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
      with: { role: true }
    });

    if (!targetAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Check hierarchy - can only modify admins with higher precedence (lower privilege)
    if (targetAdmin.role && targetAdmin.role.precedence <= actingAdmin.role.precedence) {
      return res.status(403).json({ 
        error: "Cannot modify admin with equal or higher privileges than yourself" 
      });
    }

    // If changing role, validate the new role is also lower privilege
    if (roleId !== undefined) {
      const newRole = await db.query.adminRolesTable.findFirst({
        where: eq(adminRolesTable.id, roleId)
      });

      if (!newRole) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (newRole.precedence <= actingAdmin.role.precedence) {
        return res.status(403).json({ 
          error: "Cannot assign role with equal or higher privileges than yourself" 
        });
      }
    }

    const updateData: any = {};
    if (roleId !== undefined) updateData.roleId = roleId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;

    const [updated] = await db.update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning();

    res.json({
      success: true,
      admin: {
        ...updated,
        passwordHash: undefined
      }
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
});

// GET /api/admin/admins/roles - Get available roles
router.get("/api/admin/admins/roles", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const roles = await db.query.adminRolesTable.findMany({
      orderBy: (adminRolesTable, { asc }) => [asc(adminRolesTable.precedence)]
    });

    res.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
});

// GET /api/admin/roles - Alias for getting all roles (for AdminRolesPage)
router.get("/api/admin/roles", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const roles = await db.query.adminRolesTable.findMany({
      orderBy: (adminRolesTable, { asc }) => [asc(adminRolesTable.precedence)]
    });

    res.json({ roles });
  } catch (error) {
    console.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
});

// PATCH /api/admin/roles/:id - Update role permissions
router.patch("/api/admin/roles/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions array is required" });
    }

    // Get the acting admin's role
    const actingAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
      with: { role: true }
    });

    if (!actingAdmin || !actingAdmin.role) {
      return res.status(403).json({ error: "Cannot determine your role" });
    }

    // Get the target role
    const targetRole = await db.query.adminRolesTable.findFirst({
      where: eq(adminRolesTable.id, parseInt(id))
    });

    if (!targetRole) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Owner role cannot be modified
    if (targetRole.name === 'owner') {
      return res.status(403).json({ error: "Owner role cannot be modified" });
    }

    // Only owner can modify super_admin role
    if (targetRole.name === 'super_admin' && actingAdmin.role.name !== 'owner') {
      return res.status(403).json({ error: "Only owner can modify super_admin role" });
    }

    // Can only modify roles with higher precedence (lower privilege) than your own
    if (targetRole.precedence <= actingAdmin.role.precedence) {
      return res.status(403).json({ 
        error: "Cannot modify role with equal or higher privileges than yourself" 
      });
    }

    const [updated] = await db.update(adminRolesTable)
      .set({ permissions })
      .where(eq(adminRolesTable.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      role: updated
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
});

// GET /api/admin/team - Alias for getting admin team (for AdminTeamPage)
router.get("/api/admin/team", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await db.query.adminUsers.findMany({
      orderBy: desc(adminUsers.createdAt),
      with: {
        role: true,
        invitedByAdmin: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const roles = await db.query.adminRolesTable.findMany({
      orderBy: (adminRolesTable, { asc }) => [asc(adminRolesTable.precedence)]
    });

    res.json({
      admins: admins.map(admin => ({
        ...admin,
        passwordHash: undefined
      })),
      roles
    });
  } catch (error) {
    console.error("List team error:", error);
    res.status(500).json({ error: "Failed to list team" });
  }
});

// POST /api/admin/team/invite - Invite new team member
router.post("/api/admin/team/invite", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const inviterId = (req as any).adminId;
    const { email, name, roleId, password } = req.body;

    if (!email || !name || !roleId || !password) {
      return res.status(400).json({ error: "Email, name, roleId, and password are required" });
    }

    const inviter = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, inviterId),
      with: { role: true }
    });

    if (!inviter || !inviter.role) {
      return res.status(403).json({ error: "Cannot determine inviter role" });
    }

    const targetRole = await db.query.adminRolesTable.findFirst({
      where: eq(adminRolesTable.id, roleId)
    });

    if (!targetRole) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (targetRole.precedence <= inviter.role.precedence) {
      return res.status(403).json({ 
        error: "Cannot invite admin with equal or higher privileges than yourself" 
      });
    }

    const existing = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email)
    });

    if (existing) {
      return res.status(400).json({ error: "Admin with this email already exists" });
    }

    const adminNewId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    const [newAdmin] = await db.insert(adminUsers).values({
      id: adminNewId,
      email,
      name,
      passwordHash,
      roleId,
      invitedBy: inviterId,
      isActive: true
    }).returning();

    res.json({
      success: true,
      admin: {
        ...newAdmin,
        passwordHash: undefined
      }
    });
  } catch (error) {
    console.error("Invite team member error:", error);
    res.status(500).json({ error: "Failed to invite team member" });
  }
});

// PATCH /api/admin/team/:id - Update team member
router.patch("/api/admin/team/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { roleId, isActive, name } = req.body;

    const actingAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, adminId),
      with: { role: true }
    });

    if (!actingAdmin || !actingAdmin.role) {
      return res.status(403).json({ error: "Cannot determine your role" });
    }

    const targetAdmin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
      with: { role: true }
    });

    if (!targetAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (targetAdmin.role && targetAdmin.role.precedence <= actingAdmin.role.precedence) {
      return res.status(403).json({ 
        error: "Cannot modify admin with equal or higher privileges than yourself" 
      });
    }

    if (roleId !== undefined) {
      const newRole = await db.query.adminRolesTable.findFirst({
        where: eq(adminRolesTable.id, roleId)
      });

      if (!newRole) {
        return res.status(400).json({ error: "Invalid role" });
      }

      if (newRole.precedence <= actingAdmin.role.precedence) {
        return res.status(403).json({ 
          error: "Cannot assign role with equal or higher privileges than yourself" 
        });
      }
    }

    const updateData: any = {};
    if (roleId !== undefined) updateData.roleId = roleId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;

    const [updated] = await db.update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, id))
      .returning();

    res.json({
      success: true,
      admin: {
        ...updated,
        passwordHash: undefined
      }
    });
  } catch (error) {
    console.error("Update team member error:", error);
    res.status(500).json({ error: "Failed to update team member" });
  }
});

// GET /api/admin/users/search - Search users by phone number for backup
router.get("/api/admin/users/search", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;

    if (!phone || typeof phone !== 'string' || phone.length < 3) {
      return res.status(400).json({ error: "Phone number search query required (min 3 chars)" });
    }

    const users = await db.query.serverUsers.findMany({
      where: sql`${serverUsers.phone} LIKE ${'%' + phone + '%'}`,
      limit: 20,
      orderBy: desc(serverUsers.createdAt)
    });

    res.json({
      users: users.map(u => ({
        id: u.id,
        phone: u.phone,
        displayName: u.displayName,
        userType: u.userType,
        isVerified: u.isVerified,
        isActive: u.isActive
      }))
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// ============ USER BACKUP MANAGEMENT API ============

// Helper function to generate checksum for backup data
function generateChecksum(data: any): string {
  const jsonString = JSON.stringify(data);
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

// Helper function to convert ISO date strings back to Date objects for restore
function parseDateStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      return new Date(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(parseDateStrings);
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = parseDateStrings(obj[key]);
    }
    return result;
  }
  return obj;
}

// Helper function to create backup log entry
async function createBackupLog(backupId: number, action: string, adminId: string | null, details?: any) {
  await db.insert(backupLogs).values({
    backupId,
    action,
    adminId,
    details: details || null
  });
}

// GET /api/admin/backups/stats - Get backup statistics for dashboard
router.get("/api/admin/backups/stats", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(userBackups);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userBackups)
      .where(eq(userBackups.status, 'pending'));
    const [completedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userBackups)
      .where(eq(userBackups.status, 'completed'));
    const [failedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userBackups)
      .where(eq(userBackups.status, 'failed'));
    
    const recentBackups = await db.query.userBackups.findMany({
      orderBy: desc(userBackups.createdAt),
      limit: 5,
      with: {
        user: {
          columns: {
            phone: true,
            displayName: true
          }
        }
      }
    });

    res.json({
      total: Number(totalResult.count),
      pending: Number(pendingResult.count),
      completed: Number(completedResult.count),
      failed: Number(failedResult.count),
      recent: recentBackups.map(b => ({
        id: b.id,
        phoneNumber: b.phoneNumber,
        status: b.status,
        backupType: b.backupType,
        createdAt: b.createdAt,
        userName: b.user?.displayName || null
      }))
    });
  } catch (error) {
    console.error("Backup stats error:", error);
    res.status(500).json({ error: "Failed to get backup stats" });
  }
});

// GET /api/admin/backups - List all backups with filtering
router.get("/api/admin/backups", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, status, type, phone, limit = '50', offset = '0' } = req.query;

    let conditions: any[] = [];
    
    if (userId) {
      conditions.push(eq(userBackups.userId, userId as string));
    }
    if (status && backupStatuses.includes(status as any)) {
      conditions.push(eq(userBackups.status, status as string));
    }
    if (type && backupTypes.includes(type as any)) {
      conditions.push(eq(userBackups.backupType, type as string));
    }
    if (phone) {
      conditions.push(sql`${userBackups.phoneNumber} ILIKE ${'%' + phone + '%'}`);
    }

    const backups = await db.query.userBackups.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(userBackups.createdAt),
      limit: Math.min(parseInt(limit as string) || 50, 100),
      offset: parseInt(offset as string) || 0,
      with: {
        user: true,
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        restoredBy: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get total count for pagination
    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userBackups)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      backups,
      total: Number(totalResult.count),
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0
    });
  } catch (error) {
    console.error("List backups error:", error);
    res.status(500).json({ error: "Failed to list backups" });
  }
});

// POST /api/admin/backups - Create manual backup for a user
router.post("/api/admin/backups", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { userId, notes, expiresAt } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Get user data
    const user = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Collect related user data for comprehensive backup
    const userDevices = await db.query.devices.findMany({
      where: eq(devices.userId, userId)
    });

    const userLinks = await db.query.collaborationLinks.findMany({
      where: or(
        eq(collaborationLinks.homeUserId, userId),
        eq(collaborationLinks.staffUserId, userId)
      )
    });

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId)
    });

    const backupData = {
      user: {
        ...user,
        passwordHash: '[REDACTED]',
        otpHash: '[REDACTED]'
      },
      devices: userDevices,
      collaborationLinks: userLinks,
      notifications: userNotifications.slice(0, 100), // Limit to last 100 notifications
      backupVersion: '1.0',
      backupTimestamp: new Date().toISOString()
    };

    const checksum = generateChecksum(backupData);

    const [newBackup] = await db.insert(userBackups).values({
      userId,
      phoneNumber: user.phone,
      backupType: 'manual',
      status: 'completed',
      backupData,
      checksum,
      createdById: adminId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes: notes || null
    }).returning();

    // Create audit log
    await createBackupLog(newBackup.id, 'created', adminId, {
      backupType: 'manual',
      userPhone: user.phone,
      dataSize: JSON.stringify(backupData).length
    });

    res.status(201).json({
      success: true,
      backup: {
        ...newBackup,
        backupData: undefined // Don't return backup data in response
      }
    });
  } catch (error) {
    console.error("Create backup error:", error);
    res.status(500).json({ error: "Failed to create backup" });
  }
});

// GET /api/admin/backups/:id - Get backup details
router.get("/api/admin/backups/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeData } = req.query;

    const backup = await db.query.userBackups.findFirst({
      where: eq(userBackups.id, parseInt(id)),
      with: {
        user: true,
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        restoredBy: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        },
        logs: {
          orderBy: desc(backupLogs.createdAt),
          with: {
            admin: {
              columns: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    // Verify checksum integrity
    let checksumValid = false;
    if (backup.backupData && backup.checksum) {
      const computedChecksum = generateChecksum(backup.backupData);
      checksumValid = computedChecksum === backup.checksum;
    }

    const response: any = {
      ...backup,
      checksumValid
    };

    // Only include backup data if explicitly requested (for restore preview)
    if (includeData !== 'true') {
      response.backupData = undefined;
    }

    res.json(response);
  } catch (error) {
    console.error("Get backup error:", error);
    res.status(500).json({ error: "Failed to get backup" });
  }
});

// POST /api/admin/backups/:id/restore - Restore a user from backup
router.post("/api/admin/backups/:id/restore", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { notes } = req.body;

    const backup = await db.query.userBackups.findFirst({
      where: eq(userBackups.id, parseInt(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    if (backup.status === 'deleted') {
      return res.status(400).json({ error: "Cannot restore from a deleted backup" });
    }

    if (backup.status === 'restored') {
      return res.status(400).json({ error: "Backup has already been restored" });
    }

    const backupData = backup.backupData as any;
    if (!backupData || !backupData.user) {
      return res.status(400).json({ error: "Invalid backup data" });
    }

    // Verify checksum
    if (backup.checksum) {
      const computedChecksum = generateChecksum(backup.backupData);
      if (computedChecksum !== backup.checksum) {
        await createBackupLog(backup.id, 'failed', adminId, {
          reason: 'Checksum verification failed',
          notes
        });
        return res.status(400).json({ error: "Backup data integrity check failed" });
      }
    }

    const now = new Date();
    let userId = backup.userId;

    // Check if user still exists
    if (userId) {
      const existingUser = await db.query.serverUsers.findFirst({
        where: eq(serverUsers.id, userId)
      });

      if (existingUser) {
        // Update existing user with backup data (excluding sensitive fields)
        const userData = backupData.user;
        await db.update(serverUsers)
          .set({
            displayName: userData.displayName,
            userType: userData.userType,
            avatarData: userData.avatarData,
            preferredLanguage: userData.preferredLanguage,
            isActive: true,
            lastActiveAt: now
          })
          .where(eq(serverUsers.id, userId));
      } else {
        // User was deleted, recreate with new ID
        const userData = backupData.user;
        userId = uuidv4();
        
        await db.insert(serverUsers).values({
          id: userId,
          phone: backup.phoneNumber,
          displayName: userData.displayName,
          userType: userData.userType,
          avatarData: userData.avatarData,
          preferredLanguage: userData.preferredLanguage,
          isActive: true,
          isVerified: true,
          createdAt: now
        });
      }
    } else {
      // No userId in backup (user was deleted before backup), create new user
      const userData = backupData.user;
      userId = uuidv4();
      
      await db.insert(serverUsers).values({
        id: userId,
        phone: backup.phoneNumber,
        displayName: userData.displayName || 'Restored User',
        userType: userData.userType,
        avatarData: userData.avatarData,
        preferredLanguage: userData.preferredLanguage,
        isActive: true,
        isVerified: true,
        createdAt: now
      });
    }

    // Update backup status
    await db.update(userBackups)
      .set({
        status: 'restored',
        restoredById: adminId,
        restoredAt: now,
        userId: userId, // Update to new userId if recreated
        notes: notes ? `${backup.notes || ''}\n[Restore Note]: ${notes}`.trim() : backup.notes
      })
      .where(eq(userBackups.id, backup.id));

    // Create audit log
    await createBackupLog(backup.id, 'restored', adminId, {
      restoredUserId: userId,
      notes
    });

    res.json({
      success: true,
      message: "User restored successfully",
      restoredUserId: userId
    });
  } catch (error) {
    console.error("Restore backup error:", error);
    res.status(500).json({ error: "Failed to restore backup" });
  }
});

// DELETE /api/admin/backups/:id - Delete a backup (soft delete by changing status)
router.delete("/api/admin/backups/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;
    const { notes } = req.body;

    const backup = await db.query.userBackups.findFirst({
      where: eq(userBackups.id, parseInt(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "Backup not found" });
    }

    if (backup.status === 'deleted') {
      return res.status(400).json({ error: "Backup is already deleted" });
    }

    // Soft delete by changing status
    await db.update(userBackups)
      .set({
        status: 'deleted',
        notes: notes ? `${backup.notes || ''}\n[Delete Note]: ${notes}`.trim() : backup.notes
      })
      .where(eq(userBackups.id, backup.id));

    // Create audit log
    await createBackupLog(backup.id, 'deleted', adminId, {
      previousStatus: backup.status,
      notes
    });

    res.json({
      success: true,
      message: "Backup deleted successfully"
    });
  } catch (error) {
    console.error("Delete backup error:", error);
    res.status(500).json({ error: "Failed to delete backup" });
  }
});

// ============ SYSTEM-WIDE BACKUP ENDPOINTS (Super Admin Only) ============

// Helper function to check if admin is super_admin or owner
async function isSuperAdmin(adminId: string): Promise<boolean> {
  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, adminId),
    with: {
      role: true
    }
  });
  
  if (!admin || !admin.role) return false;
  return admin.role.name === 'super_admin' || admin.role.name === 'owner';
}

// POST /api/admin/system-backup - Create a full database snapshot
router.post("/api/admin/system-backup", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    
    // Check if admin is super_admin or owner
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can create system backups" });
    }

    // Fetch all data from all tables
    const [
      usersData,
      devicesData,
      collaborationLinksData,
      collaborationMessagesData,
      adminRolesData,
      adminUsersData,
      adminInvitationsData,
      collaborationBindingsData,
      sharedAttendanceData,
      attendanceRevisionsData,
      sharedLaundryData,
      laundryRevisionsData,
      collabConnectionInvitesData,
      collabConnectionsData,
      collabChatsData,
      chatParticipantsData,
      chatMessagesData,
      householdSharesData,
      householdShareMembersData,
      businessSharesData,
      businessShareMembersData,
      notificationsData,
      advertisementsData,
      adSettingsData,
      adImpressionsData,
      userBackupsData,
      backupLogsData
    ] = await Promise.all([
      db.select().from(serverUsers),
      db.select().from(devices),
      db.select().from(collaborationLinks),
      db.select().from(collaborationMessages),
      db.select().from(adminRolesTable),
      db.select().from(adminUsers),
      db.select().from(adminInvitations),
      db.select().from(collaborationBindings),
      db.select().from(sharedAttendance),
      db.select().from(attendanceRevisions),
      db.select().from(sharedLaundry),
      db.select().from(laundryRevisions),
      db.select().from(collabConnectionInvites),
      db.select().from(collabConnections),
      db.select().from(collabChats),
      db.select().from(chatParticipants),
      db.select().from(chatMessages),
      db.select().from(householdShares),
      db.select().from(householdShareMembers),
      db.select().from(businessShares),
      db.select().from(businessShareMembers),
      db.select().from(notifications),
      db.select().from(advertisements),
      db.select().from(adSettings),
      db.select().from(adImpressions),
      db.select().from(userBackups),
      db.select().from(backupLogs)
    ]);

    const backupData = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      createdBy: adminId,
      tables: {
        server_users: usersData,
        devices: devicesData,
        collaboration_links: collaborationLinksData,
        collaboration_messages: collaborationMessagesData,
        admin_roles: adminRolesData,
        admin_users: adminUsersData,
        admin_invitations: adminInvitationsData,
        collaboration_bindings: collaborationBindingsData,
        shared_attendance: sharedAttendanceData,
        attendance_revisions: attendanceRevisionsData,
        shared_laundry: sharedLaundryData,
        laundry_revisions: laundryRevisionsData,
        collab_connection_invites: collabConnectionInvitesData,
        collab_connections: collabConnectionsData,
        collab_chats: collabChatsData,
        chat_participants: chatParticipantsData,
        chat_messages: chatMessagesData,
        household_shares: householdSharesData,
        household_share_members: householdShareMembersData,
        business_shares: businessSharesData,
        business_share_members: businessShareMembersData,
        notifications: notificationsData,
        advertisements: advertisementsData,
        ad_settings: adSettingsData,
        ad_impressions: adImpressionsData,
        user_backups: userBackupsData,
        backup_logs: backupLogsData
      }
    };

    res.json(backupData);
  } catch (error) {
    console.error("System backup error:", error);
    res.status(500).json({ error: "Failed to create system backup" });
  }
});

// POST /api/admin/system-restore - Restore database from uploaded JSON backup
router.post("/api/admin/system-restore", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    
    // Check if admin is super_admin or owner
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can restore system backups" });
    }

    const rawBackupData = req.body;

    // Validate backup structure
    if (!rawBackupData || !rawBackupData.version || !rawBackupData.tables) {
      return res.status(400).json({ error: "Invalid backup format" });
    }

    if (rawBackupData.version !== "1.0" && rawBackupData.version !== "2.0") {
      return res.status(400).json({ error: `Unsupported backup version: ${rawBackupData.version}` });
    }

    // Convert date strings back to Date objects
    const backupData = parseDateStrings(rawBackupData);

    // Perform restoration in a transaction
    await db.transaction(async (tx) => {
      // Delete existing data in reverse dependency order
      // First, delete tables with foreign key dependencies
      if (backupData.tables.backup_logs) {
        await tx.delete(backupLogs);
      }
      if (backupData.tables.user_backups) {
        await tx.delete(userBackups);
      }
      if (backupData.tables.ad_impressions) {
        await tx.delete(adImpressions);
      }
      if (backupData.tables.ad_settings) {
        await tx.delete(adSettings);
      }
      if (backupData.tables.advertisements) {
        await tx.delete(advertisements);
      }
      if (backupData.tables.notifications) {
        await tx.delete(notifications);
      }
      if (backupData.tables.business_share_members) {
        await tx.delete(businessShareMembers);
      }
      if (backupData.tables.business_shares) {
        await tx.delete(businessShares);
      }
      if (backupData.tables.household_share_members) {
        await tx.delete(householdShareMembers);
      }
      if (backupData.tables.household_shares) {
        await tx.delete(householdShares);
      }
      if (backupData.tables.chat_messages) {
        await tx.delete(chatMessages);
      }
      if (backupData.tables.chat_participants) {
        await tx.delete(chatParticipants);
      }
      if (backupData.tables.collab_chats) {
        await tx.delete(collabChats);
      }
      if (backupData.tables.collab_connections) {
        await tx.delete(collabConnections);
      }
      if (backupData.tables.collab_connection_invites) {
        await tx.delete(collabConnectionInvites);
      }
      if (backupData.tables.laundry_revisions) {
        await tx.delete(laundryRevisions);
      }
      if (backupData.tables.shared_laundry) {
        await tx.delete(sharedLaundry);
      }
      if (backupData.tables.attendance_revisions) {
        await tx.delete(attendanceRevisions);
      }
      if (backupData.tables.shared_attendance) {
        await tx.delete(sharedAttendance);
      }
      if (backupData.tables.collaboration_bindings) {
        await tx.delete(collaborationBindings);
      }
      if (backupData.tables.collaboration_messages) {
        await tx.delete(collaborationMessages);
      }
      if (backupData.tables.collaboration_links) {
        await tx.delete(collaborationLinks);
      }
      if (backupData.tables.devices) {
        await tx.delete(devices);
      }
      // Skip admin tables (admin_invitations, admin_users, admin_roles) to preserve admin access
      // Delete user_invitations before server_users (FK constraint)
      if (backupData.tables.user_invitations) {
        await tx.delete(userInvitations);
      }
      if (backupData.tables.server_users) {
        await tx.delete(serverUsers);
      }

      // Re-insert data in dependency order (parent tables first)
      // Skip admin_roles, admin_users, admin_invitations to preserve current admin access
      if (backupData.tables.server_users && backupData.tables.server_users.length > 0) {
        await tx.insert(serverUsers).values(backupData.tables.server_users);
      }
      if (backupData.tables.user_invitations && backupData.tables.user_invitations.length > 0) {
        await tx.insert(userInvitations).values(backupData.tables.user_invitations);
      }
      if (backupData.tables.devices && backupData.tables.devices.length > 0) {
        await tx.insert(devices).values(backupData.tables.devices);
      }
      if (backupData.tables.collaboration_links && backupData.tables.collaboration_links.length > 0) {
        await tx.insert(collaborationLinks).values(backupData.tables.collaboration_links);
      }
      if (backupData.tables.collaboration_messages && backupData.tables.collaboration_messages.length > 0) {
        await tx.insert(collaborationMessages).values(backupData.tables.collaboration_messages);
      }
      if (backupData.tables.collaboration_bindings && backupData.tables.collaboration_bindings.length > 0) {
        await tx.insert(collaborationBindings).values(backupData.tables.collaboration_bindings);
      }
      if (backupData.tables.shared_attendance && backupData.tables.shared_attendance.length > 0) {
        await tx.insert(sharedAttendance).values(backupData.tables.shared_attendance);
      }
      if (backupData.tables.attendance_revisions && backupData.tables.attendance_revisions.length > 0) {
        await tx.insert(attendanceRevisions).values(backupData.tables.attendance_revisions);
      }
      if (backupData.tables.shared_laundry && backupData.tables.shared_laundry.length > 0) {
        await tx.insert(sharedLaundry).values(backupData.tables.shared_laundry);
      }
      if (backupData.tables.laundry_revisions && backupData.tables.laundry_revisions.length > 0) {
        await tx.insert(laundryRevisions).values(backupData.tables.laundry_revisions);
      }
      if (backupData.tables.collab_connection_invites && backupData.tables.collab_connection_invites.length > 0) {
        await tx.insert(collabConnectionInvites).values(backupData.tables.collab_connection_invites);
      }
      if (backupData.tables.collab_connections && backupData.tables.collab_connections.length > 0) {
        await tx.insert(collabConnections).values(backupData.tables.collab_connections);
      }
      if (backupData.tables.collab_chats && backupData.tables.collab_chats.length > 0) {
        await tx.insert(collabChats).values(backupData.tables.collab_chats);
      }
      if (backupData.tables.chat_participants && backupData.tables.chat_participants.length > 0) {
        await tx.insert(chatParticipants).values(backupData.tables.chat_participants);
      }
      if (backupData.tables.chat_messages && backupData.tables.chat_messages.length > 0) {
        await tx.insert(chatMessages).values(backupData.tables.chat_messages);
      }
      if (backupData.tables.household_shares && backupData.tables.household_shares.length > 0) {
        await tx.insert(householdShares).values(backupData.tables.household_shares);
      }
      if (backupData.tables.household_share_members && backupData.tables.household_share_members.length > 0) {
        await tx.insert(householdShareMembers).values(backupData.tables.household_share_members);
      }
      if (backupData.tables.business_shares && backupData.tables.business_shares.length > 0) {
        await tx.insert(businessShares).values(backupData.tables.business_shares);
      }
      if (backupData.tables.business_share_members && backupData.tables.business_share_members.length > 0) {
        await tx.insert(businessShareMembers).values(backupData.tables.business_share_members);
      }
      if (backupData.tables.notifications && backupData.tables.notifications.length > 0) {
        await tx.insert(notifications).values(backupData.tables.notifications);
      }
      if (backupData.tables.advertisements && backupData.tables.advertisements.length > 0) {
        await tx.insert(advertisements).values(backupData.tables.advertisements);
      }
      if (backupData.tables.ad_settings && backupData.tables.ad_settings.length > 0) {
        await tx.insert(adSettings).values(backupData.tables.ad_settings);
      }
      if (backupData.tables.ad_impressions && backupData.tables.ad_impressions.length > 0) {
        await tx.insert(adImpressions).values(backupData.tables.ad_impressions);
      }
      if (backupData.tables.user_backups && backupData.tables.user_backups.length > 0) {
        await tx.insert(userBackups).values(backupData.tables.user_backups);
      }
      if (backupData.tables.backup_logs && backupData.tables.backup_logs.length > 0) {
        await tx.insert(backupLogs).values(backupData.tables.backup_logs);
      }
    });

    res.json({
      success: true,
      message: "System restored successfully",
      restoredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("System restore error:", error);
    res.status(500).json({ error: "Failed to restore system backup" });
  }
});

// POST /api/admin/system-backups - Create and save a system backup to database
router.post("/api/admin/system-backups", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can create system backups" });
    }

    const { name, description, notes } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Backup name is required" });
    }

    // Fetch all data from all tables
    const [
      usersData, devicesData, collaborationLinksData, collaborationMessagesData,
      adminRolesData, adminUsersData, adminInvitationsData, collaborationBindingsData,
      sharedAttendanceData, attendanceRevisionsData, sharedLaundryData, laundryRevisionsData,
      collabConnectionInvitesData, collabConnectionsData, collabChatsData,
      chatParticipantsData, chatMessagesData, householdSharesData, householdShareMembersData,
      businessSharesData, businessShareMembersData, notificationsData,
      advertisementsData, adSettingsData, adImpressionsData, userBackupsData, backupLogsData,
      maintenanceWindowsData, maintenanceBroadcastsData, maintenanceSessionsData,
      userInvitationsData
    ] = await Promise.all([
      db.select().from(serverUsers),
      db.select().from(devices),
      db.select().from(collaborationLinks),
      db.select().from(collaborationMessages),
      db.select().from(adminRolesTable),
      db.select().from(adminUsers),
      db.select().from(adminInvitations),
      db.select().from(collaborationBindings),
      db.select().from(sharedAttendance),
      db.select().from(attendanceRevisions),
      db.select().from(sharedLaundry),
      db.select().from(laundryRevisions),
      db.select().from(collabConnectionInvites),
      db.select().from(collabConnections),
      db.select().from(collabChats),
      db.select().from(chatParticipants),
      db.select().from(chatMessages),
      db.select().from(householdShares),
      db.select().from(householdShareMembers),
      db.select().from(businessShares),
      db.select().from(businessShareMembers),
      db.select().from(notifications),
      db.select().from(advertisements),
      db.select().from(adSettings),
      db.select().from(adImpressions),
      db.select().from(userBackups),
      db.select().from(backupLogs),
      db.select().from(maintenanceWindows),
      db.select().from(maintenanceBroadcasts),
      db.select().from(maintenanceSessions),
      db.select().from(userInvitations)
    ]);

    const tablesIncluded = [
      'server_users', 'devices', 'collaboration_links', 'collaboration_messages',
      'admin_roles', 'admin_users', 'admin_invitations', 'collaboration_bindings',
      'shared_attendance', 'attendance_revisions', 'shared_laundry', 'laundry_revisions',
      'collab_connection_invites', 'collab_connections', 'collab_chats',
      'chat_participants', 'chat_messages', 'household_shares', 'household_share_members',
      'business_shares', 'business_share_members', 'notifications',
      'advertisements', 'ad_settings', 'ad_impressions', 'user_backups', 'backup_logs',
      'maintenance_windows', 'maintenance_broadcasts', 'maintenance_sessions', 'user_invitations'
    ];

    const backupData = {
      version: "2.0",
      createdAt: new Date().toISOString(),
      createdBy: adminId,
      tables: {
        server_users: usersData,
        devices: devicesData,
        collaboration_links: collaborationLinksData,
        collaboration_messages: collaborationMessagesData,
        admin_roles: adminRolesData,
        admin_users: adminUsersData,
        admin_invitations: adminInvitationsData,
        collaboration_bindings: collaborationBindingsData,
        shared_attendance: sharedAttendanceData,
        attendance_revisions: attendanceRevisionsData,
        shared_laundry: sharedLaundryData,
        laundry_revisions: laundryRevisionsData,
        collab_connection_invites: collabConnectionInvitesData,
        collab_connections: collabConnectionsData,
        collab_chats: collabChatsData,
        chat_participants: chatParticipantsData,
        chat_messages: chatMessagesData,
        household_shares: householdSharesData,
        household_share_members: householdShareMembersData,
        business_shares: businessSharesData,
        business_share_members: businessShareMembersData,
        notifications: notificationsData,
        advertisements: advertisementsData,
        ad_settings: adSettingsData,
        ad_impressions: adImpressionsData,
        user_backups: userBackupsData,
        backup_logs: backupLogsData,
        maintenance_windows: maintenanceWindowsData,
        maintenance_broadcasts: maintenanceBroadcastsData,
        maintenance_sessions: maintenanceSessionsData,
        user_invitations: userInvitationsData
      }
    };

    const totalRecords = usersData.length + devicesData.length + collaborationLinksData.length +
      collaborationMessagesData.length + adminRolesData.length + adminUsersData.length +
      adminInvitationsData.length + collaborationBindingsData.length + sharedAttendanceData.length +
      attendanceRevisionsData.length + sharedLaundryData.length + laundryRevisionsData.length +
      collabConnectionInvitesData.length + collabConnectionsData.length + collabChatsData.length +
      chatParticipantsData.length + chatMessagesData.length + householdSharesData.length +
      householdShareMembersData.length + businessSharesData.length + businessShareMembersData.length +
      notificationsData.length + advertisementsData.length + adSettingsData.length +
      adImpressionsData.length + userBackupsData.length + backupLogsData.length +
      maintenanceWindowsData.length + maintenanceBroadcastsData.length + maintenanceSessionsData.length +
      userInvitationsData.length;

    const jsonString = JSON.stringify(backupData);
    const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');
    const checksum = generateChecksum(backupData);

    const [savedBackup] = await db.insert(systemBackups).values({
      name,
      description: description || null,
      status: 'completed',
      schemaVersion: "2.0",
      checksum,
      backupData,
      tablesIncluded,
      totalRecords,
      fileSizeBytes,
      createdById: adminId,
      notes: notes || null
    }).returning();

    res.json({
      ...savedBackup,
      backupData: undefined // Don't send full backup data in response
    });
  } catch (error) {
    console.error("Create system backup error:", error);
    res.status(500).json({ error: "Failed to create system backup" });
  }
});

// GET /api/admin/system-backups - List all saved system backups
router.get("/api/admin/system-backups", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can view system backups" });
    }

    const { status, limit = '50', offset = '0' } = req.query;

    let conditions: any[] = [];
    if (status && systemBackupStatuses.includes(status as any)) {
      conditions.push(eq(systemBackups.status, status as string));
    }

    const backups = await db.select({
      id: systemBackups.id,
      name: systemBackups.name,
      description: systemBackups.description,
      status: systemBackups.status,
      schemaVersion: systemBackups.schemaVersion,
      checksum: systemBackups.checksum,
      tablesIncluded: systemBackups.tablesIncluded,
      totalRecords: systemBackups.totalRecords,
      fileSizeBytes: systemBackups.fileSizeBytes,
      createdById: systemBackups.createdById,
      createdAt: systemBackups.createdAt,
      notes: systemBackups.notes
    }).from(systemBackups)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemBackups.createdAt))
      .limit(Math.min(parseInt(limit as string) || 50, 100))
      .offset(parseInt(offset as string) || 0);

    const [totalResult] = await db.select({ count: sql<number>`count(*)` })
      .from(systemBackups)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({
      backups,
      total: Number(totalResult.count),
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0
    });
  } catch (error) {
    console.error("List system backups error:", error);
    res.status(500).json({ error: "Failed to list system backups" });
  }
});

// GET /api/admin/system-backups/:id - Get system backup details
router.get("/api/admin/system-backups/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    const { id } = req.params;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can view system backups" });
    }

    const backup = await db.query.systemBackups.findFirst({
      where: eq(systemBackups.id, Number(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "System backup not found" });
    }

    res.json(backup);
  } catch (error) {
    console.error("Get system backup error:", error);
    res.status(500).json({ error: "Failed to get system backup" });
  }
});

// GET /api/admin/system-backups/:id/download - Download backup as JSON
router.get("/api/admin/system-backups/:id/download", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    const { id } = req.params;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can download system backups" });
    }

    const backup = await db.query.systemBackups.findFirst({
      where: eq(systemBackups.id, Number(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "System backup not found" });
    }

    const filename = `homestaff360-backup-${backup.name.replace(/[^a-zA-Z0-9]/g, '-')}-${backup.id}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(backup.backupData);
  } catch (error) {
    console.error("Download system backup error:", error);
    res.status(500).json({ error: "Failed to download system backup" });
  }
});

// POST /api/admin/system-backups/:id/restore - Restore from saved backup
router.post("/api/admin/system-backups/:id/restore", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    const { id } = req.params;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can restore system backups" });
    }

    const backup = await db.query.systemBackups.findFirst({
      where: eq(systemBackups.id, Number(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "System backup not found" });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({ error: "Cannot restore from incomplete backup" });
    }

    const rawBackupData = backup.backupData as any;
    if (!rawBackupData || !rawBackupData.version || !rawBackupData.tables) {
      return res.status(400).json({ error: "Invalid backup data" });
    }

    // Convert date strings back to Date objects
    const backupData = parseDateStrings(rawBackupData);

    // Perform restoration in a transaction
    // NOTE: We skip restoring admin_users, admin_roles, and admin_invitations to avoid
    // locking out the current admin and breaking FK constraints with system_backups
    await db.transaction(async (tx) => {
      // Delete existing data in reverse dependency order (skip admin tables)
      if (backupData.tables.maintenance_sessions) {
        await tx.delete(maintenanceSessions);
      }
      if (backupData.tables.maintenance_broadcasts) {
        await tx.delete(maintenanceBroadcasts);
      }
      if (backupData.tables.maintenance_windows) {
        await tx.delete(maintenanceWindows);
      }
      if (backupData.tables.backup_logs) {
        await tx.delete(backupLogs);
      }
      if (backupData.tables.user_backups) {
        await tx.delete(userBackups);
      }
      if (backupData.tables.ad_impressions) {
        await tx.delete(adImpressions);
      }
      if (backupData.tables.ad_settings) {
        await tx.delete(adSettings);
      }
      if (backupData.tables.advertisements) {
        await tx.delete(advertisements);
      }
      if (backupData.tables.notifications) {
        await tx.delete(notifications);
      }
      if (backupData.tables.business_share_members) {
        await tx.delete(businessShareMembers);
      }
      if (backupData.tables.business_shares) {
        await tx.delete(businessShares);
      }
      if (backupData.tables.household_share_members) {
        await tx.delete(householdShareMembers);
      }
      if (backupData.tables.household_shares) {
        await tx.delete(householdShares);
      }
      if (backupData.tables.chat_messages) {
        await tx.delete(chatMessages);
      }
      if (backupData.tables.chat_participants) {
        await tx.delete(chatParticipants);
      }
      if (backupData.tables.collab_chats) {
        await tx.delete(collabChats);
      }
      if (backupData.tables.collab_connections) {
        await tx.delete(collabConnections);
      }
      if (backupData.tables.collab_connection_invites) {
        await tx.delete(collabConnectionInvites);
      }
      if (backupData.tables.laundry_revisions) {
        await tx.delete(laundryRevisions);
      }
      if (backupData.tables.shared_laundry) {
        await tx.delete(sharedLaundry);
      }
      if (backupData.tables.attendance_revisions) {
        await tx.delete(attendanceRevisions);
      }
      if (backupData.tables.shared_attendance) {
        await tx.delete(sharedAttendance);
      }
      if (backupData.tables.collaboration_bindings) {
        await tx.delete(collaborationBindings);
      }
      if (backupData.tables.collaboration_messages) {
        await tx.delete(collaborationMessages);
      }
      if (backupData.tables.collaboration_links) {
        await tx.delete(collaborationLinks);
      }
      if (backupData.tables.devices) {
        await tx.delete(devices);
      }
      // Skip admin_invitations, admin_users, admin_roles to preserve admin access
      // Delete user_invitations before server_users (FK constraint)
      if (backupData.tables.user_invitations) {
        await tx.delete(userInvitations);
      }
      if (backupData.tables.server_users) {
        await tx.delete(serverUsers);
      }

      // Insert data in dependency order
      // Skip admin_roles, admin_users, admin_invitations to preserve current admin access
      if (backupData.tables.server_users && backupData.tables.server_users.length > 0) {
        await tx.insert(serverUsers).values(backupData.tables.server_users);
      }
      if (backupData.tables.user_invitations && backupData.tables.user_invitations.length > 0) {
        await tx.insert(userInvitations).values(backupData.tables.user_invitations);
      }
      if (backupData.tables.devices && backupData.tables.devices.length > 0) {
        await tx.insert(devices).values(backupData.tables.devices);
      }
      if (backupData.tables.collaboration_links && backupData.tables.collaboration_links.length > 0) {
        await tx.insert(collaborationLinks).values(backupData.tables.collaboration_links);
      }
      if (backupData.tables.collaboration_messages && backupData.tables.collaboration_messages.length > 0) {
        await tx.insert(collaborationMessages).values(backupData.tables.collaboration_messages);
      }
      if (backupData.tables.collaboration_bindings && backupData.tables.collaboration_bindings.length > 0) {
        await tx.insert(collaborationBindings).values(backupData.tables.collaboration_bindings);
      }
      if (backupData.tables.shared_attendance && backupData.tables.shared_attendance.length > 0) {
        await tx.insert(sharedAttendance).values(backupData.tables.shared_attendance);
      }
      if (backupData.tables.attendance_revisions && backupData.tables.attendance_revisions.length > 0) {
        await tx.insert(attendanceRevisions).values(backupData.tables.attendance_revisions);
      }
      if (backupData.tables.shared_laundry && backupData.tables.shared_laundry.length > 0) {
        await tx.insert(sharedLaundry).values(backupData.tables.shared_laundry);
      }
      if (backupData.tables.laundry_revisions && backupData.tables.laundry_revisions.length > 0) {
        await tx.insert(laundryRevisions).values(backupData.tables.laundry_revisions);
      }
      if (backupData.tables.collab_connection_invites && backupData.tables.collab_connection_invites.length > 0) {
        await tx.insert(collabConnectionInvites).values(backupData.tables.collab_connection_invites);
      }
      if (backupData.tables.collab_connections && backupData.tables.collab_connections.length > 0) {
        await tx.insert(collabConnections).values(backupData.tables.collab_connections);
      }
      if (backupData.tables.collab_chats && backupData.tables.collab_chats.length > 0) {
        await tx.insert(collabChats).values(backupData.tables.collab_chats);
      }
      if (backupData.tables.chat_participants && backupData.tables.chat_participants.length > 0) {
        await tx.insert(chatParticipants).values(backupData.tables.chat_participants);
      }
      if (backupData.tables.chat_messages && backupData.tables.chat_messages.length > 0) {
        await tx.insert(chatMessages).values(backupData.tables.chat_messages);
      }
      if (backupData.tables.household_shares && backupData.tables.household_shares.length > 0) {
        await tx.insert(householdShares).values(backupData.tables.household_shares);
      }
      if (backupData.tables.household_share_members && backupData.tables.household_share_members.length > 0) {
        await tx.insert(householdShareMembers).values(backupData.tables.household_share_members);
      }
      if (backupData.tables.business_shares && backupData.tables.business_shares.length > 0) {
        await tx.insert(businessShares).values(backupData.tables.business_shares);
      }
      if (backupData.tables.business_share_members && backupData.tables.business_share_members.length > 0) {
        await tx.insert(businessShareMembers).values(backupData.tables.business_share_members);
      }
      if (backupData.tables.notifications && backupData.tables.notifications.length > 0) {
        await tx.insert(notifications).values(backupData.tables.notifications);
      }
      if (backupData.tables.advertisements && backupData.tables.advertisements.length > 0) {
        await tx.insert(advertisements).values(backupData.tables.advertisements);
      }
      if (backupData.tables.ad_settings && backupData.tables.ad_settings.length > 0) {
        await tx.insert(adSettings).values(backupData.tables.ad_settings);
      }
      if (backupData.tables.ad_impressions && backupData.tables.ad_impressions.length > 0) {
        await tx.insert(adImpressions).values(backupData.tables.ad_impressions);
      }
      if (backupData.tables.user_backups && backupData.tables.user_backups.length > 0) {
        await tx.insert(userBackups).values(backupData.tables.user_backups);
      }
      if (backupData.tables.backup_logs && backupData.tables.backup_logs.length > 0) {
        await tx.insert(backupLogs).values(backupData.tables.backup_logs);
      }
      if (backupData.tables.maintenance_windows && backupData.tables.maintenance_windows.length > 0) {
        await tx.insert(maintenanceWindows).values(backupData.tables.maintenance_windows);
      }
      if (backupData.tables.maintenance_broadcasts && backupData.tables.maintenance_broadcasts.length > 0) {
        await tx.insert(maintenanceBroadcasts).values(backupData.tables.maintenance_broadcasts);
      }
      if (backupData.tables.maintenance_sessions && backupData.tables.maintenance_sessions.length > 0) {
        await tx.insert(maintenanceSessions).values(backupData.tables.maintenance_sessions);
      }
    });

    res.json({
      success: true,
      message: "System restored successfully from backup",
      backupId: backup.id,
      restoredAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Restore from system backup error:", error);
    res.status(500).json({ error: "Failed to restore from system backup" });
  }
});

// DELETE /api/admin/system-backups/:id - Delete a system backup
router.delete("/api/admin/system-backups/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    const { id } = req.params;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can delete system backups" });
    }

    const backup = await db.query.systemBackups.findFirst({
      where: eq(systemBackups.id, Number(id))
    });

    if (!backup) {
      return res.status(404).json({ error: "System backup not found" });
    }

    await db.update(systemBackups)
      .set({ status: 'deleted', backupData: null })
      .where(eq(systemBackups.id, Number(id)));

    res.json({
      success: true,
      message: "System backup deleted successfully"
    });
  } catch (error) {
    console.error("Delete system backup error:", error);
    res.status(500).json({ error: "Failed to delete system backup" });
  }
});

// GET /api/admin/system-backups/stats - Get system backup statistics
router.get("/api/admin/system-backups-stats", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin?.adminId;
    
    const hasAccess = await isSuperAdmin(adminId);
    if (!hasAccess) {
      return res.status(403).json({ error: "Only super administrators can view system backup stats" });
    }

    const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(systemBackups);
    const [completedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(systemBackups)
      .where(eq(systemBackups.status, 'completed'));
    const [deletedResult] = await db.select({ count: sql<number>`count(*)` })
      .from(systemBackups)
      .where(eq(systemBackups.status, 'deleted'));

    const latestBackup = await db.query.systemBackups.findFirst({
      where: eq(systemBackups.status, 'completed'),
      orderBy: desc(systemBackups.createdAt)
    });

    const totalSize = await db.select({ 
      totalSize: sql<number>`COALESCE(SUM(file_size_bytes), 0)` 
    }).from(systemBackups)
      .where(eq(systemBackups.status, 'completed'));

    res.json({
      total: Number(totalResult.count),
      completed: Number(completedResult.count),
      deleted: Number(deletedResult.count),
      latestBackup: latestBackup ? {
        id: latestBackup.id,
        name: latestBackup.name,
        createdAt: latestBackup.createdAt,
        totalRecords: latestBackup.totalRecords,
        fileSizeBytes: latestBackup.fileSizeBytes
      } : null,
      totalSizeBytes: Number(totalSize[0]?.totalSize || 0)
    });
  } catch (error) {
    console.error("System backup stats error:", error);
    res.status(500).json({ error: "Failed to get system backup stats" });
  }
});

// ============ MAINTENANCE NOTIFICATION SYSTEM ============

// GET /api/admin/maintenance/windows - List all maintenance windows
router.get("/api/admin/maintenance/windows", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = db.select().from(maintenanceWindows);
    
    if (status) {
      query = query.where(eq(maintenanceWindows.status, status as string)) as any;
    }

    const windows = await query
      .orderBy(desc(maintenanceWindows.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(maintenanceWindows);

    res.json({
      windows,
      total: Number(count),
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error("List maintenance windows error:", error);
    res.status(500).json({ error: "Failed to list maintenance windows" });
  }
});

// POST /api/admin/maintenance/windows - Create new maintenance window
router.post("/api/admin/maintenance/windows", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const parsed = insertMaintenanceWindowSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.message });
    }

    const [window] = await db.insert(maintenanceWindows).values({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : null,
      createdById: adminId,
      updatedById: adminId
    }).returning();

    res.json(window);
  } catch (error) {
    console.error("Create maintenance window error:", error);
    res.status(500).json({ error: "Failed to create maintenance window" });
  }
});

// GET /api/admin/maintenance/windows/:id - Get single window details
router.get("/api/admin/maintenance/windows/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const window = await db.query.maintenanceWindows.findFirst({
      where: eq(maintenanceWindows.id, Number(id))
    });

    if (!window) {
      return res.status(404).json({ error: "Maintenance window not found" });
    }

    // Get associated broadcasts
    const broadcasts = await db.select().from(maintenanceBroadcasts)
      .where(eq(maintenanceBroadcasts.windowId, Number(id)))
      .orderBy(desc(maintenanceBroadcasts.sentAt));

    res.json({ ...window, broadcasts });
  } catch (error) {
    console.error("Get maintenance window error:", error);
    res.status(500).json({ error: "Failed to get maintenance window" });
  }
});

// PATCH /api/admin/maintenance/windows/:id - Update maintenance window
router.patch("/api/admin/maintenance/windows/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;

    const existing = await db.query.maintenanceWindows.findFirst({
      where: eq(maintenanceWindows.id, Number(id))
    });

    if (!existing) {
      return res.status(404).json({ error: "Maintenance window not found" });
    }

    const updateData: any = { updatedAt: new Date(), updatedById: adminId };
    
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.message !== undefined) updateData.message = req.body.message;
    if (req.body.severity !== undefined) updateData.severity = req.body.severity;
    if (req.body.startAt !== undefined) updateData.startAt = new Date(req.body.startAt);
    if (req.body.endAt !== undefined) updateData.endAt = req.body.endAt ? new Date(req.body.endAt) : null;
    if (req.body.durationMinutes !== undefined) updateData.durationMinutes = req.body.durationMinutes;
    if (req.body.recurrence !== undefined) updateData.recurrence = req.body.recurrence;
    if (req.body.weekday !== undefined) updateData.weekday = req.body.weekday;
    if (req.body.dayOfMonth !== undefined) updateData.dayOfMonth = req.body.dayOfMonth;
    if (req.body.forceLogout !== undefined) updateData.forceLogout = req.body.forceLogout;
    if (req.body.showMaintenancePage !== undefined) updateData.showMaintenancePage = req.body.showMaintenancePage;
    if (req.body.status !== undefined) updateData.status = req.body.status;

    const [updated] = await db.update(maintenanceWindows)
      .set(updateData)
      .where(eq(maintenanceWindows.id, Number(id)))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Update maintenance window error:", error);
    res.status(500).json({ error: "Failed to update maintenance window" });
  }
});

// DELETE /api/admin/maintenance/windows/:id - Delete maintenance window
router.delete("/api/admin/maintenance/windows/:id", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if window exists
    const existing = await db.query.maintenanceWindows.findFirst({
      where: eq(maintenanceWindows.id, Number(id))
    });

    if (!existing) {
      return res.status(404).json({ error: "Maintenance window not found" });
    }

    // Delete associated broadcasts first
    await db.delete(maintenanceBroadcasts).where(eq(maintenanceBroadcasts.windowId, Number(id)));

    // Delete associated sessions
    await db.delete(maintenanceSessions).where(eq(maintenanceSessions.windowId, Number(id)));

    // Delete the window
    await db.delete(maintenanceWindows).where(eq(maintenanceWindows.id, Number(id)));

    res.json({ success: true, message: "Maintenance window deleted" });
  } catch (error) {
    console.error("Delete maintenance window error:", error);
    res.status(500).json({ error: "Failed to delete maintenance window" });
  }
});

// POST /api/admin/maintenance/windows/:id/activate - Activate maintenance mode
router.post("/api/admin/maintenance/windows/:id/activate", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;

    const window = await db.query.maintenanceWindows.findFirst({
      where: eq(maintenanceWindows.id, Number(id))
    });

    if (!window) {
      return res.status(404).json({ error: "Maintenance window not found" });
    }

    // Deactivate any existing active sessions
    await db.update(maintenanceSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(maintenanceSessions.isActive, true));

    // Create new active session
    const endTime = window.endAt || new Date(Date.now() + window.durationMinutes * 60 * 1000);
    
    const [session] = await db.insert(maintenanceSessions).values({
      windowId: Number(id),
      isActive: true,
      forceLogoutEnabled: window.forceLogout,
      maintenancePageEnabled: window.showMaintenancePage,
      endTime,
      message: window.message,
      activatedById: adminId
    }).returning();

    // Update window status to active
    await db.update(maintenanceWindows)
      .set({ status: 'active', updatedAt: new Date(), updatedById: adminId })
      .where(eq(maintenanceWindows.id, Number(id)));

    // Get user count for broadcast
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(serverUsers);

    // Create broadcast record
    await db.insert(maintenanceBroadcasts).values({
      windowId: Number(id),
      broadcastType: 'scheduled',
      title: window.title,
      message: window.message,
      severity: window.severity,
      forceLogout: window.forceLogout,
      targetUserCount: Number(count),
      createdById: adminId
    });

    res.json({
      success: true,
      session,
      message: "Maintenance mode activated"
    });
  } catch (error) {
    console.error("Activate maintenance error:", error);
    res.status(500).json({ error: "Failed to activate maintenance mode" });
  }
});

// POST /api/admin/maintenance/windows/:id/deactivate - Deactivate maintenance mode
router.post("/api/admin/maintenance/windows/:id/deactivate", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { id } = req.params;

    // Deactivate sessions for this window
    await db.update(maintenanceSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(and(
        eq(maintenanceSessions.windowId, Number(id)),
        eq(maintenanceSessions.isActive, true)
      ));

    // Update window status
    await db.update(maintenanceWindows)
      .set({ status: 'completed', updatedAt: new Date(), updatedById: adminId })
      .where(eq(maintenanceWindows.id, Number(id)));

    res.json({
      success: true,
      message: "Maintenance mode deactivated"
    });
  } catch (error) {
    console.error("Deactivate maintenance error:", error);
    res.status(500).json({ error: "Failed to deactivate maintenance mode" });
  }
});

// POST /api/admin/maintenance/broadcast - Send ad-hoc broadcast
router.post("/api/admin/maintenance/broadcast", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).adminId;
    const { title, message, severity = 'info', forceLogout = false, durationMinutes = 30 } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    // Get user count
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(serverUsers);

    // If forceLogout is requested, create an active session
    if (forceLogout) {
      // Deactivate any existing active sessions
      await db.update(maintenanceSessions)
        .set({ isActive: false, endedAt: new Date() })
        .where(eq(maintenanceSessions.isActive, true));

      // Create new session without a window
      await db.insert(maintenanceSessions).values({
        isActive: true,
        forceLogoutEnabled: true,
        maintenancePageEnabled: true,
        endTime: new Date(Date.now() + durationMinutes * 60 * 1000),
        message,
        activatedById: adminId
      });
    }

    // Create broadcast record
    const [broadcast] = await db.insert(maintenanceBroadcasts).values({
      broadcastType: 'adhoc',
      title,
      message,
      severity,
      forceLogout,
      targetUserCount: Number(count),
      createdById: adminId
    }).returning();

    res.json({
      success: true,
      broadcast,
      targetUserCount: Number(count)
    });
  } catch (error) {
    console.error("Send broadcast error:", error);
    res.status(500).json({ error: "Failed to send broadcast" });
  }
});

// GET /api/admin/maintenance/broadcasts - List all broadcasts
router.get("/api/admin/maintenance/broadcasts", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const broadcasts = await db.select().from(maintenanceBroadcasts)
      .orderBy(desc(maintenanceBroadcasts.sentAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(maintenanceBroadcasts);

    res.json({
      broadcasts,
      total: Number(count)
    });
  } catch (error) {
    console.error("List broadcasts error:", error);
    res.status(500).json({ error: "Failed to list broadcasts" });
  }
});

// GET /api/admin/maintenance/sessions - Get active maintenance session (if any)
router.get("/api/admin/maintenance/sessions", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const activeSession = await db.query.maintenanceSessions.findFirst({
      where: eq(maintenanceSessions.isActive, true)
    });

    res.json({ activeSession });
  } catch (error) {
    console.error("Get active session error:", error);
    res.status(500).json({ error: "Failed to get active session" });
  }
});

// POST /api/admin/maintenance/deactivate-all - Deactivate all maintenance sessions
router.post("/api/admin/maintenance/deactivate-all", authenticateAdmin, async (req: Request, res: Response) => {
  try {
    await db.update(maintenanceSessions)
      .set({ isActive: false, endedAt: new Date() })
      .where(eq(maintenanceSessions.isActive, true));

    // Update all active windows to completed
    await db.update(maintenanceWindows)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(maintenanceWindows.status, 'active'));

    res.json({ success: true, message: "All maintenance sessions deactivated" });
  } catch (error) {
    console.error("Deactivate all error:", error);
    res.status(500).json({ error: "Failed to deactivate all sessions" });
  }
});

// ============ PUBLIC MAINTENANCE STATUS API ============

// GET /api/maintenance/status - Check current maintenance status (for clients)
router.get("/api/maintenance/status", async (req: Request, res: Response) => {
  try {
    const activeSession = await db.query.maintenanceSessions.findFirst({
      where: eq(maintenanceSessions.isActive, true)
    });

    if (!activeSession) {
      return res.json({
        isActive: false,
        maintenance: null
      });
    }

    // Calculate countdown
    const now = new Date();
    const endTime = activeSession.endTime ? new Date(activeSession.endTime) : null;
    const countdownSeconds = endTime ? Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000)) : null;

    res.json({
      isActive: true,
      maintenance: {
        message: activeSession.message,
        forceLogout: activeSession.forceLogoutEnabled,
        showMaintenancePage: activeSession.maintenancePageEnabled,
        endTime: activeSession.endTime,
        countdownSeconds,
        startedAt: activeSession.startedAt
      }
    });
  } catch (error) {
    console.error("Get maintenance status error:", error);
    res.status(500).json({ error: "Failed to get maintenance status" });
  }
});

// GET /api/maintenance/check-logout - Check if user should be logged out (for polling)
router.get("/api/maintenance/check-logout", async (req: Request, res: Response) => {
  try {
    const activeSession = await db.query.maintenanceSessions.findFirst({
      where: and(
        eq(maintenanceSessions.isActive, true),
        eq(maintenanceSessions.forceLogoutEnabled, true)
      )
    });

    res.json({
      shouldLogout: !!activeSession,
      message: activeSession?.message || null
    });
  } catch (error) {
    console.error("Check logout error:", error);
    res.status(500).json({ error: "Failed to check logout status" });
  }
});

// ============ PHONE CHECK & INVITE/CONNECT API ============

// GET /api/phone/check - Check if a phone number exists in the system
router.get("/api/phone/check", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { phone } = req.query;

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const normalizedPhone = normalizePhoneWithCountryCode(phone);
    
    const targetUser = await findUserByPhone(phone);

    if (!targetUser) {
      return res.json({ exists: false });
    }

    let isConnected = false;
    
    const existingConnection = await db.query.collabConnections.findFirst({
      where: or(
        and(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, targetUser.id)
        ),
        and(
          eq(collabConnections.userAId, targetUser.id),
          eq(collabConnections.userBId, userId)
        )
      )
    });

    if (existingConnection && existingConnection.status === 'accepted') {
      isConnected = true;
    }

    res.json({
      exists: true,
      userId: targetUser.id,
      displayName: targetUser.displayName,
      userType: targetUser.userType,
      isConnected
    });
  } catch (error) {
    console.error("Phone check error:", error);
    res.status(500).json({ error: "Failed to check phone number" });
  }
});

// POST /api/invitations/send - Send an SMS invitation to a non-registered user
router.post("/api/invitations/send", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { phone, inviterName, message } = req.body;

    if (!phone || !inviterName) {
      return res.status(400).json({ error: "Phone and inviterName are required" });
    }

    const phoneValidation = validateAndFormatPhone(phone);
    if (!phoneValidation.isValid || !phoneValidation.e164) {
      return res.status(400).json({ 
        error: phoneValidation.error || "Invalid phone number format"
      });
    }

    const normalizedPhone = phoneValidation.e164;

    const existingUser = await findUserByPhone(phone);
    if (existingUser) {
      return res.status(400).json({ 
        error: "This phone number is already registered. Use connection request instead." 
      });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentInvites = await db.query.userInvitations.findMany({
      where: and(
        eq(userInvitations.invitedPhone, normalizedPhone),
        sql`${userInvitations.sentAt} > ${oneDayAgo}`
      )
    });

    if (recentInvites.length >= 3) {
      return res.status(429).json({ 
        error: "Maximum invites reached for this phone number today. Please try again tomorrow." 
      });
    }

    const appLink = "https://homestaff360.app/download";
    const smsMessage = message 
      ? `Hi! ${inviterName} has invited you to join Home Staff 360: "${message}". Download now: ${appLink}`
      : `Hi! ${inviterName} has invited you to join Home Staff 360, a household management app. Download now: ${appLink}`;

    let smsSent = false;
    if (process.env.TWILIO_PHONE_NUMBER && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      const maskedTwilioPhone = twilioPhone.length > 8 
        ? `${twilioPhone.slice(0, 4)}****${twilioPhone.slice(-4)}`
        : '****';
      
      console.log(`[SMS Invite] Attempting to send SMS invitation:`);
      console.log(`  - To: ${normalizedPhone}`);
      console.log(`  - From: ${maskedTwilioPhone}`);
      console.log(`  - Message length: ${smsMessage.length} chars`);
      
      try {
        const messageResult = await twilioClient.messages.create({
          body: smsMessage,
          to: normalizedPhone,
          from: twilioPhone
        });
        smsSent = true;
        console.log(`[SMS Invite] SUCCESS - Message SID: ${messageResult.sid}, Status: ${messageResult.status}`);
      } catch (smsError: any) {
        console.error(`[SMS Invite] FAILED - Error sending SMS to ${normalizedPhone}:`);
        console.error(`  - Error Code: ${smsError.code || 'N/A'}`);
        console.error(`  - Error Message: ${smsError.message || 'Unknown error'}`);
        console.error(`  - More Info: ${smsError.moreInfo || 'N/A'}`);
        console.error(`  - Status: ${smsError.status || 'N/A'}`);
        console.error(`  - Full Error:`, JSON.stringify(smsError, null, 2));
        
        if (process.env.NODE_ENV !== "development") {
          return res.status(500).json({ 
            error: "Failed to send SMS invitation",
            details: smsError.message || "Twilio error occurred"
          });
        }
      }
    } else {
      console.log(`[SMS Invite] Twilio not configured - missing credentials`);
      console.log(`  - TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? 'set' : 'missing'}`);
      console.log(`  - TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? 'set' : 'missing'}`);
      console.log(`  - TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'set' : 'missing'}`);
    }

    await db.insert(userInvitations).values({
      inviterUserId: userId,
      invitedPhone: normalizedPhone,
      status: "pending"
    });

    res.json({ 
      success: true, 
      message: smsSent ? "Invitation sent successfully" : "Invitation recorded (SMS not configured)"
    });
  } catch (error) {
    console.error("Send invitation error:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// POST /api/connections/request - Send a connection request to an existing user
router.post("/api/connections/request", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { targetUserId, requesterName, message } = req.body;

    if (!targetUserId || !requesterName) {
      return res.status(400).json({ error: "targetUserId and requesterName are required" });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot send connection request to yourself" });
    }

    const targetUser = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, targetUserId)
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    const currentUser = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    const existingConnection = await db.query.collabConnections.findFirst({
      where: or(
        and(
          eq(collabConnections.userAId, userId),
          eq(collabConnections.userBId, targetUserId)
        ),
        and(
          eq(collabConnections.userAId, targetUserId),
          eq(collabConnections.userBId, userId)
        )
      )
    });

    if (existingConnection) {
      return res.status(400).json({ error: "Connection already exists" });
    }

    const pendingInvite = await db.query.collabConnectionInvites.findFirst({
      where: and(
        eq(collabConnectionInvites.senderId, userId),
        eq(collabConnectionInvites.targetUserId, targetUserId),
        eq(collabConnectionInvites.status, 'pending')
      )
    });

    if (pendingInvite) {
      return res.status(400).json({ error: "Connection request already pending" });
    }

    const connectionInviteId = uuidv4();
    const normalizedPhone = targetUser.phone;
    const currentUserMode = currentUser.userType || 'HOME';

    await db.insert(collabConnectionInvites).values({
      id: connectionInviteId,
      senderId: userId,
      senderMode: currentUserMode,
      targetPhone: normalizedPhone,
      targetPhoneNormalized: normalizedPhone,
      targetUserId: targetUserId,
      status: 'pending',
      message: message || null
    });

    const notificationId = uuidv4();
    const targetUserMode = targetUser.userType || 'HOME';
    const createdAt = new Date();
    
    await db.insert(notifications).values({
      id: notificationId,
      userId: targetUserId,
      userMode: targetUserMode,
      category: 'collaboration',
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${requesterName} wants to connect with you`,
      entityType: 'connection_invite',
      entityId: connectionInviteId,
      payload: JSON.stringify({ senderId: userId, senderName: requesterName, message }),
      actionRequired: true,
      actionType: 'approve',
      createdAt
    });

    // Emit real-time invite event
    const targetNumId = typeof targetUserId === 'string' ? parseInt(targetUserId, 10) : targetUserId;
    if (!isNaN(targetNumId)) {
      emitConnectionInvite(targetNumId, {
        id: connectionInviteId,
        senderId: userId,
        senderName: requesterName,
        senderMode: currentUserMode,
        message,
        status: 'pending',
        createdAt
      });
      
      emitNotification(targetNumId, {
        id: notificationId,
        userId: targetUserId,
        userMode: targetUserMode,
        category: 'collaboration',
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${requesterName} wants to connect with you`,
        entityType: 'connection_invite',
        entityId: connectionInviteId,
        isRead: false,
        createdAt
      });
    }

    res.json({ 
      success: true, 
      connectionId: connectionInviteId 
    });
  } catch (error) {
    console.error("Connection request error:", error);
    res.status(500).json({ error: "Failed to send connection request" });
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
      name: "Owner Admin",
      isActive: true
    });
    console.log("Default admin user created");
  }
}

initializeDefaultAdmin().catch(console.error);

export default router;
