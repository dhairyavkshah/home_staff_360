import { useState, useEffect, useMemo } from "react";
import { Info, Paperclip, X, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { UnsavedChangesDialog } from "@/components/UnsavedChangesDialog";
import { AttachmentChooser } from "@/components/AttachmentChooser";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";
import { getTodayString } from "@/lib/calculations";
import { 
  type RecurrenceType, 
  expenseCategories, 
  EXPENSE_CATEGORY_LABELS,
  RECURRENCE_LABELS,
  recurrenceTypes,
  HOME_DOCUMENT_CATEGORIES
} from "@shared/schema";

const REMIND_OPTIONS = [
  { value: "1", label: "1 day before" },
  { value: "2", label: "2 days before" },
  { value: "3", label: "3 days before" },
  { value: "5", label: "5 days before" },
  { value: "7", label: "1 week before" },
];

interface PendingAttachment {
  file: File;
  preview: string;
}

export function AddExpenseScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const { tLabel } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  
  const editMode = data?.editMode && data?.expenseId;
  const existingExpense = useMemo(() => {
    if (!data?.expenseId) return null;
    return storage.getExpenses().find(e => e.id === data.expenseId);
  }, [data?.expenseId]);

  const initialDate = data?.date || getTodayString();

  const [category, setCategory] = useState("utilities");
  const [customCategory, setCustomCategory] = useState("");
  const [title, setTitle] = useState("");
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(initialDate);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceType>("MONTHLY");
  const [reminderDays, setReminderDays] = useState("1");
  const [isPaid, setIsPaid] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAttachmentChooser, setShowAttachmentChooser] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const existingAttachments = useMemo(() => {
    if (!data?.expenseId) return [];
    return storage.getDocumentsByLinkedRecord('EXPENSE', data.expenseId);
  }, [data?.expenseId, attachmentRefreshKey]);

  useEffect(() => {
    if (existingExpense) {
      setCategory(existingExpense.category);
      setCustomCategory(existingExpense.customCategory || "");
      setTitle(existingExpense.title);
      setVendor(existingExpense.vendor || "");
      setAmount(existingExpense.amount.toString());
      setDueDate(existingExpense.dueDate);
      setIsRecurring(existingExpense.recurrence !== "NONE");
      setRecurrence(existingExpense.recurrence === "NONE" ? "MONTHLY" : existingExpense.recurrence);
      setReminderDays(existingExpense.reminderDays?.toString() || "1");
      setIsPaid(existingExpense.isPaid);
    }
  }, [existingExpense]);

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachments(prev => [...prev, {
        file,
        preview: reader.result as string
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (docId: string) => {
    storage.deleteDocument(docId);
    setAttachmentRefreshKey(k => k + 1);
    toast({ title: tLabel('attachmentRemoved', 'Attachment removed') });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!dueDate) newErrors.dueDate = "Due date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const expenseData = {
      category,
      customCategory: category === "other" ? customCategory.trim() || undefined : undefined,
      title: title.trim(),
      vendor: vendor.trim() || undefined,
      amount: parseFloat(amount),
      dueDate,
      recurrence: isRecurring ? recurrence : "NONE" as RecurrenceType,
      reminderDays: isRecurring ? parseInt(reminderDays) : undefined,
      isPaid,
    };

    let expenseId: string;

    if (editMode && data?.expenseId) {
      storage.updateExpense(data.expenseId, expenseData);
      expenseId = data.expenseId;
      toast({ title: tLabel('expenseUpdated', 'Expense updated successfully') });
    } else {
      let accountId: string;
      try {
        accountId = storage.requireActiveAccountId();
      } catch {
        toast({ title: "Error", description: "No active account. Please set up an account first.", variant: "destructive" });
        return;
      }
      const newExpense = storage.addExpense({ ...expenseData, accountId });
      expenseId = newExpense.id;
      toast({ title: tLabel('expenseAdded', 'Expense added successfully') });
    }

    for (const attachment of pendingAttachments) {
      let accountId: string;
      try {
        accountId = storage.requireActiveAccountId();
      } catch {
        continue;
      }
      
      storage.addDocument({
        ownerType: 'HOME',
        accountId,
        category: HOME_DOCUMENT_CATEGORIES[0],
        description: `Receipt for: ${title.trim()}`,
        fileName: attachment.file.name,
        fileType: attachment.file.type,
        fileSize: attachment.file.size,
        fileData: attachment.preview,
        linkedRecordType: 'EXPENSE',
        linkedRecordId: expenseId,
      });
    }

    markClean();
    navigate("expenses");
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
        title={tLabel('expenseDetails', 'Expense Details')}
        subtitle={tLabel('trackNewBill', 'Track a new bill or expense')}
        onBack={() => navigate("expenses")}
        onHome={handleHomePress}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{tLabel('expenseDetails', 'Expense Details')}</h2>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">{tLabel('category', 'Category')} <span className="text-destructive">*</span></Label>
            <Select value={category} onValueChange={(v) => { setCategory(v); markDirty(); }}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder={tLabel('selectCategory', 'Select category')} />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{EXPENSE_CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{tLabel('expenseTypeTracking', 'Type of expense for tracking')}</p>
          </div>

          {category === "other" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="customCategory">{tLabel('customCategory', 'Custom Category Name')}</Label>
              <Input
                id="customCategory"
                value={customCategory}
                onChange={(e) => { setCustomCategory(e.target.value); markDirty(); }}
                placeholder={tLabel('customCategoryPlaceholder', 'e.g., Pet Supplies, Home Improvement')}
                data-testid="input-custom-category"
              />
              <p className="text-xs text-muted-foreground">{tLabel('customCategoryHelp', 'Enter a name for this category')}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{tLabel('title', 'Title')} <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              placeholder={tLabel('expenseTitlePlaceholder', 'e.g., Electricity Bill, Water Bill')}
              data-testid="input-title"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="vendor">{tLabel('vendor', 'Vendor')}</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => { setVendor(e.target.value); markDirty(); }}
              placeholder={tLabel('vendorPlaceholder', 'e.g., Power Company')}
              data-testid="input-vendor"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{tLabel('amount', 'Amount')} <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); markDirty(); }}
              placeholder="0.00"
              data-testid="input-amount"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">{tLabel('dueDate', 'Due Date')} <span className="text-destructive">*</span></Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
              placeholder="YYYY-MM-DD"
              data-testid="input-due-date"
            />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="isPaid">{tLabel('markAsPaid', 'Mark as Paid')}</Label>
              <p className="text-xs text-muted-foreground">{tLabel('alreadyPaid', 'Already paid this expense?')}</p>
            </div>
            <Switch
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked) => { setIsPaid(checked); markDirty(); }}
              data-testid="switch-is-paid"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{tLabel('attachments', 'Attachments')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAttachmentChooser(true)}
              data-testid="button-add-attachment"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {tLabel('addAttachment', 'Add')}
            </Button>
          </div>
          
          {existingAttachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">{tLabel('savedAttachments', 'Saved Attachments')}</Label>
              {existingAttachments.map((doc) => (
                <Card key={doc.id} className="p-3 flex items-center gap-3">
                  {doc.fileType.startsWith('image/') ? (
                    <ImageIcon className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                  <span className="flex-1 text-sm truncate">{doc.fileName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExistingAttachment(doc.id)}
                    data-testid={`button-remove-existing-${doc.id}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
          
          {pendingAttachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-sm text-muted-foreground">{tLabel('newAttachments', 'New Attachments')}</Label>
              {pendingAttachments.map((attachment, index) => (
                <Card key={index} className="p-3 flex items-center gap-3">
                  {attachment.file.type.startsWith('image/') ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                  <span className="flex-1 text-sm truncate">{attachment.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttachment(index)}
                    data-testid={`button-remove-pending-${index}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
          
          {existingAttachments.length === 0 && pendingAttachments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-3">
              {tLabel('noAttachments', 'No attachments. Add receipts or invoices.')}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-lg font-semibold">{tLabel('recurrence', 'Recurrence')}</h2>
                <p className="text-xs text-muted-foreground">{tLabel('setUpRecurring', 'Set up recurring bill tracking')}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-sm">{tLabel('recurrenceTooltip', 'Enable this for bills that repeat regularly like rent, utilities, or subscriptions.')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={(checked) => { setIsRecurring(checked); markDirty(); }}
              data-testid="switch-recurrence"
            />
          </div>

          {isRecurring && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="recurrence">{tLabel('repeat', 'Repeat')}</Label>
                <Select value={recurrence} onValueChange={(v) => { setRecurrence(v as RecurrenceType); markDirty(); }}>
                  <SelectTrigger id="recurrence" data-testid="select-recurrence">
                    <SelectValue placeholder={tLabel('selectFrequency', 'Select frequency')} />
                  </SelectTrigger>
                  <SelectContent>
                    {recurrenceTypes.filter(t => t !== 'NONE').map((type) => (
                      <SelectItem key={type} value={type}>{RECURRENCE_LABELS[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{tLabel('howOften', 'How often this expense repeats')}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reminderDays">{tLabel('remindMe', 'Remind Me')}</Label>
                <Select value={reminderDays} onValueChange={(v) => { setReminderDays(v); markDirty(); }}>
                  <SelectTrigger id="reminderDays" data-testid="select-reminder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMIND_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </section>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          {editMode ? tLabel('updateExpense', 'Update Expense') : tLabel('saveExpense', 'Save Expense')}
        </Button>
      </ScrollContent>

      <AttachmentChooser
        open={showAttachmentChooser}
        onOpenChange={setShowAttachmentChooser}
        onFileSelected={handleFileSelected}
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardAndGoHome}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </AppLayout>
  );
}
