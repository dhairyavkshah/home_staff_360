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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OTP_EXPIRY_SECONDS = 1800;
const RESEND_COOLDOWN_SECONDS = 60;

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "US" },
  { code: "+44", country: "UK", flag: "GB" },
  { code: "+91", country: "India", flag: "IN" },
  { code: "+61", country: "Australia", flag: "AU" },
  { code: "+49", country: "Germany", flag: "DE" },
  { code: "+33", country: "France", flag: "FR" },
  { code: "+81", country: "Japan", flag: "JP" },
  { code: "+86", country: "China", flag: "CN" },
  { code: "+55", country: "Brazil", flag: "BR" },
  { code: "+52", country: "Mexico", flag: "MX" },
  { code: "+34", country: "Spain", flag: "ES" },
  { code: "+39", country: "Italy", flag: "IT" },
  { code: "+7", country: "Russia", flag: "RU" },
  { code: "+82", country: "S. Korea", flag: "KR" },
  { code: "+65", country: "Singapore", flag: "SG" },
  { code: "+971", country: "UAE", flag: "AE" },
  { code: "+966", country: "Saudi Arabia", flag: "SA" },
  { code: "+27", country: "South Africa", flag: "ZA" },
  { code: "+234", country: "Nigeria", flag: "NG" },
  { code: "+254", country: "Kenya", flag: "KE" },
  { code: "+63", country: "Philippines", flag: "PH" },
  { code: "+62", country: "Indonesia", flag: "ID" },
  { code: "+60", country: "Malaysia", flag: "MY" },
  { code: "+66", country: "Thailand", flag: "TH" },
  { code: "+84", country: "Vietnam", flag: "VN" },
];

export function PhoneVerificationScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiryCountdown, setOtpExpiryCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const fullPhoneNumber = `${countryCode}${phoneNumber}`;
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
  }, [phoneNumber, fullPhoneNumber, toast, t]);

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
  }, [fullPhoneNumber, otp, toast, t, navigate, data.isOnboarding]);

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
                ? "Enter your phone number with country code to receive a verification code"
                : `We've sent a 6-digit code to ${fullPhoneNumber}`}
            </p>
          </div>

          <Card className="p-4 flex flex-col gap-4">
            {step === "phone" ? (
              <>
                <div className="flex flex-col gap-4">
                  <Label>{t("enterPhoneNumber")}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[120px]" data-testid="select-country-code">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_CODES.map((cc) => (
                          <SelectItem key={cc.code} value={cc.code}>
                            {cc.code} {cc.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className="pl-10"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter phone number without country code (it's selected above)
                  </p>
                </div>
                <Button
                  onClick={handleSendOtp}
                  disabled={isLoading || !phoneNumber.trim()}
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
