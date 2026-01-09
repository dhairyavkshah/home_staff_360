import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@/lib/navigation";
import { pinService } from "@/lib/pin-service";
import { storage } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Lock, X, Fingerprint, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { getErrorMessage, TIMING } from "@/lib/utils";

interface PinEntryScreenProps {
  onSuccess?: () => void;
  showBiometric?: boolean;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PinEntryScreen({ 
  onSuccess, 
  showBiometric = true
}: PinEntryScreenProps) {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLockedOut, setIsLockedOut] = useState(pinService.isLockedOut());
  const [lockoutRemaining, setLockoutRemaining] = useState(pinService.getLockoutRemainingMs());
  const [remainingAttempts, setRemainingAttempts] = useState(pinService.getRemainingAttempts());
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const profile = useMemo(() => storage.getProfile(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  
  const navigateToHome = () => {
    const defaultMode = settings.defaultAppMode || profile?.type || "HOME";
    if (defaultMode === "STAFF") {
      navigate("staff-home");
    } else {
      navigate("home");
    }
  };

  // Check lockout status and update countdown
  useEffect(() => {
    const checkLockout = () => {
      const lockedOut = pinService.isLockedOut();
      setIsLockedOut(lockedOut);
      if (lockedOut) {
        setLockoutRemaining(pinService.getLockoutRemainingMs());
      } else {
        setRemainingAttempts(pinService.getRemainingAttempts());
      }
    };
    
    checkLockout();
    const interval = setInterval(checkLockout, TIMING.COOLDOWN_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initBiometric = async () => {
      const enabled = await pinService.initializeBiometric();
      setBiometricEnabled(enabled);
    };
    initBiometric();
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4 || isLockedOut) return;
    
    const updatedPin = pin + digit;
    setPin(updatedPin);
    setError("");

    if (updatedPin.length === 4) {
      setTimeout(async () => {
        const isValid = await pinService.validatePin(updatedPin);
        if (isValid) {
          if (onSuccess) {
            onSuccess();
          } else {
            navigateToHome();
          }
        } else {
          const result = pinService.recordFailedAttempt();
          if (result.isLockedOut) {
            setIsLockedOut(true);
            setLockoutRemaining(pinService.getLockoutRemainingMs());
            setError(t("tooManyFailedAttempts"));
          } else {
            setRemainingAttempts(result.remainingAttempts);
            setError(t("incorrectPinAttempts").replace("{n}", String(result.remainingAttempts)));
          }
          setPin("");
        }
      }, TIMING.BUTTON_FEEDBACK_MS);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError("");
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await pinService.authenticateWithBiometric();
      
      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigateToHome();
        }
      } else {
        setError(result.error || t("biometricAuthFailed"));
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-background page-enter flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-4 flex flex-col items-center gap-4 fade-in-up">
        <div className="icon-halo-primary w-12 h-12">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">{t("enterYourPin")}</h2>
          <p className="text-xs text-muted-foreground">{t("enterPinToUnlock")}</p>
        </div>

        <div className="flex gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin[index] 
                  ? "bg-primary border-primary" 
                  : "border-muted-foreground/50"
              }`}
              data-testid={`pin-dot-${index}`}
            />
          ))}
        </div>

        {isLockedOut ? (
          <div className="flex flex-col items-center gap-2 text-destructive fade-in-up">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{t("accountLocked")}</span>
            </div>
            <p className="text-xs text-center">
              {t("tooManyAttemptsTryIn").replace("{time}", formatCountdown(lockoutRemaining))}
            </p>
          </div>
        ) : error && (
          <div className="flex items-center gap-2 text-destructive text-sm fade-in-up">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {showBiometric && biometricEnabled && !isLockedOut && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleBiometric}
            data-testid="button-biometric"
          >
            <Fingerprint className="w-4 h-4" />
            <span>{t("useBiometric")}</span>
          </Button>
        )}

        <NumericKeypad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          disabled={isLockedOut}
        />

        <p className="text-xs text-muted-foreground text-center">
          {t("pinProtectsData")}
        </p>
      </Card>
    </div>
  );
}
