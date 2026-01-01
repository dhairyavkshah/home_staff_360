import { useState, useRef, useEffect } from "react";
import { pinService } from "@/lib/pin-service";
import { Button } from "@/components/ui/button";
import { Lock, X } from "lucide-react";

interface PinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function PinConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm with PIN",
  description = "Enter your PIN to continue",
}: PinConfirmModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setAttempts(0);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

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
        onConfirm();
        onClose();
      } else {
        setAttempts((prev) => prev + 1);
        if (attempts >= 2) {
          setError("Too many failed attempts");
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setError(`Incorrect PIN. ${2 - attempts} attempts remaining.`);
          setPin("");
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Escape") {
      onClose();
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
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex gap-3">
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
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-50"
              data-testid={`input-pin-confirm-${index}`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full"
          data-testid="button-cancel-pin"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
