import { storage } from "./storage";
import { biometricService } from "./biometric-service";

const PIN_LENGTH = 4;

export const pinService = {
  isPinEnabled(): boolean {
    const settings = storage.getSettings();
    return settings.pinEnabled === true && !!settings.pinCode;
  },

  validatePin(pin: string): boolean {
    const settings = storage.getSettings();
    return settings.pinCode === pin;
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
