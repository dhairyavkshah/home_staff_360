import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { getTodayString } from "@/lib/calculations";
import { useTranslation } from "@/lib/i18n/i18n-context";

const CATEGORY_OPTIONS = [
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "fees", label: "Fees & Charges" },
  { value: "other", label: "Other" },
] as const;

export function StaffAddExpenseScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  
  const expenseId = data.expenseId as string | undefined;
  const isEditMode = !!expenseId;
  
  const existingExpense = useMemo(() => {
    if (!expenseId) return null;
    return storage.getStaffExpense(expenseId);
  }, [expenseId]);

  const [refreshKey] = useState(0);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [activeAccountId, showAllContexts, refreshKey]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("supplies");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(getTodayString());
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [clientHomeId, setClientHomeId] = useState<string>("none");
  const [recurrence, setRecurrence] = useState<"one-time" | "weekly" | "monthly" | "yearly">("one-time");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  useEffect(() => {
    if (existingExpense) {
      setTitle(existingExpense.title);
      setCategory(existingExpense.category);
      setAmount(existingExpense.amount.toString());
      setDueDate(existingExpense.dueDate);
      setVendor(existingExpense.vendor || "");
      setNotes(existingExpense.notes || "");
      setIsPaid(existingExpense.isPaid);
      setClientHomeId(existingExpense.clientHomeId || "none");
      setRecurrence(existingExpense.recurrence || "one-time");
    }
  }, [existingExpense]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = t("titleRequired");
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = t("amountRequired");
    }
    if (!dueDate) newErrors.dueDate = t("dueDateRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = () => {
    if (!validate()) return;

    const expenseData = {
      title: title.trim(),
      category,
      amount: parseFloat(amount),
      dueDate,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
      isPaid,
      clientHomeId: clientHomeId === "none" ? undefined : clientHomeId,
      recurrence,
      staffUserId: storage.getProfile()?.id || 'unknown',
    };

    if (isEditMode && expenseId) {
      storage.updateStaffExpense(expenseId, expenseData);
      toast({ title: t("expenseUpdated") });
    } else {
      storage.addStaffExpense(expenseData);
      toast({ title: t("expenseAdded") });
    }

    markClean();
    navigate("staff-expenses");
  };

  return (
    <AppLayout>
      <Header
        title={t("expenseDetails")}
        onBack={() => navigate("staff-expenses")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("expenseDetails")}</h2>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{t("title")} <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              placeholder={t("enterTitlePlaceholder")}
              data-testid="input-title"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">{t("category")} <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={(v) => { setCategory(v); markDirty(); }}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{t("amount")} <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); markDirty(); }}
              placeholder={t("amount")}
              data-testid="input-amount"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">{t("dueDate")} <span className="text-destructive">*</span></Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
              data-testid="input-due-date"
            />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vendor">{t("vendor")}</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => { setVendor(e.target.value); markDirty(); }}
              placeholder={t("enterVendorPlaceholder")}
              data-testid="input-vendor"
            />
          </div>

          {clientHomes.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientHome">{t("relatedClient")} ({t("optional")})</Label>
              <Select value={clientHomeId} onValueChange={(v) => { setClientHomeId(v); markDirty(); }}>
                <SelectTrigger id="clientHome" data-testid="select-client-home">
                  <SelectValue placeholder={t("selectClientHome")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noSpecificClient")}</SelectItem>
                  {clientHomes.map((home) => (
                    <SelectItem key={home.id} value={home.id}>
                      {home.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="recurrence">{t("recurrence")}</Label>
            <Select value={recurrence} onValueChange={(v) => { setRecurrence(v as any); markDirty(); }}>
              <SelectTrigger id="recurrence" data-testid="select-recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">{t("oneTime")}</SelectItem>
                <SelectItem value="weekly">{t("weekly")}</SelectItem>
                <SelectItem value="monthly">{t("monthly")}</SelectItem>
                <SelectItem value="yearly">{t("yearly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); markDirty(); }}
              placeholder={t("additionalNotesPlaceholder")}
              data-testid="input-notes"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("status")}</h2>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked) => { setIsPaid(checked as boolean); markDirty(); }}
              data-testid="checkbox-paid"
            />
            <Label htmlFor="isPaid" className="font-normal cursor-pointer">
              {t("paid")}
            </Label>
          </div>
        </section>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          {isEditMode ? t("save") : t("addExpense")}
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
