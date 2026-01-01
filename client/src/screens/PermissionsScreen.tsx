import { useState, useEffect } from "react";
import { Camera, FolderOpen, Bell, Check, X, ChevronRight, ChevronLeft, Shield, MapPin } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigation } from "@/lib/navigation";
import { 
  permissionsService, 
  REQUIRED_PERMISSIONS, 
  type PermissionStatus, 
  type PermissionType 
} from "@/lib/permissions-service";
import { detectAndSaveCountry } from "@/lib/geolocation-service";

const iconMap: Record<string, typeof Camera> = {
  camera: Camera,
  folder: FolderOpen,
  bell: Bell,
  "map-pin": MapPin,
};

export function PermissionsScreen() {
  const { navigate, data } = useNavigation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, watchDrag: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: "prompt",
    storage: "prompt",
    notifications: "prompt",
    location: "prompt",
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const permissions = REQUIRED_PERMISSIONS;
  const currentPermission = permissions[currentIndex];

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const checkPermissions = async () => {
    const status = await permissionsService.checkAllPermissions();
    setPermissionStatus(status);
  };

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    const result = await permissionsService.requestPermission(currentPermission.id);
    
    setPermissionStatus(prev => ({
      ...prev,
      [currentPermission.id]: result,
    }));
    
    if (currentPermission.id === "location" && result === "granted") {
      detectAndSaveCountry().catch(() => {});
    }
    
    setIsRequesting(false);
    
    if (result === "granted") {
      setTimeout(() => {
        if (currentIndex < permissions.length - 1) {
          emblaApi?.scrollNext();
        } else {
          checkAllAndProceed();
        }
      }, 800);
    }
  };

  const navigateAfterPermissions = () => {
    const userType = data.userType || "HOME";
    const returnToApp = data.returnToApp;
    
    if (returnToApp) {
      if (userType === "STAFF") {
        navigate("staff-home");
      } else {
        navigate("home");
      }
    } else {
      navigate("onboarding", { userType });
    }
  };

  const checkAllAndProceed = async () => {
    const status = await permissionsService.checkAllPermissions();
    setPermissionStatus(status);
    
    if (permissionsService.areRequiredPermissionsGranted(status)) {
      permissionsService.savePermissionsGranted();
      navigateAfterPermissions();
    }
  };

  const handleContinue = () => {
    if (permissionsService.areRequiredPermissionsGranted(permissionStatus)) {
      permissionsService.savePermissionsGranted();
      navigateAfterPermissions();
    }
  };

  const getStatusForPermission = (id: PermissionType) => {
    return permissionStatus[id];
  };

  const allRequiredGranted = permissionsService.areRequiredPermissionsGranted(permissionStatus);

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-permissions">
        <div className="flex items-center justify-center gap-2 p-4 border-b">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">App Permissions</h1>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-center gap-2 py-4">
            {permissions.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-primary"
                    : index < currentIndex
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex-1 overflow-hidden" ref={emblaRef}>
            <div className="flex h-full">
              {permissions.map((permission, index) => {
                const Icon = iconMap[permission.icon] || Camera;
                const status = getStatusForPermission(permission.id);
                const isGranted = status === "granted";
                const isDenied = status === "denied";

                return (
                  <div
                    key={permission.id}
                    className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center p-6"
                  >
                    <Card className="w-full max-w-sm p-6 flex flex-col items-center gap-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        isGranted 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : isDenied 
                          ? "bg-destructive/10" 
                          : "bg-primary/10"
                      }`}>
                        {isGranted ? (
                          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                        ) : isDenied ? (
                          <X className="w-10 h-10 text-destructive" />
                        ) : (
                          <Icon className="w-10 h-10 text-primary" />
                        )}
                      </div>

                      <div className="text-center space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <h2 className="text-xl font-semibold">{permission.name}</h2>
                          <Badge variant="secondary">Required</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {permission.description}
                        </p>
                      </div>

                      {isGranted ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          <span className="font-medium">Permission Granted</span>
                        </div>
                      ) : isDenied ? (
                        <div className="space-y-3 w-full">
                          <p className="text-sm text-destructive text-center">
                            Permission denied. Please enable in device settings.
                          </p>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleRequestPermission}
                            disabled={isRequesting}
                            data-testid={`button-retry-${permission.id}`}
                          >
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full"
                          onClick={handleRequestPermission}
                          disabled={isRequesting}
                          data-testid={`button-allow-${permission.id}`}
                        >
                          {isRequesting ? "Requesting..." : "Allow Access"}
                        </Button>
                      )}

                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={currentIndex === 0}
                data-testid="button-prev-permission"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <div className="flex-1 flex justify-center">
                {allRequiredGranted && (
                  <Button
                    onClick={handleContinue}
                    className="px-8"
                    data-testid="button-continue-permissions"
                  >
                    Continue to Setup
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => emblaApi?.scrollNext()}
                disabled={currentIndex === permissions.length - 1}
                data-testid="button-next-permission"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {!allRequiredGranted && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Please grant the required permissions to continue
              </p>
            )}
          </div>
        </div>
      </div>
  );
}
