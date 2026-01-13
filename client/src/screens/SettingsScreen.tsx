import { useState, useMemo, useCallback } from "react";
import { Database, Moon, Sun, Lock, KeyRound, ChevronRight, User, Check, LogOut, Home, Briefcase, HelpCircle, Volume2, Vibrate, MapPin, Link2, Crown } from "lucide-react";
import { App } from "@capacitor/app";
import { ExitCoverScreen } from "@/components/ExitCoverScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { type Currency, type Language, type UserType, type HomeSettings, type StaffSettings, languages, languageLabels, PLAN_LIMITS } from "@shared/schema";
import { useTheme } from "@/lib/theme-provider";
import { pinService } from "@/lib/pin-service";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useTour } from "@/lib/guided-tour";
import { setHapticEnabled, setSoundEnabled, isHapticEnabled, isSoundEnabled } from "@/lib/sound-service";
import { getCurrencyForCountry, getCountryByCode } from "@/lib/geolocation-service";
import { LanguageSelector } from "@/components/ui/language-selector";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { notifyCurrencyChange } from "@/hooks/useCurrency";
import { collaborationService } from "@/lib/collaboration-service";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";

export function SettingsScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const profile = useMemo(() => storage.getProfile(), []);
  const isHome = profile?.type === "HOME";
  
  const homeSettings = useMemo(() => storage.getHomeSettings(), []);
  const staffSettings = useMemo(() => storage.getStaffSettings(), []);
  const modeSettings = isHome ? homeSettings : staffSettings;
  
  const activeAccount = useMemo(() => {
    const activeId = storage.getActiveAccountId();
    return activeId ? storage.getAccount(activeId) : null;
  }, []);
  
  const appSettings = useMemo(() => storage.getSettings(), []);
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccount?.id || "");
  const country = appSettings.detectedCountry || appSettings.country || "";
  const [currency, setCurrency] = useState<Currency>(modeSettings.currency);
  const [customSymbol, setCustomSymbol] = useState(modeSettings.customCurrencySymbol || "");
  const [salaryStartDay, setSalaryStartDay] = useState(isHome ? homeSettings.salaryStartDay : 1);
  const [halfDayPercentage, setHalfDayPercentage] = useState(isHome ? homeSettings.halfDayPercentage : 50);
  const [pendingLanguage, setPendingLanguage] = useState<Language>(language);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDisablePinModal, setShowDisablePinModal] = useState(false);
  const [showExitCover, setShowExitCover] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [appMode, setAppMode] = useState<UserType>(profile?.type || "HOME");
  
  const initialCurrency = useMemo(() => modeSettings.currency, []);
  const initialCustomSymbol = useMemo(() => modeSettings.customCurrencySymbol || "", []);
  const initialSalaryStartDay = useMemo(() => isHome ? homeSettings.salaryStartDay : 1, []);
  const initialHalfDayPercentage = useMemo(() => isHome ? homeSettings.halfDayPercentage : 50, []);
  const initialLanguage = useMemo(() => modeSettings.language || 'en', []);

  const isDirty = useMemo(() => {
    return (
      currency !== initialCurrency ||
      customSymbol !== initialCustomSymbol ||
      salaryStartDay !== initialSalaryStartDay ||
      halfDayPercentage !== initialHalfDayPercentage ||
      pendingLanguage !== initialLanguage
    );
  }, [currency, customSymbol, salaryStartDay, halfDayPercentage, pendingLanguage, initialCurrency, initialCustomSymbol, initialSalaryStartDay, initialHalfDayPercentage, initialLanguage]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(appMode === "STAFF" ? "staff-home" : "home");
    }
  }, [isDirty, navigate, appMode]);

  const handleDiscardChanges = () => {
    setCurrency(initialCurrency);
    setCustomSymbol(initialCustomSymbol);
    setSalaryStartDay(initialSalaryStartDay);
    setHalfDayPercentage(initialHalfDayPercentage);
    setPendingLanguage(initialLanguage);
    setShowUnsavedChangesModal(false);
    navigate(appMode === "STAFF" ? "staff-home" : "home");
  };

  const handleCloseApp = useCallback(() => {
    setShowExitCover(true);
  }, []);

  const handleExitComplete = useCallback(async () => {
    try {
      await App.exitApp();
    } catch {
    }
    try {
      window.close();
    } catch {
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    throw new Error("exit_blocked");
  }, []);
  const isPinEnabled = pinService.isPinEnabled();
  const { startTour } = useTour();
  const [hapticFeedback, setHapticFeedback] = useState(isHapticEnabled());
  const [soundEffects, setSoundEffects] = useState(isSoundEnabled());
  const { isSubscribed, expiryDate } = useSubscription();

  const handleStartTour = () => {
    const mode = profile?.type || "HOME";
    navigate(mode === "STAFF" ? "staff-home" : "home");
    setTimeout(() => startTour(mode), 300);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (currency === "OTHER" && !customSymbol.trim()) {
      newErrors.customSymbol = "Custom symbol required";
    }
    if (halfDayPercentage < 0 || halfDayPercentage > 100) {
      newErrors.halfDayPercentage = "Must be between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const currentSettings = storage.getSettings();
    const selectedAccount = storage.getAccount(selectedAccountId);
    
    if (isHome) {
      const updatedHomeSettings: HomeSettings = {
        householdName: selectedAccount?.name || undefined,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        salaryStartDay,
        halfDayPercentage,
        language: pendingLanguage,
      };
      storage.saveHomeSettings(updatedHomeSettings);
      
      storage.saveSettings({
        ...currentSettings,
        householdName: selectedAccount?.name || undefined,
        country,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language: pendingLanguage,
        salaryStartDay,
        halfDayPercentage,
        darkMode: theme === "dark",
      });
    } else {
      const updatedStaffSettings: StaffSettings = {
        vendorName: selectedAccount?.name || undefined,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language: pendingLanguage,
      };
      storage.saveStaffSettings(updatedStaffSettings);
      
      storage.saveSettings({
        ...currentSettings,
        country,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language: pendingLanguage,
        darkMode: theme === "dark",
      });
    }

    setLanguage(pendingLanguage);
    notifyCurrencyChange();
    toast({ title: t("settingsSaved") });
  };

  const handleTogglePin = () => {
    if (isPinEnabled) {
      setShowDisablePinModal(true);
    } else {
      navigate("pin-setup", { returnTo: "settings" });
    }
  };

  const handleDisablePin = () => {
    pinService.disablePin();
    toast({ title: "App Lock disabled" });
    setShowDisablePinModal(false);
  };

  const toggleDarkMode = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await collaborationService.logout();
    toast({ title: t("loggedOut") });
    navigate("auth");
  };

  const handleAppModeSwitch = (mode: UserType) => {
    if (mode === appMode) return;
    storage.switchAppMode(mode);
    const currentSettings = storage.getSettings();
    storage.saveSettings({
      ...currentSettings,
      defaultAppMode: mode,
    });
    setAppMode(mode);
    toast({ title: mode === "HOME" ? t("switchedToHomeMode") : t("switchedToStaffMode") });
    navigate(mode === "STAFF" ? "staff-home" : "home");
  };

  return (
    <AppLayout>
      <Header
        title={t("settingsTitle")}
        subtitle=""
        onBack={handleBack}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("general")}</h2>

          <Card className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <Label htmlFor="country" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t("country")}
              </Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm" data-testid="badge-country">
                  {getCountryByCode(country)?.name || country || "Not detected"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Auto-detected from Google Play
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <p className="text-xs text-muted-foreground">
                {isHome 
                  ? t("defaultCurrencyForStaff")
                  : t("defaultCurrencyForClients")}
              </p>
            </div>
            <CurrencySelector
              value={currency}
              onValueChange={(v) => setCurrency(v)}
              data-testid="select-currency"
            />

          {currency === "OTHER" && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="customSymbol">{t("currencySymbol")}</Label>
              <Input
                id="customSymbol"
                value={customSymbol}
                onChange={(e) => setCustomSymbol(e.target.value)}
                placeholder="e.g., ¥, ₣"
                data-testid="input-custom-symbol"
              />
              {errors.customSymbol && (
                <p className="text-xs text-destructive">{errors.customSymbol}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Label htmlFor="language">{t("language")}</Label>
            <LanguageSelector
              value={pendingLanguage}
              onValueChange={(v) => setPendingLanguage(v as Language)}
              showIcon={false}
              data-testid="select-language"
            />
          </div>

          {isHome && (
            <>
              <div className="flex flex-col gap-4">
                <Label htmlFor="salaryStartDay">{t("salaryStartDay")}</Label>
                <SearchableSelect
                  value={salaryStartDay.toString()}
                  onValueChange={(v) => setSalaryStartDay(parseInt(v))}
                  placeholder="Select day"
                  searchPlaceholder="Search day..."
                  emptyMessage="No day found"
                  options={Array.from({ length: 31 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: (i + 1).toString(),
                  }))}
                  data-testid="select-salary-day"
                />
              </div>

              <div className="flex flex-col gap-4">
                <Label htmlFor="halfDayPercentage">{t("halfDayPercentageLabel")}</Label>
                <Input
                  id="halfDayPercentage"
                  type="number"
                  value={halfDayPercentage}
                  onChange={(e) => setHalfDayPercentage(parseInt(e.target.value) || 0)}
                  data-testid="input-half-day-percentage"
                />
                {errors.halfDayPercentage && (
                  <p className="text-xs text-destructive">{errors.halfDayPercentage}</p>
                )}
              </div>
            </>
          )}
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("account")}</h2>
          <Card className="divide-y">
            <button
              className="w-full p-4 text-left hover-elevate"
              onClick={() => navigate("profile-settings")}
              data-testid="button-profile-settings"
            >
              <div className="flex items-center gap-3">
                <div className="icon-halo-primary w-9 h-9">
                  <User className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  {profile && (
                    <>
                      <p className="font-medium text-sm">{profile.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {isHome ? t("homeUser") : t("staffProfessional")}
                      </p>
                    </>
                  )}
                  {!profile && (
                    <>
                      <p className="font-medium text-sm">Profile Settings</p>
                      <p className="text-xs text-muted-foreground">
                        Manage your name, phone, and password
                      </p>
                    </>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
            {collaborationService.isAuthenticated() && (
              <button
                className="w-full p-4 text-left hover-elevate"
                onClick={() => setShowLogoutModal(true)}
                data-testid="button-logout"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-halo-destructive w-9 h-9">
                    <LogOut className="w-4.5 h-4.5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-destructive">{t("logout")}</p>
                    <p className="text-xs text-muted-foreground">{t("logoutDescription")}</p>
                  </div>
                </div>
              </button>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Subscription</h2>
          <Card className="divide-y">
            <button
              className="w-full p-4 text-left hover-elevate"
              onClick={() => navigate("subscription")}
              data-testid="button-subscription"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 ${isSubscribed ? "icon-halo-success" : "icon-halo-warning"}`}>
                  <Crown className={`w-4.5 h-4.5 ${isSubscribed ? "text-success" : "text-warning"}`} />
                </div>
                <div className="flex-1">
                  {isSubscribed ? (
                    <>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Premium Active</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {expiryDate 
                          ? `Active until ${format(new Date(expiryDate), "MMM dd, yyyy")}`
                          : "Full access to all features"
                        }
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-sm">No Active Subscription</p>
                      <p className="text-xs text-muted-foreground">
                        Subscribe to access all features
                      </p>
                    </>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("appMode")}</h2>
          <Card className="divide-y">
            <button
              className={`w-full p-4 flex items-center gap-4 hover-elevate text-left ${appMode === "HOME" ? "bg-primary/5" : ""}`}
              onClick={() => handleAppModeSwitch("HOME")}
              data-testid="button-home-mode"
            >
              <div className="icon-halo-primary w-9 h-9">
                <Home className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("homeUserMode")}</p>
                <p className="text-xs text-muted-foreground">{t("manageYourHouseholdStaff")}</p>
              </div>
              {appMode === "HOME" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              className={`w-full p-4 flex items-center gap-4 hover-elevate text-left ${appMode === "STAFF" ? "bg-primary/5" : ""}`}
              onClick={() => handleAppModeSwitch("STAFF")}
              data-testid="button-staff-mode"
            >
              <div className="icon-halo-warning w-9 h-9">
                <Briefcase className="w-4.5 h-4.5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("staffVendorUserMode")}</p>
                <p className="text-xs text-muted-foreground">{t("trackYourOwnWork")}</p>
              </div>
              {appMode === "STAFF" && <Check className="w-4 h-4 text-primary" />}
            </button>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("security")}</h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="icon-halo-success w-9 h-9">
                  <Lock className="w-4.5 h-4.5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t("appLock")}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPinEnabled ? t("protectedWithPin") : t("protectWith4DigitPin")}
                  </p>
                </div>
              </div>
              <Switch
                checked={isPinEnabled}
                onCheckedChange={handleTogglePin}
                data-testid="switch-app-lock"
              />
            </div>
            {isPinEnabled && (
              <button
                className="w-full p-4 flex items-center gap-4 hover-elevate text-left"
                onClick={() => navigate("pin-setup", { returnTo: "settings" })}
                data-testid="button-change-pin"
              >
                <div className="icon-halo-info w-9 h-9">
                  <KeyRound className="w-4.5 h-4.5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t("changePin")}</p>
                  <p className="text-xs text-muted-foreground">{t("setNewPin")}</p>
                </div>
              </button>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("appearance")}</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="icon-halo-muted w-9 h-9">
                  {theme === "dark" ? (
                    <Moon className="w-4.5 h-4.5" />
                  ) : (
                    <Sun className="w-4.5 h-4.5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{t("darkMode")}</p>
                  <p className="text-xs text-muted-foreground">{t("toggleLightDarkTheme")}</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("feedback")}</h2>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="icon-halo-primary w-9 h-9">
                  <Vibrate className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t("hapticFeedback")}</p>
                  <p className="text-xs text-muted-foreground">{t("vibrationOnTouch")}</p>
                </div>
              </div>
              <Switch
                checked={hapticFeedback}
                onCheckedChange={(checked) => {
                  setHapticFeedback(checked);
                  setHapticEnabled(checked);
                  const currentSettings = storage.getSettings();
                  storage.saveSettings({ ...currentSettings, hapticFeedbackEnabled: checked });
                }}
                data-testid="switch-haptic-feedback"
              />
            </div>
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="icon-halo-info w-9 h-9">
                  <Volume2 className="w-4.5 h-4.5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-sm">{t("soundEffects")}</p>
                  <p className="text-xs text-muted-foreground">{t("playTapSounds")}</p>
                </div>
              </div>
              <Switch
                checked={soundEffects}
                onCheckedChange={(checked) => {
                  setSoundEffects(checked);
                  setSoundEnabled(checked);
                  const currentSettings = storage.getSettings();
                  storage.saveSettings({ ...currentSettings, soundEffectsEnabled: checked });
                }}
                data-testid="switch-sound-effects"
              />
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("help")}</h2>
          <Card className="divide-y">
            <button
              className="w-full p-4 flex items-center gap-4 hover-elevate text-left"
              onClick={handleStartTour}
              data-testid="button-guided-tour"
            >
              <div className="icon-halo-info w-9 h-9">
                <HelpCircle className="w-4.5 h-4.5 text-info" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("seeGuidedTour")}</p>
                <p className="text-xs text-muted-foreground">{t("learnHowToUseApp")}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("dataManagement")}</h2>
          <Card className="p-3">
            <button
              className="w-full flex items-center gap-3 hover-elevate text-left"
              onClick={() => navigate("backup")}
              data-testid="button-backup"
            >
              <div className="icon-halo-info w-9 h-9">
                <Database className="w-4.5 h-4.5 text-info" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("backupAndRestore")}</p>
                <p className="text-xs text-muted-foreground">{t("exportImportData")}</p>
              </div>
            </button>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("about")}</h2>
          <Card className="p-4">
            <div className="text-center flex flex-col gap-2">
              <div>
                <p className="font-semibold text-base">Home Staff 360</p>
                <p className="text-xs text-muted-foreground">{t("version")}: v3.0</p>
              </div>
              <p className="text-sm text-muted-foreground">{t("appTagline")}</p>
              <p className="text-xs text-muted-foreground/70 pt-1">{t("craftedBy")}</p>
              <button
                className="text-xs text-primary underline pt-2"
                onClick={() => navigate("privacy-policy")}
                data-testid="button-privacy-policy"
              >
                Privacy Policy
              </button>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("exitApp")}</h2>
          <Card className="divide-y">
            <button
              className="w-full p-3 flex items-center gap-3 hover-elevate text-left"
              onClick={handleCloseApp}
              data-testid="button-close-app"
            >
              <div className="icon-halo-muted w-9 h-9">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("exitApp")}</p>
                <p className="text-xs text-muted-foreground">{t("exitAppDescription")}</p>
              </div>
            </button>
          </Card>
        </section>

        <Button className="w-full" onClick={handleSave} data-testid="button-save-settings">
          {t("saveSettings")}
        </Button>
      </ScrollContent>

      <ConfirmModal
        open={showDisablePinModal}
        onOpenChange={setShowDisablePinModal}
        onConfirm={handleDisablePin}
        title="Disable App Lock"
        description="Are you sure you want to disable the PIN lock? Your app will no longer be protected."
        confirmText="Disable"
        variant="destructive"
      />

      <ConfirmModal
        open={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        onConfirm={() => {
          setShowUnsavedChangesModal(false);
          handleSave();
          navigate(appMode === "STAFF" ? "staff-home" : "home");
        }}
        title="Unsaved Changes"
        description="You have unsaved changes. Would you like to save them before leaving?"
        confirmText="Save"
        cancelText="Discard"
        onCancel={handleDiscardChanges}
      />

      <ConfirmModal
        open={showLogoutModal}
        onOpenChange={setShowLogoutModal}
        onConfirm={handleLogout}
        title={t("logoutConfirmTitle")}
        description={t("logoutConfirmDescription")}
        confirmText={t("logout")}
        variant="destructive"
      />

      <ExitCoverScreen 
        isVisible={showExitCover} 
        onComplete={handleExitComplete}
        onCancel={() => setShowExitCover(false)}
      />
    </AppLayout>
  );
}
