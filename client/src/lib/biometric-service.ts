import { storage } from "./storage";

const APP_NAME = "Home Staff 360";
const RP_ID = window.location.hostname || "localhost";

interface BiometricSettings {
  enabled: boolean;
  credentialId?: string;
  publicKey?: string;
}

const BIOMETRIC_STORAGE_KEY = "hm_biometric_settings_v4";
const IDB_DB_NAME = "hm_secure_storage";
const IDB_STORE_NAME = "crypto_keys";
const IDB_KEY_ID = "biometric_aes_key";

function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

async function getKeyFromIDB(): Promise<CryptoKey | null> {
  try {
    const db = await openKeyDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE_NAME, "readonly");
      const store = tx.objectStore(IDB_STORE_NAME);
      const request = store.get(IDB_KEY_ID);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.key : null);
      };
    });
  } catch (e) {
    console.error("Failed to get key from IDB:", e);
    return null;
  }
}

async function saveKeyToIDB(key: CryptoKey): Promise<void> {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_NAME, "readwrite");
    const store = tx.objectStore(IDB_STORE_NAME);
    const request = store.put({ id: IDB_KEY_ID, key });
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existingKey = await getKeyFromIDB();
  if (existingKey) {
    return existingKey;
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  
  await saveKeyToIDB(key);
  return key;
}

async function encryptSettings(data: string): Promise<string> {
  try {
    const key = await getOrCreateDeviceKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (e) {
    console.error("Encryption failed:", e);
    throw e;
  }
}

async function decryptSettings(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateDeviceKey();
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "";
  }
}

let cachedSettings: BiometricSettings | null = null;

async function getBiometricSettingsAsync(): Promise<BiometricSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }
  
  try {
    const stored = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
    if (stored) {
      const decrypted = await decryptSettings(stored);
      if (decrypted) {
        cachedSettings = JSON.parse(decrypted);
        return cachedSettings!;
      }
    }
  } catch (e) {
    console.error("Failed to parse biometric settings:", e);
  }
  return { enabled: false };
}

function getBiometricSettings(): BiometricSettings {
  if (cachedSettings) {
    return cachedSettings;
  }
  return { enabled: false };
}

async function saveBiometricSettings(settings: BiometricSettings): Promise<void> {
  cachedSettings = settings;
  const encrypted = await encryptSettings(JSON.stringify(settings));
  localStorage.setItem(BIOMETRIC_STORAGE_KEY, encrypted);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateRandomBuffer(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

export const biometricService = {
  isHardwareAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      "PublicKeyCredential" in window &&
      typeof window.PublicKeyCredential === "function"
    );
  },

  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isHardwareAvailable()) {
      return false;
    }
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (e) {
      console.error("Error checking platform authenticator:", e);
      return false;
    }
  },

  isBiometricEnabled(): boolean {
    const settings = getBiometricSettings();
    return settings.enabled && !!settings.credentialId;
  },

  async initializeAndCheckEnabled(): Promise<boolean> {
    const settings = await getBiometricSettingsAsync();
    return settings.enabled && !!settings.credentialId;
  },

  async enrollBiometric(): Promise<{ success: boolean; error?: string }> {
    if (!this.isHardwareAvailable()) {
      return { success: false, error: "Biometric hardware not available" };
    }

    try {
      const profile = storage.getProfile();
      const userId = profile?.id || "user-" + Date.now();
      const userName = profile?.displayName || "User";

      const challenge = generateRandomBuffer(32);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
          name: APP_NAME,
          id: RP_ID,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use device biometric
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      };

      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: "Failed to create credential" };
      }

      const credentialId = arrayBufferToBase64(credential.rawId);
      
      await saveBiometricSettings({
        enabled: true,
        credentialId,
        publicKey: arrayBufferToBase64(
          (credential.response as AuthenticatorAttestationResponse).getPublicKey?.() || new ArrayBuffer(0)
        ),
      });

      return { success: true };
    } catch (e: any) {
      console.error("Biometric enrollment error:", e);
      if (e.name === "NotAllowedError") {
        return { success: false, error: "Biometric enrollment was cancelled" };
      }
      if (e.name === "SecurityError") {
        return { success: false, error: "Security error during enrollment" };
      }
      return { success: false, error: e.message || "Failed to enroll biometric" };
    }
  },

  async authenticate(): Promise<{ success: boolean; error?: string }> {
    const settings = await getBiometricSettingsAsync();
    if (!settings.enabled || !settings.credentialId) {
      return { success: false, error: "Biometric not enabled" };
    }

    try {
      const challenge = generateRandomBuffer(32);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: RP_ID,
        allowCredentials: [
          {
            type: "public-key",
            id: base64ToArrayBuffer(settings.credentialId),
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        return { success: false, error: "Authentication failed" };
      }

      return { success: true };
    } catch (e: any) {
      console.error("Biometric authentication error:", e);
      if (e.name === "NotAllowedError") {
        return { success: false, error: "Biometric authentication was cancelled" };
      }
      return { success: false, error: e.message || "Authentication failed" };
    }
  },

  async disableBiometric(): Promise<void> {
    await saveBiometricSettings({ enabled: false });
  },

  getPromptTitle(): string {
    return `Unlock ${APP_NAME}`;
  },
};
