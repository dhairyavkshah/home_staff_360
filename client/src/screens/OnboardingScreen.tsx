import { useState, useEffect } from "react";
import { Home, Briefcase, Globe, Calendar, Percent, Shield, Lock, ArrowRight, Fingerprint, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { type Currency, type UserType } from "@shared/schema";
import { pinService } from "@/lib/pin-service";
import { useTour } from "@/lib/guided-tour";
import { getCurrencyForCountry, getUserCountry, detectCountryFromIP } from "@/lib/geolocation-service";
import { CountrySelector } from "@/components/ui/country-selector";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { collaborationService } from "@/lib/collaboration-service";
import { detectCountryFromPhoneNumber } from "@/lib/geolocation-service";
import { App } from "@capacitor/app";
import { useTranslation } from "@/lib/i18n/i18n-context";

export function OnboardingScreen() {
  const { navigate, data } = useNavigation();
  const { toast } = useToast();
  const { startTour } = useTour();
  const { t, language } = useTranslation();
  
  const userType = (data.userType as UserType) || "HOME";
  const isHome = userType === "HOME";
  const accountLabel = isHome ? t("household") : t("business");
  const Icon = isHome ? Home : Briefcase;

  const [displayName, setDisplayName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [country, setCountry] = useState("");
  const [countryLocked, setCountryLocked] = useState(false);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [salaryStartDay, setSalaryStartDay] = useState("1");
  const [halfDayPercentage, setHalfDayPercentage] = useState("50");
  const [enableAppLock, setEnableAppLock] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!collaborationService.isAuthenticated()) {
      navigate("auth");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const backHandler = App.addListener("backButton", () => {
    });

    return () => {
      backHandler.then(handle => handle.remove());
    };
  }, []);

  useEffect(() => {
    async function detectCountry() {
      const savedPhone = collaborationService.getSavedPhone();
      if (savedPhone) {
        const phoneCountry = detectCountryFromPhoneNumber(savedPhone);
        if (phoneCountry) {
          setCountry(phoneCountry);
          setCurrency(getCurrencyForCountry(phoneCountry));
          setCountryLocked(true);
          return;
        }
      }
      
      const existingCountry = getUserCountry();
      if (existingCountry) {
        setCountry(existingCountry);
        setCurrency(getCurrencyForCountry(existingCountry));
        return;
      }

      const detectedCode = await detectCountryFromIP();
      if (detectedCode) {
        setCountry(detectedCode);
        setCurrency(getCurrencyForCountry(detectedCode));
      }
    }
    detectCountry();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = t("pleaseEnterYourName");
    }

    if (!accountName.trim()) {
      newErrors.accountName = t("pleaseEnterAccountName");
    }

    if (!country) {
      newErrors.country = t("pleaseSelectCountry");
    }

    const day = parseInt(salaryStartDay);
    if (isNaN(day) || day < 1 || day > 31) {
      newErrors.salaryStartDay = t("enterDayBetween1And31");
    }

    const percentage = parseInt(halfDayPercentage);
    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
      newErrors.halfDayPercentage = t("enterPercentageBetween1And100");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    let profile = storage.getProfile();
    if (!profile) {
      profile = storage.createProfile({
        type: userType,
        displayName: displayName.trim(),
      });
    } else {
      // Update both display name AND type to match onboarding selection
      storage.updateProfile({ displayName: displayName.trim(), type: userType });
    }

    const existingAccounts = storage.getAccounts();
    if (existingAccounts.length === 0) {
      storage.addAccount({
        ownerId: profile.id,
        ownerType: userType,
        name: accountName.trim(),
      });
    }

    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      currency,
      country,
      salaryStartDay: parseInt(salaryStartDay),
      halfDayPercentage: parseInt(halfDayPercentage),
      hasCompletedOnboarding: true,
      defaultAppMode: userType,
    });

    // Save currency to BOTH modes during onboarding so it's the default for both
    const existingHomeSettings = storage.getHomeSettings();
    const existingStaffSettings = storage.getStaffSettings();
    
    if (isHome) {
      storage.saveHomeSettings({
        householdName: accountName.trim(),
        currency,
        salaryStartDay: parseInt(salaryStartDay),
        halfDayPercentage: parseInt(halfDayPercentage),
        language: language,
      });
      // Also apply currency to staff mode so it's the default when user switches
      storage.saveStaffSettings({
        ...existingStaffSettings,
        currency,
        language: language,
      });
    } else {
      storage.saveStaffSettings({
        vendorName: accountName.trim(),
        currency,
        language: language,
      });
      // Also apply currency to home mode so it's the default when user switches
      storage.saveHomeSettings({
        ...existingHomeSettings,
        currency,
        language: language,
      });
    }

    // Sync display name and user type to server
    if (collaborationService.isAuthenticated()) {
      try {
        const result = await collaborationService.updateProfile({
          displayName: displayName.trim(),
          userType: userType,
        });
        if (result.success) {
          storage.updateProfile({ displayName: displayName.trim() });
        }
      } catch (error) {
        console.error("Failed to sync profile to server:", error);
      }
    }

    toast({
      title: t("welcomeToApp"),
      description: t("settingsSaved"),
    });

    if (enableAppLock) {
      navigate("pin-setup", { returnTo: userType === "STAFF" ? "staff-home" : "home", startTour: true, tourMode: userType });
    } else {
      navigate(userType === "STAFF" ? "staff-home" : "home");
      setTimeout(() => startTour(userType), 500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background page-enter" data-testid="screen-onboarding">
      <div className="safe-area-top" />

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold" data-testid="text-welcome-title">
                {isHome ? t("homeUserSetup") : t("professionalSetup")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isHome ? t("letsSetupHousehold") : t("letsSetupBusiness")}
              </p>
            </div>
          </div>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              {t("yourProfile")}
            </h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="displayName">{t("yourName")} <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("enterYourName")}
                className="h-8"
                data-testid="input-display-name"
              />
              {errors.displayName && (
                <p className="text-xs text-destructive" role="alert">{errors.displayName}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="accountName" className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {isHome ? t("householdName") : t("businessName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={isHome ? t("myHome") : t("myBusiness")}
                className="h-8"
                data-testid="input-account-name"
              />
              {errors.accountName && (
                <p className="text-xs text-destructive" role="alert">{errors.accountName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("canAddMoreLater")}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-info" />
              </div>
              {t("regionalSettings")}
            </h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {t("country")} <span className="text-destructive">*</span>
              </Label>
              <CountrySelector
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  const newCurrency = getCurrencyForCountry(v);
                  setCurrency(newCurrency);
                }}
                placeholder={t("selectCountry")}
                disabled={countryLocked}
                data-testid="select-country"
              />
              {countryLocked && (
                <p className="text-xs text-muted-foreground">
                  {t("detectedFromPhone")}
                </p>
              )}
              {errors.country && (
                <p className="text-xs text-destructive" role="alert">{errors.country}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="currency">{t("currency")}</Label>
              <CurrencySelector
                value={currency}
                onValueChange={(v) => setCurrency(v)}
                data-testid="select-currency"
              />
              <p className="text-xs text-muted-foreground">
                {t("currencyAutoSetDesc")}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="salaryDay" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {t("salaryCycleStartDay")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="salaryDay"
                type="number"
                min="1"
                max="31"
                value={salaryStartDay}
                onChange={(e) => setSalaryStartDay(e.target.value)}
                className="h-8"
                data-testid="input-salary-day"
              />
              {errors.salaryStartDay && (
                <p className="text-xs text-destructive" role="alert">{errors.salaryStartDay}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("salaryStartDayDesc")}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="halfDay" className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                {t("halfDayPercentage")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="halfDay"
                type="number"
                min="1"
                max="100"
                value={halfDayPercentage}
                onChange={(e) => setHalfDayPercentage(e.target.value)}
                className="h-8"
                data-testid="input-half-day"
              />
              {errors.halfDayPercentage && (
                <p className="text-xs text-destructive" role="alert">{errors.halfDayPercentage}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("halfDayPercentageDesc")}
              </p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-success" />
              </div>
              {t("security")}
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="appLock" className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {t("enableAppLock")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("protectWith4DigitPin")}
                </p>
              </div>
              <Switch
                id="appLock"
                checked={enableAppLock}
                onCheckedChange={setEnableAppLock}
                data-testid="switch-app-lock"
              />
            </div>
            {enableAppLock && (
              <p className="text-xs text-primary fade-in-up">
                {t("pinSetupAfterComplete")}
              </p>
            )}
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">{t("hundredPercentPrivate")}</h3>
                <p className="text-xs text-muted-foreground">
                  {t("dataSecurelyEncrypted")}
                </p>
              </div>
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            data-testid="button-get-started"
          >
            {t("getStarted")}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}
