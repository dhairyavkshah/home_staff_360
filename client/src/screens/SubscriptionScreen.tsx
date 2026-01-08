import { useMemo, useState } from "react";
import { Shield, Check, Crown, Cloud, Users, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";
import { getCountryPricing, CURRENCIES, type SubscriptionPlan, type PricingTier, type Currency } from "@shared/schema";
import { format } from "date-fns";

const BENEFITS = [
  {
    icon: Users,
    title: "Unlimited Staff & Homes",
    description: "Manage unlimited staff members and households",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Keep your data synced across all your devices",
  },
  {
    icon: RefreshCw,
    title: "Real-time Collaboration",
    description: "Share and collaborate with family members",
  },
  {
    icon: Calendar,
    title: "Advanced Reports",
    description: "Generate detailed reports and analytics",
  },
];

interface PricingInfo {
  monthly: number;
  annual: number;
  tier: PricingTier;
  currency: string;
  symbol: string;
}

// Prices displayed in local currency - actual prices come from Google Play Store at runtime
function getPriceForCountry(countryCode: string): PricingInfo {
  const pricing = getCountryPricing(countryCode?.toUpperCase() || "US");
  const currencyConfig = CURRENCIES[pricing.currency as Currency];
  return {
    monthly: pricing.monthly,
    annual: pricing.annual,
    tier: pricing.tier,
    currency: pricing.currency,
    symbol: currencyConfig?.symbol || pricing.currency + ' ',
  };
}

function formatPrice(amount: number, decimals: number = 2): string {
  if (amount >= 1000) {
    return amount.toLocaleString();
  }
  if (Number.isInteger(amount)) {
    return amount.toString();
  }
  return amount.toFixed(decimals);
}

export function SubscriptionScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { isLoading, isSubscribed, expiryDate, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("annual");

  const settings = useMemo(() => storage.getSettings(), []);
  const profile = useMemo(() => storage.getProfile(), []);
  const country = settings.country || settings.detectedCountry || "US";

  const pricing = useMemo(() => getPriceForCountry(country), [country]);

  const monthlyEquivalent = useMemo(() => {
    return (pricing.annual / 12).toFixed(2);
  }, [pricing.annual]);

  const savingsPercent = useMemo(() => {
    const monthlyTotal = pricing.monthly * 12;
    const savings = ((monthlyTotal - pricing.annual) / monthlyTotal) * 100;
    return Math.round(savings);
  }, [pricing.monthly, pricing.annual]);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    toast({
      title: "Google Play Billing",
      description: `${plan === "monthly" ? "Monthly" : "Annual"} subscription will be handled through Google Play Billing. This feature will be available soon.`,
    });
  };

  const handleManageSubscription = () => {
    toast({
      title: "Manage Subscription",
      description: "You can manage your subscription through Google Play Store.",
    });
  };

  return (
    <AppLayout>
      <Header
        title="Subscription"
        subtitle=""
        onBack={goBack}
      />

      <ScrollContent>
        {isSubscribed ? (
          <section className="flex flex-col gap-4">
            <Card className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">Premium Active</h2>
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have full access to all features
                  </p>
                </div>
              </div>
            </Card>

            {expiryDate && (
              <Card className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="icon-halo-info w-9 h-9">
                      <Calendar className="w-4.5 h-4.5 text-info" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Valid Until</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expiryDate), "MMMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  {subscription?.autoRenewing && (
                    <Badge variant="outline" className="text-xs">Auto-renew</Badge>
                  )}
                </div>
              </Card>
            )}

            <section className="flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Benefits
              </h3>
              <Card className="divide-y">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="p-4 flex items-center gap-3">
                    <div className="icon-halo-success w-9 h-9">
                      <benefit.icon className="w-4.5 h-4.5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                    <Check className="w-4 h-4 text-success" />
                  </div>
                ))}
              </Card>
            </section>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageSubscription}
              data-testid="button-manage-subscription"
            >
              Manage Subscription
            </Button>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="text-center py-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Unlock Premium</h2>
              <p className="text-sm text-muted-foreground px-4">
                Get unlimited access to all features and take your household management to the next level
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  selectedPlan === "annual" 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover-elevate"
                }`}
                onClick={() => setSelectedPlan("annual")}
                data-testid="plan-annual"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">Annual Plan</h3>
                      <Badge variant="default" className="text-xs">Save {savingsPercent}%</Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{pricing.symbol}{formatPrice(pricing.annual)}</span>
                      <span className="text-sm text-muted-foreground">/year</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only {pricing.symbol}{monthlyEquivalent}/month when billed annually
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "annual" 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground"
                  }`}>
                    {selectedPlan === "annual" && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>
              </Card>

              <Card 
                className={`p-4 cursor-pointer transition-all ${
                  selectedPlan === "monthly" 
                    ? "ring-2 ring-primary bg-primary/5" 
                    : "hover-elevate"
                }`}
                onClick={() => setSelectedPlan("monthly")}
                data-testid="plan-monthly"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Monthly Plan</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{pricing.symbol}{formatPrice(pricing.monthly)}</span>
                      <span className="text-sm text-muted-foreground">/month</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Flexible monthly billing
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "monthly" 
                      ? "border-primary bg-primary" 
                      : "border-muted-foreground"
                  }`}>
                    {selectedPlan === "monthly" && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>
              </Card>
            </div>

            <section className="flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                What You Get
              </h3>
              <Card className="divide-y">
                {BENEFITS.map((benefit, index) => (
                  <div key={index} className="p-4 flex items-center gap-3">
                    <div className="icon-halo-primary w-9 h-9">
                      <benefit.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </section>

            <div className="flex flex-col gap-3 mt-2">
              <Button
                className="w-full"
                onClick={() => handleSubscribe(selectedPlan)}
                data-testid="button-subscribe"
              >
                <Crown className="w-4 h-4 mr-2" />
                Subscribe {selectedPlan === "monthly" ? "Monthly" : "Annually"} - {pricing.symbol}{formatPrice(selectedPlan === "monthly" ? pricing.monthly : pricing.annual)}/{selectedPlan === "monthly" ? "mo" : "yr"}
              </Button>
              <p className="text-xs text-center text-muted-foreground px-4 mt-2">
                Prices shown are reference values. Actual price will be displayed in Google Play checkout.
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground px-4 mt-2">
              Subscription will be processed through Google Play. You can cancel anytime from your Google Play subscriptions.
            </p>
          </section>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
