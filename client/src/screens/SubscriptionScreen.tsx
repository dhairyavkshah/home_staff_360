import { useMemo } from "react";
import { Shield, Check, Crown, Cloud, Users, Calendar, RefreshCw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";
import { SUBSCRIPTION_PRICES, CURRENCIES, type Currency } from "@shared/schema";
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

function getPriceForCountry(countryCode: string): { amount: number; symbol: string; currency: string } {
  const currencyMapping: Record<string, keyof typeof SUBSCRIPTION_PRICES> = {
    IN: "INR",
    US: "USD",
    GB: "GBP",
    AU: "AUD",
    CA: "CAD",
    CH: "CHF",
    CZ: "CZK",
    DK: "DKK",
    HK: "HKD",
    HU: "HUF",
    IL: "ILS",
    JP: "JPY",
    MX: "MXN",
    NO: "NOK",
    NZ: "NZD",
    PH: "PHP",
    PL: "PLN",
    RU: "RUB",
    SE: "SEK",
    SG: "SGD",
    TH: "THB",
    TW: "TWD",
    AE: "AED",
    CN: "CNY",
    BR: "BRL",
    ZA: "ZAR",
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    BE: "EUR",
    AT: "EUR",
    PT: "EUR",
    IE: "EUR",
    FI: "EUR",
    GR: "EUR",
  };

  const currencyKey = currencyMapping[countryCode?.toUpperCase()] || "USD";
  const priceInfo = SUBSCRIPTION_PRICES[currencyKey];
  const currencyConfig = CURRENCIES[currencyKey as Currency];

  return {
    amount: priceInfo.amount,
    symbol: currencyConfig?.symbol || "$",
    currency: priceInfo.currency,
  };
}

export function SubscriptionScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { isLoading, isSubscribed, expiryDate, subscription, refreshSubscription } = useSubscription();

  const settings = useMemo(() => storage.getSettings(), []);
  const profile = useMemo(() => storage.getProfile(), []);
  const country = settings.country || settings.detectedCountry || "US";

  const pricing = useMemo(() => getPriceForCountry(country), [country]);

  const handleSubscribe = () => {
    toast({
      title: "Google Play Billing",
      description: "Subscription will be handled through Google Play Billing. This feature will be available soon.",
    });
  };

  const handleManageSubscription = () => {
    toast({
      title: "Manage Subscription",
      description: "You can manage your subscription through Google Play Store.",
    });
  };

  const handleContinue = () => {
    const defaultMode = settings.defaultAppMode || profile?.type || "HOME";
    navigate(defaultMode === "STAFF" ? "staff-home" : "home");
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

            <Card className="p-5 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-3xl font-bold">{pricing.symbol}{pricing.amount}</span>
                  <span className="text-sm text-muted-foreground">/year</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Billed annually in {pricing.currency}
                </p>
              </div>
            </Card>

            <section className="flex flex-col gap-3">
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
                onClick={handleSubscribe}
                data-testid="button-subscribe"
              >
                <Crown className="w-4 h-4 mr-2" />
                Subscribe Now - {pricing.symbol}{pricing.amount}/year
              </Button>
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
