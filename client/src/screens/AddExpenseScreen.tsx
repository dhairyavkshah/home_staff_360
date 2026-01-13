import { useState, useEffect, useMemo } from "react";
import { Info, Paperclip, X, Image as ImageIcon, FileText, Trash2, AlertCircle, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { AttachmentChooser } from "@/components/AttachmentChooser";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";
import { getTodayString } from "@/lib/calculations";
import { useCurrency } from "@/hooks/useCurrency";
import { openBase64File, downloadBase64File } from "@/lib/shareService";
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
  useDirtyForm(isDirty);
  const { tLabel } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  const { getCurrencySymbol, getCurrencyInputLabel } = useCurrency();
  
  const isViewMode = data?.editMode && data?.expenseId;
  const existingExpense = useMemo(() => {
    if (!data?.expenseId) return null;
    return storage.getExpenses().find(e => e.id === data.expenseId);
  }, [data?.expenseId]);

  const displaySymbol = existingExpense?.recordCurrencySymbol || getCurrencySymbol();

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    if (!amount || parseInt(amount, 10) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!dueDate) newErrors.dueDate = "Due date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isViewMode) return;
    if (!validate()) return;

    const expenseData = {
      category,
      customCategory: category === "other" ? customCategory.trim() || undefined : undefined,
      title: title.trim(),
      vendor: vendor.trim() || undefined,
      amount: parseInt(amount, 10),
      dueDate,
      recurrence: isRecurring ? recurrence : "NONE" as RecurrenceType,
      reminderDays: isRecurring ? parseInt(reminderDays) : undefined,
      isPaid,
    };

    let expenseId: string;

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

    for (const attachment of pendingAttachments) {
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

  const handleDelete = () => {
    if (!data?.expenseId) return;
    
    existingAttachments.forEach(doc => {
      storage.deleteDocument(doc.id);
    });
    
    storage.deleteExpense(data.expenseId);
    toast({ title: tLabel('expenseDeleted', 'Expense deleted successfully') });
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

  if (isViewMode && existingExpense) {
    return (
      <AppLayout>
        <Header
          title={tLabel('viewExpense', 'View Expense')}
          subtitle={tLabel('expenseRecordDetails', 'Expense record details')}
          onBack={() => navigate("expenses")}
          onHome={() => navigate("home")}
          contextLabel={contextLabel}
          contextMode={contextMode}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{tLabel('expenseDetails', 'Expense Details')}</h2>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" data-testid="button-info-readonly">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{tLabel('recordNotEditable', 'This record cannot be edited')}</p>
                    <p className="text-xs text-muted-foreground">{tLabel('recordNotEditableHint', 'Financial records are locked after creation. If you need to make changes, delete this record and create a new one.')}</p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('category', 'Category')}</Label>
              <p className="font-medium" data-testid="view-category">
                {existingExpense.category === 'other' && existingExpense.customCategory 
                  ? existingExpense.customCategory 
                  : EXPENSE_CATEGORY_LABELS[existingExpense.category as keyof typeof EXPENSE_CATEGORY_LABELS] || existingExpense.category}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('title', 'Title')}</Label>
              <p className="font-medium" data-testid="view-title">{existingExpense.title}</p>
            </div>

            {existingExpense.vendor && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{tLabel('vendor', 'Vendor')}</Label>
                <p className="font-medium" data-testid="view-vendor">{existingExpense.vendor}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('amount', 'Amount')}</Label>
              <p className="font-medium text-lg" data-testid="view-amount">
                {displaySymbol}{existingExpense.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('dueDate', 'Due Date')}</Label>
              <p className="font-medium" data-testid="view-due-date">{formatDate(existingExpense.dueDate)}</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-muted-foreground text-sm">{tLabel('paymentStatus', 'Payment Status')}</Label>
              <Badge variant={existingExpense.isPaid ? "default" : "secondary"} data-testid="view-status">
                {existingExpense.isPaid ? tLabel('paid', 'Paid') : tLabel('unpaid', 'Unpaid')}
              </Badge>
            </div>

            {existingExpense.recurrence !== "NONE" && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{tLabel('recurrence', 'Recurrence')}</Label>
                <p className="font-medium" data-testid="view-recurrence">
                  {RECURRENCE_LABELS[existingExpense.recurrence]}
                  {existingExpense.reminderDays && ` (${tLabel('reminder', 'Reminder')}: ${existingExpense.reminderDays} ${tLabel('daysBefore', 'days before')})`}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('recordedOn', 'Recorded On')}</Label>
              <p className="text-sm text-muted-foreground" data-testid="view-created">
                {formatDate(existingExpense.createdAt)}
              </p>
            </div>
          </section>

          {existingAttachments.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold">{tLabel('attachments', 'Attachments')}</h2>
              <div className="flex flex-col gap-3">
                {existingAttachments.map((doc) => (
                  <Card key={doc.id} className="p-4 flex items-center gap-3">
                    {doc.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-primary" />
                    ) : (
                      <FileText className="w-5 h-5 text-primary" />
                    )}
                    <span className="flex-1 text-sm truncate">{doc.fileName}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const success = await openBase64File(doc.fileData, doc.fileName, doc.fileType);
                          if (!success) {
                            toast({ title: tLabel('error', 'Error'), description: tLabel('failedToOpenFile', 'Failed to open file'), variant: 'destructive' });
                          }
                        }}
                        data-testid={`button-view-attachment-${doc.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          const success = await downloadBase64File(doc.fileData, doc.fileName, doc.fileType);
                          if (!success) {
                            toast({ title: tLabel('error', 'Error'), description: tLabel('failedToDownloadFile', 'Failed to download file'), variant: 'destructive' });
                          }
                        }}
                        data-testid={`button-download-attachment-${doc.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={() => setShowDeleteDialog(true)} 
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {tLabel('deleteExpense', 'Delete Expense')}
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tLabel('deleteExpense', 'Delete Expense')}</AlertDialogTitle>
              <AlertDialogDescription>
                {tLabel('deleteExpenseConfirm', 'Are you sure you want to delete this expense? This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tLabel('cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                {tLabel('delete', 'Delete')}
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
        title={tLabel('addExpense', 'Add Expense')}
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
            <SearchableSelect
              value={category}
              onValueChange={(v) => { setCategory(v); markDirty(); }}
              placeholder={tLabel('selectCategory', 'Select category')}
              searchPlaceholder={tLabel('searchCategories', 'Search categories...')}
              emptyMessage={tLabel('noCategoriesFound', 'No categories found')}
              options={expenseCategories.map((cat) => ({
                value: cat,
                label: EXPENSE_CATEGORY_LABELS[cat],
              }))}
              data-testid="select-category"
            />
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
            <Label htmlFor="amount">{tLabel('amount', 'Amount')} ({getCurrencyInputLabel()}) <span className="text-destructive">*</span></Label>
            <Input
              id="amount"
              type="number"
              step="1"
              value={amount}
              onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setAmount(val); markDirty(); }}
              placeholder="0"
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
          
          {pendingAttachments.length > 0 && (
            <div className="flex flex-col gap-3">
              <Label className="text-sm text-muted-foreground">{tLabel('newAttachments', 'New Attachments')}</Label>
              {pendingAttachments.map((attachment, index) => (
                <Card key={index} className="p-4 flex items-center gap-3">
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
          
          {pendingAttachments.length === 0 && (
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
                <SearchableSelect
                  value={recurrence}
                  onValueChange={(v) => { setRecurrence(v as RecurrenceType); markDirty(); }}
                  placeholder={tLabel('selectFrequency', 'Select frequency')}
                  searchPlaceholder={tLabel('searchFrequency', 'Search frequency...')}
                  emptyMessage={tLabel('noFrequencyFound', 'No frequency found')}
                  options={recurrenceTypes.filter(t => t !== 'NONE').map((type) => ({
                    value: type,
                    label: RECURRENCE_LABELS[type],
                  }))}
                  data-testid="select-recurrence"
                />
                <p className="text-xs text-muted-foreground">{tLabel('howOften', 'How often this expense repeats')}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="reminderDays">{tLabel('remindMe', 'Remind Me')}</Label>
                <SearchableSelect
                  value={reminderDays}
                  onValueChange={(v) => { setReminderDays(v); markDirty(); }}
                  placeholder={tLabel('selectReminder', 'Select reminder')}
                  searchPlaceholder={tLabel('searchReminder', 'Search...')}
                  emptyMessage={tLabel('noReminderFound', 'No reminder found')}
                  options={REMIND_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  data-testid="select-reminder"
                />
              </div>
            </>
          )}
        </section>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          {tLabel('saveExpense', 'Save Expense')}
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
