const API_BASE = "/api";
const TOKEN_KEY = "homestaff360_collab_token";

export interface CollaborationUser {
  id: string;
  phone: string;
  displayName?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface CollaborationLink {
  id: string;
  code: string;
  createdBy: string;
  acceptedBy?: string;
  linkType: "HOME_TO_STAFF" | "STAFF_TO_HOME";
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: Date;
  createdAt: Date;
}

export interface SyncMessage {
  id: string;
  linkId: string;
  senderId: string;
  messageType: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "acknowledged";
  createdAt: Date;
}

export interface AppNotification {
  id: string;
  userId: string;
  userMode: "HOME" | "STAFF";
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  payload?: string;
  actionRequired: boolean;
  actionType?: string;
  isRead: boolean;
  readAt?: Date;
  isActioned: boolean;
  actionedAt?: Date;
  createdAt: Date;
}

export interface OtpResponse {
  success: boolean;
  message?: string;
  expiresAt?: string;
  expiresIn?: number;
  remainingAttempts?: number;
  cooldownSeconds?: number;
  devOtp?: string; // Only present in development mode when SMS fails
}

export interface VerifyOtpResponse {
  success: boolean;
  token?: string;
  user?: CollaborationUser & {
    isNewUser?: boolean;
    needsOnboarding?: boolean;
    hasPassword?: boolean;
  };
  message?: string;
}

export interface CheckPhoneResponse {
  exists: boolean;
  hasPassword: boolean;
  isVerified?: boolean;
  displayName?: string;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: CollaborationUser & {
    needsOnboarding?: boolean;
  };
  error?: string;
  needsOtp?: boolean;
}

interface ApiCollaborationLink {
  id: string;
  code: string;
  createdBy: string;
  acceptedBy?: string;
  linkType: "HOME_TO_STAFF" | "STAFF_TO_HOME";
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
}

function parseDate(dateStr: string | Date | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
}

function parseLink(link: ApiCollaborationLink): CollaborationLink {
  return {
    ...link,
    expiresAt: parseDate(link.expiresAt),
    createdAt: parseDate(link.createdAt),
  };
}

class CollaborationService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    try {
      this.token = localStorage.getItem(TOKEN_KEY);
    } catch {
      this.token = null;
    }
  }

  private saveToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      console.error("Failed to save token to localStorage");
    }
  }

  private clearToken() {
    this.token = null;
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      console.error("Failed to clear token from localStorage");
    }
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async fetchWithAuth<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.apiRequest<T>(endpoint, options);
  }

  async requestOtp(phone: string): Promise<OtpResponse> {
    return this.apiRequest<OtpResponse>("/auth/request-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
    const response = await this.apiRequest<VerifyOtpResponse>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
      // Save credentials for quick access
      this.saveCredentials(phone);
    }

    return response;
  }

  async checkPhone(phone: string): Promise<CheckPhoneResponse> {
    return this.apiRequest<CheckPhoneResponse>("/auth/check-phone", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async login(phone: string, password: string): Promise<LoginResponse> {
    const response = await this.apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
      this.saveCredentials(phone);
    }

    return response;
  }

  async setPassword(password: string): Promise<{ success: boolean; message?: string }> {
    return this.apiRequest("/auth/set-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async forgotPassword(phone: string): Promise<OtpResponse> {
    return this.apiRequest<OtpResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async resetPassword(phone: string, otp: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
    token?: string;
    user?: CollaborationUser & { needsOnboarding?: boolean };
  }> {
    const response = await this.apiRequest<{
      success: boolean;
      message?: string;
      token?: string;
      user?: CollaborationUser & { needsOnboarding?: boolean };
    }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ phone, otp, newPassword }),
    });

    if (response.success && response.token) {
      this.saveToken(response.token);
      this.saveCredentials(phone);
    }

    return response;
  }

  async completeOnboarding(): Promise<{ success: boolean }> {
    return this.apiRequest("/user/complete-onboarding", {
      method: "POST",
    });
  }

  private saveCredentials(phone: string) {
    try {
      localStorage.setItem("homestaff360_saved_phone", phone);
    } catch {
      console.error("Failed to save credentials");
    }
  }

  getSavedPhone(): string | null {
    try {
      return localStorage.getItem("homestaff360_saved_phone");
    } catch {
      return null;
    }
  }

  clearSavedCredentials() {
    try {
      localStorage.removeItem("homestaff360_saved_phone");
    } catch {
      console.error("Failed to clear credentials");
    }
  }


  async registerDevice(deviceInfo: {
    deviceId: string;
    deviceName: string;
    platform: string;
  }): Promise<{ success: boolean; device: unknown }> {
    return this.apiRequest("/devices/register", {
      method: "POST",
      body: JSON.stringify(deviceInfo),
    });
  }

  async createCollaborationLink(linkType: "HOME_TO_STAFF" | "STAFF_TO_HOME"): Promise<{
    success: boolean;
    code: string;
    expiresAt: Date;
  }> {
    const response = await this.apiRequest<{
      success: boolean;
      code: string;
      expiresAt: string;
    }>("/collaboration/create-link", {
      method: "POST",
      body: JSON.stringify({ linkType }),
    });
    
    return {
      ...response,
      expiresAt: parseDate(response.expiresAt),
    };
  }

  async acceptCollaborationLink(code: string): Promise<{
    success: boolean;
    link?: CollaborationLink;
    message?: string;
  }> {
    const response = await this.apiRequest<{
      success: boolean;
      link?: ApiCollaborationLink;
      message?: string;
    }>("/collaboration/accept-link", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    
    return {
      ...response,
      link: response.link ? parseLink(response.link) : undefined,
    };
  }

  async getActiveLinks(): Promise<CollaborationLink[]> {
    const response = await this.apiRequest<{ links: ApiCollaborationLink[] }>("/collaboration/links");
    return (response.links || []).map(parseLink);
  }

  async revokeLink(linkId: string): Promise<{ success: boolean }> {
    return this.apiRequest(`/collaboration/links/${linkId}`, {
      method: "DELETE",
    });
  }

  async getSyncMessages(linkId: string): Promise<SyncMessage[]> {
    const response = await this.apiRequest<Array<SyncMessage & { createdAt: string }>>(
      `/collaboration/${linkId}/messages`
    );
    return (response || []).map(msg => ({
      ...msg,
      createdAt: parseDate(msg.createdAt),
    }));
  }

  async sendSyncMessage(
    linkId: string,
    messageType: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; messageId: string }> {
    return this.apiRequest(`/collaboration/messages`, {
      method: "POST",
      body: JSON.stringify({ linkId, messageType, payload }),
    });
  }

  async acknowledgeMessage(_messageId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  // Notification methods
  async getNotifications(mode?: "HOME" | "STAFF"): Promise<{
    notifications: AppNotification[];
    unreadCount: number;
  }> {
    const params = mode ? `?mode=${mode}` : "";
    const response = await this.apiRequest<{
      notifications: Array<AppNotification & { createdAt: string; readAt?: string; actionedAt?: string }>;
      unreadCount: number;
    }>(`/notifications${params}`);
    
    return {
      notifications: (response.notifications || []).map(n => ({
        ...n,
        createdAt: parseDate(n.createdAt),
        readAt: n.readAt ? parseDate(n.readAt) : undefined,
        actionedAt: n.actionedAt ? parseDate(n.actionedAt) : undefined,
      })),
      unreadCount: response.unreadCount || 0,
    };
  }

  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return this.apiRequest(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsRead(mode?: "HOME" | "STAFF"): Promise<{ success: boolean }> {
    return this.apiRequest("/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({ mode }),
    });
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    return this.apiRequest(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  async clearAllNotifications(mode?: "HOME" | "STAFF"): Promise<{ success: boolean }> {
    const params = mode ? `?mode=${mode}` : "";
    return this.apiRequest(`/notifications${params}`, {
      method: "DELETE",
    });
  }

  // Bindings methods
  async getBindings(): Promise<{ bindings: any[] }> {
    return this.apiRequest("/bindings");
  }

  async createBinding(data: {
    linkId: string;
    homePersonId: string;
    homePersonName?: string;
    staffClientId: string;
    staffClientName?: string;
  }): Promise<{ success: boolean; binding?: any }> {
    return this.apiRequest("/bindings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Shared attendance methods
  async submitAttendance(data: {
    bindingId: string;
    date: string;
    status: string;
    hoursWorked?: number;
    note?: string;
    recordSalaryType?: string;
    recordRate?: number;
    recordCurrency?: string;
  }): Promise<{ success: boolean; attendanceId?: string; isRevision?: boolean }> {
    return this.apiRequest("/shared-attendance", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSharedAttendance(bindingId: string): Promise<{ attendance: any[] }> {
    return this.apiRequest(`/shared-attendance?bindingId=${bindingId}`);
  }

  async getSharedAttendanceById(attendanceId: string): Promise<{ 
    attendance: any; 
    revisions: any[] 
  }> {
    return this.apiRequest(`/shared-attendance/${attendanceId}`);
  }

  async actionAttendance(
    attendanceId: string,
    action: "approve" | "reject",
    remarks?: string
  ): Promise<{ success: boolean }> {
    return this.apiRequest(`/shared-attendance/${attendanceId}/action`, {
      method: "PATCH",
      body: JSON.stringify({ action, remarks }),
    });
  }

  // Shared laundry methods
  async submitLaundry(data: {
    bindingId: string;
    date: string;
    items: any[];
    itemsTotal?: number;
    pickupDelivery?: boolean;
    pickupDeliveryCharge?: number;
    total: number;
    serviceType?: string;
    recordCurrency?: string;
  }): Promise<{ success: boolean; laundryId?: string }> {
    return this.apiRequest("/shared-laundry", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSharedLaundry(bindingId: string): Promise<{ laundry: any[] }> {
    return this.apiRequest(`/shared-laundry?bindingId=${bindingId}`);
  }

  async getSharedLaundryById(laundryId: string): Promise<{ 
    laundry: any; 
    revisions: any[] 
  }> {
    return this.apiRequest(`/shared-laundry/${laundryId}`);
  }

  async actionLaundry(
    laundryId: string,
    action: "approve" | "reject",
    remarks?: string
  ): Promise<{ success: boolean }> {
    return this.apiRequest(`/shared-laundry/${laundryId}/action`, {
      method: "PATCH",
      body: JSON.stringify({ action, remarks }),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      if (this.token) {
        await this.apiRequest("/auth/logout", {
          method: "POST",
        }).catch(() => {});
      }
    } catch {
    }
    
    this.clearToken();
    this.clearSavedCredentials();
    
    return { success: true };
  }

  async deleteAccount(password: string): Promise<{ 
    success: boolean; 
    message?: string;
    error?: string;
  }> {
    const response = await this.apiRequest<{
      success: boolean;
      message?: string;
      error?: string;
    }>("/user/delete-account", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    if (response.success) {
      this.clearToken();
      this.clearSavedCredentials();
    }

    return response;
  }

  getConnectionStatus(): "connected" | "disconnected" | "connecting" {
    if (!navigator.onLine) return "disconnected";
    if (!this.token) return "disconnected";
    return "connected";
  }

  // Profile management methods
  async getProfile(): Promise<{
    id: string;
    phone: string;
    displayName?: string;
    userType?: string;
    isVerified: boolean;
    isNewUser: boolean;
    onboardingCompleted: boolean;
    hasPassword: boolean;
    preferredLanguage?: string;
    connectCount?: number;
    createdAt: string;
  }> {
    return this.apiRequest("/user/profile");
  }

  async updateProfile(data: {
    displayName?: string;
    userType?: string;
    preferredLanguage?: string;
  }): Promise<{ success: boolean; message?: string }> {
    return this.apiRequest("/user/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ 
    success: boolean; 
    message?: string;
    error?: string;
  }> {
    return this.apiRequest("/user/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async syncProfileToLocalStorage(): Promise<{
    synced: boolean;
    profile?: any;
    needsOnboarding: boolean;
  }> {
    try {
      const serverProfile = await this.getProfile();
      
      if (!serverProfile) {
        return { synced: false, needsOnboarding: true };
      }

      // Import storage dynamically to avoid circular deps
      const { storage } = await import("./storage");
      
      // Check if local profile already exists
      let localProfile = storage.getProfile();
      
      if (!localProfile) {
        // Create local profile from server data
        // Only set type if server has it - don't default to HOME since user may not have selected role yet
        localProfile = storage.createProfile({
          type: serverProfile.userType as any,
          displayName: serverProfile.displayName || "",
        });
      }
      
      // If server says onboarding is complete, sync local settings
      if (serverProfile.onboardingCompleted) {
        const settings = storage.getSettings();
        storage.saveSettings({
          ...settings,
          hasCompletedOnboarding: true,
          defaultAppMode: (serverProfile.userType as any) || settings.defaultAppMode,
        });
        
        // Update profile with server display name if available
        if (serverProfile.displayName) {
          storage.updateProfile({ displayName: serverProfile.displayName });
        }
      }
      
      return {
        synced: true,
        profile: serverProfile,
        needsOnboarding: !serverProfile.onboardingCompleted,
      };
    } catch (error) {
      console.error("Failed to sync profile from server:", error);
      return { synced: false, needsOnboarding: true };
    }
  }

  async verifyPassword(password: string): Promise<{ 
    success: boolean; 
    message?: string;
    error?: string;
  }> {
    return this.apiRequest("/user/verify-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async requestPhoneChange(newPhone: string, currentPassword: string): Promise<{ 
    success: boolean; 
    message?: string;
    expiresIn?: number;
    error?: string;
  }> {
    return this.apiRequest("/user/phone/request-change", {
      method: "POST",
      body: JSON.stringify({ newPhone, currentPassword }),
    });
  }

  async confirmPhoneChange(newPhone: string, otp: string): Promise<{ 
    success: boolean; 
    message?: string;
    token?: string;
    phone?: string;
    error?: string;
  }> {
    const response = await this.apiRequest<{
      success: boolean;
      message?: string;
      token?: string;
      phone?: string;
      error?: string;
    }>("/user/phone/confirm", {
      method: "POST",
      body: JSON.stringify({ newPhone, otp }),
    });

    // Update stored token if phone change successful
    if (response.success && response.token) {
      this.saveToken(response.token);
      if (response.phone) {
        localStorage.setItem("homestaff360_saved_phone", response.phone);
      }
    }

    return response;
  }
}

export const collaborationService = new CollaborationService();
