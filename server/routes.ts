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
  approvalStatuses
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

// Send connection request
router.post("/api/connections/request", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { targetUserId, senderMode, message } = req.body;

    if (!targetUserId || !senderMode) {
      return res.status(400).json({ error: "Target user ID and sender mode are required" });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ error: "Cannot send connection request to yourself" });
    }

    // Check if target user exists
    const targetUser = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, targetUserId)
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    // Check existing connection
    const existingConnection = await db.query.collabConnections.findFirst({
      where: or(
        and(eq(collabConnections.userAId, userId), eq(collabConnections.userBId, targetUserId)),
        and(eq(collabConnections.userAId, targetUserId), eq(collabConnections.userBId, userId))
      )
    });

    if (existingConnection) {
      return res.status(400).json({ error: "Already connected with this user" });
    }

    // Check pending invite
    const pendingInvite = await db.query.collabConnectionInvites.findFirst({
      where: and(
        or(
          and(eq(collabConnectionInvites.senderId, userId), eq(collabConnectionInvites.targetUserId, targetUserId)),
          and(eq(collabConnectionInvites.senderId, targetUserId), eq(collabConnectionInvites.targetUserId, userId))
        ),
        eq(collabConnectionInvites.status, 'pending')
      )
    });

    if (pendingInvite) {
      // If they sent us an invite, auto-accept
      if (pendingInvite.senderId === targetUserId) {
        return res.json({ 
          success: true, 
          message: "You have a pending invite from this user. Accepting it now.",
          inviteId: pendingInvite.id,
          autoAccept: true
        });
      }
      return res.status(400).json({ error: "Connection request already pending" });
    }

    // Get sender info
    const sender = await db.query.serverUsers.findFirst({
      where: eq(serverUsers.id, userId)
    });

    // Create invite
    const inviteId = uuidv4();
    const normalizedPhone = targetUser.phone ? normalizePhoneWithCountryCode(targetUser.phone) : '';

    await db.insert(collabConnectionInvites).values({
      id: inviteId,
      senderId: userId,
      senderMode,
      targetPhone: targetUser.phone || '',
      targetPhoneNormalized: normalizedPhone,
      targetUserId,
      status: 'pending',
      message: message || null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Create notification for target user (send to both modes)
    await createNotification(
      targetUserId, 
      'HOME',
      'connection_request',
      'New Connection Request',
      `${sender?.displayName || 'Someone'} wants to connect with you.`,
      'connection',
      inviteId,
      { senderId: userId, senderName: sender?.displayName }
    );

    await createNotification(
      targetUserId, 
      'STAFF',
      'connection_request',
      'New Connection Request',
      `${sender?.displayName || 'Someone'} wants to connect with you.`,
      'connection',
      inviteId,
      { senderId: userId, senderName: sender?.displayName }
    );

    res.json({ success: true, inviteId });
  } catch (error) {
    console.error("Connection request error:", error);
    res.status(500).json({ error: "Failed to send connection request" });
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

    // Delete connection
    await db.delete(collabConnections).where(eq(collabConnections.id, id));

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

    // Get all chats where user is a participant
    const participations = await db.query.chatParticipants.findMany({
      where: and(
        eq(chatParticipants.userId, userId),
        sql`${chatParticipants.leftAt} IS NULL`
      )
    });

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

// GET /api/ads/next - Get next ad to display (weighted random selection)
router.get("/api/ads/next", async (req: Request, res: Response) => {
  try {
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

    // Weighted random selection
    const totalWeight = activeAds.reduce((sum, ad) => sum + (ad.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    let selectedAd = activeAds[0];
    for (const ad of activeAds) {
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
      targetUrl: selectedAd.targetUrl
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
      endDate: data.endDate || null
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
