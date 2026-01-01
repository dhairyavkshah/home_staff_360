import { useState, useMemo, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { formatCurrency, getTodayString } from "@/lib/calculations";
import { currencySymbols, type InvoiceItem, type InvoiceStatus } from "@shared/schema";

function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function StaffAddInvoiceScreen() {
  const { goBack, navigate } = useNavigation();
  const { toast } = useToast();
  const { isDirty, markDirty, markClean } = useSimpleDirtyTracker();
  const data = useNavigationData<{ invoiceId?: string }>();
  
  const profile = useMemo(() => storage.getProfile(), []);
  const clientHomes = useMemo(() => storage.getActiveClientHomes(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

  const editMode = !!data.invoiceId;
  const existingInvoice = useMemo(() => {
    if (!data.invoiceId) return null;
    return storage.getStaffInvoice(data.invoiceId);
  }, [data.invoiceId]);

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

  useEffect(() => {
    if (!editMode) {
      setInvoiceNumber(storage.getNextInvoiceNumber());
    }
  }, [editMode]);

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

    if (editMode && data.invoiceId) {
      storage.updateStaffInvoice(data.invoiceId, invoiceData);
      toast({ title: "Invoice updated" });
    } else {
      storage.addStaffInvoice(invoiceData);
      toast({ title: "Invoice created" });
    }

    markClean();
    navigate("staff-invoices");
  };

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

          <div className="flex flex-col gap-2">
            <Label>Client <span className="text-destructive">*</span></Label>
            <Select value={clientHomeId} onValueChange={(v) => { setClientHomeId(v); markDirty(); }}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clientHomes.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientHomeId && <p className="text-xs text-destructive">{errors.clientHomeId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
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

            <div className="flex flex-col gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { setStatus(v as InvoiceStatus); markDirty(); }}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="issueDate">Issue Date <span className="text-destructive">*</span></Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => { setIssueDate(e.target.value); markDirty(); }}
                data-testid="input-issue-date"
              />
            </div>
            <div className="flex flex-col gap-2">
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
                <Card key={item.id} className="p-3">
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
                          placeholder="Rate"
                          value={item.rate || ""}
                          onChange={(e) => { handleUpdateItem(item.id, 'rate', parseFloat(e.target.value) || 0); markDirty(); }}
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
