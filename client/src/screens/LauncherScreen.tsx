import { useEffect } from "react";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { pinService } from "@/lib/pin-service";
import { permissionsService } from "@/lib/permissions-service";
import { collaborationService } from "@/lib/collaboration-service";
import appIconPath from "@/assets/app-icon.png";

export function LauncherScreen() {
  const { navigate } = useNavigation();

  useEffect(() => {
    const checkAndNavigate = async () => {
      const isAuthenticated = collaborationService.isAuthenticated();
      
      if (!isAuthenticated) {
        navigate("auth");
        return;
      }
      
      // Security check: Require re-authentication for new browser tabs/windows
      // This prevents unauthorized access if someone opens the app in a new tab
      if (collaborationService.needsSessionVerification()) {
        navigate("auth", { requireSessionVerification: true });
        return;
      }
      
      // Sync profile from server if local profile is missing
      let currentProfile = storage.getProfile();
      if (!currentProfile) {
        await collaborationService.syncProfileToLocalStorage();
        // Re-read profile after sync
        currentProfile = storage.getProfile();
        if (!currentProfile) {
          // Still no profile, go to auth
          navigate("auth");
          return;
        }
      }
      
      // Now continue with the rest of the logic using updated profile/settings
      const settings = storage.getSettings();
      
      const permissionsStatus = await permissionsService.checkAllPermissions();
      const permissionsGranted = permissionsService.areRequiredPermissionsGranted(permissionsStatus);
      const hasCompletedPermissions = permissionsService.hasCompletedPermissionsFlow();
      
      if (settings.hasCompletedOnboarding && currentProfile) {
        // For returning users, check BOTH actual permissions AND if they've completed the flow on this device
        if (!permissionsGranted || !hasCompletedPermissions) {
          permissionsService.clearPermissionsGranted();
          navigate("permissions", { userType: currentProfile.type, returnToApp: true });
          return;
        }
        
        if (pinService.isPinEnabled()) {
          navigate("pin-entry");
        } else {
          try {
            const response = await fetch("/api/subscriptions/status", {
              credentials: "include",
            });
            if (response.ok) {
              const status = await response.json();
              if (!status.isSubscribed) {
                navigate("subscription");
                return;
              }
            }
          } catch {
          }
          
          const defaultMode = settings.defaultAppMode || currentProfile.type || "HOME";
          if (defaultMode === "STAFF") {
            navigate("staff-home");
          } else {
            navigate("home");
          }
        }
      } else if (currentProfile) {
        // Check if user has selected a role type yet
        if (!currentProfile.type) {
          navigate("role-selection");
        } else if (!hasCompletedPermissions) {
          navigate("permissions", { userType: currentProfile.type });
        } else {
          navigate("onboarding", { userType: currentProfile.type });
        }
      } else {
        // No profile exists - navigate to auth first, then role selection after authentication
        permissionsService.clearPermissionsGranted();
        navigate("auth");
      }
    };

    const timer = setTimeout(checkAndNavigate, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-launcher">
      <div className="safe-area-top" />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            <img src={appIconPath} alt="Home Staff 360" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Home Staff 360</h1>
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
      <div className="safe-area-bottom" />
    </div>
  );
}
