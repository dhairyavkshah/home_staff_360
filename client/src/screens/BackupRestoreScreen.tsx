import { useState, useEffect } from "react";
import { Database, Check, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/storage";
import { listLocalBackups, loadLocalBackup } from "@/lib/auto-backup";

type ScreenState = "checking" | "no-backup" | "backup-found" | "restoring";

export function BackupRestoreScreen() {
  const { navigate, data } = useNavigation();
  const { toast } = useToast();
  const [screenState, setScreenState] = useState<ScreenState>("checking");
  const [backupInfo, setBackupInfo] = useState<{ name: string; date: Date } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    checkForBackups();
  }, []);

  useEffect(() => {
    if (screenState === "no-backup") {
      const timer = setTimeout(() => {
        navigate("role-selection");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screenState, navigate]);

  const checkForBackups = async () => {
    try {
      const backups = await listLocalBackups();
      if (backups.length > 0) {
        setBackupInfo(backups[0]);
        setScreenState("backup-found");
      } else {
        setScreenState("no-backup");
      }
    } catch (error) {
      console.error("Error checking for backups:", error);
      setScreenState("no-backup");
    }
  };

  const handleRestore = async () => {
    if (!backupInfo) return;

    setIsRestoring(true);
    setScreenState("restoring");

    try {
      const backupData = await loadLocalBackup(backupInfo.name);
      if (!backupData) {
        throw new Error("Failed to load backup file");
      }

      const parsed = JSON.parse(backupData);
      const result = storage.importBackup(parsed, "replace");

      if (!result.success) {
        throw new Error(result.error || "Failed to import backup");
      }

      const settings = storage.getSettings();
      storage.saveSettings({
        ...settings,
        hasCompletedOnboarding: true,
      });

      toast({
        title: "Data restored successfully",
        description: "Your data has been restored from the backup.",
      });

      const defaultMode = settings.defaultAppMode || "HOME";
      if (defaultMode === "STAFF") {
        navigate("staff-home");
      } else {
        navigate("home");
      }
    } catch (error) {
      console.error("Restore failed:", error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
      setIsRestoring(false);
      setScreenState("backup-found");
    }
  };

  const handleStartFresh = () => {
    navigate("role-selection");
  };

  const formatBackupDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppLayout data-testid="screen-backup-restore">
      <Header title="Backup Check" />

      <ScrollContent className="flex flex-col items-center justify-center p-4">
        {screenState === "checking" && (
          <Card className="w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Checking for backups...</h2>
              <p className="text-sm text-muted-foreground">
                Looking for any saved data
              </p>
            </div>
          </Card>
        )}

        {screenState === "no-backup" && (
          <Card className="w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Database className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">No backup found</h2>
              <p className="text-sm text-muted-foreground">
                Proceeding with setup...
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting</span>
            </div>
          </Card>
        )}

        {screenState === "backup-found" && backupInfo && (
          <Card className="w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Database className="w-8 h-8 text-success" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Backup Found</h2>
              <p className="text-sm text-muted-foreground">
                A local backup from {formatBackupDate(backupInfo.date)} was found.
              </p>
            </div>
            <p className="text-sm font-medium">
              Would you like to restore your data?
            </p>
            <div className="flex flex-col w-full gap-3 mt-2">
              <Button
                onClick={handleRestore}
                disabled={isRestoring}
                data-testid="button-restore-data"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restore Data
              </Button>
              <Button
                variant="outline"
                onClick={handleStartFresh}
                disabled={isRestoring}
                data-testid="button-start-fresh"
              >
                Start Fresh
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {screenState === "restoring" && (
          <Card className="w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Restoring your data...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we restore your data
              </p>
            </div>
          </Card>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
