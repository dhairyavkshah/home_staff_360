import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { getTodayString } from "@/lib/calculations";
import { useTranslation } from "@/lib/i18n/i18n-context";
import type { AttendanceStatus } from "@shared/schema";

export function AddAttendanceScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const personId = data.personId as string;
  const source = data.source as "attendance" | "payables" | "quick-pay" | "person-detail" | undefined;

  const person = useMemo(() => storage.getPerson(personId), [personId]);
  const showHours = person?.salaryType === "HOURLY";

  const [date, setDate] = useState(data.date as string || getTodayString());
  const [status, setStatus] = useState<AttendanceStatus>("FULL");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const handleBack = () => navigate("person-detail", { personId, source });

  if (!person) {
    return (
      <AppLayout>
        <Header title="Staff Not Found" onBack={handleBack} />
        <ScrollContent>
          <p className="text-center text-muted-foreground">This staff member could not be found.</p>
        </ScrollContent>
      </AppLayout>
    );
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = t("dueDateRequired");

    // Prevent marking attendance for future dates
    const today = getTodayString();
    if (date > today) {
      newErrors.date = t("cannotMarkFutureAttendance");
    }

    const existing = storage.getAttendance().find(
      (a) => a.personId === personId && a.date === date
    );
    if (existing) {
      newErrors.date = t("existingRecord");
    }

    if (showHours && status !== "ABSENT") {
      if (!hours || parseFloat(hours) <= 0) {
        newErrors.hours = t("baseRateRequired");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    storage.addAttendance({
      personId,
      date,
      status,
      hours: showHours && status !== "ABSENT" ? parseFloat(hours) : undefined,
      note: note.trim() || undefined,
    });

    markClean();
    toast({ title: t("attendanceMarked") });
    navigate("person-detail", { personId, source });
  };

  const handleHomePress = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      navigate("home");
    }
  };

  const handleDiscardAndGoHome = () => {
    setShowUnsavedDialog(false);
    markClean();
    navigate("home");
  };

  return (
    <AppLayout>
      <Header
        title="Attendance Details"
        subtitle={`for ${person.name}`}
        onBack={handleBack}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              max={getTodayString()}
              onChange={(e) => { setDate(e.target.value); markDirty(); }}
              data-testid="input-date"
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <Label>Attendance Status <span className="text-destructive">*</span></Label>
          <RadioGroup value={status} onValueChange={(v) => { setStatus(v as AttendanceStatus); markDirty(); }}>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
              <RadioGroupItem value="FULL" id="full" data-testid="radio-full" />
              <Label htmlFor="full" className="flex-1 cursor-pointer font-normal">
                {t("fullDay")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
              <RadioGroupItem value="HALF" id="half" data-testid="radio-half" />
              <Label htmlFor="half" className="flex-1 cursor-pointer font-normal">
                {t("halfDay")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
              <RadioGroupItem value="ABSENT" id="absent" data-testid="radio-absent" />
              <Label htmlFor="absent" className="flex-1 cursor-pointer font-normal">
                {t("absent")}
              </Label>
            </div>
          </RadioGroup>
        </section>

        {showHours && status !== "ABSENT" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="hours">Hours Worked <span className="text-destructive">*</span></Label>
            <Input
              id="hours"
              type="number"
              value={hours}
              onChange={(e) => { setHours(e.target.value); markDirty(); }}
              placeholder="e.g., 8"
              data-testid="input-hours"
            />
            {errors.hours && <p className="text-xs text-destructive">{errors.hours}</p>}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => { setNote(e.target.value); markDirty(); }}
            placeholder="Add a note..."
            rows={2}
            data-testid="textarea-note"
          />
        </div>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          Save Attendance
        </Button>
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
