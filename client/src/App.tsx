import { useState, useEffect } from "react";
import { Router, Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { NavigationProvider, useNavigation } from "@/lib/navigation";
import { DirtyTrackingProvider } from "@/lib/dirty-tracking";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { GuidedTourProvider } from "@/lib/guided-tour";
import { SafeAreaProvider } from "@/lib/safe-area-provider";
import { storage } from "@/lib/storage";
import { initializeAutoBackup } from "@/lib/auto-backup";
import "@/lib/demo-data";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminAds from "@/pages/admin/AdminAds";
import AdminManagement from "@/pages/admin/AdminManagement";
import AdminBackups from "@/pages/admin/AdminBackups";
import AdminRolesPage from "@/pages/admin/AdminRolesPage";
import AdminTeamPage from "@/pages/admin/AdminTeamPage";
import AdminMaintenance from "@/pages/admin/AdminMaintenance";

import { SplashScreen } from "@/screens/SplashScreen";
import { LauncherScreen } from "@/screens/LauncherScreen";
import { PermissionsScreen } from "@/screens/PermissionsScreen";
import { RoleSelectionScreen } from "@/screens/RoleSelectionScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { PinSetupScreen } from "@/screens/PinSetupScreen";
import { PinEntryScreen } from "@/screens/PinEntryScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { PeopleScreen } from "@/screens/PeopleScreen";
import { AddPersonScreen } from "@/screens/AddPersonScreen";
import { PersonDetailScreen } from "@/screens/PersonDetailScreen";
import { PersonCalendarScreen } from "@/screens/PersonCalendarScreen";
import { AttendanceScreen } from "@/screens/AttendanceScreen";
import { AddAttendanceScreen } from "@/screens/AddAttendanceScreen";
import { AddTransactionScreen } from "@/screens/AddTransactionScreen";
import { AddLaundryScreen } from "@/screens/AddLaundryScreen";
import { LaundryViewScreen } from "@/screens/LaundryViewScreen";
import { ExpensesScreen } from "@/screens/ExpensesScreen";
import { AddExpenseScreen } from "@/screens/AddExpenseScreen";
import { ExpenseCalendarScreen } from "@/screens/ExpenseCalendarScreen";
import { ReportsScreen } from "@/screens/ReportsScreen";
import { ReportPreviewScreen } from "@/screens/ReportPreviewScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { SupportDeveloperScreen } from "@/screens/SupportDeveloperScreen";
import { BackupScreen } from "@/screens/BackupScreen";
import { PayablesScreen } from "@/screens/PayablesScreen";
import { DocumentsScreen } from "@/screens/DocumentsScreen";
import { HouseholdsScreen } from "@/screens/HouseholdsScreen";
import { TransactionsScreen } from "@/screens/TransactionsScreen";

import { StaffHomeScreen } from "@/screens/staff/StaffHomeScreen";
import { StaffDocumentsScreen } from "@/screens/staff/StaffDocumentsScreen";
import { BusinessesScreen } from "@/screens/staff/BusinessesScreen";
import { StaffLaundryScreen } from "@/screens/staff/StaffLaundryScreen";
import { StaffLogAttendanceScreen } from "@/screens/staff/StaffLogAttendanceScreen";
import { StaffAttendanceScreen } from "@/screens/staff/StaffAttendanceScreen";
import { StaffEarningsScreen } from "@/screens/staff/StaffEarningsScreen";
import { StaffClientHomesScreen } from "@/screens/staff/StaffClientHomesScreen";
import { StaffAddClientHomeScreen } from "@/screens/staff/StaffAddClientHomeScreen";
import { StaffLogLaundryScreen } from "@/screens/staff/StaffLogLaundryScreen";
import { StaffReportsScreen } from "@/screens/staff/StaffReportsScreen";
import { StaffExpensesScreen } from "@/screens/staff/StaffExpensesScreen";
import { StaffAddExpenseScreen } from "@/screens/staff/StaffAddExpenseScreen";
import { StaffInvoicesScreen } from "@/screens/staff/StaffInvoicesScreen";
import { StaffAddInvoiceScreen } from "@/screens/staff/StaffAddInvoiceScreen";
import { StaffInvoiceViewScreen } from "@/screens/staff/StaffInvoiceViewScreen";

import { PhoneVerificationScreen } from "@/screens/collaboration/PhoneVerificationScreen";
import { CollaborationHubScreen } from "@/screens/collaboration/CollaborationHubScreen";
import { LinkAccountScreen } from "@/screens/collaboration/LinkAccountScreen";
import { SyncActivityScreen } from "@/screens/collaboration/SyncActivityScreen";
import { NotificationCenterScreen } from "@/screens/collaboration/NotificationCenterScreen";
import { ApprovalDetailScreen } from "@/screens/collaboration/ApprovalDetailScreen";
import { ChatScreen } from "@/screens/collaboration/ChatScreen";
import { AuthScreen } from "@/screens/auth/AuthScreen";
import { ProfileSettingsScreen } from "@/screens/ProfileSettingsScreen";
import { AdOverlay } from "@/components/AdOverlay";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { useAds } from "@/hooks/useAds";
import { useDonationReminder } from "@/hooks/useDonationReminder";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Heart } from "lucide-react";

function MobileAppRouter() {
  const { currentScreen } = useNavigation();

  switch (currentScreen) {
    case "launcher":
      return <LauncherScreen />;
    case "permissions":
      return <PermissionsScreen />;
    case "role-selection":
      return <RoleSelectionScreen />;
    case "onboarding":
      return <OnboardingScreen />;
    case "pin-setup":
      return <PinSetupScreen />;
    case "pin-entry":
      return <PinEntryScreen />;
    case "home":
      return <HomeScreen />;
    case "households":
    case "add-household":
      return <HouseholdsScreen />;
    case "documents":
      return <DocumentsScreen />;
    case "people":
      return <PeopleScreen />;
    case "add-person":
      return <AddPersonScreen />;
    case "person-detail":
      return <PersonDetailScreen />;
    case "person-calendar":
      return <PersonCalendarScreen />;
    case "attendance":
      return <AttendanceScreen />;
    case "add-attendance":
      return <AddAttendanceScreen />;
    case "add-transaction":
      return <AddTransactionScreen />;
    case "transactions":
      return <TransactionsScreen />;
    case "add-laundry":
      return <AddLaundryScreen />;
    case "laundry-view":
      return <LaundryViewScreen />;
    case "payables":
      return <PayablesScreen />;
    case "expenses":
      return <ExpensesScreen />;
    case "add-expense":
      return <AddExpenseScreen />;
    case "expense-calendar":
      return <ExpenseCalendarScreen />;
    case "reports":
      return <ReportsScreen />;
    case "report-preview":
      return <ReportPreviewScreen />;
    case "settings":
      return <SettingsScreen />;
    case "support-developer":
      return <SupportDeveloperScreen />;
    case "backup":
      return <BackupScreen />;
    case "staff-home":
      return <StaffHomeScreen />;
    case "businesses":
    case "add-business":
      return <BusinessesScreen />;
    case "staff-documents":
      return <StaffDocumentsScreen />;
    case "staff-invoices":
      return <StaffInvoicesScreen />;
    case "staff-add-invoice":
      return <StaffAddInvoiceScreen />;
    case "staff-invoice-view":
      return <StaffInvoiceViewScreen />;
    case "staff-log-attendance":
      return <StaffLogAttendanceScreen />;
    case "staff-attendance":
      return <StaffAttendanceScreen />;
    case "staff-earnings":
      return <StaffEarningsScreen />;
    case "staff-client-homes":
      return <StaffClientHomesScreen />;
    case "staff-add-client-home":
    case "staff-edit-client-home":
    case "staff-client-detail":
      return <StaffAddClientHomeScreen />;
    case "staff-log-laundry":
    case "staff-edit-laundry":
      return <StaffLogLaundryScreen />;
    case "staff-laundry":
      return <StaffLaundryScreen />;
    case "staff-edit-attendance":
      return <StaffLogAttendanceScreen />;
    case "staff-reports":
      return <StaffReportsScreen />;
    case "staff-expenses":
      return <StaffExpensesScreen />;
    case "staff-add-expense":
      return <StaffAddExpenseScreen />;
    case "phone-verification":
      return <PhoneVerificationScreen />;
    case "collaboration-hub":
      return <CollaborationHubScreen />;
    case "link-account":
      return <LinkAccountScreen />;
    case "sync-activity":
      return <SyncActivityScreen />;
    case "notification-center":
      return <NotificationCenterScreen />;
    case "approval-detail":
      return <ApprovalDetailScreen />;
    case "chat":
      return <ChatScreen />;
    case "auth":
      return <AuthScreen />;
    case "profile-settings":
      return <ProfileSettingsScreen />;
    default:
      return <LauncherScreen />;
  }
}

function AdManager() {
  const { currentAd, dismissAd } = useAds();

  if (!currentAd) return null;

  return <AdOverlay ad={currentAd} onClose={dismissAd} />;
}

function DonationReminderDialog() {
  const { shouldShowReminder, dismissReminder } = useDonationReminder();
  const { t } = useTranslation();
  const { navigate } = useNavigation();

  const handleSupport = () => {
    dismissReminder();
    navigate("support-developer");
  };

  return (
    <AlertDialog open={shouldShowReminder} onOpenChange={(open) => !open && dismissReminder()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <AlertDialogTitle>{t("donationReminderTitle")}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {t("donationReminderMessage")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-dismiss-reminder">{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleSupport} data-testid="button-support-now">
            {t("supportTheDeveloper")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MobileAppWithSplash() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    storage.initializePlan();
    initializeAutoBackup();
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <NavigationProvider>
      <DirtyTrackingProvider>
        <GuidedTourProvider>
          <MaintenanceBanner />
          <MobileAppRouter />
          <AdManager />
          <DonationReminderDialog />
          <Toaster />
        </GuidedTourProvider>
      </DirtyTrackingProvider>
    </NavigationProvider>
  );
}

function AdminApp() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="homestaff360-admin-theme">
      <TooltipProvider>
        <Switch>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/ads" component={AdminAds} />
          <Route path="/admin/admins" component={AdminManagement} />
          <Route path="/admin/backups" component={AdminBackups} />
          <Route path="/admin/maintenance" component={AdminMaintenance} />
          <Route path="/admin/roles" component={AdminRolesPage} />
          <Route path="/admin/team" component={AdminTeamPage} />
          <Route path="/admin" component={AdminLogin} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider defaultTheme="light" storageKey="homestaff360-theme">
        <I18nProvider>
          <TooltipProvider>
            <MobileAppWithSplash />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
