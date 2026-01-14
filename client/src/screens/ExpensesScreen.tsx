import { useMemo, useState } from "react";
import { Receipt, Check, Clock, AlertCircle, Eye, Trash2, Banknote, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PayNowModal } from "@/components/PayNowModal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { SearchBar } from "@/components/SearchBar";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatRecordCurrency, formatShortDate, groupTotalsByCurrency, formatCurrencyTotals } from "@/lib/calculations";
import { getCurrencySymbol } from "@shared/schema";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";
import { parseISO, startOfDay, addDays, isBefore, isToday } from "date-fns";
import type { Expense } from "@shared/schema";

type TabType = "all" | "unpaid" | "paid";

export function ExpensesScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  const settings = useMemo(() => storage.getSettings(), []);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const accountId = storage.getActiveAccountId();
    const all = accountId ? storage.getExpensesByAccount(accountId) : storage.getExpenses();
    return all.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payNowExpense, setPayNowExpense] = useState<Expense | null>(null);

  const refreshExpenses = () => {
    const accountId = storage.getActiveAccountId();
    const all = accountId ? storage.getExpensesByAccount(accountId) : storage.getExpenses();
    setExpenses(all.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()));
  };

  const filteredExpenses = useMemo(() => {
    let result = expenses;

    switch (activeTab) {
      case "unpaid":
        result = result.filter((e) => !e.isPaid);
        break;
      case "paid":
        result = result.filter((e) => e.isPaid);
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          (e.vendor && e.vendor.toLowerCase().includes(query)) ||
          e.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [expenses, activeTab, searchQuery]);

  const getExpenseStatus = (expense: Expense) => {
    if (expense.isPaid) return "paid";
    if (!expense.dueDate) return "pending";

    const dueDate = parseISO(expense.dueDate);
    const todayDate = startOfDay(new Date());

    if (isBefore(dueDate, todayDate) && !isToday(dueDate)) {
      return "overdue";
    }
    if (isBefore(dueDate, addDays(todayDate, 3))) {
      return "dueSoon";
    }
    return "pending";
  };

  const statusConfig = {
    paid: { color: "bg-success/10 text-success", label: t("paid"), icon: Check },
    overdue: { color: "bg-destructive/10 text-destructive", label: t("overdue"), icon: AlertCircle },
    dueSoon: { color: "bg-warning/10 text-warning", label: t("dueSoon"), icon: Clock },
    pending: { color: "bg-muted text-muted-foreground", label: t("pending"), icon: Clock },
  };

  const togglePaid = (id: string, currentStatus: boolean) => {
    storage.updateExpense(id, { isPaid: !currentStatus });
    refreshExpenses();
    toast({ title: currentStatus ? t("markedAsUnpaid") : t("markedAsPaid"), variant: "success" });
  };

  const handleDelete = () => {
    if (deleteId) {
      storage.deleteExpense(deleteId);
      refreshExpenses();
      toast({ title: t("expenseDeleted"), variant: "success" });
      setDeleteId(null);
    }
  };

  const counts = useMemo(() => ({
    all: expenses.length,
    unpaid: expenses.filter((e) => !e.isPaid).length,
    paid: expenses.filter((e) => e.isPaid).length,
  }), [expenses]);

  const renderTab = (tab: TabType, label: string) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tab
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover-elevate"
      }`}
      data-testid={`tab-${tab}`}
    >
      {label} ({counts[tab]})
    </button>
  );

  return (
    <AppLayout>
      <Header
        title={t("expensesBills")}
        subtitle={t("trackHouseholdExpenses")}
        onBack={() => navigate("home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => navigate("expense-calendar")} data-testid="button-calendar">
              <Receipt className="h-5 w-5" />
            </Button>
            <Button size="icon" onClick={() => navigate("add-expense")} data-testid="button-add-expense-header">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <ScrollContent>
        <div className="flex gap-2 flex-wrap" data-testid="tabs-container">
          {renderTab("all", t("all"))}
          {renderTab("unpaid", t("unpaid"))}
          {renderTab("paid", t("paid"))}
        </div>

        {expenses.length > 0 && (
          <SearchBar
            placeholder={t("searchByTitleOrVendor")}
            value={searchQuery}
            onChange={setSearchQuery}
            testId="search-expenses"
          />
        )}

        {filteredExpenses.length === 0 ? (
          <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
            <div className="icon-halo-muted w-10 h-10">
              <Receipt className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{t("noExpenses")}</h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? t("noResultsFound") : t("addYourFirstExpense")}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => navigate("add-expense")} data-testid="button-add-expense-empty">
                <span className="mr-2">+</span>
                {t("addExpense")}
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-3" data-testid="list-expenses">
              {filteredExpenses.map((expense) => {
                const status = getExpenseStatus(expense);
                const config = statusConfig[status];
                const StatusIcon = config.icon;

                return (
                  <div
                    key={expense.id}
                    className="flex items-center gap-2 py-2.5 px-3 rounded-lg border bg-card"
                    data-testid={`card-expense-${expense.id}`}
                  >
                    <div
                      className={`w-8 h-8 shrink-0 ${
                        expense.isPaid
                          ? "icon-halo-success"
                          : status === "overdue"
                          ? "icon-halo-destructive"
                          : "icon-halo-warning"
                      }`}
                    >
                      <StatusIcon className={`w-4 h-4 ${
                        expense.isPaid
                          ? "text-success"
                          : status === "overdue"
                          ? "text-destructive"
                          : "text-warning"
                      }`} />
                    </div>
                    
                    <div 
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => togglePaid(expense.id, expense.isPaid)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{expense.title}</p>
                        <p className="font-semibold text-sm shrink-0">
                          {formatRecordCurrency(expense.amount, expense.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {expense.vendor || expense.category} • {t("due")} {formatShortDate(expense.dueDate)}
                        </p>
                        <Badge 
                          variant={status === "overdue" ? "destructive" : "secondary"} 
                          className={`text-xs shrink-0 ${config.color}`}
                          data-testid={`badge-status-${expense.id}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="shrink-0" data-testid={`button-menu-${expense.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!expense.isPaid && (
                          <DropdownMenuItem 
                            onClick={() => setPayNowExpense(expense)}
                            data-testid={`button-pay-${expense.id}`}
                          >
                            <Banknote className="w-4 h-4 mr-2 text-success" />
                            {t("payNow")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => navigate("add-expense", { expenseId: expense.id, editMode: true })}
                          data-testid={`button-view-${expense.id}`}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t("view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(expense.id)}
                          className="text-destructive"
                          data-testid={`button-delete-${expense.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ScrollContent>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t("deleteExpense")}
        description={t("deleteExpenseConfirm")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />

      {payNowExpense && (
        <PayNowModal
          open={!!payNowExpense}
          onOpenChange={() => setPayNowExpense(null)}
          payeeName={payNowExpense.vendor || payNowExpense.title}
          amount={payNowExpense.amount}
          currency={settings.currency}
          customCurrencySymbol={settings.customCurrencySymbol}
          description={payNowExpense.title}
          onPaymentConfirmed={() => {
            storage.updateExpense(payNowExpense.id, { isPaid: true });
            refreshExpenses();
            setPayNowExpense(null);
          }}
          onPaymentCancelled={() => setPayNowExpense(null)}
        />
      )}
    </AppLayout>
  );
}
