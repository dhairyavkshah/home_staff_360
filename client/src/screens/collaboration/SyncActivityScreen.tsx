import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface SyncActivityItem {
  id: string;
  type: "incoming" | "outgoing";
  messageType: string;
  status: "pending" | "delivered" | "acknowledged" | "failed";
  timestamp: Date;
  description: string;
}

export function SyncActivityScreen() {
  const { goBack } = useNavigation();
  const { t } = useTranslation();

  const [activities, setActivities] = useState<SyncActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      setActivities([]);
    } catch (error) {
      console.error("Failed to load sync activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <Badge variant="default">{t("synced")}</Badge>;
      case "failed":
        return <Badge variant="destructive">{t("syncFailed")}</Badge>;
      case "pending":
        return <Badge variant="secondary">{t("pending")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <Clock className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{t("noSyncActivity")}</h3>
      <p className="text-muted-foreground text-center text-sm">
        Sync activity will appear here when you have linked accounts
      </p>
    </div>
  );

  const renderActivityItem = (activity: SyncActivityItem) => (
    <Card key={activity.id} className="p-4" data-testid={`card-activity-${activity.id}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          activity.type === "incoming" 
            ? "bg-blue-100 dark:bg-blue-900/30" 
            : "bg-green-100 dark:bg-green-900/30"
        }`}>
          {activity.type === "incoming" ? (
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium truncate">{activity.description}</p>
            {getStatusBadge(activity.status)}
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {getStatusIcon(activity.status)}
            <span>{activity.timestamp.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <AppLayout>
      <Header
        title={t("syncActivity")}
        onBack={goBack}
      />
      <ScrollContent>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t("recentSync")}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadActivities}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-3">
              {activities.map(renderActivityItem)}
            </div>
          )}
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
