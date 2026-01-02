import { useMemo, useState, useEffect, useRef } from "react";
import { Settings, Users, Calendar, Shirt, FileText, Home, ChevronDown, Check, Building2, FolderOpen, Wallet, Receipt, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { getDashboardStats, formatCurrency, formatCurrencyTotals } from "@/lib/calculations";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { notifyActiveContextChange } from "@/hooks/use-active-context";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { useTour, shouldShowTour } from "@/lib/guided-tour";
import { useToast } from "@/hooks/use-toast";
import { StorageWarningBanner } from "@/components/StorageWarningBanner";

export function HomeScreen() {
  const { navigate, data } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { planType } = usePlanStatus();
  const { startTour } = useTour();
  const tourStartedRef = useRef(false);

  useEffect(() => {
    if (tourStartedRef.current) return;
    if (data.startTour && data.tourMode === "HOME") {
      tourStartedRef.current = true;
      setTimeout(() => startTour("HOME"), 500);
    } else if (shouldShowTour("HOME")) {
      tourStartedRef.current = true;
      setTimeout(() => startTour("HOME"), 500);
    }
  }, [data.startTour, data.tourMode, startTour]);

  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const accounts = useMemo(() => storage.getAccounts().filter(a => a.ownerType === 'HOME'), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const activeAccount = useMemo(() => accounts.find((a) => a.id === activeAccountId), [accounts, activeAccountId]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  
  const stats = useMemo(() => getDashboardStats(), [refreshKey]);
  const settings = useMemo(() => storage.getSettings(), [refreshKey]);
  const planLimit = useMemo(() => storage.checkHomePlanLimit('households'), [refreshKey, planType]);

  const hasHouseholds = accounts.length > 0;
  const activePeople = useMemo(() => {
    const allActive = storage.getPeople().filter(p => p.isActive);
    if (showAllContexts) {
      return allActive;
    }
    if (activeAccountId) {
      return storage.getPeopleByAccount(activeAccountId).filter(p => p.isActive);
    }
    return allActive;
  }, [refreshKey, showAllContexts, activeAccountId]);
  const hasStaff = activePeople.length > 0;

  const modulesRequiringHousehold = ['staff', 'attendance', 'laundry', 'payables', 'expenses', 'transactions', 'reports', 'documents'];
  const modulesRequiringStaff = ['attendance', 'laundry', 'payables', 'expenses', 'transactions', 'reports'];

  const handleModuleClick = (moduleId: string, screen: string) => {
    if (modulesRequiringHousehold.includes(moduleId) && !hasHouseholds) {
      toast({
        title: "Household Required",
        description: "Please add a Household first.",
        variant: "destructive",
      });
      return;
    }
    if (modulesRequiringStaff.includes(moduleId) && !hasStaff) {
      toast({
        title: "Staff Required",
        description: "Please add Staff first.",
        variant: "destructive",
      });
      return;
    }
    navigate(screen as any);
  };

  const handleSwitchAccount = (accountId: string | null) => {
    if (accountId === null) {
      storage.setShowAllContexts(true);
    } else {
      storage.setShowAllContexts(false);
      storage.setActiveAccount(accountId);
    }
    notifyActiveContextChange();
    setRefreshKey((k) => k + 1);
  };

  const modules = [
    {
      id: 'households',
      title: tLabel('households', 'Households'),
      icon: Building2,
      color: 'primary',
      screen: 'households' as const,
      subtitle: `${planLimit.current}/${planLimit.max}`,
    },
    {
      id: 'staff',
      title: tLabel('staff', 'Staff'),
      icon: Users,
      color: 'success',
      screen: 'people' as const,
      subtitle: `${stats.activeStaff} ${tLabel('active', 'Active')}`,
    },
    {
      id: 'attendance',
      title: tLabel('attendance', 'Attendance'),
      icon: Calendar,
      color: 'warning',
      screen: 'attendance' as const,
      subtitle: stats.todayAttendance.unmarked > 0 
        ? `${stats.todayAttendance.unmarked} ${tLabel('unmarked', 'Unmarked')}`
        : stats.activeStaff > 0 
          ? `${stats.todayAttendance.present}P / ${stats.todayAttendance.halfDay}H / ${stats.todayAttendance.absent}A`
          : tLabel('markAttendance', 'Mark Today'),
    },
    {
      id: 'laundry',
      title: tLabel('laundry', 'Laundry'),
      icon: Shirt,
      color: 'info',
      screen: 'laundry-view' as const,
      subtitle: stats.unpaidLaundryByCurrency.length > 0 
        ? `${formatCurrencyTotals(stats.unpaidLaundryByCurrency)} ${tLabel('unpaid', 'Unpaid')}`
        : tLabel('allPaid', 'All Paid'),
    },
    {
      id: 'payables',
      title: tLabel('payables', 'Payables'),
      icon: Wallet,
      color: 'warning',
      screen: 'payables' as const,
      subtitle: formatCurrency(stats.totalPayable, settings.currency, settings.customCurrencySymbol),
    },
    {
      id: 'expenses',
      title: tLabel('billsExpenses', 'Expenses'),
      icon: Receipt,
      color: 'destructive',
      screen: 'expenses' as const,
      subtitle: stats.expensesByCurrency.length > 0 
        ? formatCurrencyTotals(stats.expensesByCurrency)
        : formatCurrency(0, settings.currency, settings.customCurrencySymbol),
    },
    {
      id: 'transactions',
      title: tLabel('transactions', 'Transactions'),
      icon: ArrowRightLeft,
      color: 'info',
      screen: 'transactions' as const,
      subtitle: tLabel('viewAll', 'View All'),
    },
    {
      id: 'reports',
      title: tLabel('reports', 'Reports'),
      icon: FileText,
      color: 'muted',
      screen: 'reports' as const,
      subtitle: tLabel('viewReports', 'View Reports'),
    },
    {
      id: 'documents',
      title: tLabel('documents', 'Documents'),
      icon: FolderOpen,
      color: 'muted',
      screen: 'documents' as const,
      subtitle: tLabel('storeFiles', 'Store Files'),
    },
  ];

  const getHaloClass = (color: string) => {
    const classes: Record<string, string> = {
      primary: 'icon-halo-primary',
      success: 'icon-halo-success',
      warning: 'icon-halo-warning',
      info: 'icon-halo-info',
      destructive: 'icon-halo-destructive',
      muted: 'icon-halo-muted',
    };
    return classes[color] || 'icon-halo-primary';
  };

  const getIconClass = (color: string) => {
    const classes: Record<string, string> = {
      primary: 'text-primary',
      success: 'text-success',
      warning: 'text-warning',
      info: 'text-info',
      destructive: 'text-destructive',
      muted: 'text-muted-foreground',
    };
    return classes[color] || 'text-primary';
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-home" data-tour-id="tour-dashboard">
      <div className="safe-area-top" />

      <header className="content-container py-3 min-h-14 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-welcome">
              {tLabel("welcome", "Welcome")}, {profile?.displayName || "User"}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-account-switcher"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">
                    {activeAccount?.name || tLabel('selectHousehold', 'Select')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => handleSwitchAccount(account.id)}
                    className="flex items-center gap-2"
                    data-testid={`menu-item-account-${account.id}`}
                  >
                    <Home className="w-4 h-4" />
                    <span className="flex-1">{account.name}</span>
                    {account.id === activeAccountId && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("settings")}
            data-testid="button-settings"
            data-tour-id="tour-settings-button"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <StorageWarningBanner />
        <div className="content-container pb-6 flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-2" data-testid="section-modules">
            {modules.map((module) => {
              const Icon = module.icon;
              const tourId = {
                staff: 'tour-staff-card',
                attendance: 'tour-attendance-card',
                payables: 'tour-payables-card',
                expenses: 'tour-expenses-card',
                laundry: 'tour-laundry-card',
                reports: 'tour-reports-card',
              }[module.id];
              return (
                <Card
                  key={module.id}
                  className="p-3 hover-elevate cursor-pointer"
                  onClick={() => handleModuleClick(module.id, module.screen)}
                  data-testid={`card-module-${module.id}`}
                  data-tour-id={tourId}
                >
                  <div className="flex flex-col gap-2">
                    <div className={`${getHaloClass(module.color)} w-9 h-9`}>
                      <Icon className={`w-4.5 h-4.5 ${getIconClass(module.color)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{module.title}</p>
                      <p className="text-xs text-muted-foreground">{module.subtitle}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>

          <section className="flex flex-col gap-2" data-testid="section-quick-stats" data-tour-id="tour-overview-section">
            <h2 className="text-base font-semibold">{tLabel('overview', 'Overview')}</h2>
            <div className="grid grid-cols-3 gap-2">
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('staff', 'people')}
                data-testid="card-overview-active-staff"
              >
                <p className="text-xl font-bold text-primary">{stats.activeStaff}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('activeStaff', 'Active Staff')}</p>
              </Card>
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('payables', 'payables')}
                data-testid="card-overview-payable"
              >
                <p className="text-xl font-bold text-warning">
                  {formatCurrency(stats.totalPayable, settings.currency, settings.customCurrencySymbol)}
                </p>
                <p className="text-[10px] text-muted-foreground">{tLabel('payable', 'Payable')}</p>
              </Card>
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('expenses', 'expenses')}
                data-testid="card-overview-bills-due"
              >
                <p className="text-xl font-bold text-destructive">{stats.unpaidBills}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('billsDue', 'Bills Due')}</p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
