import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { collaborationService } from "@/lib/collaboration-service";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { combinePhoneNumber, getDefaultCountryCode } from "@/lib/phone-utils";

const OTP_EXPIRY_SECONDS = 1800;
const RESEND_COOLDOWN_SECONDS = 60;

export function PhoneVerificationScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [countryCode, setCountryCode] = useState(getDefaultCountryCode());
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiryCountdown, setOtpExpiryCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const getFullPhoneNumber = useCallback(() => {
    return combinePhoneNumber(countryCode, phoneNumber);
  }, [countryCode, phoneNumber]);

  const canResend = resendCooldown === 0 && step === "otp";

  useEffect(() => {
    let expiryTimer: NodeJS.Timeout;
    if (otpExpiryCountdown > 0) {
      expiryTimer = setInterval(() => {
        setOtpExpiryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(expiryTimer);
  }, [otpExpiryCountdown]);

  useEffect(() => {
    let cooldownTimer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const handlePhoneValidationChange = useCallback((isValid: boolean) => {
    setPhoneValid(isValid);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: t("error"),
        description: t("enterPhoneNumber"),
        variant: "destructive",
      });
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    try {
      const response = await collaborationService.requestOtp(fullPhoneNumber);
      if (response.success) {
        setStep("otp");
        setOtpExpiryCountdown(OTP_EXPIRY_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        if ((response as any).remainingAttempts !== undefined) {
          setRemainingAttempts((response as any).remainingAttempts);
        }
        toast({
          title: t("success"),
          description: t("otpSent"),
        });
      } else {
        toast({
          title: t("error"),
          description: response.message || t("error"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [phoneNumber, getFullPhoneNumber, toast, t]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: t("error"),
        description: t("enterOtp"),
        variant: "destructive",
      });
      return;
    }

    const fullPhoneNumber = getFullPhoneNumber();
    setIsLoading(true);
    try {
      const response = await collaborationService.verifyOtp(fullPhoneNumber, otp);
      if (response.success) {
        toast({
          title: t("success"),
          description: t("phoneVerified"),
        });
        if (data.isOnboarding) {
          navigate("role-selection");
        } else {
          navigate("collaboration-hub");
        }
      } else {
        toast({
          title: t("error"),
          description: response.message || t("invalidOtp"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("invalidOtp"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getFullPhoneNumber, otp, toast, t, navigate, data.isOnboarding]);

  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    await handleSendOtp();
  }, [canResend, handleSendOtp]);

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
      setOtpExpiryCountdown(0);
      setResendCooldown(0);
    } else {
      goBack();
    }
  };

  return (
    <AppLayout>
      <Header
        title={t("phoneVerification")}
        onBack={handleBack}
      />
      <ScrollContent>
        <div className="flex flex-col gap-6">
          <div className="flex justify-center py-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center flex flex-col gap-2">
            <h2 className="text-xl font-semibold">
              {step === "phone" ? t("verifyPhone") : t("enterOtp")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {step === "phone"
                ? "Enter your phone number to receive a verification code"
                : `We've sent a 6-digit code to ${getFullPhoneNumber()}`}
            </p>
          </div>

          <Card className="p-4 flex flex-col gap-4">
            {step === "phone" ? (
              <>
                <PhoneNumberInput
                  countryCode={countryCode}
                  phoneNumber={phoneNumber}
                  onCountryCodeChange={setCountryCode}
                  onPhoneNumberChange={setPhoneNumber}
                  onValidationChange={handlePhoneValidationChange}
                  label={t("enterPhoneNumber")}
                  required
                  testIdPrefix="verify-phone"
                />
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading || !phoneValid}
                  className="w-full"
                  data-testid="button-send-otp"
                >
                  {isLoading ? t("loading") : t("sendOtp")}
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  <Label htmlFor="otp">{t("enterOtp")}</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-widest font-mono"
                    data-testid="input-otp"
                  />
                </div>

                {otpExpiryCountdown > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("otpExpires")}: {formatTime(otpExpiryCountdown)}
                  </p>
                )}

                {resendCooldown > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Resend available in: {resendCooldown}s
                  </p>
                )}

                {remainingAttempts !== null && remainingAttempts <= 2 && (
                  <p className="text-center text-sm text-amber-600 dark:text-amber-400">
                    Remaining attempts: {remainingAttempts}
                  </p>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full"
                  data-testid="button-verify-otp"
                >
                  {isLoading ? t("loading") : t("verifyOtp")}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                  className="w-full"
                  data-testid="button-resend-otp"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("resendOtp")}
                </Button>
              </>
            )}
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            OTP is valid for 30 minutes. Maximum 5 OTP requests allowed per hour.
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy. Your phone number is used only for account verification.
          </p>
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
