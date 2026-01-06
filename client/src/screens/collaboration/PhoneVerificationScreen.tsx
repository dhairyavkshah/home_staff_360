import { useState, useEffect, useCallback } from "react";
import { Phone, Shield, RefreshCw } from "lucide-react";
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

const OTP_EXPIRY_SECONDS = 300;

export function PhoneVerificationScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = useCallback(async () => {
    if (!phone.trim()) {
      toast({
        title: t("error"),
        description: t("enterPhoneNumber"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await collaborationService.requestOtp(phone);
      if (response.success) {
        setStep("otp");
        setCountdown(OTP_EXPIRY_SECONDS);
        setCanResend(false);
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
  }, [phone, toast, t]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otp.trim() || otp.length !== 6) {
      toast({
        title: t("error"),
        description: t("enterOtp"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await collaborationService.verifyOtp(phone, otp);
      if (response.success) {
        toast({
          title: t("success"),
          description: t("phoneVerified"),
        });
        navigate("collaboration-hub");
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
  }, [phone, otp, toast, t, navigate]);

  const handleResendOtp = useCallback(async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(OTP_EXPIRY_SECONDS);
    await handleSendOtp();
  }, [canResend, handleSendOtp]);

  const handleBack = () => {
    if (step === "otp") {
      setStep("phone");
      setOtp("");
      setCountdown(0);
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
        <div className="p-4 space-y-6">
          <div className="flex justify-center py-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">
              {step === "phone" ? t("verifyPhone") : t("enterOtp")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {step === "phone"
                ? "Enter your phone number to receive a verification code"
                : `We've sent a 6-digit code to ${phone}`}
            </p>
          </div>

          <Card className="p-4 space-y-4">
            {step === "phone" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("enterPhoneNumber")}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("phoneNumberPlaceholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading || !phone.trim()}
                  className="w-full"
                  data-testid="button-send-otp"
                >
                  {isLoading ? t("loading") : t("sendOtp")}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
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

                {countdown > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("otpExpires")}: {formatTime(countdown)}
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

          <p className="text-center text-xs text-muted-foreground px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            Your phone number is used only for account verification.
          </p>
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
