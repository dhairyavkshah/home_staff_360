import { useState, useEffect, useRef } from "react";
import { Database, Loader2, ArrowRight, RefreshCw, FolderOpen } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkForBackups();
  }, []);

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

  const restoreFromData = async (backupData: string, sourceName: string) => {
    setIsRestoring(true);
    setScreenState("restoring");

    try {
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
        description: `Your data has been restored from ${sourceName}.`,
        variant: "success",
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
      setScreenState(backupInfo ? "backup-found" : "no-backup");
    }
  };

  const handleRestore = async () => {
    if (!backupInfo) return;

    try {
      const backupData = await loadLocalBackup(backupInfo.name);
      if (!backupData) {
        throw new Error("Failed to load backup file");
      }
      await restoreFromData(backupData, "the backup");
    } catch (error) {
      console.error("Restore failed:", error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      });
    }
  };

  const handleBrowseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".hs360")) {
      toast({
        title: "Invalid file",
        description: "Please select a valid .hs360 backup file.",
        variant: "destructive",
      });
      // Clear the input so user can retry with same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (content) {
          await restoreFromData(content, file.name);
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Could not read the selected file.",
          variant: "destructive",
        });
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("File read error:", error);
      toast({
        title: "Error",
        description: "Failed to read the backup file.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartFresh = () => {
    // If userType was passed from permissions (user already selected their role),
    // go directly to onboarding. Otherwise, go to role selection.
    const userType = data.userType;
    if (userType) {
      navigate("onboarding", { userType });
    } else {
      navigate("role-selection");
    }
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".hs360"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        data-testid="input-file-picker"
      />

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
                No automatic backup was detected. You can browse for a backup file or start fresh.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3 mt-2">
              <Button
                variant="outline"
                onClick={handleBrowseFile}
                disabled={isRestoring}
                data-testid="button-browse-backup"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse for Backup
              </Button>
              <Button
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

        {screenState === "backup-found" && backupInfo && (
          <Card className="w-full max-w-sm p-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
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
                onClick={handleBrowseFile}
                disabled={isRestoring}
                data-testid="button-browse-backup"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse for Different Backup
              </Button>
              <Button
                variant="ghost"
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
