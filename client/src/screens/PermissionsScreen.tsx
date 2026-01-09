import { useState, useEffect } from "react";
import { Camera, FolderOpen, Bell, Check, ChevronRight, MapPin, ArrowRight, Image } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { 
  permissionsService, 
  REQUIRED_PERMISSIONS, 
  type PermissionStatus, 
  type PermissionType 
} from "@/lib/permissions-service";
import { detectAndSaveCountry } from "@/lib/geolocation-service";
import { useTranslation } from "@/lib/i18n/i18n-context";

const iconMap: Record<string, typeof Camera> = {
  camera: Camera,
  folder: FolderOpen,
  bell: Bell,
  "map-pin": MapPin,
  image: Image,
};

export function PermissionsScreen() {
  const { navigate, data } = useNavigation();
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, watchDrag: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    camera: "prompt",
    storage: "prompt",
    notifications: "prompt",
    location: "prompt",
    media: "prompt",
  });
  const [isRequesting, setIsRequesting] = useState(false);

  const permissions = REQUIRED_PERMISSIONS;
  const currentPermission = permissions[currentIndex];
  const isLastPermission = currentIndex === permissions.length - 1;

  // Translation key maps for permission names, descriptions, and "why needed" texts
  const permissionNameKeys: Record<PermissionType, string> = {
    location: "locationAccess",
    storage: "storageAccess",
    media: "mediaAccess",
    notifications: "notifications",
    camera: "cameraAccess",
  };

  const permissionDescKeys: Record<PermissionType, string> = {
    location: "locationAccessDesc",
    storage: "storageAccessDesc",
    media: "mediaAccessDesc",
    notifications: "notificationsDesc",
    camera: "cameraAccessDesc",
  };

  const whyNeededKeys: Record<PermissionType, string> = {
    location: "whyLocationNeeded",
    storage: "whyStorageNeeded",
    media: "whyMediaNeeded",
    notifications: "whyNotificationsNeeded",
    camera: "whyCameraNeeded",
  };

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
        moveToNext();
      }, 600);
    }
  };

  const moveToNext = () => {
    if (isLastPermission) {
      finishPermissions();
    } else {
      emblaApi?.scrollNext();
    }
  };

  const handleSkip = () => {
    moveToNext();
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

  const canFinish = permissionsService.areRequiredPermissionsGranted(permissionStatus);

  const finishPermissions = () => {
    if (!canFinish) {
      return;
    }
    permissionsService.savePermissionsGranted();
    navigateAfterPermissions();
  };

  const getStatusForPermission = (id: PermissionType) => {
    return permissionStatus[id];
  };

  const grantedCount = Object.values(permissionStatus).filter(s => s === "granted").length;

  return (
    <AppLayout data-testid="screen-permissions">
      <Header
        title={t("appPermissions")}
        subtitle={t("nOfMGranted").replace("{n}", String(grantedCount)).replace("{m}", String(permissions.length))}
      />

      <ScrollContent className="flex flex-col">
        {/* Progress indicator - Material 3 style segmented bar */}
        <div className="px-4 pb-4">
          <div className="flex gap-1.5">
            {permissions.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  index < currentIndex
                    ? "bg-primary"
                    : index === currentIndex
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Permission Cards Carousel */}
        <div className="flex-1 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {permissions.map((permission) => {
              const Icon = iconMap[permission.icon] || Camera;
              const status = getStatusForPermission(permission.id);
              const isGranted = status === "granted";
              const isDenied = status === "denied";
              const isRequired = permission.required;

              return (
                <div
                  key={permission.id}
                  className="flex-[0_0_100%] min-w-0 flex flex-col px-4"
                >
                  {/* Permission Card - Samsung One UI + Fluent + Material 3 fusion */}
                  <Card className="flex flex-col p-5">
                    {/* Icon with status indicator */}
                    <div className="flex justify-center mb-5">
                      <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isGranted 
                          ? "bg-green-100 dark:bg-green-900/30" 
                          : isDenied 
                          ? "bg-destructive/10" 
                          : "bg-primary/10"
                      }`}>
                        {isGranted ? (
                          <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
                        ) : (
                          <Icon className={`w-7 h-7 ${isDenied ? "text-destructive" : "text-primary"}`} />
                        )}
                        
                        {/* Status dot */}
                        {isGranted && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 border-2 border-card flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center flex flex-col gap-3">
                      <div className="flex items-center justify-center gap-2">
                        <h2 className="text-lg font-semibold">{t(permissionNameKeys[permission.id] as any)}</h2>
                        {isRequired && (
                          <Badge variant="secondary" className="text-xs">{t("required")}</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t(permissionDescKeys[permission.id] as any)}
                      </p>

                      {/* Why needed - subtle info box */}
                      <div className="bg-muted/50 rounded-lg p-3 mt-2">
                        <p className="text-xs text-muted-foreground">
                          {t(whyNeededKeys[permission.id] as any)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 space-y-3">
                        {isGranted ? (
                          <div className="flex items-center justify-center gap-2 py-3 text-green-600 dark:text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">{t("permissionGranted")}</span>
                          </div>
                        ) : isDenied ? (
                          <>
                            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                              {t("permissionDeniedSettings" as any) || "Denied. You can enable this later in device settings"}
                            </p>
                            <div className="flex gap-3">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={handleRequestPermission}
                                disabled={isRequesting}
                                data-testid={`button-retry-${permission.id}`}
                              >
                                {isRequesting ? t("requesting") : t("tryAgain")}
                              </Button>
                              <Button
                                variant="ghost"
                                className="flex-1"
                                onClick={handleSkip}
                                data-testid={`button-skip-${permission.id}`}
                              >
                                {t("skip")}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex gap-3">
                            <Button
                              className="flex-1"
                              onClick={handleRequestPermission}
                              disabled={isRequesting}
                              data-testid={`button-allow-${permission.id}`}
                            >
                              {isRequesting ? t("requesting") : t("allow")}
                            </Button>
                            {!isRequired && (
                              <Button
                                variant="ghost"
                                onClick={handleSkip}
                                data-testid={`button-skip-${permission.id}`}
                              >
                                {t("skip")}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 mt-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Progress text */}
            <p className="text-xs text-muted-foreground">
              {t("stepNOfM").replace("{n}", String(currentIndex + 1)).replace("{m}", String(permissions.length))}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => emblaApi?.scrollPrev()}
                  data-testid="button-prev-permission"
                >
                  {t("back")}
                </Button>
              )}

              {isLastPermission ? (
                <Button
                  onClick={finishPermissions}
                  disabled={!canFinish}
                  data-testid="button-continue-permissions"
                >
                  {t("continueBtn")}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => emblaApi?.scrollNext()}
                  data-testid="button-next-permission"
                >
                  {t("next")}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Skip all option - only show if all required permissions are granted */}
          {canFinish && (
            <div className="text-center mt-4">
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={finishPermissions}
                data-testid="button-skip-all"
              >
                {t("skipRemainingAndContinue")}
              </Button>
            </div>
          )}

          {/* Message when required permissions are missing */}
          {!canFinish && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              {t("pleaseGrantRequiredPermissions")}
            </p>
          )}
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
