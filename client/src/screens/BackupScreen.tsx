import { useState, useRef, useMemo } from "react";
import { Download, Upload } from "lucide-react";
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

  const [importMode, setImportMode] = useState<"replace" | "merge" | "keep">("replace");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = () => {
    const backup = storage.exportBackup();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `homestaff360-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
    toast({ title: "Backup downloaded successfully" });
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
      const data = JSON.parse(text);

      const result = backupDataSchema.safeParse(data);
      if (!result.success) {
        throw new Error("Invalid backup file format");
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
            <Button onClick={handleExport} data-testid="button-download-backup">
              <Download className="w-4 h-4 mr-2" />
              Download Backup
            </Button>
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
              accept=".json"
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
