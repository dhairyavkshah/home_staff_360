import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@/lib/navigation";
import { pinService } from "@/lib/pin-service";
import { storage } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Lock, X, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumericKeypad } from "@/components/ui/numeric-keypad";

interface PinEntryScreenProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  showBiometric?: boolean;
}

export function PinEntryScreen({ 
  onSuccess, 
  title = "Enter Your PIN",
  subtitle = "Enter your 4-digit PIN to unlock",
  showBiometric = true
}: PinEntryScreenProps) {
  const { navigate } = useNavigation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
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

  useEffect(() => {
    const initBiometric = async () => {
      const enabled = await pinService.initializeBiometric();
      setBiometricEnabled(enabled);
    };
    initBiometric();
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4 || attempts >= 3) return;
    
    const updatedPin = pin + digit;
    setPin(updatedPin);
    setError("");

    if (updatedPin.length === 4) {
      setTimeout(() => {
        if (pinService.validatePin(updatedPin)) {
          if (onSuccess) {
            onSuccess();
          } else {
            navigateToHome();
          }
        } else {
          setAttempts((prev) => prev + 1);
          if (attempts >= 2) {
            setError("Too many failed attempts. Please try again later.");
          } else {
            setError(`Incorrect PIN. ${2 - attempts} attempts remaining.`);
          }
          setPin("");
        }
      }, 150);
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
        setError(result.error || "Biometric authentication failed");
      }
    } catch (err: any) {
      setError(err.message || "Biometric authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-background page-enter flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-3 flex flex-col items-center gap-3 fade-in-up">
        <div className="icon-halo-primary w-12 h-12">
          <Lock className="w-6 h-6 text-primary" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
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

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm fade-in-up">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {showBiometric && biometricEnabled && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleBiometric}
            data-testid="button-biometric"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Use Biometric</span>
          </Button>
        )}

        <NumericKeypad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          disabled={attempts >= 3}
        />

        <p className="text-xs text-muted-foreground text-center">
          Your PIN protects your household data
        </p>
      </Card>
    </div>
  );
}
