import { useMemo, useState } from "react";
import { FileText, Clock, CheckCircle, AlertCircle, XCircle, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { formatCurrency, formatRecordCurrency } from "@/lib/calculations";
import { currencySymbols, type InvoiceStatus } from "@shared/schema";
import { useActiveContext } from "@/hooks/use-active-context";

const STATUS_CONFIG: Record<InvoiceStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  draft: { icon: FileText, color: "bg-muted text-muted-foreground", label: "Draft" },
  sent: { icon: Clock, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Sent" },
  paid: { icon: CheckCircle, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Paid" },
  overdue: { icon: AlertCircle, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Overdue" },
  cancelled: { icon: XCircle, color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400", label: "Cancelled" },
};

export function StaffInvoicesScreen() {
  const { navigate, goBack } = useNavigation();
  const { contextLabel, contextMode } = useActiveContext();
  
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");

  const [refreshKey, setRefreshKey] = useState(0);
  const settings = useMemo(() => storage.getSettings(), [refreshKey]);
  const profile = useMemo(() => storage.getProfile(), [refreshKey]);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [activeAccountId, showAllContexts, refreshKey]);
  
  const invoices = useMemo(() => {
    if (!profile) return [];
    let list = !showAllContexts && activeAccountId
      ? storage.getStaffInvoicesByAccount(activeAccountId)
      : storage.getStaffInvoices();
    list = list.filter(inv => inv.staffUserId === profile.id);
    
    if (statusFilter !== "all") {
      list = list.filter(inv => inv.status === statusFilter);
    }
    if (clientFilter !== "all") {
      list = list.filter(inv => inv.clientHomeId === clientFilter);
    }
    
    return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [statusFilter, clientFilter, activeAccountId, showAllContexts, profile, refreshKey]);

  const getClientName = (clientHomeId: string) => {
    const client = clientHomes.find(c => c.id === clientHomeId);
    return client?.name || "Unknown Client";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const totalPending = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <AppLayout>
      <Header
        title="Invoices"
        subtitle="Manage your invoices"
        onBack={() => navigate("staff-home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button
            size="icon"
            onClick={() => navigate("staff-add-invoice")}
            data-testid="button-add-invoice"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <ScrollContent>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pending Amount</p>
            <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalPending, settings.currency, settings.customCurrencySymbol)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid, settings.currency, settings.customCurrencySymbol)}
            </p>
          </Card>
        </div>

        <div className="flex gap-3">
          <SearchableSelect
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
            placeholder="Status"
            searchPlaceholder="Search status..."
            emptyMessage="No status found"
            className="flex-1"
            icon={<Filter className="w-4 h-4" />}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            data-testid="select-status-filter"
          />

          <SearchableSelect
            value={clientFilter}
            onValueChange={setClientFilter}
            placeholder="Client"
            searchPlaceholder="Search clients..."
            emptyMessage="No clients found"
            className="flex-1"
            options={[
              { value: "all", label: "All Clients" },
              ...clientHomes.map(client => ({ value: client.id, label: client.name }))
            ]}
            data-testid="select-client-filter"
          />
        </div>

        {invoices.length === 0 ? (
          <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
            <div className="icon-halo-muted w-10 h-10">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">No Invoices Yet</h3>
              <p className="text-xs text-muted-foreground">Create invoices to bill your clients</p>
            </div>
            <Button onClick={() => navigate("staff-add-invoice")} data-testid="button-create-first-invoice">
              <span className="mr-2">+</span>
              Create Invoice
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {invoices.map(invoice => {
              const statusConfig = STATUS_CONFIG[invoice.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <Card
                  key={invoice.id}
                  className="p-4 hover-elevate cursor-pointer"
                  onClick={() => navigate("staff-invoice-view", { invoiceId: invoice.id })}
                  data-testid={`card-invoice-${invoice.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium">{invoice.invoiceNumber}</span>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getClientName(invoice.clientHomeId)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(invoice.issueDate)} - Due: {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold">
                        {formatRecordCurrency(invoice.total, invoice.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
