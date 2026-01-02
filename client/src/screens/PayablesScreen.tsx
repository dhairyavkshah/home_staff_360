import { useMemo } from "react";
import { Receipt, ChevronRight, Clock, AlertTriangle, Wallet, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { calculatePersonBalanceWithCurrency, getUnpaidLaundryTotal, formatCurrency, getCurrencyIcon, formatRecordCurrency } from "@/lib/calculations";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";

export function PayablesScreen() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  const settings = useMemo(() => storage.getSettings(), []);
  
  // Get account-level unpaid laundry (not linked to specific person)
  const accountLevelUnpaidLaundry = useMemo(() => {
    const accountId = storage.getActiveAccountId();
    const laundry = accountId ? storage.getLaundryByAccount(accountId) : storage.getLaundry();
    // Get all unpaid laundry that doesn't have a personId
    return laundry
      .filter((l) => !l.isPaid && !l.personId)
      .reduce((sum, l) => sum + l.total, 0);
  }, []);
  
  const peopleWithBalances = useMemo(() => {
    const accountId = storage.getActiveAccountId();
    const all = accountId ? storage.getPeopleByAccount(accountId) : storage.getPeople();
    const now = new Date();
    
    return all
      .map((p) => {
        const balanceResult = calculatePersonBalanceWithCurrency(p.id);
        const unpaidLaundry = getUnpaidLaundryTotal(p.id);
        // Total payable = wages owed PLUS unpaid laundry (employer owes staff for laundry service)
        const balance = balanceResult.amount + unpaidLaundry;
        const transactions = storage.getTransactionsByPerson(p.id);
        const lastPayment = transactions
          .filter(t => t.category === "payment")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const lastPaymentDate = lastPayment ? new Date(lastPayment.date) : null;
        const daysSincePayment = lastPaymentDate 
          ? Math.floor((now.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        
        return {
          ...p,
          balance,
          unpaidLaundry,
          lastPaymentDate,
          daysSincePayment,
          isOverdue: balance > 0 && daysSincePayment > settings.salaryStartDay,
          hasMixedCurrencies: balanceResult.hasMixedCurrencies,
          primaryCurrencySymbol: balanceResult.primaryCurrencySymbol,
        };
      })
      .filter((p) => p.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [settings.salaryStartDay]);

  // Total payable includes staff balances + account-level unpaid laundry
  const totalPayable = useMemo(() => 
    peopleWithBalances.reduce((sum, p) => sum + p.balance, 0) + accountLevelUnpaidLaundry, 
    [peopleWithBalances, accountLevelUnpaidLaundry]
  );

  // Check if there are mixed currencies across all balances
  const hasMixedCurrenciesOverall = useMemo(() => {
    return peopleWithBalances.some(p => p.hasMixedCurrencies);
  }, [peopleWithBalances]);

  const overdueCount = peopleWithBalances.filter(p => p.isOverdue).length;
  
  const dueThisWeek = useMemo(() => {
    const now = new Date();
    const salaryDay = settings.salaryStartDay || 1;
    const currentDay = now.getDate();
    const daysUntilPayday = salaryDay > currentDay 
      ? salaryDay - currentDay 
      : (salaryDay + 30 - currentDay);
    
    if (daysUntilPayday <= 7) {
      return totalPayable;
    }
    return 0;
  }, [settings.salaryStartDay, totalPayable]);

  const CurrencyIcon = getCurrencyIcon(settings.currency);

  return (
    <AppLayout data-testid="screen-payables">
      <Header
        title={t("payables")}
        onBack={() => navigate("home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent>
          <Card className="p-4 bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="icon-halo-warning w-9 h-9">
                  <Receipt className="w-4.5 h-4.5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold" data-testid="text-total-payable">
                    {formatCurrency(totalPayable, settings.currency, settings.customCurrencySymbol)}
                  </p>
                  {hasMixedCurrenciesOverall && (
                    <p className="text-xs text-muted-foreground italic">Mixed currencies in records</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{peopleWithBalances.length}</p>
                <p className="text-xs text-muted-foreground">Staff owed</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="icon-halo-info w-7 h-7">
                  <Clock className="w-3.5 h-3.5 text-info" />
                </div>
                <span className="text-xs text-muted-foreground">Due This Week</span>
              </div>
              <p className="text-lg font-semibold mt-1">
                {dueThisWeek > 0 
                  ? formatCurrency(dueThisWeek, settings.currency, settings.customCurrencySymbol)
                  : "None"}
              </p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="icon-halo-destructive w-7 h-7">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-xs text-muted-foreground">Overdue</span>
              </div>
              <p className={`text-lg font-semibold mt-1 ${overdueCount > 0 ? 'text-destructive' : ''}`}>
                {overdueCount} staff
              </p>
            </Card>
          </div>

          {accountLevelUnpaidLaundry > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">Unpaid Laundry</h2>
              <Card 
                className="p-3 hover-elevate cursor-pointer"
                onClick={() => navigate("laundry-view", { source: "payables" })}
                data-testid="card-unpaid-laundry"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="icon-halo-warning w-9 h-9">
                      <Shirt className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Laundry Services</p>
                      <p className="text-xs text-muted-foreground">Tap to view details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold text-warning">
                        {formatCurrency(accountLevelUnpaidLaundry, settings.currency, settings.customCurrencySymbol)}
                      </p>
                      <p className="text-xs text-muted-foreground">unpaid</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            </section>
          )}
          
          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Outstanding by Staff</h2>
            
            {peopleWithBalances.length === 0 && accountLevelUnpaidLaundry === 0 ? (
              <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
                <div className="icon-halo-muted w-10 h-10">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">All payments up to date</h3>
                  <p className="text-xs text-muted-foreground">No outstanding balances</p>
                </div>
              </Card>
            ) : peopleWithBalances.length === 0 ? (
              <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state-staff">
                <div className="icon-halo-muted w-10 h-10">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">No staff balances</h3>
                  <p className="text-xs text-muted-foreground">All staff payments are settled</p>
                </div>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {peopleWithBalances.map((person) => (
                  <Card
                    key={person.id}
                    className="p-3 hover-elevate cursor-pointer"
                    onClick={() => navigate("person-detail", { personId: person.id, source: "payables" })}
                    data-testid={`card-payable-${person.id}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="icon-halo-primary w-9 h-9">
                          <span className="text-sm font-semibold text-primary">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{person.name}</p>
                            {person.isOverdue && (
                              <Badge variant="destructive" className="text-xs">Overdue</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{person.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-warning">
                            {formatRecordCurrency(person.balance, person.primaryCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {person.hasMixedCurrencies ? "owed (mixed)" : "owed"}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("add-transaction", { 
                            personId: person.id,
                            presetAmount: person.balance,
                            defaultDescription: `Salary Payment for ${person.name}`,
                            defaultCategory: "payment",
                            source: "payables",
                          });
                        }}
                        data-testid={`button-pay-${person.id}`}
                      >
                        <CurrencyIcon className="w-3.5 h-3.5 mr-1" />
                        Record Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("person-calendar", { personId: person.id, source: "payables" });
                        }}
                        data-testid={`button-view-history-${person.id}`}
                      >
                        View History
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
      </ScrollContent>
    </AppLayout>
  );
}
