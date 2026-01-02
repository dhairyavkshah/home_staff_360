import { useMemo, useState, useCallback, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, MinusCircle, Trash2, Banknote, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PayNowModal } from "@/components/PayNowModal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useActiveContext } from "@/hooks/use-active-context";
import {
  calculatePersonBalance,
  formatCurrency,
  formatRecordCurrency,
  formatShortDate,
  getAttendanceSummary,
  getCategoryLabel,
} from "@/lib/calculations";
import type { Transaction } from "@shared/schema";

export function PersonDetailScreen() {
  const { navigate, goBack, data } = useNavigation();
  const { toast } = useToast();
  const { contextLabel, contextMode } = useActiveContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAttendanceId, setDeleteAttendanceId] = useState<string | null>(null);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [payNowTransaction, setPayNowTransaction] = useState<Transaction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const personId = data.personId as string;
  const source = data.source as "attendance" | "payables" | "quick-pay" | "person-detail" | undefined;

  const handleBack = () => {
    if (source === "payables") {
      navigate("payables");
    } else {
      navigate("people");
    }
  };

  const person = useMemo(() => storage.getPerson(personId), [personId, refreshKey]);
  const settings = useMemo(() => storage.getSettings(), []);
  const balance = calculatePersonBalance(personId);
  const attendanceSummary = useMemo(() => getAttendanceSummary(personId), [personId, refreshKey]);

  const recentAttendance = useMemo(() => {
    return storage
      .getAttendanceByPerson(personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [personId, refreshKey]);

  const recentTransactions = useMemo(() => {
    return storage
      .getTransactionsByPerson(personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [personId, refreshKey]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    refresh();
  }, [personId]);

  if (!person) {
    return (
      <AppLayout>
        <Header title="Staff Not Found" onBack={handleBack} />
        <ScrollContent>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">This staff member could not be found.</p>
            <Button className="mt-4" onClick={handleBack}>
              Go Back
            </Button>
          </Card>
        </ScrollContent>
      </AppLayout>
    );
  }

  const handleEdit = () => {
    navigate("add-person", { personId, editMode: true });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    storage.deletePerson(personId);
    toast({ title: "Staff member deleted" });
    navigate("people");
  };

  const confirmDeleteAttendance = () => {
    if (deleteAttendanceId) {
      storage.deleteAttendance(deleteAttendanceId);
      toast({ title: "Attendance record deleted" });
      setDeleteAttendanceId(null);
      refresh();
    }
  };

  const confirmDeleteTransaction = () => {
    if (deleteTransactionId) {
      storage.deleteTransaction(deleteTransactionId);
      toast({ title: "Transaction deleted" });
      setDeleteTransactionId(null);
      refresh();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FULL":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "HALF":
        return <MinusCircle className="w-4 h-4 text-warning" />;
      case "ABSENT":
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <Header
        title={person.name}
        subtitle={`${person.role} • ${person.phone}`}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDelete}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <div className="content-container pt-4 pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1" data-testid="tab-attendance">
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex-1" data-testid="tab-payment">
              Payment
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollContent>
        {activeTab === "overview" && (
          <>
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={`text-3xl font-bold ${balance > 0 ? "text-warning" : ""}`} data-testid="text-balance">
                  {formatCurrency(balance, settings.currency, settings.customCurrencySymbol)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {balance > 0 ? "owed to staff" : balance < 0 ? "advance given" : "all settled"}
                </p>
              </div>
            </Card>

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Details</h3>
              <Card className="divide-y">
                <div className="p-4 flex justify-between">
                  <span className="text-muted-foreground">Salary Type</span>
                  <span className="font-medium">{person.salaryType}</span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-muted-foreground">Base Rate</span>
                  <span className="font-medium">
                    {formatCurrency(person.baseRate, settings.currency, settings.customCurrencySymbol)}
                    {person.salaryType === "MONTHLY" ? "/mo" : person.salaryType === "DAILY" ? "/day" : "/hr"}
                  </span>
                </div>
                <div className="p-4 flex justify-between">
                  <span className="text-muted-foreground">Half Day</span>
                  <span className="font-medium">
                    {person.halfDayPercentage ?? settings.halfDayPercentage}%
                  </span>
                </div>
              </Card>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Actions</h3>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => navigate("person-calendar", { personId, source })}
                data-testid="button-view-calendar"
              >
                <Calendar className="w-4 h-4 mr-3" />
                View Calendar
              </Button>
            </section>
          </>
        )}

        {activeTab === "attendance" && (
          <>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-success">{attendanceSummary.full}</p>
                  <p className="text-xs text-muted-foreground">Full Days</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{attendanceSummary.half}</p>
                  <p className="text-xs text-muted-foreground">Half Days</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">{attendanceSummary.absent}</p>
                  <p className="text-xs text-muted-foreground">Absent</p>
                </div>
              </div>
            </Card>

            <section className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm">Recent Attendance</h3>
              {recentAttendance.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No attendance records yet
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentAttendance.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-card">
                      {getStatusIcon(entry.status)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{formatShortDate(entry.date)}</p>
                        {entry.hours && (
                          <p className="text-xs text-muted-foreground">{entry.hours} hours</p>
                        )}
                      </div>
                      <span className="text-xs capitalize text-muted-foreground">{entry.status.toLowerCase()}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground shrink-0"
                        onClick={() => setDeleteAttendanceId(entry.id)}
                        data-testid={`button-delete-attendance-${entry.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Button
              className="w-full"
              onClick={() => navigate("add-attendance", { personId, source })}
              data-testid="button-mark-attendance-tab"
            >
              Mark Attendance
            </Button>
          </>
        )}

        {activeTab === "payment" && (
          <>
            <section className="flex flex-col gap-3">
              <h3 className="font-semibold text-sm">Recent Transactions</h3>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No transactions yet
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-2 py-2 px-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {getCategoryLabel(tx.category)} • {formatShortDate(tx.date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-semibold text-sm ${tx.category === "deduction" ? "text-destructive" : ""}`}>
                          {tx.category === "deduction" ? "-" : ""}
                          {formatRecordCurrency(tx.amount, tx.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.isPaid ? "Paid" : "Pending"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!tx.isPaid && tx.category === "payment" && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setPayNowTransaction(tx)}
                            data-testid={`button-pay-now-${tx.id}`}
                          >
                            <Banknote className="w-4 h-4 mr-1" />
                            Pay
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground"
                          onClick={() => setDeleteTransactionId(tx.id)}
                          data-testid={`button-delete-transaction-${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Button
              className="w-full"
              onClick={() => navigate("add-transaction", { 
                personId,
                presetAmount: balance > 0 ? balance : undefined,
                defaultDescription: balance > 0 ? `Salary Payment for ${person.name}` : "",
                defaultCategory: "payment",
                source: "person-detail",
              })}
              data-testid="button-record-payment-tab"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </>
        )}
      </ScrollContent>

      <ConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title={`Delete ${person.name}?`}
        description="This will permanently remove all attendance records, transactions, and data for this staff member. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      <ConfirmModal
        open={!!deleteAttendanceId}
        onOpenChange={() => setDeleteAttendanceId(null)}
        title="Delete Attendance Record?"
        description="This will remove this attendance entry. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteAttendance}
      />

      <ConfirmModal
        open={!!deleteTransactionId}
        onOpenChange={() => setDeleteTransactionId(null)}
        title="Delete Transaction?"
        description="This will remove this transaction entry. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteTransaction}
      />

      {payNowTransaction && person && (
        <PayNowModal
          open={!!payNowTransaction}
          onOpenChange={() => setPayNowTransaction(null)}
          payeeName={person.name}
          amount={payNowTransaction.amount}
          currency={settings.currency}
          customCurrencySymbol={settings.customCurrencySymbol}
          description={payNowTransaction.description}
          onPaymentConfirmed={() => {
            storage.updateTransaction(payNowTransaction.id, { isPaid: true });
            refresh();
            setPayNowTransaction(null);
          }}
          onPaymentCancelled={() => setPayNowTransaction(null)}
        />
      )}
    </AppLayout>
  );
}
