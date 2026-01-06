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

export interface OtpResponse {
  success: boolean;
  message?: string;
  expiresAt?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  token?: string;
  user?: CollaborationUser;
  message?: string;
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
    }

    return response;
  }

  async getProfile(): Promise<CollaborationUser | null> {
    if (!this.token) return null;
    try {
      return await this.apiRequest<CollaborationUser>("/user/profile");
    } catch {
      return null;
    }
  }

  async updateProfile(displayName: string): Promise<CollaborationUser> {
    return this.apiRequest<CollaborationUser>("/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    });
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
    }>("/collaboration/links", {
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
    }>("/collaboration/links/accept", {
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
    const response = await this.apiRequest<{ messages: Array<SyncMessage & { createdAt: string }> }>(
      `/collaboration/sync/${linkId}/messages`
    );
    return (response.messages || []).map(msg => ({
      ...msg,
      createdAt: parseDate(msg.createdAt),
    }));
  }

  async sendSyncMessage(
    linkId: string,
    messageType: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: SyncMessage }> {
    return this.apiRequest(`/collaboration/sync/${linkId}/messages`, {
      method: "POST",
      body: JSON.stringify({ messageType, payload }),
    });
  }

  async acknowledgeMessage(messageId: string): Promise<{ success: boolean }> {
    return this.apiRequest(`/collaboration/sync/messages/${messageId}/ack`, {
      method: "POST",
    });
  }

  logout() {
    this.clearToken();
  }

  getConnectionStatus(): "connected" | "disconnected" | "connecting" {
    if (!navigator.onLine) return "disconnected";
    if (!this.token) return "disconnected";
    return "connected";
  }
}

export const collaborationService = new CollaborationService();
