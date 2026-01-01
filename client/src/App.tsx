import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { NavigationProvider, useNavigation } from "@/lib/navigation";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { GuidedTourProvider } from "@/lib/guided-tour";
import { storage } from "@/lib/storage";

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
import { SettingsScreen } from "@/screens/SettingsScreen";
import { DonationScreen } from "@/screens/DonationScreen";
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
    case "settings":
      return <SettingsScreen />;
    case "donate":
      return <DonationScreen />;
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
    default:
      return <LauncherScreen />;
  }
}

function MobileAppWithSplash() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    storage.initializeTrial();
    storage.updateTrialStatusIfExpired();
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <NavigationProvider>
      <GuidedTourProvider>
        <MobileAppRouter />
        <Toaster />
      </GuidedTourProvider>
    </NavigationProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="homestaff360-theme">
      <I18nProvider>
        <TooltipProvider>
          <MobileAppWithSplash />
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;
