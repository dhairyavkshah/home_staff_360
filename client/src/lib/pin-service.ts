import { storage } from "./storage";
import { biometricService } from "./biometric-service";

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const LOCKOUT_STORAGE_KEY = "hm_pin_lockout";

interface LockoutState {
  failedAttempts: number;
  lockoutUntil: number | null;
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
    return settings.pinEnabled === true && !!settings.pinCode;
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

  validatePin(pin: string): boolean {
    const settings = storage.getSettings();
    const isValid = settings.pinCode === pin;
    if (isValid) {
      this.clearFailedAttempts();
    }
    return isValid;
  },

  setPin(pin: string): void {
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      pinEnabled: true,
      pinCode: pin,
    });
  },

  disablePin(): void {
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      pinEnabled: false,
      pinCode: undefined,
    });
    biometricService.disableBiometric();
  },

  changePin(currentPin: string, newPin: string): boolean {
    if (!this.validatePin(currentPin)) {
      return false;
    }
    this.setPin(newPin);
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
