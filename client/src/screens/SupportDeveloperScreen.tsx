import { useState } from "react";
import { Heart, Coffee, Gift, Star, Check, Copy, User, MapPin, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { getUserCountry } from "@/lib/geolocation-service";

const INR_DONATIONS = [
  { amount: 9, label: "A small coffee", icon: Coffee },
  { amount: 29, label: "A thank you", icon: Heart },
  { amount: 99, label: "Show appreciation", icon: Star },
  { amount: 299, label: "Generous support", icon: Gift },
  { amount: 599, label: "Amazing supporter", icon: Heart },
  { amount: 999, label: "Champion supporter", icon: Star },
];

const USD_DONATIONS = [
  { amount: 1, label: "A small coffee", icon: Coffee },
  { amount: 3, label: "A thank you", icon: Heart },
  { amount: 5, label: "Show appreciation", icon: Star },
  { amount: 10, label: "Generous support", icon: Gift },
  { amount: 20, label: "Amazing supporter", icon: Heart },
  { amount: 50, label: "Champion supporter", icon: Star },
];

export function SupportDeveloperScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();

  const userCountry = getUserCountry();
  const isIndian = userCountry === "IN";
  const donations = isIndian ? INR_DONATIONS : USD_DONATIONS;
  const currencySymbol = isIndian ? "₹" : "$";
  const currencyCode = isIndian ? "INR" : "USD";

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

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

    const upiId = "developer@upi";
    const payeeName = "Home Staff 360 Developer";
    
    if (isIndian) {
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Support Home Staff 360")}`;
      window.open(upiUrl, "_blank");
    } else {
      toast({
        title: "Thank you for your interest!",
        description: "International payment options coming soon. Your support means a lot!",
      });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("developer@upi");
    toast({ title: "UPI ID copied to clipboard" });
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
            I'm a solo developer passionate about creating useful, privacy-focused apps. 
            Home Staff 360 is built with love and dedication to help people manage their household staff efficiently. 
            Your support keeps this project alive and growing!
          </p>
        </Card>

        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Choose an Amount
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
            <label className="text-sm font-medium">Or enter custom amount ({currencyCode})</label>
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

        {isIndian && (
          <Card className="p-4 flex flex-col gap-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm text-green-800 dark:text-green-200">UPI Payment</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Fastest way to donate in India
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                Recommended
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-green-950/50 px-3 py-2 rounded text-sm font-mono">
                developer@upi
              </code>
              <Button size="icon" variant="outline" onClick={copyUpiId} data-testid="button-copy-upi">
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
            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
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
