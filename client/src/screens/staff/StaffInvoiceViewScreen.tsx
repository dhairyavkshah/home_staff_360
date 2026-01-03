import { useMemo, useState } from "react";
import { Edit2, Trash2, FileText, Clock, CheckCircle, AlertCircle, XCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatRecordCurrency } from "@/lib/calculations";
import { currencySymbols, type InvoiceStatus } from "@shared/schema";
import { Share } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { useI18n } from "@/lib/i18n/i18n-context";

const STATUS_CONFIG: Record<InvoiceStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-muted text-muted-foreground", label: "Draft" },
  sent: { icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
  paid: { icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Paid" },
  overdue: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Overdue" },
  cancelled: { icon: XCircle, color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", label: "Cancelled" },
};

export function StaffInvoiceViewScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useI18n();
  const data = useNavigationData<{ invoiceId: string }>();
  
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];
  const [refreshKey] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [activeAccountId, showAllContexts, refreshKey]);
  
  const invoice = useMemo(() => {
    if (!data.invoiceId) return null;
    return storage.getStaffInvoice(data.invoiceId);
  }, [data.invoiceId]);

  const client = useMemo(() => {
    if (!invoice) return null;
    return clientHomes.find(c => c.id === invoice.clientHomeId);
  }, [invoice, clientHomes]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDelete = () => {
    if (!data.invoiceId) return;
    storage.deleteStaffInvoice(data.invoiceId);
    toast({ title: "Invoice deleted" });
    navigate("staff-invoices");
  };

  const handleMarkPaid = () => {
    if (!data.invoiceId) return;
    storage.updateStaffInvoice(data.invoiceId, { 
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0]
    });
    toast({ title: "Invoice marked as paid" });
    navigate("staff-invoices");
  };

  const generateInvoiceText = () => {
    if (!invoice) return "";
    const sym = invoice.recordCurrencySymbol || symbol;
    
    let text = `INVOICE: ${invoice.invoiceNumber}\n`;
    text += `Date: ${formatDate(invoice.issueDate)}\n`;
    text += `Due Date: ${formatDate(invoice.dueDate)}\n`;
    text += `Status: ${statusConfig?.label || invoice.status}\n\n`;
    
    if (client) {
      text += `CLIENT:\n`;
      text += `${client.name}\n`;
      if (client.address) text += `${client.address}\n`;
      if (client.contactName) text += `${client.contactName}\n`;
      if (client.contactPhone) text += `${client.contactPhone}\n`;
      text += `\n`;
    }
    
    text += `ITEMS:\n`;
    text += `-`.repeat(40) + `\n`;
    invoice.items.forEach((item) => {
      text += `${item.description}\n`;
      text += `${item.quantity} x ${sym}${item.rate.toFixed(2)} = ${sym}${item.amount.toFixed(2)}\n\n`;
    });
    
    text += `-`.repeat(40) + `\n`;
    text += `Subtotal: ${sym}${invoice.subtotal.toFixed(2)}\n`;
    if (invoice.taxRate && invoice.taxAmount) {
      text += `Tax (${invoice.taxRate}%): ${sym}${invoice.taxAmount.toFixed(2)}\n`;
    }
    text += `TOTAL: ${sym}${invoice.total.toFixed(2)}\n`;
    
    if (invoice.notes) {
      text += `\nNotes: ${invoice.notes}\n`;
    }
    
    return text;
  };

  const handleShareInvoice = async () => {
    if (!invoice) return;
    
    setIsSharing(true);
    try {
      const invoiceText = generateInvoiceText();
      const title = `Invoice ${invoice.invoiceNumber}`;
      
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: title,
          text: invoiceText,
          dialogTitle: t("shareInvoice"),
        });
        toast({ title: t("invoiceShared") });
      } else if (navigator.share) {
        await navigator.share({
          title: title,
          text: invoiceText,
        });
        toast({ title: t("invoiceShared") });
      } else {
        await navigator.clipboard.writeText(invoiceText);
        toast({ 
          title: t("success"), 
          description: "Invoice copied to clipboard" 
        });
      }
    } catch (error) {
      if ((error as Error).message?.includes("cancel") || (error as Error).message?.includes("Cancel")) {
        return;
      }
      console.error("Share error:", error);
      toast({
        title: t("error"),
        description: "Could not share invoice",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!invoice) {
    return (
      <AppLayout>
        <Header title="Invoice Not Found" onBack={() => navigate("staff-invoices")} />
        <ScrollContent>
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">This invoice could not be found.</p>
          </div>
        </ScrollContent>
      </AppLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[invoice.status];
  const StatusIcon = statusConfig.icon;

  return (
    <AppLayout>
      <Header
        title={invoice.invoiceNumber}
        subtitle={client?.name || "Unknown Client"}
        onBack={() => navigate("staff-invoices")}
        onEdit={() => navigate("staff-add-invoice", { invoiceId: invoice.id })}
        onDelete={handleDelete}
      />

      <ScrollContent>
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <Button size="sm" onClick={handleMarkPaid} data-testid="button-mark-paid">
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Paid
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            {invoice.paidDate && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Paid Date</p>
                <p className="font-medium text-green-600">{formatDate(invoice.paidDate)}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Client Details</h3>
          {client ? (
            <div className="text-sm space-y-1">
              <p className="font-medium">{client.name}</p>
              {client.address && <p className="text-muted-foreground">{client.address}</p>}
              {client.contactName && <p>{client.contactName}</p>}
              {client.contactPhone && <p className="text-muted-foreground">{client.contactPhone}</p>}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Client details unavailable</p>
          )}
        </Card>

        <Card className="p-4 mb-4">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-3">
            {invoice.items.map((item, index) => (
              <div key={item.id} className="flex justify-between gap-2 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} x {invoice.recordCurrencySymbol || symbol}{item.rate.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium">
                  {formatRecordCurrency(item.amount, invoice.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRecordCurrency(invoice.subtotal, invoice.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
            {invoice.taxRate && invoice.taxAmount && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                <span>{formatRecordCurrency(invoice.taxAmount, invoice.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2 font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatRecordCurrency(invoice.total, invoice.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
          </div>
        </Card>

        {invoice.notes && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </Card>
        )}

        <div className="flex gap-3 mt-4">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleShareInvoice}
            disabled={isSharing}
            data-testid="button-share-invoice"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {t("shareInvoice")}
          </Button>
        </div>

        <div className="flex gap-3 mt-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("staff-add-invoice", { invoiceId: invoice.id })}
            data-testid="button-edit-invoice"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t("edit")}
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1" 
            data-testid="button-delete-invoice"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("delete")}
          </Button>
        </div>

        <ConfirmModal
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title="Delete Invoice?"
          description={`This will permanently delete invoice ${invoice.invoiceNumber}. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </ScrollContent>
    </AppLayout>
  );
}
