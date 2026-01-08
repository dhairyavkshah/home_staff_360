import { useState, useMemo, useEffect } from "react";
import { Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency, getTodayString } from "@/lib/calculations";
import { currencySymbols, type InvoiceItem, type InvoiceStatus } from "@shared/schema";

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export function StaffAddInvoiceScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  useDirtyForm(isDirty);
  const data = useNavigationData<{ invoiceId?: string; editMode?: boolean }>();
  const { getCurrencySymbol, getCurrencyInputLabel } = useCurrency();
  
  const profile = useMemo(() => storage.getProfile(), []);
  const clientHomes = useMemo(() => storage.getActiveClientHomes(), []);
  const settings = useMemo(() => storage.getSettings(), []);

  const isViewMode = data?.editMode && data?.invoiceId;
  const existingInvoice = useMemo(() => {
    if (!data?.invoiceId) return null;
    return storage.getStaffInvoice(data.invoiceId);
  }, [data?.invoiceId]);

  const displaySymbol = existingInvoice?.recordCurrencySymbol || getCurrencySymbol();
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

  const today = getTodayString();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

  const [clientHomeId, setClientHomeId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDueDateStr);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!data?.invoiceId) {
      setInvoiceNumber(storage.getNextInvoiceNumber());
    }
  }, [data?.invoiceId]);

  useEffect(() => {
    if (existingInvoice) {
      setClientHomeId(existingInvoice.clientHomeId);
      setInvoiceNumber(existingInvoice.invoiceNumber);
      setIssueDate(existingInvoice.issueDate);
      setDueDate(existingInvoice.dueDate);
      setItems(existingInvoice.items);
      setTaxRate(existingInvoice.taxRate?.toString() || "");
      setNotes(existingInvoice.notes || "");
      setStatus(existingInvoice.status);
    }
  }, [existingInvoice]);

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = taxRate ? (subtotal * parseFloat(taxRate)) / 100 : 0;
  const total = subtotal + taxAmount;

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: generateItemId(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
    markDirty();
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') {
        updated.amount = (updated.quantity || 0) * (updated.rate || 0);
      }
      return updated;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    markDirty();
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!clientHomeId) newErrors.clientHomeId = "Client is required";
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice number is required";
    if (!issueDate) newErrors.issueDate = "Issue date is required";
    if (!dueDate) newErrors.dueDate = "Due date is required";
    if (items.length === 0) newErrors.items = "At least one item is required";
    
    const invalidItems = items.filter(item => !item.description.trim() || item.rate <= 0);
    if (invalidItems.length > 0) {
      newErrors.items = "Fill in all item details";
    }

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

  const handleSave = (saveStatus: InvoiceStatus = status) => {
    if (isViewMode) return;
    if (!validate() || !profile) return;

    const invoiceData = {
      staffUserId: profile.id,
      clientHomeId,
      invoiceNumber: invoiceNumber.trim(),
      issueDate,
      dueDate,
      items,
      subtotal,
      taxRate: taxRate ? parseFloat(taxRate) : undefined,
      taxAmount: taxAmount || undefined,
      total,
      status: saveStatus,
      notes: notes.trim() || undefined,
    };

    if (data?.invoiceId && !isViewMode) {
      storage.updateStaffInvoice(data.invoiceId, invoiceData);
      toast({ title: "Invoice updated" });
    } else {
      storage.addStaffInvoice(invoiceData);
      toast({ title: "Invoice created" });
    }

    markClean();
    navigate("staff-invoices");
  };

  const handleDelete = () => {
    if (!data?.invoiceId) return;
    
    storage.deleteStaffInvoice(data.invoiceId);
    toast({ title: "Invoice deleted" });
    navigate("staff-invoices");
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

  const getClientName = (clientId: string) => {
    const client = clientHomes.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };

  const getStatusVariant = (s: InvoiceStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (s) {
      case "paid": return "default";
      case "sent": return "secondary";
      case "overdue": return "destructive";
      case "cancelled": return "outline";
      default: return "secondary";
    }
  };

  if (isViewMode && existingInvoice) {
    return (
      <AppLayout>
        <Header
          title="View Invoice"
          subtitle={existingInvoice.invoiceNumber}
          onBack={() => navigate("staff-invoices")}
          onHome={() => navigate("staff-home")}
        />

        <ScrollContent>
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Invoice Details</h2>
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
              <Label className="text-muted-foreground text-sm">Client</Label>
              <p className="font-medium" data-testid="view-client">
                {getClientName(existingInvoice.clientHomeId)}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">Invoice Number</Label>
              <p className="font-medium" data-testid="view-invoice-number">{existingInvoice.invoiceNumber}</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label className="text-muted-foreground text-sm">Status</Label>
              <Badge variant={getStatusVariant(existingInvoice.status)} data-testid="view-status">
                {STATUS_LABELS[existingInvoice.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">Issue Date</Label>
                <p className="font-medium" data-testid="view-issue-date">{formatDate(existingInvoice.issueDate)}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-sm">Due Date</Label>
                <p className="font-medium" data-testid="view-due-date">{formatDate(existingInvoice.dueDate)}</p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4 mt-6">
            <h2 className="text-lg font-semibold">Items</h2>

            {existingInvoice.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items</p>
            ) : (
              <div className="flex flex-col gap-3">
                {existingInvoice.items.map((item, index) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex flex-col gap-2">
                      <p className="font-medium" data-testid={`view-item-description-${index}`}>{item.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <span data-testid={`view-item-qty-${index}`}>Qty: {item.quantity}</span>
                        <span data-testid={`view-item-rate-${index}`}>Rate: {displaySymbol}{item.rate.toFixed(2)}</span>
                        <span className="text-right font-medium text-foreground" data-testid={`view-item-amount-${index}`}>
                          {displaySymbol}{item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 mt-6">
            <h2 className="text-lg font-semibold">Totals</h2>

            <Card className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="view-subtotal">{displaySymbol}{existingInvoice.subtotal.toFixed(2)}</span>
                </div>
                
                {existingInvoice.taxRate && existingInvoice.taxRate > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax Rate</span>
                      <span data-testid="view-tax-rate">{existingInvoice.taxRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span data-testid="view-tax-amount">{displaySymbol}{(existingInvoice.taxAmount || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg" data-testid="view-total">{displaySymbol}{existingInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </section>

          {existingInvoice.notes && (
            <section className="flex flex-col gap-4 mt-6">
              <h2 className="text-lg font-semibold">Notes</h2>
              <p className="text-sm text-muted-foreground" data-testid="view-notes">{existingInvoice.notes}</p>
            </section>
          )}

          <section className="flex flex-col gap-4 mt-6">
            <div className="flex flex-col gap-1">
              <Label className="text-muted-foreground text-sm">Created On</Label>
              <p className="text-sm text-muted-foreground" data-testid="view-created">
                {formatDate(existingInvoice.createdAt)}
              </p>
            </div>
          </section>

          <Button 
            variant="destructive" 
            className="w-full mt-6" 
            onClick={() => setShowDeleteDialog(true)} 
            data-testid="button-delete"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Invoice
          </Button>
        </ScrollContent>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this invoice? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
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
        title="Invoice Details"
        subtitle={invoiceNumber || "New Invoice"}
        onBack={() => navigate("staff-invoices")}
        onHome={handleHomePress}
      />

      <ScrollContent>
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Invoice Details</h2>

          <div className="flex flex-col gap-4">
            <Label>Client <span className="text-destructive">*</span></Label>
            <SearchableSelect
              value={clientHomeId}
              onValueChange={(v) => { setClientHomeId(v); markDirty(); }}
              placeholder="Select client"
              searchPlaceholder="Search clients..."
              emptyMessage="No clients found"
              options={clientHomes.map(client => ({
                value: client.id,
                label: client.name,
              }))}
              data-testid="select-client"
            />
            {errors.clientHomeId && <p className="text-xs text-destructive">{errors.clientHomeId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-4">
              <Label htmlFor="invoiceNumber">Invoice Number <span className="text-destructive">*</span></Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => { setInvoiceNumber(e.target.value); markDirty(); }}
                placeholder="INV-2025-0001"
                data-testid="input-invoice-number"
              />
              {errors.invoiceNumber && <p className="text-xs text-destructive">{errors.invoiceNumber}</p>}
            </div>

            <div className="flex flex-col gap-4">
              <Label>Status</Label>
              <SearchableSelect
                value={status}
                onValueChange={(v) => { setStatus(v as InvoiceStatus); markDirty(); }}
                placeholder="Select status"
                searchPlaceholder="Search status..."
                emptyMessage="No status found"
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "sent", label: "Sent" },
                  { value: "paid", label: "Paid" },
                  { value: "overdue", label: "Overdue" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
                data-testid="select-status"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-4">
              <Label htmlFor="issueDate">Issue Date <span className="text-destructive">*</span></Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => { setIssueDate(e.target.value); markDirty(); }}
                data-testid="input-issue-date"
              />
            </div>
            <div className="flex flex-col gap-4">
              <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
                data-testid="input-due-date"
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Items</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              data-testid="button-add-item"
            >
              <span className="mr-1">+</span>
              Add Item
            </Button>
          </div>
          {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}

          {items.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">No items yet</p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={handleAddItem}
                data-testid="button-add-first-item"
              >
                <span className="mr-1">+</span>
                Add First Item
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => { handleUpdateItem(item.id, 'description', e.target.value); markDirty(); }}
                        data-testid={`input-item-description-${index}`}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => { handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0); markDirty(); }}
                          data-testid={`input-item-qty-${index}`}
                        />
                        <Input
                          type="number"
                          step="1"
                          placeholder="Rate"
                          value={item.rate || ""}
                          onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); handleUpdateItem(item.id, 'rate', parseInt(val, 10) || 0); markDirty(); }}
                          data-testid={`input-item-rate-${index}`}
                        />
                        <div className="flex items-center justify-end font-medium">
                          {symbol}{item.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4 mt-6">
          <h2 className="text-lg font-semibold">Totals</h2>

          <Card className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, settings.currency, settings.customCurrencySymbol)}</span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Tax Rate (%)</span>
                <Input
                  type="number"
                  className="w-20 text-right"
                  placeholder="0"
                  value={taxRate}
                  onChange={(e) => { setTaxRate(e.target.value); markDirty(); }}
                  data-testid="input-tax-rate"
                />
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(taxAmount, settings.currency, settings.customCurrencySymbol)}</span>
                </div>
              )}

              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-lg">{formatCurrency(total, settings.currency, settings.customCurrencySymbol)}</span>
              </div>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); markDirty(); }}
              placeholder="Payment terms, additional notes..."
              rows={3}
              data-testid="textarea-notes"
            />
          </div>
        </section>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave("draft")}
            data-testid="button-save-draft"
          >
            Save Draft
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleSave("sent")}
            data-testid="button-send-invoice"
          >
            Send Invoice
          </Button>
        </div>
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
