import { useState, useRef, useMemo } from "react";
import { Download, Upload, Share2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { backupDataSchema, type BackupData } from "@shared/schema";

export function BackupScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = useMemo(() => storage.getProfile(), []);
  const isNative = Capacitor.isNativePlatform();

  const [importMode, setImportMode] = useState<"replace" | "merge" | "keep">("replace");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
          toast({ title: "Backup saved successfully" });
        } catch (shareError) {
          if ((shareError as Error).message?.includes("cancel") || (shareError as Error).message?.includes("Cancel")) {
            toast({ title: "Backup file ready", description: "Tap Share to save it" });
            return;
          }
          toast({
            title: "Backup file created",
            description: `Tap the Share button to save ${filename}`,
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
        toast({ title: "Backup downloaded successfully" });
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        setIsExporting(false);
        return;
      }
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Could not save backup file",
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
          toast({ title: "Backup shared successfully" });
        } catch (shareError) {
          if ((shareError as Error).message?.includes("cancel") || (shareError as Error).message?.includes("Cancel")) {
            toast({ title: "Backup file ready", description: "Tap Share to send it" });
            return;
          }
          toast({
            title: "Backup file created",
            description: `Tap Share again to send ${filename}`,
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
          toast({ title: "Backup downloaded" });
        }
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        setIsExporting(false);
        return;
      }
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Could not share backup",
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

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const text = await selectedFile.text();
      let data: unknown;
      
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("File is not valid JSON. Please select a valid .hs360 backup file.");
      }

      if (typeof data !== 'object' || data === null) {
        throw new Error("Invalid backup file structure");
      }
      
      const rawData = data as Record<string, unknown>;
      
      if (!rawData.version || !rawData.exportDate) {
        throw new Error("Missing required backup metadata (version/exportDate)");
      }
      
      if (!rawData.settings || typeof rawData.settings !== 'object') {
        throw new Error("Missing or invalid settings in backup file");
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
      };

      const result = backupDataSchema.safeParse(normalizedData);
      if (!result.success) {
        const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        console.error("Backup validation errors:", result.error.errors);
        throw new Error(`Backup validation failed: ${errorMessages}`);
      }

      storage.importBackup(result.data, importMode);
      toast({ title: "Backup imported successfully" });
      navigate(profile?.type === "STAFF" ? "staff-home" : "home");
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <Header
        title="Backup & Restore"
        subtitle="Export or import your data"
        onBack={() => navigate("settings")}
      />

      <ScrollContent>
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Export Data</h2>
          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-halo-primary w-9 h-9">
                <Download className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Create backup file</p>
                <p className="text-xs text-muted-foreground">
                  Includes all staff, attendance, transactions, and settings
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
                {isNative ? "Save Backup" : "Download Backup"}
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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Import Data</h2>
          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="icon-halo-muted w-9 h-9">
                <Upload className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Restore from backup</p>
                <p className="text-xs text-muted-foreground">
                  Select a previously exported backup file
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
              {selectedFile ? selectedFile.name : "Choose File"}
            </Button>

            {selectedFile && (
              <>
                <div className="flex flex-col gap-3">
                  <Label>Import Mode</Label>
                  <RadioGroup
                    value={importMode}
                    onValueChange={(v) => setImportMode(v as typeof importMode)}
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="replace" id="replace" data-testid="radio-replace" />
                      <div>
                        <Label htmlFor="replace" className="cursor-pointer font-medium">
                          Replace All
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Delete existing data, import new data
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="merge" id="merge" data-testid="radio-merge" />
                      <div>
                        <Label htmlFor="merge" className="cursor-pointer font-medium">
                          Merge
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Update existing records, add new ones
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                      <RadioGroupItem value="keep" id="keep" data-testid="radio-keep" />
                      <div>
                        <Label htmlFor="keep" className="cursor-pointer font-medium">
                          Keep Both
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Keep existing data, import with new IDs
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleImport} data-testid="button-import">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Backup
                </Button>
              </>
            )}
          </Card>
        </section>
      </ScrollContent>
    </AppLayout>
  );
}
