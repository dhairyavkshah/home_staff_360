import { useState, useRef, useMemo, useEffect } from "react";
import { Download, Upload, Share2, Clock, Trash2, FolderOpen } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  formatLastBackupTime,
  performAutoBackup,
  listLocalBackups,
  loadLocalBackup,
  deleteLocalBackup,
} from "@/lib/auto-backup";

export function BackupScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = useMemo(() => storage.getProfile(), []);
  const isNative = Capacitor.isNativePlatform();

  const [importMode, setImportMode] = useState<"replace" | "merge" | "keep">("replace");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [backupFrequency, setBackupFrequencyState] = useState<BackupFrequency>(getBackupFrequency());
  const [lastBackupTime, setLastBackupTime] = useState(formatLastBackupTime());
  const [localBackups, setLocalBackups] = useState<Array<{ name: string; date: Date }>>([]);
  const [showLocalBackups, setShowLocalBackups] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

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
    setBackupFrequency(value);
    setBackupFrequencyState(value);
    toast({
      title: t("success"),
      description: value === "off" 
        ? t("autoBackupDisabled") 
        : t("autoBackupEnabled").replace("{frequency}", value),
    });
  };

  const handleManualBackup = async () => {
    setIsExporting(true);
    try {
      const result = await performAutoBackup();
      if (result.success) {
        setLastBackupTime(formatLastBackupTime());
        await loadBackupsList();
        
        const backup = storage.exportBackup();
        const json = JSON.stringify(backup, null, 2);
        const filename = `homestaff360-backup-${new Date().toISOString().split("T")[0]}.hs360`;

        if (isNative) {
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
      const backup = storage.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = `homestaff360-backup-${new Date().toISOString().split("T")[0]}.hs360`;

      if (isNative) {
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
      const backup = storage.exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const filename = `homestaff360-backup-${new Date().toISOString().split("T")[0]}.hs360`;

      if (isNative) {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      const validatedData = processBackupData(text);

      const importResult = storage.importBackup(validatedData, importMode);
      if (!importResult.success) {
        throw new Error(importResult.error || t("importValidationFailed"));
      }
      toast({ title: t("backupImported") });
      navigate(profile?.type === "STAFF" ? "staff-home" : "home");
    } catch (error) {
      toast({
        title: t("importFailed"),
        description: error instanceof Error ? error.message : t("unknownError"),
        variant: "destructive",
      });
    }
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

  const handleDeleteLocalBackup = async (filename: string) => {
    const success = await deleteLocalBackup(filename);
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
          <Card className="p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-halo-primary w-9 h-9">
                <Clock className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("backupFrequency")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("lastBackup")}: {lastBackupTime}
                </p>
              </div>
            </div>
            
            <Select value={backupFrequency} onValueChange={handleFrequencyChange}>
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

            <Button 
              variant="outline" 
              onClick={handleManualBackup}
              disabled={isExporting}
              data-testid="button-backup-now"
            >
              {t("backupNow")}
            </Button>
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
                        onClick={() => handleDeleteLocalBackup(backup.name)}
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
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("exportData")}</h2>
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-halo-primary w-9 h-9">
                <Download className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("createBackupFile")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("backupIncludesAllData")}
                </p>
              </div>
            </div>
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

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("importData")}</h2>
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-halo-muted w-9 h-9">
                <Upload className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">{t("restoreFromBackup")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("selectPreviouslyExportedBackup")}
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".hs360,.json"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-file"
            />

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-choose-file"
            >
              {selectedFile ? selectedFile.name : t("chooseFile")}
            </Button>

            {selectedFile && (
              <>
                <div className="flex flex-col gap-3">
                  <Label>{t("importMode")}</Label>
                  <RadioGroup
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as typeof importMode)}
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="replace" id="replace" data-testid="radio-replace" />
                      <div>
                        <Label htmlFor="replace" className="cursor-pointer font-medium">
                          {t("replaceAll")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("replaceAllDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="merge" id="merge" data-testid="radio-merge" />
                      <div>
                        <Label htmlFor="merge" className="cursor-pointer font-medium">
                          {t("merge")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("mergeDescription")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="keep" id="keep" data-testid="radio-keep" />
                      <div>
                        <Label htmlFor="keep" className="cursor-pointer font-medium">
                          {t("keepBoth")}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t("keepBothDescription")}
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleImport} data-testid="button-import">
                  <Upload className="w-4 h-4 mr-2" />
                  {t("importBackup")}
                </Button>
              </>
            )}
          </Card>
        </section>
      </ScrollContent>
    </AppLayout>
  );
}
