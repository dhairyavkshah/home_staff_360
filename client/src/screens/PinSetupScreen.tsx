import { useState, useEffect } from "react";
import { useNavigation } from "@/lib/navigation";
import { pinService } from "@/lib/pin-service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Lock, X, Fingerprint } from "lucide-react";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useTranslation } from "@/lib/i18n/i18n-context";

type Step = "enter" | "confirm" | "biometric";

export function PinSetupScreen() {
  const { navigate, data, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
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

  const currentPin = step === "enter" ? pin : confirmPin;
  const setCurrentPin = step === "enter" ? setPin : setConfirmPin;

  useEffect(() => {
    async function checkBiometric() {
      const available = await pinService.checkPlatformAuthenticator();
      setBiometricAvailable(available);
    }
    checkBiometric();
  }, []);

  const handleDigitPress = (digit: string) => {
    if (currentPin.length >= 4) return;
    
    const updatedPin = currentPin + digit;
    setCurrentPin(updatedPin);
    setError("");

    if (updatedPin.length === 4) {
      if (step === "enter") {
        setTimeout(() => {
          setStep("confirm");
          setConfirmPin("");
        }, 200);
      } else if (step === "confirm") {
        setTimeout(() => {
          if (updatedPin === pin) {
            pinService.setPin(updatedPin);
            if (biometricAvailable) {
              setStep("biometric");
            } else {
              toast({
                title: t("pinSetSuccessfully"),
                description: t("appProtectedWithPin"),
              });
              navigateToReturn();
            }
          } else {
            setError(t("pinsDontMatch"));
            setConfirmPin("");
          }
        }, 200);
      }
    }
  };

  const handleBackspace = () => {
    if (currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
      setError("");
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
        title: t("pinSetSuccessfully"),
        description: t("appProtectedWithPin"),
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
          title: t("biometricEnabled"),
          description: t("biometricEnabledDesc"),
        });
        navigateToReturn();
      } else {
        setError(result.error || t("biometricAuthFailed"));
      }
    } catch (e: any) {
      setError(e.message || t("biometricAuthFailed"));
    } finally {
      setEnrollingBiometric(false);
    }
  };

  const handleSkipBiometric = () => {
    toast({
      title: t("pinSetSuccessfully"),
      description: t("appProtectedWithPin"),
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
            <h1 className="text-lg font-semibold">{t("setUpPin")}</h1>
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
              <h2 className="text-lg font-semibold mb-1">{t("enableBiometricUnlock")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("biometricDescription")}
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
                {enrollingBiometric ? t("enabling") : t("enableBiometric")}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkipBiometric}
                disabled={enrollingBiometric}
                className="w-full"
                data-testid="button-skip-biometric"
              >
                {t("skipForNow")}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t("biometricDataPrivacy")}
            </p>
          </Card>
        ) : (
          <Card className="w-full max-w-sm p-3 flex flex-col items-center gap-3 fade-in-up">
            <div className="icon-halo-primary w-12 h-12">
              <Lock className="w-6 h-6 text-primary" />
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold mb-1">
                {step === "enter" ? t("createYourPin") : t("confirmYourPin")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === "enter"
                  ? t("enterPinToProtect")
                  : t("reEnterPinToConfirm")}
              </p>
            </div>

            <div className="flex gap-3">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    currentPin[index] 
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

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${step === "enter" ? "bg-primary" : "bg-muted"}`} />
              <div className={`w-2 h-2 rounded-full ${step === "confirm" ? "bg-primary" : "bg-muted"}`} />
            </div>

            <NumericKeypad
              onDigitPress={handleDigitPress}
              onBackspace={handleBackspace}
            />
          </Card>
        )}
      </main>
    </div>
  );
}
