import { useMemo, useState } from "react";
import { Crown, Check, Home, Briefcase, Users, Building2, Sparkles, Info, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { PLAN_LIMITS, PRICING } from "@shared/schema";
import { usePlanStatus } from "@/hooks/use-plan-status";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export function PlanScreen() {
  const { navigate } = useNavigation();
  const { planType, isPremium, status } = usePlanStatus();

  const profile = useMemo(() => storage.getProfile(), []);
  const isHome = profile?.type === "HOME";
  const settings = useMemo(() => storage.getModeSettings(), []);
  const currency = settings.currency || "INR";
  const pricing = PRICING[currency] || PRICING.INR;

  const homeLimits = PLAN_LIMITS.HOME;
  const staffLimits = PLAN_LIMITS.STAFF;

  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = () => {
    setPurchasing(true);
    setTimeout(() => {
      storage.markPurchased();
      setPurchasing(false);
      setShowPurchaseDialog(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <Header
        title="Subscription Plan"
        onBack={() => navigate("settings")}
      />

      <ScrollContent className="p-4 pb-24">
        <div className="flex flex-col gap-4">
          {status === "PURCHASED" ? (
            <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/50">
                  <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-sm text-green-800 dark:text-green-200">Premium Plan</h2>
                    <Badge variant="default" className="bg-green-600">
                      LIFETIME ACCESS
                    </Badge>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    All features unlocked. Thank you for your support!
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-sm text-blue-800 dark:text-blue-200">Standard Plan</h2>
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                    You are on the free Standard plan. Upgrade for more features!
                  </p>
                </div>
              </div>
            </Card>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Plan Comparison
            </h3>

            <Card className="overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 p-3 border-b">
                <div className="text-xs font-medium text-muted-foreground">Feature</div>
                <div className="text-xs font-medium text-center text-blue-600 dark:text-blue-400">Standard (Free)</div>
                <div className="text-xs font-medium text-center text-amber-600 dark:text-amber-400">Premium</div>
              </div>

              <div className="divide-y">
                <div className="grid grid-cols-3 p-3 items-center">
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Households</span>
                  </div>
                  <div className="text-sm text-center font-medium">{homeLimits.STANDARD.maxHouseholds}</div>
                  <div className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">{homeLimits.PREMIUM.maxHouseholds}</div>
                </div>

                <div className="grid grid-cols-3 p-3 items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Total Staff</span>
                  </div>
                  <div className="text-sm text-center font-medium">{homeLimits.STANDARD.maxStaffTotal}</div>
                  <div className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">{homeLimits.PREMIUM.maxStaffTotal}</div>
                </div>

                <div className="grid grid-cols-3 p-3 items-center">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Businesses</span>
                  </div>
                  <div className="text-sm text-center font-medium">{staffLimits.STANDARD.maxBusinesses}</div>
                  <div className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">{staffLimits.PREMIUM.maxBusinesses}</div>
                </div>

                <div className="grid grid-cols-3 p-3 items-center">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Total Clients</span>
                  </div>
                  <div className="text-sm text-center font-medium">{staffLimits.STANDARD.maxClientsTotal}</div>
                  <div className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">{staffLimits.PREMIUM.maxClientsTotal}</div>
                </div>

                <div className="grid grid-cols-3 p-3 items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Documents</span>
                  </div>
                  <div className="text-sm text-center font-medium">{homeLimits.STANDARD.maxDocuments}</div>
                  <div className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">{homeLimits.PREMIUM.maxDocuments}</div>
                </div>
              </div>
            </Card>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              What's Included
            </h3>
            
            <div className="grid gap-3">
              <Card className="p-4 border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-medium text-sm text-blue-800 dark:text-blue-200">Standard Plan</h4>
                  <Badge variant="secondary" className="ml-auto text-xs">FREE</Badge>
                </div>
                <ul className="space-y-2">
                  {[
                    `${homeLimits.STANDARD.maxHouseholds} households, ${homeLimits.STANDARD.maxStaffTotal} staff (Home Mode)`,
                    `${staffLimits.STANDARD.maxBusinesses} businesses, ${staffLimits.STANDARD.maxClientsTotal} clients (Staff Mode)`,
                    `Up to ${homeLimits.STANDARD.maxDocuments} document uploads`,
                    "Attendance & payment tracking",
                    "Expense management",
                    "Data backup & restore",
                    "Free forever, no time limit"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200">Premium Plan</h4>
                  <Badge variant="default" className="ml-auto text-xs bg-amber-600">{pricing.label}</Badge>
                </div>
                <ul className="space-y-2">
                  {[
                    `${homeLimits.PREMIUM.maxHouseholds} households, ${homeLimits.PREMIUM.maxStaffTotal} staff (Home Mode)`,
                    `${staffLimits.PREMIUM.maxBusinesses} businesses, ${staffLimits.PREMIUM.maxClientsTotal} clients (Staff Mode)`,
                    `Up to ${homeLimits.PREMIUM.maxDocuments} document uploads`,
                    "All Standard Plan features included",
                    "One-time purchase, lifetime access",
                    "No recurring fees or subscriptions"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-100">
                      <Check className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </section>

          {status !== "PURCHASED" && (
            <Card className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Upgrade to Premium</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">One-time purchase, lifetime access</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pricing.label}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">No recurring fees</p>
                  </div>
                  <Button 
                    onClick={() => setShowPurchaseDialog(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    data-testid="button-upgrade"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Support & Updates
            </h3>
            
            <Card className="p-4">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We are committed to improving your experience. Your purchase includes all future updates and enhancements for this version of the app. Please note that any new major app releases may require a separate subscription. We appreciate your support and are here to help you get the most out of Home Staff 360.
                </p>
              </div>
            </Card>
          </section>
        </div>
      </ScrollContent>

      <AlertDialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upgrade to Premium</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to purchase lifetime premium access for {pricing.label}. This is a one-time payment with no recurring fees. All future updates for this version are included.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              disabled={purchasing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {purchasing ? "Processing..." : `Pay ${pricing.label}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
