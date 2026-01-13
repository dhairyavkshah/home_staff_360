import { useState, useEffect, useCallback, useMemo } from "react";
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
  Trash2,
  AlertTriangle,
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
import { storage } from "@/lib/storage";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { combinePhoneNumber, getDefaultCountryCode } from "@/lib/phone-utils";

type ProfileStep = "view" | "edit-name" | "change-password" | "change-phone" | "verify-phone" | "clear-all-data" | "delete-account";

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Change phone form
  const [newPhoneCountryCode, setNewPhoneCountryCode] = useState(getDefaultCountryCode());
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newPhoneValid, setNewPhoneValid] = useState(false);
  const [phonePassword, setPhonePassword] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const getFullNewPhone = useCallback(() => {
    return combinePhoneNumber(newPhoneCountryCode, newPhoneNumber);
  }, [newPhoneCountryCode, newPhoneNumber]);

  const handleNewPhoneValidationChange = useCallback((isValid: boolean) => {
    setNewPhoneValid(isValid);
  }, []);

  // Delete account form
  const [deletePassword, setDeletePassword] = useState("");

  // Clear all data form
  const [clearDataPassword, setClearDataPassword] = useState("");

  const isFormDirty = useMemo(() => {
    switch (step) {
      case "edit-name":
        return displayName !== (profile?.displayName || "");
      case "change-password":
        return currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
      case "change-phone":
        return newPhoneNumber.length > 0 || phonePassword.length > 0;
      case "verify-phone":
        return otp.length > 0;
      case "delete-account":
        return deletePassword.length > 0;
      case "clear-all-data":
        return clearDataPassword.length > 0;
      default:
        return false;
    }
  }, [step, displayName, profile?.displayName, currentPassword, newPassword, confirmPassword, newPhoneNumber, phonePassword, otp, deletePassword, clearDataPassword]);

  useDirtyForm(isFormDirty);

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
      setNewPhoneCountryCode(getDefaultCountryCode());
      setNewPhoneNumber("");
      setNewPhoneValid(false);
      setPhonePassword("");
      setOtp("");
      setDeletePassword("");
      setClearDataPassword("");
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

    if (!currentPassword) {
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
      let errorTitle = t("error");
      let errorMessage = error.message || "Failed to change password";
      const lowerMessage = error.message?.toLowerCase() || "";
      
      if (error.message === "NETWORK_ERROR") {
        errorTitle = t("networkError");
        errorMessage = t("noInternetConnection");
      } else if (
        lowerMessage.includes("incorrect") || 
        lowerMessage.includes("wrong") || 
        lowerMessage.includes("invalid") ||
        lowerMessage.includes("current password")
      ) {
        errorMessage = t("currentPasswordIncorrect");
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    if (!newPhoneNumber || newPhoneNumber.length < 4 || !newPhoneValid) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
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

    const fullPhone = getFullNewPhone();
    setIsLoading(true);
    try {
      const result = await collaborationService.requestPhoneChange(fullPhone, phonePassword);
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

    const fullPhone = getFullNewPhone();
    setIsLoading(true);
    try {
      const result = await collaborationService.confirmPhoneChange(fullPhone, otp);
      if (result.success) {
        toast({ title: "Phone Updated", description: "Your phone number has been changed" });
        setProfile(prev => prev ? { ...prev, phone: fullPhone } : null);
        setStep("view");
        setNewPhoneCountryCode(getDefaultCountryCode());
        setNewPhoneNumber("");
        setNewPhoneValid(false);
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

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: "Error",
        description: "Please enter your password to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.deleteAccount(deletePassword);
      if (result.success) {
        toast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted",
        });
        localStorage.clear();
        navigate("auth");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!clearDataPassword) {
      toast({
        title: t("error"),
        description: t("clearAllDataPasswordRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.verifyPassword(clearDataPassword);
      if (result.success) {
        storage.clearAllData();
        toast({
          title: t("clearAllDataSuccess"),
          description: t("clearAllDataSuccessDescription"),
        });
        navigate("role-selection");
      } else {
        toast({
          title: t("error"),
          description: t("incorrectPassword"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("clearAllDataFailed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case "edit-name": return "Edit Name";
      case "change-password": return "Change Password";
      case "change-phone": return "Change Phone Number";
      case "verify-phone": return "Verify New Phone";
      case "clear-all-data": return t("clearAllData");
      case "delete-account": return "Delete Account";
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
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Account Information
            </h2>

            <Card className="p-4 flex flex-col gap-4">
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
                      Change your password
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </Card>

            <h2 className="text-sm font-medium text-destructive uppercase tracking-wide mt-6">
              {t("dangerZone")}
            </h2>

            <Card className="p-4 border-destructive/30 flex flex-col gap-2">
              <button
                className="flex items-center justify-between py-2 hover-elevate rounded-md px-2 -mx-2 w-full"
                onClick={() => setStep("clear-all-data")}
                data-testid="button-clear-all-data"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-destructive">{t("clearAllData")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("clearAllDataDescription")}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive" />
              </button>

              <div className="border-t border-destructive/20 -mx-4 my-1" />

              <button
                className="flex items-center justify-between py-2 hover-elevate rounded-md px-2 -mx-2 w-full"
                onClick={() => setStep("delete-account")}
                data-testid="button-delete-account"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-destructive">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive" />
              </button>
            </Card>
          </section>
        )}

        {step === "edit-name" && (
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
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
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    data-testid="button-toggle-current-password"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="pr-10"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="pr-10"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                    Change Password
                  </>
                )}
              </Button>
            </Card>
          </section>
        )}

        {step === "change-phone" && (
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4">
              <div className="text-center mb-2">
                <p className="text-sm text-muted-foreground">
                  Your current phone: <strong>{profile?.phone}</strong>
                </p>
              </div>

              <PhoneNumberInput
                countryCode={newPhoneCountryCode}
                phoneNumber={newPhoneNumber}
                onCountryCodeChange={setNewPhoneCountryCode}
                onPhoneNumberChange={setNewPhoneNumber}
                onValidationChange={handleNewPhoneValidationChange}
                label="New Phone Number"
                required
                testIdPrefix="new-phone"
              />

              {profile?.hasPassword ? (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="phonePassword">Confirm with Password</Label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phonePassword"
                      type={showPassword ? "text" : "password"}
                      value={phonePassword}
                      onChange={(e) => setPhonePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      data-testid="input-phone-password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                disabled={isLoading || !profile?.hasPassword || !newPhoneValid}
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
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4">
              <div className="text-center mb-4">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">Verify New Phone</p>
                <p className="text-sm text-muted-foreground">
                  Enter the code sent to {getFullNewPhone()}
                </p>
              </div>

              <div className="flex flex-col gap-4">
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

        {step === "clear-all-data" && (
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4 border-destructive/30">
              <div className="flex flex-col items-center text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-destructive">{t("clearAllData")}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("clearAllDataWarning")}
                </p>
              </div>

              <div className="bg-destructive/5 rounded-md p-3 text-sm space-y-2">
                <p className="font-medium text-destructive">{t("clearAllDataWhatDeleted")}</p>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>{t("clearAllDataItem1")}</li>
                  <li>{t("clearAllDataItem2")}</li>
                  <li>{t("clearAllDataItem3")}</li>
                </ul>
                <p className="font-medium text-muted-foreground mt-3">
                  {t("clearAllDataServerNote")}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="clearDataPassword">{t("enterPasswordToConfirm")}</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="clearDataPassword"
                    type={showPassword ? "text" : "password"}
                    value={clearDataPassword}
                    onChange={(e) => setClearDataPassword(e.target.value)}
                    placeholder={t("enterYourPassword")}
                    className="pl-10 pr-10"
                    data-testid="input-clear-data-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("view")}
                  disabled={isLoading}
                  data-testid="button-cancel-clear"
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleClearAllData}
                  disabled={isLoading || !clearDataPassword}
                  data-testid="button-confirm-clear"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("clearAllDataConfirm")}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </section>
        )}

        {step === "delete-account" && (
          <section className="flex flex-col gap-6">
            <Card className="p-4 flex flex-col gap-4 border-destructive/30">
              <div className="flex flex-col items-center text-center mb-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-destructive">Delete Your Account</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  This action is <strong>permanent and irreversible</strong>. 
                  Once deleted, your account cannot be recovered.
                </p>
              </div>

              <div className="bg-destructive/5 rounded-md p-3 text-sm space-y-2">
                <p className="font-medium text-destructive">What will be deleted:</p>
                <ul className="text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Your profile and account information</li>
                  <li>All your personal data stored on our servers</li>
                  <li>Your connection links and pending invitations</li>
                </ul>
                <p className="font-medium text-muted-foreground mt-3">
                  Data of connected users will NOT be affected.
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Label htmlFor="deletePassword">Enter your password to confirm</Label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="deletePassword"
                    type={showPassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    data-testid="input-delete-password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("view")}
                  disabled={isLoading}
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={isLoading || !deletePassword}
                  data-testid="button-confirm-delete"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
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
