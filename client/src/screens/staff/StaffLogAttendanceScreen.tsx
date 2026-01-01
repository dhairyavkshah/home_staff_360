import { useState, useMemo, useEffect } from "react";
import { Calendar, Check, X, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { AttendanceStatus } from "@shared/schema";

export function StaffLogAttendanceScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const data = useNavigationData<{ attendanceId?: string }>();

  const profile = useMemo(() => storage.getProfile(), []);
  const clientHomes = useMemo(() => storage.getActiveClientHomes(), []);
  
  const editMode = !!data.attendanceId;
  const existingRecord = useMemo(() => {
    if (!data.attendanceId) return null;
    return storage.getSelfAttendance().find(a => a.id === data.attendanceId);
  }, [data.attendanceId]);

  const today = new Date().toISOString().split('T')[0];
  const [selectedHome, setSelectedHome] = useState<string>("");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<AttendanceStatus>("FULL");
  const [hours, setHours] = useState<string>("");
  const [note, setNote] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (existingRecord) {
      setSelectedHome(existingRecord.clientHomeId);
      setDate(existingRecord.date);
      setStatus(existingRecord.status);
      setHours(existingRecord.hoursWorked?.toString() || "");
      setNote(existingRecord.note || "");
    }
  }, [existingRecord]);

  const existingAttendance = useMemo(() => {
    if (!selectedHome || editMode) return null;
    const records = storage.getSelfAttendance();
    return records.find(r => r.clientHomeId === selectedHome && r.date === date);
  }, [selectedHome, date, editMode]);

  const handleHomePress = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("staff-home");
    }
  };

  const handleDiscardAndGoHome = () => {
    setShowUnsavedDialog(false);
    markClean();
    navigate("staff-home");
  };

  const handleSave = () => {
    if (!selectedHome) {
      toast({ title: t("selectClientHome"), variant: "destructive" });
      return;
    }
    if (!profile) return;

    if (editMode && data.attendanceId) {
      storage.updateSelfAttendance(data.attendanceId, {
        clientHomeId: selectedHome,
        date,
        status,
        hoursWorked: hours ? parseFloat(hours) : undefined,
        note: note.trim() || undefined,
      });
      toast({ title: t("attendanceUpdated") || "Attendance updated" });
    } else {
      storage.addSelfAttendance({
        staffUserId: profile.id,
        clientHomeId: selectedHome,
        date,
        status,
        hoursWorked: hours ? parseFloat(hours) : undefined,
        note: note.trim() || undefined,
      });
      toast({ title: t("attendanceLogged") });
    }

    markClean();
    navigate("staff-home");
  };

  return (
    <AppLayout>
      <Header
        title="Attendance Details"
        subtitle={t("recordYourWorkDay")}
        onBack={() => navigate("staff-home")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        {clientHomes.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">{t("addClientHomesFirst")}</p>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label>{t("clientHomes")}</Label>
              <Select value={selectedHome} onValueChange={(v) => { setSelectedHome(v); markDirty(); }}>
                <SelectTrigger data-testid="select-client-home">
                  <SelectValue placeholder={t("selectClientHome")} />
                </SelectTrigger>
                <SelectContent>
                  {clientHomes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name} - {home.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); markDirty(); }}
                data-testid="input-date"
              />
            </div>

            {existingAttendance && (
              <Card className="p-3 bg-muted">
                <p className="text-sm text-muted-foreground">
                  {t("existingRecord")}: {existingAttendance.status === 'FULL' ? t("fullDay") : existingAttendance.status === 'HALF' ? t("halfDay") : t("absent")}
                </p>
              </Card>
            )}

            <div className="flex flex-col gap-2">
              <Label>{t("status")}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={status === "FULL" ? "default" : "outline"}
                  onClick={() => { setStatus("FULL"); markDirty(); }}
                  className="flex flex-col gap-1 h-auto py-3"
                  data-testid="button-status-full"
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs">{t("fullDay")}</span>
                </Button>
                <Button
                  variant={status === "HALF" ? "default" : "outline"}
                  onClick={() => { setStatus("HALF"); markDirty(); }}
                  className="flex flex-col gap-1 h-auto py-3"
                  data-testid="button-status-half"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-xs">{t("halfDay")}</span>
                </Button>
                <Button
                  variant={status === "ABSENT" ? "default" : "outline"}
                  onClick={() => { setStatus("ABSENT"); markDirty(); }}
                  className="flex flex-col gap-1 h-auto py-3"
                  data-testid="button-status-absent"
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs">{t("absent")}</span>
                </Button>
              </div>
            </div>

            {status !== "ABSENT" && (
              <div className="flex flex-col gap-2">
                <Label>{t("hoursWorked")}</Label>
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => { setHours(e.target.value); markDirty(); }}
                  placeholder="8"
                  data-testid="input-hours"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>{t("notes")}</Label>
              <Textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); markDirty(); }}
                placeholder={t("anyNotesAboutToday")}
                data-testid="input-note"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              data-testid="button-save"
            >
              {editMode ? t("updateAttendance") : existingAttendance ? t("updateAttendance") : t("logAttendance")}
            </Button>
          </>
        )}
      </ScrollContent>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardAndGoHome}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </AppLayout>
  );
}
