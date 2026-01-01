import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigation } from "@/lib/navigation";
import { pinService } from "@/lib/pin-service";
import { storage } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Lock, X, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
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
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = pin.split("");
    newPin[index] = value.slice(-1);
    const updatedPin = newPin.join("").slice(0, 4);
    setPin(updatedPin);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (updatedPin.length === 4) {
      if (pinService.validatePin(updatedPin)) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigateToHome();
        }
      } else {
        setAttempts((prev) => prev + 1);
        setError(`Incorrect PIN. ${3 - attempts} attempts remaining.`);
        setPin("");
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        
        if (attempts >= 2) {
          setError("Too many failed attempts. Please try again later.");
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || "Biometric authentication failed");
      inputRefs.current[0]?.focus();
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

        <div className="flex gap-2.5">
          {[0, 1, 2, 3].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[index] || ""}
              onChange={(e) => handleDigitInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={attempts >= 3}
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
              data-testid={`input-pin-${index}`}
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

        <p className="text-xs text-muted-foreground text-center">
          Your PIN protects your household data
        </p>
      </Card>
    </div>
  );
}
