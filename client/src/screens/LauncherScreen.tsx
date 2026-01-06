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
      const settings = storage.getSettings();
      const profile = storage.getProfile();
      
      const isAuthenticated = collaborationService.isAuthenticated();
      
      if (!isAuthenticated) {
        navigate("auth");
        return;
      }
      
      const permissionsStatus = await permissionsService.checkAllPermissions();
      const permissionsGranted = permissionsService.areRequiredPermissionsGranted(permissionsStatus);
      const hasCompletedPermissions = permissionsService.hasCompletedPermissionsFlow();
      
      if (settings.hasCompletedOnboarding && profile) {
        if (!permissionsGranted) {
          permissionsService.clearPermissionsGranted();
          navigate("permissions", { userType: profile.type, returnToApp: true });
          return;
        }
        
        if (pinService.isPinEnabled()) {
          navigate("pin-entry");
        } else {
          const defaultMode = settings.defaultAppMode || profile.type || "HOME";
          if (defaultMode === "STAFF") {
            navigate("staff-home");
          } else {
            navigate("home");
          }
        }
      } else if (profile) {
        if (!hasCompletedPermissions) {
          navigate("permissions", { userType: profile.type });
        } else {
          navigate("onboarding", { userType: profile.type });
        }
      } else {
        permissionsService.clearPermissionsGranted();
        navigate("role-selection");
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
