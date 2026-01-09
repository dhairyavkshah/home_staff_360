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

export function OnboardingScreen() {
  const { navigate, data } = useNavigation();
  const { toast } = useToast();
  const { startTour } = useTour();
  
  const userType = (data.userType as UserType) || "HOME";
  const isHome = userType === "HOME";
  const accountLabel = isHome ? "Household" : "Business";
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
      newErrors.displayName = "Please enter your name";
    }

    if (!accountName.trim()) {
      newErrors.accountName = `Please enter a ${accountLabel.toLowerCase()} name`;
    }

    if (!country) {
      newErrors.country = "Please select your country";
    }

    const day = parseInt(salaryStartDay);
    if (isNaN(day) || day < 1 || day > 31) {
      newErrors.salaryStartDay = "Enter a day between 1 and 31";
    }

    const percentage = parseInt(halfDayPercentage);
    if (isNaN(percentage) || percentage < 1 || percentage > 100) {
      newErrors.halfDayPercentage = "Enter a percentage between 1 and 100";
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
      storage.updateProfile({ displayName: displayName.trim() });
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

    if (isHome) {
      storage.saveHomeSettings({
        householdName: accountName.trim(),
        currency,
        salaryStartDay: parseInt(salaryStartDay),
        halfDayPercentage: parseInt(halfDayPercentage),
        language: 'en',
      });
    } else {
      storage.saveStaffSettings({
        vendorName: accountName.trim(),
        currency,
        language: 'en',
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
      title: "Welcome to Home Staff 360!",
      description: "Your settings have been saved.",
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
                {isHome ? "Home User Setup" : "Professional Setup"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isHome ? "Let's set up your household staff manager" : "Let's set up your business management"}
              </p>
            </div>
          </div>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              Your Profile
            </h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="displayName">Your Name <span className="text-destructive">*</span></Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
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
                {accountLabel} Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="accountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={isHome ? "My Home" : "My Business"}
                className="h-8"
                data-testid="input-account-name"
              />
              {errors.accountName && (
                <p className="text-xs text-destructive" role="alert">{errors.accountName}</p>
              )}
              <p className="text-xs text-muted-foreground">
                You can add more {accountLabel.toLowerCase()}s later
              </p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-info" />
              </div>
              Regional Settings
            </h2>

            <div className="flex flex-col gap-1">
              <Label htmlFor="country" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Country <span className="text-destructive">*</span>
              </Label>
              <CountrySelector
                value={country}
                onValueChange={(v) => {
                  setCountry(v);
                  const newCurrency = getCurrencyForCountry(v);
                  setCurrency(newCurrency);
                }}
                placeholder="Select your country"
                disabled={countryLocked}
                data-testid="select-country"
              />
              {countryLocked && (
                <p className="text-xs text-muted-foreground">
                  Detected from your phone number
                </p>
              )}
              {errors.country && (
                <p className="text-xs text-destructive" role="alert">{errors.country}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelector
                value={currency}
                onValueChange={(v) => setCurrency(v)}
                data-testid="select-currency"
              />
              <p className="text-xs text-muted-foreground">
                Auto-set based on country, but you can change it
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="salaryDay" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Salary Cycle Start Day (1-31) <span className="text-destructive">*</span>
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
                Day of month when salary calculations begin
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="halfDay" className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5" />
                Half-Day Percentage <span className="text-destructive">*</span>
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
                Percentage of daily wage for half-day work
              </p>
            </div>
          </Card>

          <Card className="p-4 flex flex-col gap-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Lock className="w-4 h-4 text-success" />
              </div>
              Security
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="appLock" className="flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  Enable App Lock
                </Label>
                <p className="text-xs text-muted-foreground">
                  Protect your data with a 4-digit PIN
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
                You'll set up your PIN after completing setup
              </p>
            )}
          </Card>

          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">100% Private</h3>
                <p className="text-xs text-muted-foreground">
                  Your data is securely encrypted and synced across devices.
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
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}
