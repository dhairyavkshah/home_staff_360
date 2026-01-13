import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { storage } from "@/lib/storage";

export type Screen =
  | "launcher"
  | "permissions"
  | "role-selection"
  | "onboarding"
  | "pin-entry"
  | "pin-setup"
  | "home"
  | "households"
  | "add-household"
  | "people"
  | "add-person"
  | "person-detail"
  | "person-calendar"
  | "attendance"
  | "add-attendance"
  | "add-transaction"
  | "transactions"
  | "add-laundry"
  | "laundry-view"
  | "payables"
  | "expenses"
  | "add-expense"
  | "expense-calendar"
  | "reports"
  | "export"
  | "backup"
  | "settings"
  | "documents"
  | "staff-home"
  | "businesses"
  | "add-business"
  | "staff-log-attendance"
  | "staff-attendance"
  | "staff-earnings"
  | "staff-client-homes"
  | "staff-add-client-home"
  | "staff-edit-client-home"
  | "staff-client-detail"
  | "staff-log-laundry"
  | "staff-laundry"
  | "staff-edit-laundry"
  | "staff-edit-attendance"
  | "staff-reports"
  | "staff-expenses"
  | "staff-add-expense"
  | "staff-documents"
  | "staff-invoices"
  | "staff-add-invoice"
  | "staff-invoice-view"
  | "report-preview"
  | "feedback"
  | "phone-verification"
  | "collaboration-hub"
  | "link-account"
  | "sync-activity"
  | "notification-center"
  | "approval-detail"
  | "chat"
  | "messages-list"
  | "auth"
  | "set-password"
  | "profile-settings"
  | "subscription"
  | "privacy-policy"
  | "notes";

interface NavigationData {
  personId?: string;
  date?: string;
  expenseId?: string;
  editMode?: boolean;
  clientHomeId?: string;
  presetAmount?: number;
  defaultDescription?: string;
  defaultCategory?: string;
  source?: "attendance" | "payables" | "quick-pay" | "person-detail";
  transactionId?: string;
  laundryId?: string;
  attendanceId?: string;
  userType?: string;
  invoiceId?: string;
  reportType?: string;
  reportTitle?: string;
  reportData?: unknown;
  // Approval detail screen params
  entityType?: "attendance" | "laundry";
  entityId?: string;
  notificationType?: string;
  chatId?: string;
  connectionId?: string;
  [key: string]: unknown;
}

interface NavigationState {
  screen: Screen;
  data: NavigationData;
  history: Array<{ screen: Screen; data: NavigationData }>;
}

interface NavigationContextType {
  currentScreen: Screen;
  data: NavigationData;
  navigate: (screen: Screen, data?: NavigationData) => void;
  goBack: () => void;
  canGoBack: boolean;
  clearHistory: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavigationState>({
    screen: "launcher",
    data: {},
    history: [],
  });

  const screensToExcludeFromHistory: Screen[] = [
    "launcher", "auth", "role-selection", "permissions", "onboarding", "pin-setup", "pin-entry", "set-password"
  ];

  const homeScreens: Screen[] = ["home", "staff-home"];

  const navigate = useCallback((screen: Screen, data: NavigationData = {}) => {
    setState((prev) => {
      if (homeScreens.includes(screen)) {
        return { screen, data, history: [] };
      }
      
      if (screensToExcludeFromHistory.includes(prev.screen)) {
        return { screen, data, history: prev.history };
      }
      
      return {
        screen,
        data,
        history: [...prev.history, { screen: prev.screen, data: prev.data }],
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) {
        const settings = storage.getSettings();
        const profile = storage.getProfile();
        const defaultMode = settings.defaultAppMode || profile?.type || "HOME";
        const defaultScreen = defaultMode === "STAFF" ? "staff-home" : "home";
        return { screen: defaultScreen, data: {}, history: [] };
      }
      const history = [...prev.history];
      const last = history.pop()!;
      return { screen: last.screen, data: last.data, history };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, history: [] }));
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen: state.screen,
        data: state.data,
        navigate,
        goBack,
        canGoBack: state.history.length > 0,
        clearHistory,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export function useNavigationData<T extends NavigationData>(): T {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigationData must be used within a NavigationProvider");
  }
  return context.data as T;
}
