import { useMemo, useState, useEffect, useRef } from "react";
import { Settings, Users, Calendar, Shirt, FileText, Home, ChevronDown, Check, Building2, FolderOpen, Wallet, Receipt, ArrowRightLeft, StickyNote, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { getDashboardStats, formatCurrency, formatCurrencyTotals } from "@/lib/calculations";
import { currencySymbols } from "@shared/schema";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { notifyActiveContextChange } from "@/hooks/use-active-context";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { useTour, shouldShowTour } from "@/lib/guided-tour";
import { useToast } from "@/hooks/use-toast";
import { StorageWarningBanner } from "@/components/StorageWarningBanner";
import { App } from "@capacitor/app";
import { ExitAppDialog } from "@/components/ExitAppDialog";
import { getBackupFrequency, setBackupFrequency, hasShownBackupPrompt, markBackupPromptShown } from "@/lib/auto-backup";

export function HomeScreen() {
  const { navigate, data, goBack, canGoBack } = useNavigation();
  const { tLabel } = useTranslation();
  const { toast } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { planType } = usePlanStatus();
  const { startTour } = useTour();
  const tourStartedRef = useRef(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [isEnablingBackup, setIsEnablingBackup] = useState(false);

  useEffect(() => {
    const backHandler = App.addListener("backButton", () => {
      if (canGoBack) {
        goBack();
      } else {
        setShowExitDialog(true);
      }
    });

    return () => {
      backHandler.then(handle => handle.remove());
    };
  }, [canGoBack, goBack]);

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

  // Refresh data when returning from profile settings
  useEffect(() => {
    if (data.refresh) {
      setRefreshKey((k) => k + 1);
    }
  }, [data.refresh]);

  // Show backup prompt on first visit if auto-backup is not enabled
  useEffect(() => {
    const checkBackupPrompt = () => {
      const frequency = getBackupFrequency();
      const hasShown = hasShownBackupPrompt();
      if (frequency === "off" && !hasShown) {
        // Small delay to let the screen load first
        setTimeout(() => setShowBackupPrompt(true), 1000);
      }
    };
    checkBackupPrompt();
  }, []);

  const handleEnableBackup = async () => {
    setIsEnablingBackup(true);
    try {
      await setBackupFrequency("daily");
      markBackupPromptShown();
      toast({
        title: "Auto-backup enabled",
        description: "Your first backup has been created. Daily backups will run automatically.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable auto-backup",
        variant: "destructive",
      });
    } finally {
      setIsEnablingBackup(false);
      setShowBackupPrompt(false);
    }
  };

  const handleDismissBackupPrompt = () => {
    markBackupPromptShown();
    setShowBackupPrompt(false);
  };

  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const accounts = useMemo(() => storage.getAccounts().filter(a => a.ownerType === 'HOME'), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const activeAccount = useMemo(() => accounts.find((a) => a.id === activeAccountId), [accounts, activeAccountId]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  
  const stats = useMemo(() => getDashboardStats(), [refreshKey]);
  const settings = useMemo(() => storage.getSettings(), [refreshKey]);
  const planLimit = useMemo(() => storage.checkHomePlanLimit('households'), [refreshKey, planType]);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

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

  const modulesRequiringHousehold = ['staff', 'attendance', 'laundry', 'payables'];
  const modulesRequiringStaff = ['attendance', 'laundry', 'payables'];

  const handleModuleClick = (moduleId: string, screen: string) => {
    if (modulesRequiringHousehold.includes(moduleId) && !hasHouseholds) {
      toast({
        title: tLabel('householdRequired', 'Household Required'),
        description: tLabel('pleaseAddHouseholdFirst', 'Please add a Household first.'),
        variant: "destructive",
      });
      return;
    }
    if (modulesRequiringStaff.includes(moduleId) && !hasStaff) {
      toast({
        title: tLabel('staffRequired', 'Staff Required'),
        description: tLabel('pleaseAddStaffFirst', 'Please add Staff first.'),
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
        ? `${formatCurrencyTotals(stats.unpaidLaundryByCurrency, symbol)} ${tLabel('unpaid', 'Unpaid')}`
        : tLabel('allPaid', 'All Paid'),
    },
    {
      id: 'payables',
      title: tLabel('payables', 'Payables'),
      icon: Wallet,
      color: 'warning',
      screen: 'payables' as const,
      subtitle: stats.totalPayableByCurrency.length > 0 
        ? formatCurrencyTotals(stats.totalPayableByCurrency, symbol)
        : formatCurrency(0, settings.currency, settings.customCurrencySymbol),
    },
    {
      id: 'expenses',
      title: tLabel('billsExpenses', 'Expenses'),
      icon: Receipt,
      color: 'destructive',
      screen: 'expenses' as const,
      subtitle: stats.expensesByCurrency.length > 0 
        ? formatCurrencyTotals(stats.expensesByCurrency, symbol)
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
    {
      id: 'notes',
      title: tLabel('notes', 'Notes'),
      icon: StickyNote,
      color: 'warning',
      screen: 'notes' as const,
      subtitle: tLabel('stickyNotes', 'Sticky Notes'),
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

      <header className="px-4 py-3 min-h-14 flex-shrink-0 relative z-20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-welcome">
              {tLabel("welcome", "Welcome")}, {profile?.displayName || "User"}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="group flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
                  data-testid="button-account-switcher"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[180px]">
                    {activeAccount?.name || tLabel('selectHousehold', 'Select')}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {accounts.length === 0 ? (
                  <DropdownMenuItem
                    onClick={() => navigate('households')}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Home className="w-4 h-4" />
                    <span>{tLabel('addFirstHousehold', 'Add your first household')}</span>
                  </DropdownMenuItem>
                ) : (
                  accounts.map((account) => (
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
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1">
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <StorageWarningBanner />
        <div className="px-4 pt-4 pb-20 flex flex-col gap-6">
          <section className="grid grid-cols-2 gap-3" data-testid="section-modules">
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
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => handleModuleClick(module.id, module.screen)}
                  data-testid={`card-module-${module.id}`}
                  data-tour-id={tourId}
                >
                  <div className="flex flex-col gap-3">
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

          <section className="flex flex-col gap-3" data-testid="section-quick-stats" data-tour-id="tour-overview-section">
            <h2 className="text-base font-semibold">{tLabel('overview', 'Overview')}</h2>
            <div className="grid grid-cols-3 gap-3">
              <Card 
                className="p-4 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('staff', 'people')}
                data-testid="card-overview-active-staff"
              >
                <p className="text-xl font-bold text-primary">{stats.activeStaff}</p>
                <p className="text-[10px] text-muted-foreground">{tLabel('activeStaff', 'Active Staff')}</p>
              </Card>
              <Card 
                className="p-4 text-center hover-elevate cursor-pointer"
                onClick={() => handleModuleClick('payables', 'payables')}
                data-testid="card-overview-payable"
              >
                <p className="text-xl font-bold text-warning">
                  {stats.totalPayableByCurrency.length > 0 
                    ? formatCurrencyTotals(stats.totalPayableByCurrency, symbol)
                    : formatCurrency(0, settings.currency, settings.customCurrencySymbol)}
                </p>
                <p className="text-[10px] text-muted-foreground">{tLabel('payable', 'Payable')}</p>
              </Card>
              <Card 
                className="p-4 text-center hover-elevate cursor-pointer"
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

      <ExitAppDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onExit={() => App.exitApp()}
        onStay={() => setShowExitDialog(false)}
      />

      <Dialog open={showBackupPrompt} onOpenChange={setShowBackupPrompt}>
        <DialogContent data-testid="dialog-backup-prompt">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <CloudUpload className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle>{tLabel('enableAutoBackup', 'Enable Auto-Backup')}</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              {tLabel('autoBackupDescription', 'Protect your data by enabling automatic backups. Your data will be saved to your device daily, ensuring you never lose important information.')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {tLabel('backupFeature1', 'Automatic daily backups')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {tLabel('backupFeature2', 'Data stays on your device')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                {tLabel('backupFeature3', 'Easy restore anytime')}
              </li>
            </ul>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={handleEnableBackup}
              disabled={isEnablingBackup}
              className="w-full"
              data-testid="button-enable-backup"
            >
              {isEnablingBackup ? tLabel('enablingBackup', 'Enabling...') : tLabel('enableNow', 'Enable Now')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismissBackupPrompt}
              className="w-full"
              data-testid="button-dismiss-backup"
            >
              {tLabel('notNow', 'Not Now')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
