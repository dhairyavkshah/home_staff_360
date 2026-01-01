import { Home, Users, Calendar, FileText, Settings, Building2, Wallet } from "lucide-react";
import { useNavigation, type Screen } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface TabItem {
  screen: Screen;
  icon: typeof Home;
  label: string;
}

interface BottomTabBarProps {
  mode: "home" | "staff";
}

export function BottomTabBar({ mode }: BottomTabBarProps) {
  const { currentScreen, navigate } = useNavigation();

  const homeTabs: TabItem[] = [
    { screen: "home", icon: Home, label: "Home" },
    { screen: "people", icon: Users, label: "People" },
    { screen: "attendance", icon: Calendar, label: "Attendance" },
    { screen: "reports", icon: FileText, label: "Reports" },
    { screen: "settings", icon: Settings, label: "Settings" },
  ];

  const staffTabs: TabItem[] = [
    { screen: "staff-home", icon: Home, label: "Home" },
    { screen: "staff-client-homes", icon: Building2, label: "Clients" },
    { screen: "staff-attendance", icon: Calendar, label: "Attendance" },
    { screen: "staff-earnings", icon: Wallet, label: "Earnings" },
    { screen: "settings", icon: Settings, label: "Settings" },
  ];

  const tabs = mode === "home" ? homeTabs : staffTabs;

  const isTabActive = (tabScreen: Screen) => {
    return currentScreen === tabScreen;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 z-50" data-testid="bottom-tab-bar">
      <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const isActive = isTabActive(tab.screen);
            const Icon = tab.icon;
            return (
              <button
                key={tab.screen}
                onClick={() => navigate(tab.screen)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`tab-${tab.screen}`}
              >
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className={cn("text-xs", isActive && "font-medium")}>
                  {tab.label}
                </span>
              </button>
            );
          })}
      </div>
      <div className="safe-area-bottom" />
    </nav>
  );
}
