import { useState, useMemo, useCallback } from "react";
import { Database, Trash2, Moon, Sun, Lock, KeyRound, ChevronRight, User, Check, LogOut, Home, Briefcase, Crown, HelpCircle, Volume2, Vibrate, MapPin } from "lucide-react";
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
import { PinConfirmModal } from "@/components/ui/pin-confirm-modal";
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
import { getCurrencyForCountry } from "@/lib/geolocation-service";
import { CountrySelector } from "@/components/ui/country-selector";
import { LanguageSelector } from "@/components/ui/language-selector";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { notifyCurrencyChange } from "@/hooks/useCurrency";

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
  const [country, setCountry] = useState(appSettings.country || "");
  const [currency, setCurrency] = useState<Currency>(modeSettings.currency);
  const [customSymbol, setCustomSymbol] = useState(modeSettings.customCurrencySymbol || "");
  const [salaryStartDay, setSalaryStartDay] = useState(isHome ? homeSettings.salaryStartDay : 1);
  const [halfDayPercentage, setHalfDayPercentage] = useState(isHome ? homeSettings.halfDayPercentage : 50);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showPinConfirmModal, setShowPinConfirmModal] = useState(false);
  const [showDisablePinModal, setShowDisablePinModal] = useState(false);
  const [showExitCover, setShowExitCover] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);

  const [appMode, setAppMode] = useState<UserType>(profile?.type || "HOME");
  
  const initialCountry = useMemo(() => appSettings.country || "", []);
  const initialCurrency = useMemo(() => modeSettings.currency, []);
  const initialCustomSymbol = useMemo(() => modeSettings.customCurrencySymbol || "", []);
  const initialSalaryStartDay = useMemo(() => isHome ? homeSettings.salaryStartDay : 1, []);
  const initialHalfDayPercentage = useMemo(() => isHome ? homeSettings.halfDayPercentage : 50, []);
  const initialLanguage = useMemo(() => modeSettings.language || 'en', []);

  const isDirty = useMemo(() => {
    return (
      country !== initialCountry ||
      currency !== initialCurrency ||
      customSymbol !== initialCustomSymbol ||
      salaryStartDay !== initialSalaryStartDay ||
      halfDayPercentage !== initialHalfDayPercentage ||
      language !== initialLanguage
    );
  }, [country, currency, customSymbol, salaryStartDay, halfDayPercentage, language, initialCountry, initialCurrency, initialCustomSymbol, initialSalaryStartDay, initialHalfDayPercentage, initialLanguage]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setShowUnsavedChangesModal(true);
    } else {
      navigate(appMode === "STAFF" ? "staff-home" : "home");
    }
  }, [isDirty, navigate, appMode]);

  const handleDiscardChanges = () => {
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
        language,
      };
      storage.saveHomeSettings(updatedHomeSettings);
      
      storage.saveSettings({
        ...currentSettings,
        householdName: selectedAccount?.name || undefined,
        country,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language,
        salaryStartDay,
        halfDayPercentage,
        darkMode: theme === "dark",
      });
    } else {
      const updatedStaffSettings: StaffSettings = {
        vendorName: selectedAccount?.name || undefined,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language,
      };
      storage.saveStaffSettings(updatedStaffSettings);
      
      storage.saveSettings({
        ...currentSettings,
        country,
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language,
        darkMode: theme === "dark",
      });
    }

    notifyCurrencyChange();
    toast({ title: t("settingsSaved") });
  };

  const handleClearData = () => {
    if (isPinEnabled) {
      setShowPinConfirmModal(true);
    } else {
      setShowClearDataModal(true);
    }
  };

  const confirmClearData = () => {
    storage.clearAllData();
    toast({ title: "All data cleared" });
    navigate("role-selection");
  };

  const handlePinConfirmed = () => {
    setShowClearDataModal(true);
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
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("general")}</h2>

          <Card className="p-3 flex flex-col gap-2.5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {t("country")}
              </Label>
              <CountrySelector
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  const newCurrency = getCurrencyForCountry(v);
                  setCurrency(newCurrency);
                }}
                data-testid="select-country"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="currency">{t("currency")}</Label>
              <p className="text-xs text-muted-foreground">
                {isHome 
                  ? "Default currency for new staff members. Each staff member can have their own currency."
                  : "Default currency for new clients. Each client can have their own currency."}
              </p>
            </div>
            <CurrencySelector
              value={currency}
              onValueChange={(v) => setCurrency(v)}
              data-testid="select-currency"
            />

          {currency === "OTHER" && (
            <div className="flex flex-col gap-2">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="language">{t("language")}</Label>
            <LanguageSelector
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
              showIcon={false}
              data-testid="select-language"
            />
          </div>

          {isHome && (
            <>
              <div className="flex flex-col gap-2">
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

              <div className="flex flex-col gap-2">
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("account")}</h2>
          <Card className="divide-y">
            {profile && (
              <div className="p-3 flex items-center gap-3">
                <div className="icon-halo-primary w-9 h-9">
                  <User className="w-4.5 h-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isHome ? t("homeUser") : t("staffProfessional")}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Support</h2>
          <button
            className="w-full text-left hover-elevate"
            onClick={() => navigate("support-developer")}
            data-testid="button-support"
          >
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="icon-halo-warning w-10 h-10">
                  <Crown className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Support the Developer</p>
                  <p className="text-xs text-muted-foreground">
                    Help keep this app free and ad-free
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Card>
          </button>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("appMode")}</h2>
          <Card className="divide-y">
            <button
              className={`w-full p-3 flex items-center gap-3 hover-elevate text-left ${appMode === "HOME" ? "bg-primary/5" : ""}`}
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
              className={`w-full p-3 flex items-center gap-3 hover-elevate text-left ${appMode === "STAFF" ? "bg-primary/5" : ""}`}
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("security")}</h2>
          <Card className="divide-y">
            <div className="p-3 flex items-center justify-between gap-3">
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
                className="w-full p-3 flex items-center gap-3 hover-elevate text-left"
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("appearance")}</h2>
          <Card className="p-3">
            <div className="flex items-center justify-between gap-3">
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
                  <p className="text-xs text-muted-foreground">Toggle light/dark theme</p>
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Feedback</h2>
          <Card className="divide-y">
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="icon-halo-primary w-9 h-9">
                  <Vibrate className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Haptic Feedback</p>
                  <p className="text-xs text-muted-foreground">Vibration on touch interactions</p>
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
            <div className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="icon-halo-info w-9 h-9">
                  <Volume2 className="w-4.5 h-4.5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-sm">Sound Effects</p>
                  <p className="text-xs text-muted-foreground">Play tap sounds on interactions</p>
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Help</h2>
          <Card className="divide-y">
            <button
              className="w-full p-3 flex items-center gap-3 hover-elevate text-left"
              onClick={handleStartTour}
              data-testid="button-guided-tour"
            >
              <div className="icon-halo-info w-9 h-9">
                <HelpCircle className="w-4.5 h-4.5 text-info" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">See Guided Tour</p>
                <p className="text-xs text-muted-foreground">Learn how to use the app effectively</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("dataManagement")}</h2>
          <Card className="divide-y">
            <button
              className="w-full p-3 flex items-center gap-3 hover-elevate text-left"
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
            <button
              className="w-full p-3 flex items-center gap-3 hover-elevate text-left"
              onClick={handleClearData}
              data-testid="button-clear-data"
            >
              <div className="icon-halo-destructive w-9 h-9">
                <Trash2 className="w-4.5 h-4.5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-sm text-destructive">{t("clearAllData")}</p>
                <p className="text-xs text-muted-foreground">{t("deleteEverythingStartFresh")}</p>
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
                <p className="text-xs text-muted-foreground">{t("version")} 1.0.0</p>
              </div>
              <p className="text-sm text-muted-foreground">{t("appTagline")}</p>
              <p className="text-xs text-muted-foreground/70 pt-1">{t("craftedBy")}</p>
              <button
                className="text-xs text-primary underline pt-2"
                onClick={() => window.open("https://www.theteam360.com/homestaff360", "_blank")}
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
        open={showClearDataModal}
        onOpenChange={setShowClearDataModal}
        onConfirm={confirmClearData}
        title={t("clearAllData")}
        description="This will permanently delete all your data. This action cannot be undone."
        confirmText="Clear Everything"
        variant="destructive"
      />

      <PinConfirmModal
        isOpen={showPinConfirmModal}
        onClose={() => setShowPinConfirmModal(false)}
        onConfirm={handlePinConfirmed}
        title="Confirm with PIN"
      />

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

      <ExitCoverScreen 
        isVisible={showExitCover} 
        onComplete={handleExitComplete}
        onCancel={() => setShowExitCover(false)}
      />
    </AppLayout>
  );
}
