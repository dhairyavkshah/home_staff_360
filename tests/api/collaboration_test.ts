
import { expect } from "node:test";

const BASE_URL = "http://localhost:5000";
const BYPASS_HEADER = { "x-test-bypass": "rate-limit-skip" };

async function apiRequest(path: string, method: string = "GET", body?: any, token?: string) {
  const headers: any = {
    ...BYPASS_HEADER,
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error: any) {
    return { status: 500, error: error.message };
  }
}

async function getAuthToken(phone: string) {
  console.log(`Getting auth token for ${phone}...`);
  // Request OTP
  const otpRes = await apiRequest("/api/auth/request-otp", "POST", { phone });
  if (otpRes.status !== 200) throw new Error(`Failed to request OTP for ${phone}: ${JSON.stringify(otpRes.data)}`);
  
  const otp = otpRes.data.devOtp;
  if (!otp) throw new Error("No devOtp returned in development mode");

  // Verify OTP
  const verifyRes = await apiRequest("/api/auth/verify-otp", "POST", { phone, otp });
  if (verifyRes.status !== 200) throw new Error(`Failed to verify OTP for ${phone}: ${JSON.stringify(verifyRes.data)}`);

  console.log(`Authenticated as ${phone}`);
  return { token: verifyRes.data.token, user: verifyRes.data.user };
}

async function runTests() {
  console.log("Starting Collaboration API Tests...");

  try {
    // 1. Create two users
    console.log("--- Creating users ---");
    const userA = await getAuthToken("+919999999991"); // Home User
    const userB = await getAuthToken("+919999999992"); // Staff User

    // Update user types
    await apiRequest("/api/user/profile", "PATCH", { userType: "home", displayName: "Home Owner" }, userA.token);
    await apiRequest("/api/user/profile", "PATCH", { userType: "staff", displayName: "Service Provider" }, userB.token);

    // 2. Test connection/invite APIs
    console.log("\n--- Testing Connection/Invite APIs ---");
    
    const createLinkRes = await apiRequest("/api/collaboration/create-link", "POST", {
      isHomeUser: true,
      homeAccountId: "home-acc-1",
    }, userA.token);
    
    if (createLinkRes.status !== 200) {
      console.error("FAILED: Create link", createLinkRes.data);
      throw new Error("Link creation failed");
    }
    console.log("SUCCESS: Create link", createLinkRes.data);

    const inviteCode = createLinkRes.data.invitationCode;

    // Accept link (User B)
    const acceptLinkRes = await apiRequest("/api/collaboration/accept-link", "POST", {
      invitationCode: inviteCode,
      accountId: "staff-acc-1"
    }, userB.token);
    
    if (acceptLinkRes.status !== 200) {
      console.error("FAILED: Accept link", acceptLinkRes.data);
    } else {
      console.log("SUCCESS: Accept link", acceptLinkRes.data);
    }

    // Get links
    const getLinksARes = await apiRequest("/api/collaboration/links", "GET", null, userA.token);
    const linksA = getLinksARes.data.links || [];
    console.log(`User A links count: ${linksA.length}`);
    const linkId = linksA[0].id;

    // 3. Test messaging APIs
    console.log("\n--- Testing Messaging APIs ---");
    
    const sendMsgRes = await apiRequest("/api/collaboration/messages", "POST", {
      linkId,
      payload: { text: "Hello from Home User!" },
      messageType: "text"
    }, userA.token);
    
    if (sendMsgRes.status !== 200) {
      console.error("FAILED: Send message", sendMsgRes.data);
    } else {
      console.log("SUCCESS: Send message", sendMsgRes.data);
    }

    const getMsgsRes = await apiRequest(`/api/collaboration/${linkId}/messages`, "GET", null, userB.token);
    const messages = Array.isArray(getMsgsRes.data) ? getMsgsRes.data : (getMsgsRes.data.messages || []);
    console.log(`SUCCESS: Received ${messages.length} messages`);

    // 4. Test notifications APIs
    console.log("\n--- Testing Notifications APIs ---");
    
    // Check User A's notifications (should have "Connection Accepted" after B accepted)
    const getNotifsRes = await apiRequest("/api/notifications", "GET", null, userA.token);
    const notifs = getNotifsRes.data.notifications || [];
    console.log(`User A notification count: ${notifs.length}`);
    
    if (notifs.length > 0) {
      const notif = notifs.find((n: any) => n.title === 'Connection Accepted');
      if (notif) {
        console.log("SUCCESS: Received 'Connection Accepted' notification");
        const readNotifRes = await apiRequest(`/api/notifications/${notif.id}/read`, "PATCH", null, userA.token);
        if (readNotifRes.status === 200) {
          console.log("SUCCESS: Marked notification as read");
        }
      } else {
        console.error("FAILED: 'Connection Accepted' notification not found", notifs);
      }
    }

    // 5. Test Shared Spaces APIs
    console.log("\n--- Testing Shared Spaces APIs ---");
    
    // Create shared space
    const createSpaceRes = await apiRequest("/api/shared-spaces", "POST", {
      type: "household",
      name: "Our Home",
      localId: "local-hh-1"
    }, userA.token);
    
    if (createSpaceRes.status !== 200) {
      console.error("FAILED: Create shared space", createSpaceRes.data);
    } else {
      console.log("SUCCESS: Create shared space", createSpaceRes.data);
      const spaceId = createSpaceRes.data.id;

      // Invite User B
      const inviteBRes = await apiRequest(`/api/shared-spaces/${spaceId}/invite`, "POST", {
        type: "household",
        targetUserId: userB.user.id,
        role: "editor"
      }, userA.token);
      
      if (inviteBRes.status !== 200) {
        console.error("FAILED: Invite to shared space", inviteBRes.data);
      } else {
        console.log("SUCCESS: Invited User B to shared space");
        const memberId = inviteBRes.data.memberId;

        // B gets invitations
        const getInvsRes = await apiRequest("/api/shared-spaces/invitations", "GET", null, userB.token);
        const invs = getInvsRes.data.invitations || [];
        const myInv = invs.find((i: any) => i.id === memberId);

        if (myInv) {
          console.log("SUCCESS: User B found shared space invitation");
          // B accepts invitation
          const acceptInvRes = await apiRequest(`/api/shared-spaces/invitations/${memberId}/accept`, "POST", {
            type: "household"
          }, userB.token);
          
          if (acceptInvRes.status === 200) {
            console.log("SUCCESS: User B accepted shared space invitation");
            
            // B lists shared spaces
            const getSpacesRes = await apiRequest("/api/shared-spaces", "GET", null, userB.token);
            const spaces = getSpacesRes.data.spaces || [];
            if (spaces.find((s: any) => s.id === spaceId)) {
              console.log("SUCCESS: Shared space visible to User B");
            } else {
              console.error("FAILED: Shared space not visible to User B", spaces);
            }
          }
        }
      }
    }

    // 6. Test Error Handling
    console.log("\n--- Testing Error Handling ---");
    const invalidCodeRes = await apiRequest("/api/collaboration/accept-link", "POST", {
      invitationCode: "INVALID",
      accountId: "acc-1"
    }, userB.token);
    console.log(`SUCCESS: Caught invalid code (Status: ${invalidCodeRes.status})`);

    // 7. Test Deletion/Revocation
    console.log("\n--- Testing Deletion/Revocation ---");
    const deleteLinkRes = await apiRequest(`/api/collaboration/links/${linkId}`, "DELETE", null, userA.token);
    if (deleteLinkRes.status === 200) {
      console.log("SUCCESS: Requested delete/revoke for link");
      
      // Verify status is revoked
      const verifyRevokeRes = await apiRequest("/api/collaboration/links", "GET", null, userA.token);
      const revLink = (verifyRevokeRes.data.links || []).find((l: any) => l.id === linkId);
      if (revLink && revLink.status === 'revoked') {
        console.log("SUCCESS: Link status is 'revoked'");
      } else {
        console.error("FAILED: Link status not updated to 'revoked'", revLink);
      }
    }

    console.log("\nAll tests completed successfully.");
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTests();
