import { useState, useEffect } from "react";
import { AlertTriangle, Wrench, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MaintenanceStatus {
  isActive: boolean;
  session?: {
    id: number;
    windowId: number;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
    startedAt: string;
    expectedEndAt?: string;
    forceLogoutEnabled: boolean;
  };
}

export function MaintenanceBanner() {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance/status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
          
          if (data.isActive && data.session?.forceLogoutEnabled) {
            handleForceLogout();
          }
        }
      } catch (error) {
        console.error("Failed to check maintenance status:", error);
      }
    };

    checkMaintenanceStatus();

    const interval = setInterval(checkMaintenanceStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleForceLogout = () => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("serverUser");
      window.location.reload();
    }
  };

  if (!status?.isActive || dismissed || !status.session) {
    return null;
  }

  const { session } = status;

  const getSeverityStyles = () => {
    switch (session.severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "warning":
        return "bg-yellow-500 dark:bg-yellow-600 text-white";
      default:
        return "bg-blue-500 dark:bg-blue-600 text-white";
    }
  };

  const getSeverityIcon = () => {
    switch (session.severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4" />;
      case "warning":
        return <Wrench className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatExpectedEnd = () => {
    if (!session.expectedEndAt) return null;
    const endDate = new Date(session.expectedEndAt);
    return endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const canDismiss = session.severity !== "critical";

  return (
    <div
      className={`${getSeverityStyles()} px-4 py-2 flex items-center justify-between gap-2 z-50`}
      data-testid="maintenance-banner"
    >
      <div className="flex items-center gap-2 flex-1">
        {getSeverityIcon()}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-medium text-sm">{session.title}</span>
          <span className="text-xs opacity-90">{session.message}</span>
          {formatExpectedEnd() && (
            <span className="text-xs opacity-75">
              Expected end: {formatExpectedEnd()}
            </span>
          )}
        </div>
      </div>
      {canDismiss && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="text-inherit opacity-75"
          data-testid="button-dismiss-maintenance"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
