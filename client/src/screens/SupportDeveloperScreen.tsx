import { useState } from "react";
import { Heart, Coffee, Gift, Star, Copy, User, MapPin, Globe, Smartphone, CreditCard, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { getUserCountry, getCurrencyForCountry, getCountryByCode } from "@/lib/geolocation-service";
import { Capacitor } from "@capacitor/core";

interface DonationTier {
  amount: number;
  label: string;
  icon: typeof Coffee;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: typeof Smartphone;
  description: string;
  countries: string[];
  action: (amount: number, currency: string) => void;
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

const UPI_ID = "dhairyavkshah@icici";
const UPI_PHONE = "+919722523691";
const PAYPAL_USERNAME = "dhairyavkshah";

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

  const isIndian = userCountry === "IN" || userCountry === "NP" || userCountry === "BT";

  const openUpiUrl = (upiUrl: string, appName: string) => {
    if (Capacitor.isNativePlatform()) {
      window.open(upiUrl, "_system");
      toast({
        title: `Opening ${appName}`,
        description: "Choose your preferred UPI app to complete payment",
      });
    } else {
      window.location.href = upiUrl;
      toast({
        title: "Opening payment app",
        description: "If no app opens, please use the UPI ID below to pay manually",
      });
    }
  };

  const handleUpiPayment = (amount: number) => {
    const payeeName = "Dhairya Shah";
    const transactionNote = "Support Home Staff 360";
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    openUpiUrl(upiUrl, "UPI Apps");
  };

  const handlePayPalPayment = (amount: number, currencyCode: string) => {
    const paypalUrl = `https://www.paypal.me/${PAYPAL_USERNAME}/${amount}${currencyCode}`;
    window.open(paypalUrl, "_blank");
    toast({
      title: "Opening PayPal",
      description: "Complete the payment on PayPal",
    });
  };

  const handleGooglePayPayment = (amount: number) => {
    const payeeName = "Dhairya Shah";
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Support Home Staff 360")}`;
    openUpiUrl(upiUrl, "Google Pay");
  };

  const paymentMethods: PaymentMethod[] = isIndian ? [
    {
      id: "upi",
      name: "UPI Apps",
      icon: Smartphone,
      description: "Google Pay, PhonePe, Paytm, BHIM & more",
      countries: ["IN", "NP", "BT"],
      action: (amount) => handleUpiPayment(amount),
    },
    {
      id: "gpay",
      name: "Google Pay",
      icon: Wallet,
      description: "Pay directly with Google Pay",
      countries: ["IN"],
      action: (amount) => handleGooglePayPayment(amount),
    },
  ] : [
    {
      id: "paypal",
      name: "PayPal",
      icon: CreditCard,
      description: "Pay securely with PayPal",
      countries: ["US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "GR", "CA", "AU", "SG", "JP", "KR", "HK", "ZA", "BR", "MX", "AR", "CL", "CO", "AE", "SA", "QA", "KW", "OM", "BH"],
      action: (amount, curr) => handlePayPalPayment(amount, curr),
    },
  ];

  const availablePaymentMethods = paymentMethods;

  const copyPaymentId = (id: string, label: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: `${label} copied to clipboard` });
  };

  const handleDonate = () => {
    const amount = selectedAmount || parseInt(customAmount) || 0;
    if (amount <= 0) {
      toast({
        title: "Please select an amount",
        description: "Choose a donation amount to continue",
        variant: "destructive",
      });
      return;
    }

    const methodId = selectedPaymentMethod || (isIndian ? "upi" : "paypal");
    const method = paymentMethods.find((m) => m.id === methodId) || paymentMethods[0];
    if (method) {
      method.action(amount, currency);
    }
  };

  return (
    <AppLayout>
      <Header
        title="Support the Developer"
        onBack={() => navigate("settings")}
      />

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

          <div className="grid grid-cols-2 gap-2">
            {donations.map((donation) => {
              const Icon = donation.icon;
              const isSelected = selectedAmount === donation.amount;
              return (
                <button
                  key={donation.amount}
                  onClick={() => {
                    setSelectedAmount(donation.amount);
                    setCustomAmount("");
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-donate-${donation.amount}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-semibold">
                      {currencySymbol}{donation.amount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{donation.label}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
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
                  className="w-full pl-8 pr-4 py-2 rounded-md border bg-background text-sm"
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
            {availablePaymentMethods.map((method, index) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id || (selectedPaymentMethod === null && index === 0);
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover-elevate"
                  }`}
                  data-testid={`button-payment-${method.id}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {isIndian && (
          <Card className="p-4 flex flex-col gap-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm text-green-800 dark:text-green-200">UPI ID</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Copy and pay via any UPI app
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-green-950/50 px-3 py-2 rounded text-sm font-mono text-xs">
                {UPI_ID}
              </code>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => copyPaymentId(UPI_ID, "UPI ID")} 
                data-testid="button-copy-upi"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-green-950/50 px-3 py-2 rounded text-sm font-mono text-xs">
                {UPI_PHONE}
              </code>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => copyPaymentId(UPI_PHONE, "Phone number")} 
                data-testid="button-copy-phone"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {!isIndian && (
          <Card className="p-4 flex flex-col gap-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm text-blue-800 dark:text-blue-200">PayPal</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Pay securely with PayPal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-blue-950/50 px-3 py-2 rounded text-sm font-mono">
                paypal.me/{PAYPAL_USERNAME}
              </code>
              <Button 
                size="icon" 
                variant="outline" 
                onClick={() => copyPaymentId(`https://paypal.me/${PAYPAL_USERNAME}`, "PayPal link")} 
                data-testid="button-copy-paypal"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

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
