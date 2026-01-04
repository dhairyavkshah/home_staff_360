import { useState, useEffect } from "react";
import { pinService } from "@/lib/pin-service";
import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface PinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PinConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: PinConfirmModalProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setAttempts(0);
    }
  }, [isOpen]);

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4 || attempts >= 3) return;
    
    const updatedPin = pin + digit;
    setPin(updatedPin);
    setError("");

    if (updatedPin.length === 4) {
      setTimeout(() => {
        if (pinService.validatePin(updatedPin)) {
          onConfirm();
          onClose();
        } else {
          setAttempts((prev) => prev + 1);
          if (attempts >= 2) {
            setError(t("tooManyFailedAttempts"));
            setTimeout(() => {
              onClose();
            }, 1500);
          } else {
            setError(t("incorrectPinAttempts").replace("{n}", String(2 - attempts)));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm fade-in-scale"
        onClick={onClose}
      />
      <div className="relative bg-background rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl fade-in-up flex flex-col items-center gap-5">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3"
          onClick={onClose}
          data-testid="button-close-pin-modal"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-destructive" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1">{t("confirmWithPin")}</h2>
          <p className="text-sm text-muted-foreground">{t("enterPinToContinue")}</p>
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
          <div className="flex items-center gap-2 text-destructive text-sm">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <NumericKeypad
          onDigitPress={handleDigitPress}
          onBackspace={handleBackspace}
          disabled={attempts >= 3}
        />

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full"
          data-testid="button-cancel-pin"
        >
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
