import { useState, useMemo, useEffect } from "react";
import { Download, Share2, Trash2, FolderOpen, Check, Save } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { backupDataSchema, type BackupData, type BackupFrequency } from "@shared/schema";
import {
  getBackupFrequency,
  setBackupFrequency,
  getBackupConsent,
  setBackupConsent,
  formatLastBackupTime,
  formatNextBackupTime,
  performAutoBackup,
  listLocalBackups,
  loadLocalBackup,
  deleteLocalBackup,
  deleteExistingBackup,
  BACKUP_FILENAME,
} from "@/lib/auto-backup";

// Helper to check if running on native platform using window-based detection
function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function BackupScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const profile = useMemo(() => storage.getProfile(), []);
  const isNative = isNativePlatform();

  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [backupFrequency, setBackupFrequencyState] = useState<BackupFrequency>(getBackupFrequency());
  const [pendingFrequency, setPendingFrequency] = useState<BackupFrequency | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState(formatLastBackupTime());
  const [nextBackupTime, setNextBackupTime] = useState(formatNextBackupTime());
  const [localBackups, setLocalBackups] = useState<Array<{ name: string; date: Date }>>([]);
  const [showLocalBackups, setShowLocalBackups] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [showActiveStatus, setShowActiveStatus] = useState(getBackupFrequency() !== "off" && getBackupConsent());
  const [backgroundConsent, setBackgroundConsentState] = useState(getBackupConsent());
  const [pendingConsent, setPendingConsent] = useState<boolean | null>(null);

  useEffect(() => {
    loadBackupsList();
  }, []);

  const loadBackupsList = async () => {
    setIsLoadingBackups(true);
    const backups = await listLocalBackups();
    setLocalBackups(backups);
    setIsLoadingBackups(false);
  };

  const handleFrequencyChange = (value: BackupFrequency) => {
    setPendingFrequency(value);
  };

  const handleSaveSettings = () => {
    const frequencyToSave = pendingFrequency ?? backupFrequency;
    const consentToSave = pendingConsent ?? backgroundConsent;
    
    setBackupFrequency(frequencyToSave);
    setBackupFrequencyState(frequencyToSave);
    setPendingFrequency(null);
    
    setBackupConsent(consentToSave);
    setBackgroundConsentState(consentToSave);
    setPendingConsent(null);
    
    setNextBackupTime(formatNextBackupTime());
    setShowActiveStatus(frequencyToSave !== "off" && consentToSave);
    
    toast({
      title: t("success"),
      description: frequencyToSave === "off" 
        ? t("autoBackupDisabled") 
        : t("autoBackupSettingsSaved"),
    });
  };

  const handleConsentChange = (checked: boolean) => {
    setPendingConsent(checked);
  };

  const hasUnsavedChanges = (pendingFrequency !== null && pendingFrequency !== backupFrequency) ||
    (pendingConsent !== null && pendingConsent !== backgroundConsent);
  const displayFrequency = pendingFrequency ?? backupFrequency;

  const getFrequencyLabel = (freq: BackupFrequency) => {
    switch (freq) {
      case "daily": return t("backupDaily");
      case "weekly": return t("backupWeekly");
      case "monthly": return t("backupMonthly");
      default: return "";
    }
  };

  const handleManualBackup = async () => {
    setIsExporting(true);
    try {
      const result = await performAutoBackup();
      if (result.success) {
        setLastBackupTime(formatLastBackupTime());
        setNextBackupTime(formatNextBackupTime());
        await loadBackupsList();
        
        const backup = storage.exportBackup();
        const json = JSON.stringify(backup, null, 2);
        const filename = BACKUP_FILENAME;

        if (isNative) {
          try {
            const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
            await Filesystem.writeFile({
              path: filename,
              data: json,
              directory: Directory.Cache,
              encoding: Encoding.UTF8,
            });

            const uriResult = await Filesystem.getUri({
              directory: Directory.Cache,
              path: filename,
            });

            try {
              const { Share } = await import("@capacitor/share");
              await Share.share({
                title: "Save Backup",
                files: [uriResult.uri],
                dialogTitle: "Save or Share Backup",
              });
              toast({ title: t("success"), description: t("backupCreatedAndSaved") || t("backupSaved") });
            } catch (shareError) {
              toast({ 
                title: t("success"), 
                description: t("backupCreatedLocally") || t("backupCreated")
              });
            }
          } catch (error) {
            console.error("Failed to save backup on native:", error);
            throw error;
          }
        } else {
          const blob = new Blob([json], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: t("success"), description: t("backupCreatedAndDownloaded") || t("backupDownloaded") });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        setIsExporting(false);
        return;
      }
      toast({
        title: t("error"),
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await deleteExistingBackup();
      await performAutoBackup();
      setLastBackupTime(formatLastBackupTime());
      await loadBackupsList();
      
      const backup = storage.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = BACKUP_FILENAME;

      if (isNative) {
        try {
          const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
          await Filesystem.writeFile({
            path: filename,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });

          const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: filename,
          });

          try {
            const { Share } = await import("@capacitor/share");
            await Share.share({
              title: "Save Backup",
              files: [uriResult.uri],
              dialogTitle: "Save or Share Backup",
            });
            toast({ title: t("backupSaved") });
          } catch (shareError) {
            if ((shareError as Error).message?.includes("cancel") || (shareError as Error).message?.includes("Cancel")) {
              toast({ title: t("backupFileReady"), description: t("tapShareToSave") });
              return;
            }
            toast({
              title: t("backupFileCreated"),
              description: t("tapShareAgainToSave").replace("{filename}", filename),
            });
          }
        } catch (error) {
          console.error("Failed to export backup on native:", error);
          throw error;
        }
      } else {
        const blob = new Blob([json], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: t("backupDownloaded") });
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        setIsExporting(false);
        return;
      }
      console.error("Export error:", error);
      toast({
        title: t("exportFailed"),
        description: error instanceof Error ? error.message : t("couldNotSaveBackup"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareBackup = async () => {
    setIsExporting(true);
    try {
      await deleteExistingBackup();
      await performAutoBackup();
      setLastBackupTime(formatLastBackupTime());
      await loadBackupsList();
      
      const backup = storage.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = BACKUP_FILENAME;

      if (isNative) {
        try {
          const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
          await Filesystem.writeFile({
            path: filename,
            data: json,
            directory: Directory.Cache,
            encoding: Encoding.UTF8,
          });

          const uriResult = await Filesystem.getUri({
            directory: Directory.Cache,
            path: filename,
          });

          try {
            const { Share } = await import("@capacitor/share");
            await Share.share({
              title: "Home Staff 360 Backup",
              files: [uriResult.uri],
              dialogTitle: "Share Backup File",
            });
            toast({ title: t("backupShared") });
          } catch (shareError) {
            if ((shareError as Error).message?.includes("cancel") || (shareError as Error).message?.includes("Cancel")) {
              toast({ title: t("backupFileReady"), description: t("tapShareToSend") });
              return;
            }
            toast({
              title: t("backupFileCreated"),
              description: t("tapShareAgainToSend").replace("{filename}", filename),
            });
          }
        } catch (error) {
          console.error("Failed to share backup on native:", error);
          throw error;
        }
      } else {
        if (navigator.share) {
          const file = new File([json], filename, { type: "application/octet-stream" });
          await navigator.share({
            title: "Home Staff 360 Backup",
            files: [file],
          });
        } else {
          const blob = new Blob([json], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          toast({ title: t("backupDownloaded") });
        }
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        setIsExporting(false);
        return;
      }
      console.error("Share error:", error);
      toast({
        title: t("shareFailed"),
        description: error instanceof Error ? error.message : t("couldNotShareBackup"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const processBackupData = (text: string): BackupData => {
    let data: unknown;
    
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(t("invalidJsonFile"));
    }

    if (typeof data !== 'object' || data === null) {
      throw new Error(t("invalidBackupStructure"));
    }
    
    const rawData = data as Record<string, unknown>;
    
    if (!rawData.version || !rawData.exportDate) {
      throw new Error(t("missingBackupMetadata"));
    }
    
    if (!rawData.settings || typeof rawData.settings !== 'object') {
      throw new Error(t("missingOrInvalidSettings"));
    }
    
    const settingsData = rawData.settings as Record<string, unknown>;
    
    const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'JPY', 'CNY', 'CAD', 'AUD', 'CHF', 'SGD', 'MXN', 'BRL', 'ZAR', 'OTHER'];
    const currencyValue = typeof settingsData.currency === 'string' && validCurrencies.includes(settingsData.currency) 
      ? settingsData.currency 
      : 'USD';
    
    const normalizedSettings = {
      currency: currencyValue,
      customCurrencySymbol: settingsData.customCurrencySymbol,
      language: settingsData.language || 'en',
      salaryStartDay: typeof settingsData.salaryStartDay === 'number' ? settingsData.salaryStartDay : 1,
      halfDayPercentage: typeof settingsData.halfDayPercentage === 'number' ? settingsData.halfDayPercentage : 50,
      hasCompletedOnboarding: settingsData.hasCompletedOnboarding ?? false,
      pinEnabled: settingsData.pinEnabled,
      pinCode: settingsData.pinCode,
      householdName: settingsData.householdName,
      darkMode: settingsData.darkMode,
      planType: settingsData.planType,
      showAllContexts: settingsData.showAllContexts,
      defaultAppMode: settingsData.defaultAppMode,
      homeTourCompleted: settingsData.homeTourCompleted,
      staffTourCompleted: settingsData.staffTourCompleted,
      trialStartedAt: settingsData.trialStartedAt,
      purchaseStatus: settingsData.purchaseStatus,
      purchaseDate: settingsData.purchaseDate,
      purchaseCountry: settingsData.purchaseCountry,
      hapticFeedbackEnabled: settingsData.hapticFeedbackEnabled ?? true,
      soundEffectsEnabled: settingsData.soundEffectsEnabled ?? true,
      country: settingsData.country,
      detectedCountry: settingsData.detectedCountry,
    };
    
    const normalizedData = {
      ...rawData,
      settings: normalizedSettings,
      people: Array.isArray(rawData.people) ? rawData.people : [],
      attendance: Array.isArray(rawData.attendance) ? rawData.attendance : [],
      transactions: Array.isArray(rawData.transactions) ? rawData.transactions : [],
      laundry: Array.isArray(rawData.laundry) ? rawData.laundry : [],
      expenses: Array.isArray(rawData.expenses) ? rawData.expenses : [],
      clientHomes: Array.isArray(rawData.clientHomes) ? rawData.clientHomes : [],
      selfAttendance: Array.isArray(rawData.selfAttendance) ? rawData.selfAttendance : [],
      staffLaundryJobs: Array.isArray(rawData.staffLaundryJobs) ? rawData.staffLaundryJobs : [],
      staffEarnings: Array.isArray(rawData.staffEarnings) ? rawData.staffEarnings : [],
      staffExpenses: Array.isArray(rawData.staffExpenses) ? rawData.staffExpenses : [],
      staffInvoices: Array.isArray(rawData.staffInvoices) ? rawData.staffInvoices : [],
    };

    const result = backupDataSchema.safeParse(normalizedData);
    if (!result.success) {
      const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      console.error("Backup validation errors:", result.error.errors);
      throw new Error(`${t("backupValidationFailed")}: ${errorMessages}`);
    }

    return result.data;
  };

  const handleRestoreLocalBackup = async (filename: string) => {
    try {
      const backupContent = await loadLocalBackup(filename);
      if (!backupContent) {
        throw new Error(t("backupFileNotFound"));
      }

      const validatedData = processBackupData(backupContent);

      const importResult = storage.importBackup(validatedData, "replace");
      if (!importResult.success) {
        throw new Error(importResult.error || t("importValidationFailed"));
      }
      toast({ title: t("backupRestored") });
      navigate(profile?.type === "STAFF" ? "staff-home" : "home");
    } catch (error) {
      toast({
        title: t("restoreFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (filename: string) => {
    setBackupToDelete(filename);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!backupToDelete) return;
    
    const success = await deleteLocalBackup(backupToDelete);
    if (success) {
      toast({ title: t("backupDeleted") });
      await loadBackupsList();
    } else {
      toast({
        title: t("error"),
        description: t("couldNotDeleteBackup"),
        variant: "destructive",
      });
    }
    setDeleteConfirmOpen(false);
    setBackupToDelete(null);
  };

  return (
    <AppLayout>
      <Header
        title={t("backupAndRestore")}
        subtitle={t("exportOrImportData")}
        onBack={() => navigate("settings")}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("autoBackup")}</h2>
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("lastBackup")}: {lastBackupTime}
              </p>
            </div>
            
            <Select value={displayFrequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger data-testid="select-backup-frequency">
                <SelectValue placeholder={t("selectFrequency")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off" data-testid="option-off">{t("backupOff")}</SelectItem>
                <SelectItem value="daily" data-testid="option-daily">{t("backupDaily")}</SelectItem>
                <SelectItem value="weekly" data-testid="option-weekly">{t("backupWeekly")}</SelectItem>
                <SelectItem value="monthly" data-testid="option-monthly">{t("backupMonthly")}</SelectItem>
              </SelectContent>
            </Select>

            {displayFrequency !== "off" && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                <Checkbox
                  id="backup-consent"
                  checked={pendingConsent ?? backgroundConsent}
                  onCheckedChange={handleConsentChange}
                  data-testid="checkbox-backup-consent"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="backup-consent" 
                    className="text-sm font-medium cursor-pointer leading-tight"
                  >
                    {t("autoBackupConsentLabel")}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("autoBackupConsentDescription")}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveSettings}
                disabled={!hasUnsavedChanges}
                className="flex-1"
                data-testid="button-save-settings"
              >
                <Save className="w-4 h-4 mr-2" />
                {t("saveSettings")}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleManualBackup}
                disabled={isExporting}
                data-testid="button-backup-now"
              >
                {t("backupNow")}
              </Button>
            </div>

            {showActiveStatus && backupFrequency !== "off" && backgroundConsent && nextBackupTime && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-success/10 border border-success/20">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-success">{t("autoBackupActiveMessage")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("autoBackupScheduledFor")
                      .replace("{time}", nextBackupTime)
                      .replace("{frequency}", getFrequencyLabel(backupFrequency))}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </section>

        {localBackups.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("localBackups")}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLocalBackups(!showLocalBackups)}
                data-testid="button-toggle-local-backups"
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                {showLocalBackups ? t("hide") : t("show")} ({localBackups.length})
              </Button>
            </div>
            
            {showLocalBackups && (
              <Card className="p-4 flex flex-col gap-2">
                {localBackups.map((backup) => (
                  <div 
                    key={backup.name} 
                    className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{backup.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {backup.date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreLocalBackup(backup.name)}
                        data-testid={`button-restore-${backup.name}`}
                      >
                        {t("restore")}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(backup.name)}
                        data-testid={`button-delete-${backup.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("downloadBackup")}</h2>
          <Card className="p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              {t("backupIncludesAllData")}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="flex-1"
                data-testid="button-download-backup"
              >
                <Download className="w-4 h-4 mr-2" />
                {isNative ? t("saveBackup") : t("downloadBackup")}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShareBackup}
                disabled={isExporting}
                data-testid="button-share-backup"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </section>

        </ScrollContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteBackupConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteBackupConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
