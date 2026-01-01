import { useMemo, useState, useEffect, useRef } from "react";
import { Calendar, ClipboardList, Building2, Settings, Shirt, Briefcase, ChevronDown, Check, Users, FolderOpen, Receipt, FileText } from "lucide-react";
import { getCurrencyIcon } from "@/lib/calculations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { currencySymbols } from "@shared/schema";
import { notifyActiveContextChange } from "@/hooks/use-active-context";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { useTour, shouldShowTour } from "@/lib/guided-tour";
import { useToast } from "@/hooks/use-toast";
import { StorageWarningBanner } from "@/components/StorageWarningBanner";

export function StaffHomeScreen() {
  const { navigate, data } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { planType } = usePlanStatus();
  const { startTour } = useTour();
  const tourStartedRef = useRef(false);

  useEffect(() => {
    if (tourStartedRef.current) return;
    if (data.startTour && data.tourMode === "STAFF") {
      tourStartedRef.current = true;
      setTimeout(() => startTour("STAFF"), 500);
    } else if (shouldShowTour("STAFF")) {
      tourStartedRef.current = true;
      setTimeout(() => startTour("STAFF"), 500);
    }
  }, [data.startTour, data.tourMode, startTour]);

  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const accounts = useMemo(() => storage.getAccounts().filter(a => a.ownerType === 'STAFF'), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const activeAccount = useMemo(() => accounts.find((a) => a.id === activeAccountId), [accounts, activeAccountId]);
  const settings = useMemo(() => storage.getSettings(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const planLimit = useMemo(() => storage.checkStaffPlanLimit('businesses'), [refreshKey, planType]);
  
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getActiveClientHomesByAccount(activeAccountId);
    }
    return storage.getActiveClientHomes();
  }, [refreshKey, showAllContexts, activeAccountId]);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];
  const CurrencyIcon = getCurrencyIcon(settings.currency);

  const hasBusinesses = accounts.length > 0;
  const hasClients = clientHomes.length > 0;

  const modulesRequiringBusiness = ['clients', 'attendance', 'laundry', 'expenses', 'reports', 'documents', 'invoices'];
  const modulesRequiringClient = ['attendance', 'laundry', 'expenses', 'reports', 'invoices'];
  
  const isLaundryBusiness = useMemo(() => {
    if (showAllContexts) {
      return accounts.some(a => a.profession === 'Laundry Service');
    }
    return activeAccount?.profession === 'Laundry Service';
  }, [accounts, activeAccount, showAllContexts]);

  const handleModuleClick = (moduleId: string, screen: string) => {
    if (modulesRequiringBusiness.includes(moduleId) && !hasBusinesses) {
      toast({
        title: "Business Required",
        description: "Please add a Business first.",
        variant: "destructive",
      });
      return;
    }
    if (modulesRequiringClient.includes(moduleId) && !hasClients) {
      toast({
        title: "Client Required",
        description: "Please add a Client first.",
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

  const now = new Date();
  const todayAttendance = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = !showAllContexts && activeAccountId
      ? storage.getSelfAttendanceByAccount(activeAccountId).filter(a => a.date === today)
      : storage.getSelfAttendanceByDate(today);
    return attendance.length;
  }, [refreshKey, showAllContexts, activeAccountId]);

  const thisMonthAttendance = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const allAttendance = !showAllContexts && activeAccountId
      ? storage.getSelfAttendanceByAccount(activeAccountId)
      : storage.getSelfAttendance();
    return allAttendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === month && date.getFullYear() === year;
    }).length;
  }, [refreshKey, showAllContexts, activeAccountId]);

  const activeClientHomesCount = useMemo(() => {
    return clientHomes.filter(h => h.isActive).length;
  }, [clientHomes]);

  const earnings = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const allEarnings = !showAllContexts && activeAccountId
      ? storage.getStaffEarningsByAccount(activeAccountId)
      : storage.getStaffEarnings();
    const laundryJobs = !showAllContexts && activeAccountId
      ? storage.getStaffLaundryJobsByAccount(activeAccountId)
      : storage.getStaffLaundryJobs();
    
    const monthlyEarnings = allEarnings.filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    
    const monthlyLaundry = laundryJobs.filter(j => {
      const date = new Date(j.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
    
    const fromLaundry = monthlyLaundry.reduce((sum, j) => sum + j.totalEarned, 0);
    const fromOther = monthlyEarnings.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      total: fromLaundry + fromOther,
      fromLaundry,
    };
  }, [refreshKey, showAllContexts, activeAccountId]);

  const staffExpenses = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    const expenses = !showAllContexts && activeAccountId
      ? storage.getStaffExpensesByAccount(activeAccountId)
      : storage.getStaffExpenses();
    return expenses.filter(e => {
      const date = new Date(e.createdAt);
      return date.getMonth() === month && date.getFullYear() === year;
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [refreshKey, showAllContexts, activeAccountId]);

  const allModules = [
    {
      id: 'businesses',
      title: tLabel('businesses', 'Businesses'),
      icon: Briefcase,
      color: 'primary',
      screen: 'businesses' as const,
      subtitle: `${planLimit.current}/${planLimit.max}`,
    },
    {
      id: 'clients',
      title: tLabel('clients', 'Clients'),
      icon: Users,
      color: 'success',
      screen: 'staff-client-homes' as const,
      subtitle: `${clientHomes.length} ${tLabel('active', 'Active')}`,
    },
    {
      id: 'attendance',
      title: tLabel('attendance', 'Attendance'),
      icon: Calendar,
      color: 'warning',
      screen: 'staff-log-attendance' as const,
      subtitle: `${todayAttendance} ${tLabel('today', 'Today')}`,
    },
    {
      id: 'laundry',
      title: tLabel('laundry', 'Laundry'),
      icon: Shirt,
      color: 'info',
      screen: 'staff-laundry' as const,
      subtitle: `${symbol}${earnings.fromLaundry.toLocaleString()}`,
    },
    {
      id: 'expenses',
      title: tLabel('expenses', 'Expenses'),
      icon: Receipt,
      color: 'destructive',
      screen: 'staff-expenses' as const,
      subtitle: `${symbol}${staffExpenses.toLocaleString()}`,
    },
    {
      id: 'reports',
      title: tLabel('reports', 'Reports'),
      icon: ClipboardList,
      color: 'muted',
      screen: 'staff-reports' as const,
      subtitle: `${symbol}${earnings.total.toLocaleString()}`,
    },
    {
      id: 'documents',
      title: tLabel('documents', 'Documents'),
      icon: FolderOpen,
      color: 'muted',
      screen: 'staff-documents' as const,
      subtitle: tLabel('storeFiles', 'Store Files'),
    },
    {
      id: 'invoices',
      title: tLabel('invoices', 'Invoices'),
      icon: FileText,
      color: 'primary',
      screen: 'staff-invoices' as const,
      subtitle: tLabel('billClients', 'Bill Clients'),
    },
  ];
  
  const modules = isLaundryBusiness ? allModules : allModules.filter(m => m.id !== 'laundry');

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
    <div className="h-screen flex flex-col bg-background" data-testid="screen-staff-home" data-tour-id="tour-dashboard">
      <div className="safe-area-top" />

      <header className="content-container py-3 min-h-14 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-welcome">
              {tLabel("welcome", "Welcome")}, {profile?.displayName || "Staff"}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-account-switcher"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">
                    {activeAccount?.name || tLabel('selectBusiness', 'Select')}
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
                    <Briefcase className="w-4 h-4" />
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
        <div className="content-container pb-20 flex flex-col gap-4">
          <section className="grid grid-cols-2 gap-2" data-testid="section-modules">
            {modules.map((module) => {
              const Icon = module.icon;
              const tourId = {
                clients: 'tour-clients-card',
                attendance: 'tour-attendance-card',
                earnings: 'tour-earnings-card',
                expenses: 'tour-expenses-card',
                laundry: 'tour-laundry-card',
                invoices: 'tour-invoices-card',
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
                onClick={() => handleModuleClick('clients', 'staff-client-homes')}
                data-testid="card-overview-active-clients"
              >
                <p className="text-xl font-bold text-primary">{activeClientHomesCount}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('activeClientHomes', 'Active Clients')}</p>
              </Card>
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('attendance', 'staff-log-attendance')}
                data-testid="card-overview-today-attendance"
              >
                <p className="text-xl font-bold text-warning">{todayAttendance}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('todayAttendance', "Today's Attendance")}</p>
              </Card>
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('attendance', 'staff-attendance')}
                data-testid="card-overview-month-attendance"
              >
                <p className="text-xl font-bold text-info">{thisMonthAttendance}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('thisMonthAttendance', 'This Month')}</p>
              </Card>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('reports', 'staff-reports')}
                data-testid="card-overview-wage-earnings"
              >
                <p className="text-xl font-bold text-success">{symbol}{(earnings.total - earnings.fromLaundry).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('thisMonthWageEarnings', 'Wage/Salary')}</p>
              </Card>
              <Card 
                className="p-2.5 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('laundry', 'staff-laundry')}
                data-testid="card-overview-laundry-earnings"
              >
                <p className="text-xl font-bold text-info">{symbol}{earnings.fromLaundry.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('thisMonthLaundryEarnings', 'Laundry Jobs')}</p>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
