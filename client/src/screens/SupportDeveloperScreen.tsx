import { useState, useEffect, useCallback } from "react";
import { Heart, Coffee, Gift, Star, User, MapPin, Globe, Smartphone, CreditCard, Wallet, Check, X, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { getUserCountry, getCurrencyForCountry, getCountryByCode } from "@/lib/geolocation-service";
import { 
  openUpiPayment, 
  openPayPalPayment, 
  validateAmount, 
  markAsDonor, 
  getDonorStatus,
  isIndianUser
} from "@/lib/payment-handler";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface DonationTier {
  amount: number;
  label: string;
  icon: typeof Coffee;
}

const DONATION_TIERS: { [key: string]: DonationTier[] } = {
  INR: [
    { amount: 9, label: "A small tea/coffee", icon: Coffee },
    { amount: 29, label: "A thank you", icon: Heart },
    { amount: 99, label: "Show appreciation", icon: Star },
    { amount: 299, label: "Generous support", icon: Gift },
    { amount: 599, label: "Amazing supporter", icon: Heart },
    { amount: 999, label: "Champion supporter", icon: Star },
  ],
  USD: [
    { amount: 1, label: "A small tea/coffee", icon: Coffee },
    { amount: 3, label: "A thank you", icon: Heart },
    { amount: 5, label: "Show appreciation", icon: Star },
    { amount: 10, label: "Generous support", icon: Gift },
    { amount: 20, label: "Amazing supporter", icon: Heart },
    { amount: 50, label: "Champion supporter", icon: Star },
  ],
  EUR: [
    { amount: 1, label: "A small tea/coffee", icon: Coffee },
    { amount: 3, label: "A thank you", icon: Heart },
    { amount: 5, label: "Show appreciation", icon: Star },
    { amount: 10, label: "Generous support", icon: Gift },
    { amount: 20, label: "Amazing supporter", icon: Heart },
    { amount: 50, label: "Champion supporter", icon: Star },
  ],
  GBP: [
    { amount: 1, label: "A small tea/coffee", icon: Coffee },
    { amount: 2, label: "A thank you", icon: Heart },
    { amount: 4, label: "Show appreciation", icon: Star },
    { amount: 8, label: "Generous support", icon: Gift },
    { amount: 15, label: "Amazing supporter", icon: Heart },
    { amount: 40, label: "Champion supporter", icon: Star },
  ],
  AED: [
    { amount: 5, label: "A small tea/coffee", icon: Coffee },
    { amount: 10, label: "A thank you", icon: Heart },
    { amount: 20, label: "Show appreciation", icon: Star },
    { amount: 40, label: "Generous support", icon: Gift },
    { amount: 75, label: "Amazing supporter", icon: Heart },
    { amount: 200, label: "Champion supporter", icon: Star },
  ],
};

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "Fr.",
  SGD: "S$",
  MXN: "$",
  BRL: "R$",
  ZAR: "R",
};

function ConfettiParticle({ delay }: { delay: number }) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const x = Math.random() * 100;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%` }}
      initial={{ y: -10, opacity: 1, rotate: 0 }}
      animate={{ 
        y: 400, 
        opacity: 0, 
        rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
        x: (Math.random() - 0.5) * 100
      }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
    />
  );
}

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => i);
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((i) => (
        <ConfettiParticle key={i} delay={Math.random() * 0.5} />
      ))}
    </div>
  );
}

export function SupportDeveloperScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();

  const userCountry = getUserCountry() || "US";
  const countryInfo = getCountryByCode(userCountry);
  const currency = getCurrencyForCountry(userCountry) || "USD";
  const donations = DONATION_TIERS[currency] || DONATION_TIERS.USD;
  const currencySymbol = CURRENCY_SYMBOLS[currency] || "$";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState<number>(0);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const isIndian = isIndianUser(userCountry);
  const donorStatus = getDonorStatus();

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible" && paymentInProgress) {
      setTimeout(() => {
        setShowConfirmation(true);
        setPaymentInProgress(false);
      }, 500);
    }
  }, [paymentInProgress]);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const handleUpiPayment = (amount: number) => {
    const validAmount = validateAmount(amount);
    if (!validAmount) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    setPendingPaymentAmount(validAmount);
    setPaymentInProgress(true);
    
    const success = openUpiPayment(validAmount);
    if (success) {
      toast({
        title: "Opening UPI App",
        description: "Choose your preferred UPI app to complete payment",
      });
    } else {
      setPaymentInProgress(false);
      toast({
        title: "Unable to open UPI",
        description: "Please use the UPI ID below to pay manually",
        variant: "destructive",
      });
    }
  };

  const handlePayPalPayment = (amount: number, currencyCode: string) => {
    const validAmount = validateAmount(amount);
    if (!validAmount) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    setPendingPaymentAmount(validAmount);
    setPaymentInProgress(true);
    
    const success = openPayPalPayment(validAmount, currencyCode);
    if (success) {
      toast({
        title: "Opening PayPal",
        description: "Complete the payment on PayPal",
      });
    } else {
      setPaymentInProgress(false);
      toast({
        title: "Unable to open PayPal",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDonate = () => {
    const amount = selectedAmount || parseFloat(customAmount) || 0;
    const validAmount = validateAmount(amount);
    
    if (!validAmount) {
      toast({
        title: "Please select an amount",
        description: "Choose a donation amount to continue",
        variant: "destructive",
      });
      return;
    }

    const methodId = selectedPaymentMethod || (isIndian ? "upi" : "paypal");
    
    if (methodId === "upi" || methodId === "gpay") {
      handleUpiPayment(validAmount);
    } else {
      handlePayPalPayment(validAmount, currency);
    }
  };

  const handleConfirmDonation = () => {
    setShowConfirmation(false);
    markAsDonor();
    setShowThankYou(true);
    setTimeout(() => setShowThankYou(false), 5000);
  };

  const handleDeclineDonation = () => {
    setShowConfirmation(false);
  };

  return (
    <AppLayout>
      <Header
        title="Support the Developer"
        onBack={() => navigate("settings")}
      />

      <AnimatePresence>
        {showThankYou && <Confetti />}
      </AnimatePresence>

      <AnimatePresence>
        {showThankYou && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-xs mx-4"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-center">Thank You!</h2>
              <p className="text-sm text-muted-foreground text-center">
                Your generous support means the world to me. It helps keep this project alive and growing!
              </p>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                You are now a supporter!
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-lg">Payment Verification</DrawerTitle>
            <DrawerDescription>
              Did your support transaction of {currencySymbol}{pendingPaymentAmount} go through?
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-6 flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full min-h-[52px] gap-2"
              onClick={handleConfirmDonation}
              data-testid="button-confirm-donation"
            >
              <Check className="w-5 h-5" />
              Yes, I contributed
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full min-h-[52px] gap-2"
              onClick={handleDeclineDonation}
              data-testid="button-decline-donation"
            >
              <X className="w-5 h-5" />
              No / Not yet
            </Button>
          </div>
          <DrawerFooter className="pt-0">
            <p className="text-xs text-center text-muted-foreground">
              We cannot automatically verify UPI payments. Please confirm manually.
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ScrollContent className="pb-24">
        <section className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Thank You!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your support helps me continue developing and improving Home Staff 360
            </p>
          </div>
          {countryInfo && (
            <Badge variant="outline" className="gap-1">
              <Globe className="w-3 h-3" />
              {countryInfo.name}
            </Badge>
          )}
          {donorStatus.isDonor && (
            <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Star className="w-3 h-3" />
              Supporter
            </Badge>
          )}
        </section>

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">About the Developer</h3>
              <p className="text-xs text-muted-foreground">
                Independent developer from India
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Based in India</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Building apps that make life easier</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Built by a solo-preneur passionate about creating useful and individuals-focused apps. 
            Home Staff 360 is crafted with love and dedication to help households manage their domestic staff seamlessly, while also empowering professionals in household service industries to organize their work and earnings with ease. 
            Your support keeps this project alive and growing!
          </p>
        </Card>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Choose an Amount ({currency})
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {donations.map((donation) => {
              const isSelected = selectedAmount === donation.amount;
              return (
                <button
                  key={donation.amount}
                  onClick={() => {
                    setSelectedAmount(donation.amount);
                    setCustomAmount("");
                  }}
                  className="flex flex-col items-center gap-2 p-3"
                  data-testid={`button-donate-${donation.amount}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted hover:bg-muted/80"
                  }`}>
                    {currencySymbol}{donation.amount}
                  </div>
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    {donation.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium">Or enter custom amount ({currency})</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setSelectedAmount(null);
                  }}
                  placeholder="Amount"
                  className="w-full pl-8 pr-4 py-2 rounded-md border bg-background text-sm min-h-[44px]"
                  data-testid="input-custom-amount"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Payment Method
          </h3>

          <div className="flex flex-col gap-2">
            {isIndian ? (
              <>
                <button
                  onClick={() => setSelectedPaymentMethod("upi")}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 min-h-[60px] ${
                    selectedPaymentMethod === "upi" || selectedPaymentMethod === null
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid="button-payment-upi"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedPaymentMethod === "upi" || selectedPaymentMethod === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">UPI Apps</p>
                    <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, BHIM & more</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod("gpay")}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 min-h-[60px] ${
                    selectedPaymentMethod === "gpay"
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid="button-payment-gpay"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedPaymentMethod === "gpay" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Google Pay</p>
                    <p className="text-xs text-muted-foreground">Pay directly with Google Pay</p>
                  </div>
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectedPaymentMethod("paypal")}
                className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 min-h-[60px] ${
                  selectedPaymentMethod === "paypal" || selectedPaymentMethod === null
                    ? "border-primary bg-primary/10"
                    : "border-border hover-elevate"
                }`}
                data-testid="button-payment-paypal"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedPaymentMethod === "paypal" || selectedPaymentMethod === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">PayPal</p>
                  <p className="text-xs text-muted-foreground">Pay securely with PayPal</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </button>
            )}
          </div>
        </section>

        <Button
          className="w-full"
          size="lg"
          onClick={handleDonate}
          disabled={!selectedAmount && !customAmount}
          data-testid="button-donate"
        >
          <Heart className="w-4 h-4 mr-2" />
          {selectedAmount || customAmount
            ? `Donate ${currencySymbol}${selectedAmount || customAmount}`
            : "Select an Amount"}
        </Button>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">What Your Support Does</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Helps maintain and improve the app</li>
                <li>Supports development of new features</li>
                <li>Keeps the app ad-free and privacy-focused</li>
                <li>Enables faster bug fixes and updates</li>
              </ul>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          All donations are voluntary. The app is free to use forever, regardless of donations. 
          Thank you for your support!
        </p>
      </ScrollContent>
    </AppLayout>
  );
}
