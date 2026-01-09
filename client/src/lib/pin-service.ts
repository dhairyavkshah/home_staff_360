import { storage } from "./storage";
import { biometricService } from "./biometric-service";

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const LOCKOUT_STORAGE_KEY = "hm_pin_lockout";
const PIN_HASH_STORAGE_KEY = "hm_pin_hash";
const PIN_SALT = "homestaff360_pin_salt_v1";

interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number | null;
}

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(PIN_SALT + pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function getStoredPinHash(): string | null {
  try {
    return localStorage.getItem(PIN_HASH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredPinHash(hash: string): void {
  localStorage.setItem(PIN_HASH_STORAGE_KEY, hash);
}

function clearStoredPinHash(): void {
  localStorage.removeItem(PIN_HASH_STORAGE_KEY);
}

function getLockoutState(): LockoutState {
  try {
    const stored = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { failedAttempts: 0, lockoutUntil: null };
}

function setLockoutState(state: LockoutState): void {
  localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
}

function clearLockoutState(): void {
  localStorage.removeItem(LOCKOUT_STORAGE_KEY);
}

export const pinService = {
  isPinEnabled(): boolean {
    const settings = storage.getSettings();
    const hasHash = !!getStoredPinHash();
    const hasLegacyPin = !!settings.pinCode;
    return settings.pinEnabled === true && (hasHash || hasLegacyPin);
  },

  isLockedOut(): boolean {
    const state = getLockoutState();
    if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
      return true;
    }
    // Clear expired lockout
    if (state.lockoutUntil && Date.now() >= state.lockoutUntil) {
      clearLockoutState();
    }
    return false;
  },

  getLockoutRemainingMs(): number {
    const state = getLockoutState();
    if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
      return state.lockoutUntil - Date.now();
    }
    return 0;
  },

  getFailedAttempts(): number {
    const state = getLockoutState();
    return state.failedAttempts;
  },

  getRemainingAttempts(): number {
    return MAX_ATTEMPTS - this.getFailedAttempts();
  },

  recordFailedAttempt(): { isLockedOut: boolean; remainingAttempts: number } {
    const state = getLockoutState();
    state.failedAttempts += 1;
    
    if (state.failedAttempts >= MAX_ATTEMPTS) {
      state.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutState(state);
      return { isLockedOut: true, remainingAttempts: 0 };
    }
    
    setLockoutState(state);
    return { isLockedOut: false, remainingAttempts: MAX_ATTEMPTS - state.failedAttempts };
  },

  clearFailedAttempts(): void {
    clearLockoutState();
  },

  async validatePin(pin: string): Promise<boolean> {
    const storedHash = getStoredPinHash();
    
    if (storedHash) {
      const inputHash = await hashPin(pin);
      const isValid = inputHash === storedHash;
      if (isValid) {
        this.clearFailedAttempts();
      }
      return isValid;
    }
    
    // Legacy fallback for users with plain text PIN (migrate on next set)
    const settings = storage.getSettings();
    if (settings.pinCode) {
      const isValid = settings.pinCode === pin;
      if (isValid) {
        this.clearFailedAttempts();
        // Migrate to hashed storage
        await this.setPin(pin);
      }
      return isValid;
    }
    
    return false;
  },

  async setPin(pin: string): Promise<void> {
    const hashedPin = await hashPin(pin);
    setStoredPinHash(hashedPin);
    
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      pinEnabled: true,
      pinCode: undefined, // Clear legacy plain text storage
    });
  },

  disablePin(): void {
    clearStoredPinHash();
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      pinEnabled: false,
      pinCode: undefined,
    });
    biometricService.disableBiometric();
  },

  async changePin(currentPin: string, newPin: string): Promise<boolean> {
    const isValid = await this.validatePin(currentPin);
    if (!isValid) {
      return false;
    }
    await this.setPin(newPin);
    return true;
  },

  getPinLength(): number {
    return PIN_LENGTH;
  },

  isBiometricAvailable(): boolean {
    return biometricService.isHardwareAvailable();
  },

  async checkPlatformAuthenticator(): Promise<boolean> {
    return biometricService.isPlatformAuthenticatorAvailable();
  },

  isBiometricEnabled(): boolean {
    return biometricService.isBiometricEnabled();
  },

  async initializeBiometric(): Promise<boolean> {
    return biometricService.initializeAndCheckEnabled();
  },

  async enrollBiometric(): Promise<{ success: boolean; error?: string }> {
    return biometricService.enrollBiometric();
  },

  async authenticateWithBiometric(): Promise<{ success: boolean; error?: string }> {
    return biometricService.authenticate();
  },

  disableBiometric(): void {
    biometricService.disableBiometric();
  },
};
