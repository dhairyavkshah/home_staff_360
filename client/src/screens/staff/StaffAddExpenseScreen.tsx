import { useState, useMemo, useEffect } from "react";
import { Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { getTodayString } from "@/lib/calculations";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useCurrency } from "@/hooks/useCurrency";

const CATEGORY_OPTIONS = [
  { value: "supplies", label: "Supplies" },
  { value: "equipment", label: "Equipment" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "fees", label: "Fees & Charges" },
  { value: "other", label: "Other" },
] as const;

const RECURRENCE_LABELS: Record<string, string> = {
  "one-time": "One-time",
  "weekly": "Weekly",
  "monthly": "Monthly",
  "yearly": "Yearly",
};

export function StaffAddExpenseScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const { getCurrencySymbol, getCurrencyInputLabel } = useCurrency();
  
  const isViewMode = data?.editMode && data?.expenseId;
  const expenseId = data?.expenseId as string | undefined;
  
  const existingExpense = useMemo(() => {
    if (!expenseId) return null;
    return storage.getStaffExpense(expenseId);
  }, [expenseId]);

  const displaySymbol = existingExpense?.recordCurrencySymbol || getCurrencySymbol();

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    if (!amount || parseInt(amount, 10) <= 0) {
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
    if (isViewMode) return;
    if (!validate()) return;

    const expenseData = {
      title: title.trim(),
      category,
      amount: parseInt(amount, 10),
      dueDate,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
      isPaid,
      accountId: activeAccountId || undefined,
      clientHomeId: clientHomeId === "none" ? undefined : clientHomeId,
      recurrence,
      staffUserId: storage.getProfile()?.id || 'unknown',
    };

    storage.addStaffExpense(expenseData);
    toast({ title: t("expenseAdded"), variant: "success" });

    markClean();
    navigate("staff-expenses");
  };

  const handleDelete = () => {
    if (!expenseId) return;
    
    storage.deleteStaffExpense(expenseId);
    toast({ title: t("expenseDeleted") || "Expense deleted successfully", variant: "success" });
    navigate("staff-expenses");
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

  const getCategoryLabel = (categoryValue: string): string => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === categoryValue);
    return cat ? cat.label : categoryValue;
  };

  const getClientHomeName = (homeId: string | undefined): string => {
    if (!homeId || homeId === "none") return t("noSpecificClient") || "No specific client";
    const home = clientHomes.find(h => h.id === homeId);
    return home?.name || homeId;
  };

  if (isViewMode && existingExpense) {
    return (
      <AppLayout>
        <Header
          title={"View Expense"}
          onBack={() => navigate("staff-expenses")}
          onHome={() => navigate("staff-home")}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{t("expenseDetails")}</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-info-readonly">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">This record cannot be edited</p>
                    <p className="text-xs text-muted-foreground">Financial records are locked after creation. If you need to make changes, delete this record and create a new one.</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("title")}</Label>
              <p className="font-medium" data-testid="view-title">{existingExpense.title}</p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("category")}</Label>
              <p className="font-medium" data-testid="view-category">
                {getCategoryLabel(existingExpense.category)}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("amount")}</Label>
              <p className="font-medium text-lg" data-testid="view-amount">
                {displaySymbol}{existingExpense.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("dueDate")}</Label>
              <p className="font-medium" data-testid="view-due-date">{formatDate(existingExpense.dueDate)}</p>
            </div>

            {existingExpense.vendor && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("vendor")}</Label>
                <p className="font-medium" data-testid="view-vendor">{existingExpense.vendor}</p>
              </div>
            )}

            {existingExpense.clientHomeId && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("relatedClient")}</Label>
                <p className="font-medium" data-testid="view-client-home">
                  {getClientHomeName(existingExpense.clientHomeId)}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{t("recurrence")}</Label>
              <p className="font-medium" data-testid="view-recurrence">
                {RECURRENCE_LABELS[existingExpense.recurrence] || existingExpense.recurrence}
              </p>
            </div>

            {existingExpense.notes && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{t("notes")}</Label>
                <p className="font-medium" data-testid="view-notes">{existingExpense.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <Label className="text-muted-foreground text-sm">{"Payment Status"}</Label>
              <Badge variant={existingExpense.isPaid ? "default" : "secondary"} data-testid="view-status">
                {existingExpense.isPaid ? t("paid") : t("unpaid") || "Unpaid"}
              </Badge>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{"Recorded On"}</Label>
              <p className="text-sm text-muted-foreground" data-testid="view-created">
                {formatDate(existingExpense.createdAt)}
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
            {t("deleteExpense") || "Delete Expense"}
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteExpense") || "Delete Expense"}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteExpenseConfirm") || "Are you sure you want to delete this expense? This action cannot be undone."}
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
        title={t("expenseDetails")}
        onBack={() => navigate("staff-expenses")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t("expenseDetails")}</h2>

          <div className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-4">
            <Label htmlFor="category">{t("category")} <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={category}
              onValueChange={(v) => { setCategory(v); markDirty(); }}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
              emptyMessage="No categories found"
              options={CATEGORY_OPTIONS.map((cat) => ({ value: cat.value, label: cat.label }))}
              data-testid="select-category"
            />
          </div>

          <div className="flex flex-col gap-4">
            <Label htmlFor="amount">{t("amount")} ({getCurrencyInputLabel()}) <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              step="1"
              value={amount}
              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setAmount(val); markDirty(); }}
              placeholder={t("amount")}
              data-testid="input-amount"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="flex flex-col gap-4">
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

          <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-4">
              <Label htmlFor="clientHome">{t("relatedClient")} ({t("optional")})</Label>
              <SearchableSelect
                value={clientHomeId}
                onValueChange={(v) => { setClientHomeId(v); markDirty(); }}
                placeholder={t("selectClientHome")}
                searchPlaceholder="Search clients..."
                emptyMessage="No clients found"
                options={[
                  { value: "none", label: t("noSpecificClient") },
                  ...clientHomes.map((home) => ({ value: home.id, label: home.name }))
                ]}
                data-testid="select-client-home"
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Label htmlFor="recurrence">{t("recurrence")}</Label>
            <SearchableSelect
              value={recurrence}
              onValueChange={(v) => { setRecurrence(v as any); markDirty(); }}
              placeholder="Select recurrence"
              searchPlaceholder="Search recurrence..."
              emptyMessage="No options found"
              options={[
                { value: "one-time", label: t("oneTime") },
                { value: "weekly", label: t("weekly") },
                { value: "monthly", label: t("monthly") },
                { value: "yearly", label: t("yearly") },
              ]}
              data-testid="select-recurrence"
            />
          </div>

          <div className="flex flex-col gap-4">
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
          {t("addExpense")}
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
