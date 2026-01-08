import { useState, useEffect, useMemo } from "react";
import { Info, Paperclip, X, Image as ImageIcon, FileText, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AttachmentChooser } from "@/components/AttachmentChooser";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useSimpleDirtyTracker } from "@/hooks/use-dirty-tracker";
import { useDirtyForm } from "@/lib/dirty-tracking";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";
import { useCurrency } from "@/hooks/useCurrency";
import { getTodayString, calculatePersonBalance, formatCurrency } from "@/lib/calculations";
import { HOME_DOCUMENT_CATEGORIES } from "@shared/schema";

interface PendingAttachment {
  file: File;
  preview: string;
}


export function AddTransactionScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const { tLabel } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  const { getCurrencySymbol, getCurrencyInputLabel } = useCurrency();
  
  const isViewMode = data?.editMode && data?.transactionId;
  const existingTransaction = useMemo(() => {
    if (!data?.transactionId) return null;
    return storage.getTransactions().find(t => t.id === data.transactionId);
  }, [data?.transactionId]);

  const displaySymbol = existingTransaction?.recordCurrencySymbol || getCurrencySymbol();

  const personId = data.personId as string;
  const presetAmount = data.presetAmount as number | undefined;
  const defaultDescription = data.defaultDescription as string | undefined;
  const defaultCategory = data.defaultCategory as string | undefined;
  const source = data.source as "attendance" | "payables" | "quick-pay" | "person-detail" | undefined;

  const person = useMemo(() => storage.getPerson(personId), [personId]);
  const settings = useMemo(() => storage.getSettings(), []);
  
  const currentBalance = useMemo(() => 
    person ? calculatePersonBalance(personId) : 0, 
    [personId, person]
  );

  const getSmartDefaults = useMemo(() => {
    if (!person) return { description: "", amount: "" };
    
    let description = defaultDescription || "";
    let amount = presetAmount && presetAmount > 0 ? String(presetAmount) : "";
    
    if (source === "attendance") {
      description = description || `Salary Payment for Attendance - ${person.name}`;
    } else if (source === "payables" || source === "person-detail") {
      if (!description && currentBalance > 0) {
        description = `Salary Payment for ${person.name}`;
      }
      if (!amount && currentBalance > 0) {
        amount = String(currentBalance);
      }
    }
    
    return { description, amount };
  }, [person, defaultDescription, presetAmount, source, currentBalance]);

  const [category, setCategory] = useState(defaultCategory || "payment");
  const [description, setDescription] = useState(getSmartDefaults.description);
  const [transactionNo, setTransactionNo] = useState("");
  const [amount, setAmount] = useState(getSmartDefaults.amount);
  const [date, setDate] = useState(getTodayString());
  const [isPaid, setIsPaid] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAttachmentChooser, setShowAttachmentChooser] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const existingAttachments = useMemo(() => {
    if (!data?.transactionId) return [];
    return storage.getDocumentsByLinkedRecord('TRANSACTION', data.transactionId);
  }, [data?.transactionId, attachmentRefreshKey]);

  useEffect(() => {
    if (existingTransaction) {
      setCategory(existingTransaction.category);
      setDescription(existingTransaction.description);
      setTransactionNo(existingTransaction.transactionNo || "");
      setAmount(existingTransaction.amount.toString());
      setDate(existingTransaction.date);
      setIsPaid(existingTransaction.isPaid);
    }
  }, [existingTransaction]);

  const handleBack = () => {
    if (isViewMode) {
      navigate("person-detail", { personId, source });
    } else if (source === "payables") {
      navigate("payables");
    } else {
      navigate("person-detail", { personId, source });
    }
  };

  if (!person) {
    return (
      <AppLayout>
        <Header title={tLabel('staffNotFound', 'Staff Not Found')} onBack={handleBack} />
        <ScrollContent>
          <p className="text-center text-muted-foreground">
            {tLabel('staffNotFoundMessage', 'This staff member could not be found.')}
          </p>
        </ScrollContent>
      </AppLayout>
    );
  }

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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) newErrors.description = "Description is required";
    if (!amount || parseInt(amount, 10) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!date) newErrors.date = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isViewMode) return;
    if (!validate()) return;

    const newTransaction = storage.addTransaction({
      personId,
      category,
      description: description.trim(),
      transactionNo: transactionNo.trim() || undefined,
      amount: parseInt(amount, 10),
      date,
      isPaid,
    });

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
        description: `Receipt for: ${description.trim()}`,
        fileName: attachment.file.name,
        fileType: attachment.file.type,
        fileSize: attachment.file.size,
        fileData: attachment.preview,
        linkedRecordType: 'TRANSACTION',
        linkedRecordId: newTransaction.id,
      });
    }

    markClean();
    toast({ title: tLabel('transactionAdded', 'Transaction added successfully') });
    navigate("person-detail", { personId, source });
  };

  const handleDelete = () => {
    if (!data?.transactionId) return;
    
    existingAttachments.forEach(doc => {
      storage.deleteDocument(doc.id);
    });
    
    storage.deleteTransaction(data.transactionId);
    toast({ title: tLabel('transactionDeleted', 'Transaction deleted successfully') });
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

  if (isViewMode && existingTransaction) {
    return (
      <AppLayout>
        <Header
          title={tLabel('viewTransaction', 'View Transaction')}
          subtitle={`${tLabel('for', 'for')} ${person.name}`}
          onBack={handleBack}
          onHome={() => navigate("home")}
          contextLabel={contextLabel}
          contextMode={contextMode}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{tLabel('transactionDetails', 'Transaction Details')}</h2>
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
                {existingTransaction.category === 'payment' ? tLabel('payment', 'Payment') : 
                 existingTransaction.category === 'advance' ? tLabel('advance', 'Advance') : 
                 existingTransaction.category === 'deduction' ? tLabel('deduction', 'Deduction') : 
                 existingTransaction.category === 'other' ? tLabel('other', 'Other') : existingTransaction.category}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('description', 'Description')}</Label>
              <p className="font-medium" data-testid="view-description">{existingTransaction.description}</p>
            </div>

            {existingTransaction.transactionNo && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{tLabel('transactionNo', 'Transaction No.')}</Label>
                <p className="font-medium" data-testid="view-transaction-no">{existingTransaction.transactionNo}</p>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('amount', 'Amount')}</Label>
              <p className="font-medium text-lg" data-testid="view-amount">
                {displaySymbol}{existingTransaction.amount.toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">{tLabel('date', 'Date')}</Label>
              <p className="font-medium" data-testid="view-date">{formatDate(existingTransaction.date)}</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-muted-foreground text-sm">{tLabel('paymentStatus', 'Payment Status')}</Label>
              <Badge variant={existingTransaction.isPaid ? "default" : "secondary"} data-testid="view-status">
                {existingTransaction.isPaid ? tLabel('paid', 'Paid') : tLabel('unpaid', 'Unpaid')}
              </Badge>
            </div>

            {existingTransaction.createdAt && (
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">{tLabel('createdAt', 'Created At')}</Label>
                <p className="text-sm text-muted-foreground" data-testid="view-created-at">
                  {formatDate(existingTransaction.createdAt)}
                </p>
              </div>
            )}
          </section>

          {existingAttachments.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-base font-semibold">{tLabel('attachments', 'Attachments')}</h2>
              <div className="flex flex-col gap-2">
                {existingAttachments.map((doc) => (
                  <Card key={doc.id} className="p-3 flex items-center gap-3">
                    {doc.fileType.startsWith('image/') ? (
                      <ImageIcon className="w-5 h-5 text-primary" />
                    ) : (
                      <FileText className="w-5 h-5 text-primary" />
                    )}
                    <span className="flex-1 text-sm truncate">{doc.fileName}</span>
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
            {tLabel('deleteTransaction', 'Delete Transaction')}
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tLabel('confirmDelete', 'Confirm Delete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {tLabel('deleteTransactionConfirm', 'Are you sure you want to delete this transaction? This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                {tLabel('cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
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
        title={tLabel('transactionDetails', 'Transaction Details')}
        subtitle={`${tLabel('for', 'for')} ${person.name}`}
        onBack={handleBack}
        onHome={handleHomePress}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent>
        {currentBalance > 0 && (
          <Card className="p-4 bg-info/10 border-info/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-muted-foreground">{tLabel('outstandingBalance', 'Outstanding balance')}: </span>
                <span className="font-semibold">
                  {formatCurrency(currentBalance, settings.currency, settings.customCurrencySymbol)}
                </span>
                {source === "attendance" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tLabel('recordingSalaryPayment', 'Recording salary payment for attendance')}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{tLabel('transactionDetails', 'Transaction Details')}</h2>

          <div className="flex flex-col gap-1">
            <Label htmlFor="category">{tLabel('category', 'Category')} <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={category}
              onValueChange={(v) => { setCategory(v); markDirty(); }}
              placeholder={tLabel('selectCategory', 'Select category')}
              searchPlaceholder={tLabel('searchCategories', 'Search categories...')}
              emptyMessage={tLabel('noCategoriesFound', 'No categories found')}
              options={[
                { value: "payment", label: tLabel('payment', 'Payment') },
                { value: "advance", label: tLabel('advance', 'Advance') },
                { value: "deduction", label: tLabel('deduction', 'Deduction') },
                { value: "other", label: tLabel('other', 'Other') },
              ]}
              data-testid="select-category"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="description">{tLabel('description', 'Description')} <span className="text-destructive">*</span></Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty(); }}
              placeholder={source === "attendance" 
                ? tLabel('salaryPaymentAttendance', 'Salary Payment for Attendance')
                : tLabel('transactionPlaceholder', 'e.g., Salary payment, Festival bonus')}
              data-testid="input-description"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="transactionNo">{tLabel('transactionNo', 'Transaction No.')}</Label>
            <Input
              id="transactionNo"
              value={transactionNo}
              onChange={(e) => { setTransactionNo(e.target.value); markDirty(); }}
              placeholder={tLabel('transactionNoPlaceholder', 'e.g., TXN-001, REF-123')}
              data-testid="input-transaction-no"
            />
          </div>

          <div className="flex flex-col gap-1">
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

          <div className="flex flex-col gap-1">
            <Label htmlFor="date">{tLabel('date', 'Date')} <span className="text-destructive">*</span></Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); markDirty(); }}
              data-testid="input-date"
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">{tLabel('attachments', 'Attachments')}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAttachmentChooser(true)}
              data-testid="button-add-attachment"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              {tLabel('add', 'Add')}
            </Button>
          </div>
          
          {pendingAttachments.length > 0 ? (
            <div className="flex flex-col gap-2">
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
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3">
              {tLabel('noAttachments', 'No attachments. Add receipts or invoices.')}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{tLabel('status', 'Status')}</h2>
          <div className="flex items-center space-x-3">
            <Checkbox
              id="isPaid"
              checked={isPaid}
              onCheckedChange={(checked) => { setIsPaid(checked as boolean); markDirty(); }}
              data-testid="checkbox-paid"
            />
            <Label htmlFor="isPaid" className="font-normal cursor-pointer">
              {tLabel('markAsPaid', 'Mark as paid')}
            </Label>
          </div>
        </section>

        <Button className="w-full" onClick={handleSubmit} data-testid="button-save">
          {tLabel('saveTransaction', 'Save Transaction')}
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
