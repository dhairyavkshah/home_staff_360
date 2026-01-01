import { useState, useMemo, useCallback } from "react";
import { Database, Trash2, Moon, Sun, Lock, KeyRound, ChevronRight, User, Check, LogOut, Home, Briefcase, Crown, HelpCircle } from "lucide-react";
import { App } from "@capacitor/app";
import { ExitCoverScreen } from "@/components/ExitCoverScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  
  const [selectedAccountId, setSelectedAccountId] = useState(activeAccount?.id || "");
  const [currency, setCurrency] = useState<Currency>(modeSettings.currency);
  const [customSymbol, setCustomSymbol] = useState(modeSettings.customCurrencySymbol || "");
  const [salaryStartDay, setSalaryStartDay] = useState(isHome ? homeSettings.salaryStartDay : 1);
  const [halfDayPercentage, setHalfDayPercentage] = useState(isHome ? homeSettings.halfDayPercentage : 50);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showPinConfirmModal, setShowPinConfirmModal] = useState(false);
  const [showDisablePinModal, setShowDisablePinModal] = useState(false);
  const [showExitCover, setShowExitCover] = useState(false);

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
  const [appMode, setAppMode] = useState<UserType>(profile?.type || "HOME");
  const isPinEnabled = pinService.isPinEnabled();
  const { startTour } = useTour();

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
        currency,
        customCurrencySymbol: currency === "OTHER" ? customSymbol : undefined,
        language,
        darkMode: theme === "dark",
      });
    }

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
        onBack={() => navigate(appMode === "STAFF" ? "staff-home" : "home")}
      />

      <ScrollContent>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("general")}</h2>

          <Card className="p-3 flex flex-col gap-2.5">
            <Label htmlFor="currency">{t("currency")}</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger id="currency" data-testid="select-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>

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
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger id="language" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {languageLabels[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isHome && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="salaryStartDay">{t("salaryStartDay")}</Label>
                <Select
                  value={salaryStartDay.toString()}
                  onValueChange={(v) => setSalaryStartDay(parseInt(v))}
                >
                  <SelectTrigger id="salaryStartDay" data-testid="select-salary-day">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("subscriptionPlan")}</h2>
          <button
            className="w-full text-left hover-elevate"
            onClick={() => navigate("plan")}
            data-testid="button-plan"
          >
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <div className="icon-halo-warning w-10 h-10">
                  <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{t("subscriptionPlan")}</p>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      {storage.getTrialInfo().status === "PURCHASED" ? "PREMIUM" : 
                       storage.getTrialInfo().status === "TRIAL" ? `${storage.getTrialInfo().daysRemaining} DAYS LEFT` : "EXPIRED"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {storage.getTrialInfo().status === "PURCHASED" ? "Lifetime premium access" : 
                     storage.getTrialInfo().status === "TRIAL" ? "Free trial - all features unlocked" : "Upgrade to unlock all features"}
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
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">About</h2>
          <Card className="p-3">
            <div className="text-center">
              <p className="font-medium text-sm">Home Staff 360</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
              <p className="text-xs text-muted-foreground mt-1">Offline-first mobile app</p>
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

      <ExitCoverScreen 
        isVisible={showExitCover} 
        onComplete={handleExitComplete}
        onCancel={() => setShowExitCover(false)}
      />
    </AppLayout>
  );
}
