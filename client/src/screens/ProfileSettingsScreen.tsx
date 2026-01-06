import { useState, useEffect, useCallback } from "react";
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ChevronRight,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { collaborationService } from "@/lib/collaboration-service";
import { useTranslation } from "@/lib/i18n/i18n-context";

type ProfileStep = "view" | "edit-name" | "change-password" | "change-phone" | "verify-phone";

export function ProfileSettingsScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [step, setStep] = useState<ProfileStep>("view");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Profile data
  const [profile, setProfile] = useState<{
    id: string;
    phone: string;
    displayName?: string;
    hasPassword: boolean;
  } | null>(null);

  // Edit name form
  const [displayName, setDisplayName] = useState("");

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Change phone form
  const [newPhone, setNewPhone] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setIsFetching(true);
      const data = await collaborationService.getProfile();
      if (data) {
        setProfile({
          id: data.id,
          phone: data.phone,
          displayName: data.displayName,
          hasPassword: data.hasPassword,
        });
        setDisplayName(data.displayName || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleBack = () => {
    if (step !== "view") {
      setStep("view");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNewPhone("");
      setPhonePassword("");
      setOtp("");
    } else {
      navigate("settings");
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.updateProfile({ displayName: displayName.trim() });
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your name has been updated" });
        setProfile(prev => prev ? { ...prev, displayName: displayName.trim() } : null);
        setStep("view");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (profile?.hasPassword && !currentPassword) {
      toast({
        title: "Error",
        description: "Please enter your current password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.changePassword(currentPassword, newPassword);
      if (result.success) {
        toast({ title: "Password Changed", description: "Your password has been updated" });
        setProfile(prev => prev ? { ...prev, hasPassword: true } : null);
        setStep("view");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    if (!newPhone || newPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    if (profile?.hasPassword && !phonePassword) {
      toast({
        title: "Error",
        description: "Please enter your password to change phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.requestPhoneChange(newPhone, phonePassword);
      if (result.success) {
        toast({ title: "Code Sent", description: "Check your new phone for the verification code" });
        setCooldown(result.expiresIn ? Math.min(result.expiresIn, 60) : 60);
        setStep("verify-phone");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to request phone change",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneChange = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid Code",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.confirmPhoneChange(newPhone, otp);
      if (result.success) {
        toast({ title: "Phone Updated", description: "Your phone number has been changed" });
        setProfile(prev => prev ? { ...prev, phone: newPhone } : null);
        setStep("view");
        setNewPhone("");
        setPhonePassword("");
        setOtp("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify phone change",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case "edit-name": return "Edit Name";
      case "change-password": return profile?.hasPassword ? "Change Password" : "Set Password";
      case "change-phone": return "Change Phone Number";
      case "verify-phone": return "Verify New Phone";
      default: return "Profile";
    }
  };

  if (isFetching) {
    return (
      <AppLayout>
        <Header title="Profile" onBack={() => navigate("settings")} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title={getTitle()} onBack={handleBack} />

      <ScrollContent>
        {step === "view" && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Account Information
            </h2>

            <Card className="p-3 flex flex-col gap-3">
              <button
                className="flex items-center justify-between py-2 hover-elevate rounded-md px-2 -mx-2"
                onClick={() => setStep("edit-name")}
                data-testid="button-edit-name"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Display Name</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.displayName || "Not set"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                className="flex items-center justify-between py-2 hover-elevate rounded-md px-2 -mx-2"
                onClick={() => setStep("change-phone")}
                data-testid="button-change-phone"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.phone || "Not set"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                className="flex items-center justify-between py-2 hover-elevate rounded-md px-2 -mx-2"
                onClick={() => setStep("change-password")}
                data-testid="button-change-password"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.hasPassword ? "Change your password" : "Set a password"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </Card>
          </section>
        )}

        {step === "edit-name" && (
          <section className="flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  data-testid="input-display-name"
                />
                <p className="text-xs text-muted-foreground">
                  This name will be visible to your connections
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleUpdateName}
                disabled={isLoading}
                data-testid="button-save-name"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Name
                  </>
                )}
              </Button>
            </Card>
          </section>
        )}

        {step === "change-password" && (
          <section className="flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-4">
              {profile?.hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10"
                      data-testid="input-current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleChangePassword}
                disabled={isLoading}
                data-testid="button-save-password"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {profile?.hasPassword ? "Change Password" : "Set Password"}
                  </>
                )}
              </Button>
            </Card>
          </section>
        )}

        {step === "change-phone" && (
          <section className="flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-4">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">
                  Your current phone: <strong>{profile?.phone}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPhone">New Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPhone"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="pl-10"
                    data-testid="input-new-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for USA, +91 for India)
                </p>
              </div>

              {profile?.hasPassword ? (
                <div className="space-y-2">
                  <Label htmlFor="phonePassword">Confirm with Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phonePassword"
                      type={showPassword ? "text" : "password"}
                      value={phonePassword}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      data-testid="input-phone-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required for security verification
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                  <p>To change your phone number, please set up a password first.</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleRequestPhoneChange}
                disabled={isLoading || !profile?.hasPassword}
                data-testid="button-request-phone-change"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send Verification Code"
                )}
              </Button>
            </Card>
          </section>
        )}

        {step === "verify-phone" && (
          <section className="flex flex-col gap-4">
            <Card className="p-4 flex flex-col gap-4">
              <div className="text-center mb-2">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">Verify New Phone</p>
                <p className="text-sm text-muted-foreground">
                  Enter the code sent to {newPhone}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter OTP"
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                  data-testid="input-phone-otp"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyPhoneChange}
                disabled={isLoading}
                data-testid="button-verify-phone"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify and Update Phone"
                )}
              </Button>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRequestPhoneChange}
                  disabled={cooldown > 0 || isLoading}
                  className="text-primary"
                >
                  {cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </section>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
