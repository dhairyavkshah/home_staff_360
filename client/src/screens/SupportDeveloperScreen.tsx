import { useState, useEffect, useCallback, useMemo } from "react";
import { Heart, Coffee, Gift, Star, User, MapPin, Globe, Smartphone, CreditCard, Wallet, Check, X, Sparkles, ChevronDown, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DonationTier {
  amount: number;
  labelKey: string;
  icon: typeof Coffee;
}

const DONATION_TIERS: { [key: string]: DonationTier[] } = {
  INR: [
    { amount: 9, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 29, labelKey: "aThankYou", icon: Heart },
    { amount: 99, labelKey: "showAppreciation", icon: Star },
    { amount: 299, labelKey: "generousSupport", icon: Gift },
    { amount: 599, labelKey: "amazingSupporter", icon: Heart },
    { amount: 999, labelKey: "championSupporter", icon: Star },
  ],
  USD: [
    { amount: 1, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 3, labelKey: "aThankYou", icon: Heart },
    { amount: 5, labelKey: "showAppreciation", icon: Star },
    { amount: 10, labelKey: "generousSupport", icon: Gift },
    { amount: 20, labelKey: "amazingSupporter", icon: Heart },
    { amount: 50, labelKey: "championSupporter", icon: Star },
  ],
  EUR: [
    { amount: 1, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 3, labelKey: "aThankYou", icon: Heart },
    { amount: 5, labelKey: "showAppreciation", icon: Star },
    { amount: 10, labelKey: "generousSupport", icon: Gift },
    { amount: 20, labelKey: "amazingSupporter", icon: Heart },
    { amount: 50, labelKey: "championSupporter", icon: Star },
  ],
  GBP: [
    { amount: 1, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 2, labelKey: "aThankYou", icon: Heart },
    { amount: 4, labelKey: "showAppreciation", icon: Star },
    { amount: 8, labelKey: "generousSupport", icon: Gift },
    { amount: 15, labelKey: "amazingSupporter", icon: Heart },
    { amount: 40, labelKey: "championSupporter", icon: Star },
  ],
  AUD: [
    { amount: 2, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 5, labelKey: "aThankYou", icon: Heart },
    { amount: 10, labelKey: "showAppreciation", icon: Star },
    { amount: 20, labelKey: "generousSupport", icon: Gift },
    { amount: 40, labelKey: "amazingSupporter", icon: Heart },
    { amount: 80, labelKey: "championSupporter", icon: Star },
  ],
  CAD: [
    { amount: 2, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 5, labelKey: "aThankYou", icon: Heart },
    { amount: 10, labelKey: "showAppreciation", icon: Star },
    { amount: 20, labelKey: "generousSupport", icon: Gift },
    { amount: 40, labelKey: "amazingSupporter", icon: Heart },
    { amount: 75, labelKey: "championSupporter", icon: Star },
  ],
  CHF: [
    { amount: 1, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 3, labelKey: "aThankYou", icon: Heart },
    { amount: 5, labelKey: "showAppreciation", icon: Star },
    { amount: 10, labelKey: "generousSupport", icon: Gift },
    { amount: 20, labelKey: "amazingSupporter", icon: Heart },
    { amount: 50, labelKey: "championSupporter", icon: Star },
  ],
  CZK: [
    { amount: 25, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 75, labelKey: "aThankYou", icon: Heart },
    { amount: 125, labelKey: "showAppreciation", icon: Star },
    { amount: 250, labelKey: "generousSupport", icon: Gift },
    { amount: 500, labelKey: "amazingSupporter", icon: Heart },
    { amount: 1200, labelKey: "championSupporter", icon: Star },
  ],
  DKK: [
    { amount: 10, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 25, labelKey: "aThankYou", icon: Heart },
    { amount: 50, labelKey: "showAppreciation", icon: Star },
    { amount: 100, labelKey: "generousSupport", icon: Gift },
    { amount: 200, labelKey: "amazingSupporter", icon: Heart },
    { amount: 400, labelKey: "championSupporter", icon: Star },
  ],
  HKD: [
    { amount: 10, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 25, labelKey: "aThankYou", icon: Heart },
    { amount: 50, labelKey: "showAppreciation", icon: Star },
    { amount: 100, labelKey: "generousSupport", icon: Gift },
    { amount: 200, labelKey: "amazingSupporter", icon: Heart },
    { amount: 400, labelKey: "championSupporter", icon: Star },
  ],
  HUF: [
    { amount: 400, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 1200, labelKey: "aThankYou", icon: Heart },
    { amount: 2000, labelKey: "showAppreciation", icon: Star },
    { amount: 4000, labelKey: "generousSupport", icon: Gift },
    { amount: 8000, labelKey: "amazingSupporter", icon: Heart },
    { amount: 20000, labelKey: "championSupporter", icon: Star },
  ],
  ILS: [
    { amount: 5, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 12, labelKey: "aThankYou", icon: Heart },
    { amount: 20, labelKey: "showAppreciation", icon: Star },
    { amount: 40, labelKey: "generousSupport", icon: Gift },
    { amount: 80, labelKey: "amazingSupporter", icon: Heart },
    { amount: 200, labelKey: "championSupporter", icon: Star },
  ],
  JPY: [
    { amount: 150, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 500, labelKey: "aThankYou", icon: Heart },
    { amount: 800, labelKey: "showAppreciation", icon: Star },
    { amount: 1500, labelKey: "generousSupport", icon: Gift },
    { amount: 3000, labelKey: "amazingSupporter", icon: Heart },
    { amount: 8000, labelKey: "championSupporter", icon: Star },
  ],
  MXN: [
    { amount: 20, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 60, labelKey: "aThankYou", icon: Heart },
    { amount: 100, labelKey: "showAppreciation", icon: Star },
    { amount: 200, labelKey: "generousSupport", icon: Gift },
    { amount: 400, labelKey: "amazingSupporter", icon: Heart },
    { amount: 1000, labelKey: "championSupporter", icon: Star },
  ],
  NOK: [
    { amount: 15, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 40, labelKey: "aThankYou", icon: Heart },
    { amount: 70, labelKey: "showAppreciation", icon: Star },
    { amount: 140, labelKey: "generousSupport", icon: Gift },
    { amount: 280, labelKey: "amazingSupporter", icon: Heart },
    { amount: 600, labelKey: "championSupporter", icon: Star },
  ],
  NZD: [
    { amount: 2, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 5, labelKey: "aThankYou", icon: Heart },
    { amount: 10, labelKey: "showAppreciation", icon: Star },
    { amount: 20, labelKey: "generousSupport", icon: Gift },
    { amount: 40, labelKey: "amazingSupporter", icon: Heart },
    { amount: 100, labelKey: "championSupporter", icon: Star },
  ],
  PHP: [
    { amount: 60, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 180, labelKey: "aThankYou", icon: Heart },
    { amount: 300, labelKey: "showAppreciation", icon: Star },
    { amount: 600, labelKey: "generousSupport", icon: Gift },
    { amount: 1200, labelKey: "amazingSupporter", icon: Heart },
    { amount: 3000, labelKey: "championSupporter", icon: Star },
  ],
  PLN: [
    { amount: 5, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 15, labelKey: "aThankYou", icon: Heart },
    { amount: 25, labelKey: "showAppreciation", icon: Star },
    { amount: 50, labelKey: "generousSupport", icon: Gift },
    { amount: 100, labelKey: "amazingSupporter", icon: Heart },
    { amount: 250, labelKey: "championSupporter", icon: Star },
  ],
  RUB: [
    { amount: 100, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 300, labelKey: "aThankYou", icon: Heart },
    { amount: 500, labelKey: "showAppreciation", icon: Star },
    { amount: 1000, labelKey: "generousSupport", icon: Gift },
    { amount: 2000, labelKey: "amazingSupporter", icon: Heart },
    { amount: 5000, labelKey: "championSupporter", icon: Star },
  ],
  SEK: [
    { amount: 15, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 40, labelKey: "aThankYou", icon: Heart },
    { amount: 70, labelKey: "showAppreciation", icon: Star },
    { amount: 140, labelKey: "generousSupport", icon: Gift },
    { amount: 280, labelKey: "amazingSupporter", icon: Heart },
    { amount: 600, labelKey: "championSupporter", icon: Star },
  ],
  SGD: [
    { amount: 2, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 5, labelKey: "aThankYou", icon: Heart },
    { amount: 10, labelKey: "showAppreciation", icon: Star },
    { amount: 20, labelKey: "generousSupport", icon: Gift },
    { amount: 40, labelKey: "amazingSupporter", icon: Heart },
    { amount: 80, labelKey: "championSupporter", icon: Star },
  ],
  THB: [
    { amount: 40, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 120, labelKey: "aThankYou", icon: Heart },
    { amount: 200, labelKey: "showAppreciation", icon: Star },
    { amount: 400, labelKey: "generousSupport", icon: Gift },
    { amount: 800, labelKey: "amazingSupporter", icon: Heart },
    { amount: 2000, labelKey: "championSupporter", icon: Star },
  ],
  TWD: [
    { amount: 40, labelKey: "aSmallTeaCoffee", icon: Coffee },
    { amount: 100, labelKey: "aThankYou", icon: Heart },
    { amount: 175, labelKey: "showAppreciation", icon: Star },
    { amount: 350, labelKey: "generousSupport", icon: Gift },
    { amount: 700, labelKey: "amazingSupporter", icon: Heart },
    { amount: 1750, labelKey: "championSupporter", icon: Star },
  ],
};

const PAYPAL_SUPPORTED_CURRENCIES = [
  'AUD', 'USD', 'CAD', 'CHF', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF',
  'ILS', 'JPY', 'MXN', 'NOK', 'NZD', 'PHP', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TWD'
];

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CZK: "Kč",
  DKK: "kr",
  HKD: "HK$",
  HUF: "Ft",
  ILS: "₪",
  JPY: "¥",
  MXN: "MX$",
  NOK: "kr",
  NZD: "NZ$",
  PHP: "₱",
  PLN: "zł",
  RUB: "₽",
  SEK: "kr",
  SGD: "S$",
  THB: "฿",
  TWD: "NT$",
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

const DONATION_CURRENCIES = ["INR", ...PAYPAL_SUPPORTED_CURRENCIES];

interface DonationCurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

const DONATION_CURRENCY_LIST: DonationCurrencyInfo[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ILS", name: "Israeli Shekel", symbol: "₪" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
];

export function SupportDeveloperScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const userCountry = getUserCountry() || "US";
  const countryInfo = getCountryByCode(userCountry);
  const detectedCurrency = getCurrencyForCountry(userCountry) || "USD";
  
  const isIndianByCountry = isIndianUser(userCountry);
  const isPayPalSupported = PAYPAL_SUPPORTED_CURRENCIES.includes(detectedCurrency);
  
  const initialCurrency = isIndianByCountry ? "INR" : (isPayPalSupported ? detectedCurrency : "USD");
  
  const [selectedCurrency, setSelectedCurrency] = useState<string>(initialCurrency);
  const [currencySearchOpen, setCurrencySearchOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  
  const isUpiCurrency = selectedCurrency === "INR";
  const donations = DONATION_TIERS[selectedCurrency] || DONATION_TIERS.USD;
  const currencySymbol = CURRENCY_SYMBOLS[selectedCurrency] || "$";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState<number>(0);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  const donorStatus = getDonorStatus();
  
  const filteredCurrencies = useMemo(() => {
    if (!currencySearch.trim()) return DONATION_CURRENCY_LIST;
    const query = currencySearch.toLowerCase();
    return DONATION_CURRENCY_LIST.filter(
      (c) => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)
    );
  }, [currencySearch]);
  
  const selectedCurrencyInfo = DONATION_CURRENCY_LIST.find((c) => c.code === selectedCurrency);
  
  const handleCurrencyChange = (code: string) => {
    setSelectedCurrency(code);
    setSelectedAmount(null);
    setCustomAmount("");
    setSelectedPaymentMethod(null);
    setCurrencySearchOpen(false);
    setCurrencySearch("");
  };

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
        title: t("invalidAmount"),
        description: t("pleaseEnterValidAmount"),
        variant: "destructive",
      });
      return;
    }
    
    setPendingPaymentAmount(validAmount);
    setPaymentInProgress(true);
    
    const success = openUpiPayment(validAmount);
    if (success) {
      toast({
        title: t("openingUpiApp"),
        description: t("chooseUpiApp"),
      });
    } else {
      setPaymentInProgress(false);
      toast({
        title: t("unableToOpenUpi"),
        description: t("useUpiIdManually"),
        variant: "destructive",
      });
    }
  };

  const handlePayPalPayment = (amount: number, currencyCode: string) => {
    const validAmount = validateAmount(amount);
    if (!validAmount) {
      toast({
        title: t("invalidAmount"),
        description: t("pleaseEnterValidAmount"),
        variant: "destructive",
      });
      return;
    }
    
    setPendingPaymentAmount(validAmount);
    setPaymentInProgress(true);
    
    const success = openPayPalPayment(validAmount, currencyCode);
    if (success) {
      toast({
        title: t("openingPayPal"),
        description: t("completePaymentOnPayPal"),
      });
    } else {
      setPaymentInProgress(false);
      toast({
        title: t("unableToOpenPayPal"),
        description: t("pleaseTryAgain"),
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

    const methodId = selectedPaymentMethod || (isUpiCurrency ? "upi" : "paypal");
    
    if (methodId === "upi" || methodId === "gpay") {
      handleUpiPayment(validAmount);
    } else {
      handlePayPalPayment(validAmount, selectedCurrency);
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
        title={t("supportTheDeveloper")}
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
              <h2 className="text-xl font-bold text-center">{t("thankYou")}</h2>
              <p className="text-sm text-muted-foreground text-center">
                {t("yourSupportMeansALot")}
              </p>
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {t("youAreNowSupporter")}
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Drawer open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-lg">{t("paymentVerification")}</DrawerTitle>
            <DrawerDescription>
              {t("didPaymentGoThrough").replace("{amount}", `${currencySymbol}${pendingPaymentAmount}`)}
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
              {t("yesPaymentCompleted")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full min-h-[52px] gap-2"
              onClick={handleDeclineDonation}
              data-testid="button-decline-donation"
            >
              <X className="w-5 h-5" />
              {t("noTryAgain")}
            </Button>
          </div>
          <DrawerFooter className="pt-0">
            <p className="text-xs text-center text-muted-foreground">
              {t("cannotVerifyUpi")}
            </p>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <ScrollContent className="pb-24">
        <section className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t("thankYou")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t("yourSupportMeansALot")}
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
              {t("supporter")}
            </Badge>
          )}
        </section>

        <Card className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{t("aboutTheDeveloper")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("independentDeveloper")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{t("basedInIndia")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>{t("buildingApps")}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("developerDescription")}
          </p>
        </Card>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("selectCurrency")}
          </h3>
          <Popover open={currencySearchOpen} onOpenChange={setCurrencySearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={currencySearchOpen}
                className="w-full justify-between font-normal"
                data-testid="button-currency-selector"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 opacity-50" />
                  {selectedCurrencyInfo ? (
                    <span>{selectedCurrencyInfo.symbol} {selectedCurrencyInfo.name} ({selectedCurrencyInfo.code})</span>
                  ) : (
                    <span>Select currency</span>
                  )}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[--radix-popover-trigger-width] p-0" 
              align="start"
              sideOffset={4}
              collisionPadding={{ top: 48, bottom: 48 }}
            >
              <div className="flex items-center border-b px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search currencies..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  className="h-8 border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  data-testid="input-currency-search"
                />
              </div>
              <ScrollArea className="h-[min(300px,50vh)]">
                <div className="p-1">
                  {filteredCurrencies.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No currency found
                    </div>
                  ) : (
                    filteredCurrencies.map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => handleCurrencyChange(curr.code)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                          selectedCurrency === curr.code && "bg-accent"
                        )}
                        data-testid={`currency-option-${curr.code}`}
                      >
                        <span className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-muted-foreground font-mono w-12">{curr.symbol}</span>
                          <span>{curr.name}</span>
                          <span className="text-xs text-muted-foreground">({curr.code})</span>
                        </span>
                        {selectedCurrency === curr.code && (
                          <Check className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          {isUpiCurrency && (
            <p className="text-xs text-muted-foreground">
              INR donations use UPI (Google Pay, PhonePe, Paytm, etc.)
            </p>
          )}
          {!isUpiCurrency && (
            <p className="text-xs text-muted-foreground">
              International donations use PayPal
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t("chooseAmount")} ({selectedCurrency})
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
                    {t(donation.labelKey as any)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-medium">{t("orEnterCustomAmount")} ({selectedCurrency})</label>
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
            {t("selectPaymentMethod")}
          </h3>

          <div className="flex flex-col gap-2">
            {isUpiCurrency ? (
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
                    <p className="font-medium text-sm">{t("upiApps")}</p>
                    <p className="text-xs text-muted-foreground">{t("upiAppsDescription")}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {t("recommended")}
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
                    <p className="font-medium text-sm">{t("googlePay")}</p>
                    <p className="text-xs text-muted-foreground">{t("payDirectlyWithGooglePay")}</p>
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
                  <p className="font-medium text-sm">{t("paypal")}</p>
                  <p className="text-xs text-muted-foreground">{t("paySecurelyWithPayPal")}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {t("recommended")}
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
            ? `${t("donate")} ${currencySymbol}${selectedAmount || customAmount}`
            : t("selectAnAmount")}
        </Button>

        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">{t("whatYourSupportDoes")}</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{t("helpsMaintainApp")}</li>
                <li>{t("supportsDevelopment")}</li>
                <li>{t("keepsAppAdFree")}</li>
                <li>{t("enablesFasterBugFixes")}</li>
              </ul>
            </div>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          {t("donationsVoluntary")}
        </p>
      </ScrollContent>
    </AppLayout>
  );
}
