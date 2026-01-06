import { useState, useEffect } from "react";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation";
import { collaborationService } from "@/lib/collaboration-service";

type AuthStep = "phone" | "password" | "otp" | "set-password";

export function AuthScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();

  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const savedPhone = collaborationService.getSavedPhone();
    if (savedPhone) {
      setPhone(savedPhone);
    }

    if (collaborationService.isAuthenticated()) {
      navigate("launcher");
    }
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleCheckPhone = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.checkPhone(phone);
      setUserExists(result.exists);
      setHasPassword(result.hasPassword);
      setDisplayName(result.displayName || null);

      if (result.exists && result.hasPassword) {
        setStep("password");
      } else {
        await handleRequestOtp();
        setStep("otp");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check phone number",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (cooldown > 0) return;

    setIsLoading(true);
    try {
      const result = await collaborationService.requestOtp(phone);
      if (result.success) {
        setCooldown(result.cooldownSeconds || 60);
        toast({
          title: "OTP Sent",
          description: "Check your phone for the verification code",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.login(phone, password);
      
      if (result.success) {
        toast({
          title: "Welcome Back",
          description: displayName ? `Hello, ${displayName}!` : "Login successful",
        });
        
        if (result.user?.needsOnboarding) {
          navigate("onboarding");
        } else {
          navigate("launcher");
        }
      } else if (result.needsOtp) {
        await handleRequestOtp();
        setStep("otp");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.verifyOtp(phone, otp);
      
      if (result.success) {
        if (result.user?.isNewUser || !result.user?.hasPassword) {
          setNeedsOnboarding(result.user?.needsOnboarding ?? true);
          setStep("set-password");
        } else if (result.user?.needsOnboarding) {
          navigate("onboarding");
        } else {
          navigate("launcher");
        }
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await collaborationService.setPassword(password);
      
      if (result.success) {
        toast({
          title: "Password Set",
          description: "Your account is now secured",
        });
        
        if (needsOnboarding) {
          navigate("onboarding");
        } else {
          navigate("launcher");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setIsLoading(true);
    try {
      await handleRequestOtp();
      setStep("otp");
      setHasPassword(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Home Staff 360</h1>
          <p className="text-muted-foreground">
            Connect, collaborate, and manage your household staff
          </p>
        </div>

        <Card className="p-6">
          {step === "phone" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for USA, +91 for India)
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleCheckPhone}
                disabled={isLoading}
                data-testid="button-continue"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="font-medium">Welcome back{displayName ? `, ${displayName}` : ""}!</p>
                <p className="text-sm text-muted-foreground">{phone}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="flex justify-between text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={() => setStep("phone")}
                >
                  Change Number
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot Password?
                </Button>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Shield className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">Verify Your Phone</p>
                <p className="text-sm text-muted-foreground">
                  Enter the code sent to {phone}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-xl tracking-widest"
                  maxLength={6}
                  data-testid="input-otp"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={isLoading}
                data-testid="button-verify"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>

              <div className="flex justify-between items-center text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={() => setStep("phone")}
                >
                  Change Number
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={handleRequestOtp}
                  disabled={cooldown > 0 || isLoading}
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
            </div>
          )}

          {step === "set-password" && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <Lock className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">Create Your Password</p>
                <p className="text-sm text-muted-foreground">
                  Secure your account for quick sign-in next time
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    data-testid="input-new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-confirm-password"
                />
              </div>

              <Button
                className="w-full"
                onClick={handleSetPassword}
                disabled={isLoading}
                data-testid="button-set-password"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your data stays secure on your device. We only sync what you choose to share.
        </p>
      </div>
    </div>
  );
}
