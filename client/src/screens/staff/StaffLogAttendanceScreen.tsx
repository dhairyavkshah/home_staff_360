import { useState, useMemo, useEffect } from "react";
import { Calendar, Check, X, Clock, Trash2, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { AttendanceStatus } from "@shared/schema";

export function StaffLogAttendanceScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const data = useNavigationData<{ attendanceId?: string }>();

  const profile = useMemo(() => storage.getProfile(), []);
  const clientHomes = useMemo(() => storage.getActiveClientHomes(), []);
  
  const editMode = !!data.attendanceId;
  const existingRecord = useMemo(() => {
    if (!data.attendanceId) return null;
    return storage.getSelfAttendance().find(a => a.id === data.attendanceId);
  }, [data.attendanceId]);

  const isViewMode = editMode && existingRecord;

  const today = new Date().toISOString().split('T')[0];
  const [selectedHome, setSelectedHome] = useState<string>("");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<AttendanceStatus>("FULL");
  const [hours, setHours] = useState<string>("");
  const [note, setNote] = useState("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditConfirmDialog, setShowEditConfirmDialog] = useState(false);

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

    // Prevent marking attendance for future dates (recompute today for freshness)
    const currentDate = new Date().toISOString().split('T')[0];
    if (date > currentDate) {
      toast({ title: t("cannotMarkFutureAttendance"), variant: "destructive" });
      return;
    }

    // Check for existing attendance record and ask for confirmation
    if (existingAttendance) {
      setShowEditConfirmDialog(true);
      return;
    }

    saveAttendance();
  };

  const saveAttendance = () => {
    if (!profile) return;

    // Update existing record if present
    if (existingAttendance) {
      storage.updateSelfAttendance(existingAttendance.id, {
        status,
        hoursWorked: hours ? parseFloat(hours) : undefined,
        note: note.trim() || undefined,
      });
      toast({ title: t("updateAttendance") || "Attendance updated" });
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

  const handleConfirmEdit = () => {
    setShowEditConfirmDialog(false);
    saveAttendance();
  };

  const handleDelete = () => {
    if (!data.attendanceId) return;
    
    storage.deleteSelfAttendance(data.attendanceId);
    toast({ title: t("attendanceDeleted") || "Attendance deleted successfully" });
    navigate("staff-attendance");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getClientHomeName = (homeId: string): string => {
    const home = clientHomes.find(h => h.id === homeId);
    return home ? `${home.name} - ${home.role}` : homeId;
  };

  const getStatusBadge = (statusValue: AttendanceStatus) => {
    switch (statusValue) {
      case "FULL":
        return <Badge variant="default" data-testid="view-status">{t("fullDay")}</Badge>;
      case "HALF":
        return <Badge variant="secondary" data-testid="view-status">{t("halfDay")}</Badge>;
      case "ABSENT":
        return <Badge variant="outline" data-testid="view-status">{t("absent")}</Badge>;
      default:
        return <Badge variant="outline" data-testid="view-status">{statusValue}</Badge>;
    }
  };

  if (isViewMode && existingRecord) {
    return (
      <AppLayout>
        <Header
          title={"View Attendance"}
          subtitle={t("recordYourWorkDay")}
          onBack={() => navigate("staff-attendance")}
          onHome={() => navigate("staff-home")}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{"Attendance Details"}</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-info-readonly">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">This record cannot be edited</p>
                    <p className="text-xs text-muted-foreground">Attendance records are locked after creation. If you need to make changes, delete this record and create a new one.</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("clientHomes")}</Label>
              <p className="font-medium" data-testid="view-client-home">
                {getClientHomeName(existingRecord.clientHomeId)}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("date")}</Label>
              <p className="font-medium" data-testid="view-date">{formatDate(existingRecord.date)}</p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("status")}</Label>
              <div data-testid="view-status-container">
                {getStatusBadge(existingRecord.status)}
              </div>
            </div>

            {existingRecord.hoursWorked && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("hoursWorked")}</Label>
                <p className="font-medium" data-testid="view-hours">{existingRecord.hoursWorked} {t("hours") || "hours"}</p>
              </div>
            )}

            {existingRecord.note && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("notes")}</Label>
                <p className="font-medium" data-testid="view-note">{existingRecord.note}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{"Recorded On"}</Label>
              <p className="text-sm text-muted-foreground" data-testid="view-created">
                {formatDate(existingRecord.createdAt)}
              </p>
            </div>
          </section>

          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowDeleteDialog(true)} 
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("deleteAttendance") || "Delete Attendance"}
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteAttendance") || "Delete Attendance"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteAttendanceConfirm") || "Are you sure you want to delete this attendance record? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    );
  }

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
            <div className="flex flex-col gap-4">
              <Label>{t("clientHomes")}</Label>
              <SearchableSelect
                value={selectedHome}
                onValueChange={(v) => { setSelectedHome(v); markDirty(); }}
                placeholder={t("selectClientHome")}
                searchPlaceholder="Search clients..."
                emptyMessage="No clients found"
                options={clientHomes.map((home) => ({ value: home.id, label: `${home.name} - ${home.role}` }))}
                data-testid="select-client-home"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Label>{t("date")}</Label>
              <Input
                type="date"
                value={date}
                max={today}
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

            <div className="flex flex-col gap-4">
              <Label>{t("status")}</Label>
              <div className="grid grid-cols-3 gap-3">
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
              <div className="flex flex-col gap-4">
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

            <div className="flex flex-col gap-4">
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
              {existingAttendance ? t("updateAttendance") : t("logAttendance")}
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

      <AlertDialog open={showEditConfirmDialog} onOpenChange={setShowEditConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("editAttendance") || "Edit Attendance"}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm editing attendance
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit} data-testid="button-confirm-edit">
              {t("update") || "Update"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
