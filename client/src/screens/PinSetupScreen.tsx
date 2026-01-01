import { useState, useRef, useEffect } from "react";
import { useNavigation } from "@/lib/navigation";
import { pinService } from "@/lib/pin-service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, Check, X, Fingerprint } from "lucide-react";

type Step = "enter" | "confirm" | "biometric";

export function PinSetupScreen() {
  const { navigate, data, goBack } = useNavigation();
  const { toast } = useToast();
  const returnScreen = (data?.returnTo as string) || "settings";
  const shouldStartTour = data?.startTour === true;
  const tourMode = data?.tourMode as string | undefined;
  
  const navigateToReturn = () => {
    if (shouldStartTour && tourMode) {
      navigate(returnScreen as any, { startTour: true, tourMode });
    } else {
      navigate(returnScreen as any);
    }
  };
  
  const [step, setStep] = useState<Step>("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enrollingBiometric, setEnrollingBiometric] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const currentPin = step === "enter" ? pin : confirmPin;
  const setCurrentPin = step === "enter" ? setPin : setConfirmPin;

  useEffect(() => {
    if (step !== "biometric") {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  useEffect(() => {
    async function checkBiometric() {
      const available = await pinService.checkPlatformAuthenticator();
      setBiometricAvailable(available);
    }
    checkBiometric();
  }, []);

  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = currentPin.split("");
    newPin[index] = value.slice(-1);
    const updatedPin = newPin.join("").slice(0, 4);
    setCurrentPin(updatedPin);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (updatedPin.length === 4) {
      if (step === "enter") {
        setTimeout(() => {
          setStep("confirm");
          setConfirmPin("");
        }, 150);
      } else if (step === "confirm") {
        if (updatedPin === pin) {
          pinService.setPin(updatedPin);
          if (biometricAvailable) {
            setStep("biometric");
          } else {
            toast({
              title: "PIN Set Successfully",
              description: "Your app is now protected with a PIN.",
            });
            navigateToReturn();
          }
        } else {
          setError("PINs don't match. Try again.");
          setConfirmPin("");
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !currentPin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("enter");
      setPin("");
      setConfirmPin("");
      setError("");
    } else if (step === "biometric") {
      toast({
        title: "PIN Set Successfully",
        description: "Your app is now protected with a PIN.",
      });
      navigateToReturn();
    } else {
      navigateToReturn();
    }
  };

  const handleEnableBiometric = async () => {
    setEnrollingBiometric(true);
    setError("");
    try {
      const result = await pinService.enrollBiometric();
      if (result.success) {
        toast({
          title: "Biometric Enabled",
          description: "You can now unlock with your fingerprint or face.",
        });
        navigateToReturn();
      } else {
        setError(result.error || "Failed to enable biometric");
      }
    } catch (e: any) {
      setError(e.message || "Failed to enable biometric");
    } finally {
      setEnrollingBiometric(false);
    }
  };

  const handleSkipBiometric = () => {
    toast({
      title: "PIN Set Successfully",
      description: "Your app is now protected with a PIN.",
    });
    navigate(returnScreen as any);
  };

  return (
    <div className="min-h-screen bg-background page-enter">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50 flex-shrink-0">
        <div className="content-container py-3 min-h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Set Up PIN</h1>
          </div>
        </div>
      </header>

      <main className="p-4 flex flex-col items-center justify-center min-h-[70vh]">
        {step === "biometric" ? (
          <Card className="w-full max-w-sm p-3 flex flex-col items-center gap-3 fade-in-up">
            <div className="icon-halo-primary w-12 h-12">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">Enable Biometric Unlock?</h2>
              <p className="text-xs text-muted-foreground">
                Use your fingerprint or face to unlock Home Staff 360 quickly and securely.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm fade-in-up">
                <X className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={handleEnableBiometric}
                disabled={enrollingBiometric}
                className="w-full"
                data-testid="button-enable-biometric"
              >
                {enrollingBiometric ? "Enabling..." : "Enable Biometric"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipBiometric}
                disabled={enrollingBiometric}
                className="w-full"
                data-testid="button-skip-biometric"
              >
                Skip for Now
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Your biometric data never leaves your device. We only receive a success/failure response.
            </p>
          </Card>
        ) : (
          <Card className="w-full max-w-sm p-3 flex flex-col items-center gap-3 fade-in-up">
            <div className="icon-halo-primary w-12 h-12">
              <Lock className="w-6 h-6 text-primary" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">
                {step === "enter" ? "Create Your PIN" : "Confirm Your PIN"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "enter"
                  ? "Enter a 4-digit PIN to protect your app"
                  : "Re-enter your PIN to confirm"}
              </p>
            </div>

            <div className="flex gap-2.5">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={currentPin[index] || ""}
                  onChange={(e) => handleDigitInput(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${step === "enter" ? "bg-primary" : "bg-muted"}`} />
              <div className={`w-2 h-2 rounded-full ${step === "confirm" ? "bg-primary" : "bg-muted"}`} />
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
