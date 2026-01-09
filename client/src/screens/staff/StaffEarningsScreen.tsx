import { useState, useMemo, useCallback, useEffect } from "react";
import { TrendingUp, ChevronLeft, ChevronRight, Trash2, Edit, MoreVertical, Receipt, FileText, Link2, Check, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { currencySymbols } from "@shared/schema";
import { collaborationService, type CollaborationBinding, type SharedPaymentRecord } from "@/lib/collaboration-service";
import { realtimeService } from "@/lib/realtime-service";

export function StaffEarningsScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteAttendanceId, setDeleteAttendanceId] = useState<string | null>(null);
  const [deleteLaundryId, setDeleteLaundryId] = useState<string | null>(null);

  const [bindings, setBindings] = useState<CollaborationBinding[]>([]);
  const [sharedPayments, setSharedPayments] = useState<SharedPaymentRecord[]>([]);
  const [actioningPaymentId, setActioningPaymentId] = useState<string | null>(null);

  const isAuthenticated = collaborationService.isAuthenticated();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const fetchBindings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { bindings: fetchedBindings } = await collaborationService.getBindings();
      setBindings(fetchedBindings || []);

      const allPayments: SharedPaymentRecord[] = [];
      for (const binding of (fetchedBindings || [])) {
        if (binding.isActive) {
          try {
            const { payments } = await collaborationService.getSharedPayments({ bindingId: binding.id });
            if (payments) {
              allPayments.push(...payments);
            }
          } catch (err) {
            console.error(`Failed to fetch shared payments for binding ${binding.id}:`, err);
          }
        }
      }
      setSharedPayments(allPayments);
    } catch (err) {
      console.error("Failed to fetch bindings:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = realtimeService.on("collab:payment-update", () => {
      fetchBindings();
      refresh();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchBindings, refresh]);

  const handlePaymentAction = useCallback(async (paymentId: string, action: "approve" | "reject") => {
    setActioningPaymentId(paymentId);
    try {
      await collaborationService.actionSharedPayment(paymentId, action);
      toast({
        title: action === "approve" ? "Payment approved" : "Payment rejected",
      });
      fetchBindings();
    } catch (err) {
      toast({
        title: t("error") || "Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setActioningPaymentId(null);
    }
  }, [fetchBindings, toast, t]);

  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  
  const accountIdForFilter = !showAllContexts && activeAccountId ? activeAccountId : null;
  
  const earnings = useMemo(
    () => storage.calculateStaffMonthlyEarnings(year, month, accountIdForFilter),
    [year, month, refreshKey, accountIdForFilter]
  );
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [refreshKey, activeAccountId, showAllContexts]);
  const homeNames = new Map(clientHomes.map(h => [h.id, h.name]));

  const attendance = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const records = !showAllContexts && activeAccountId 
      ? storage.getSelfAttendanceByAccount(activeAccountId)
      : storage.getSelfAttendance();
    return records.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd && a.status !== 'ABSENT';
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [year, month, refreshKey, activeAccountId, showAllContexts]);

  const laundryJobs = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const jobs = !showAllContexts && activeAccountId
      ? storage.getStaffLaundryJobsByAccount(activeAccountId)
      : storage.getStaffLaundryJobs();
    return jobs.filter(j => {
      const date = new Date(j.date);
      return date >= monthStart && date <= monthEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [year, month, refreshKey, activeAccountId, showAllContexts]);

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const confirmDeleteAttendance = () => {
    if (deleteAttendanceId) {
      storage.deleteSelfAttendance(deleteAttendanceId);
      toast({ title: t("attendanceDeleted") || "Attendance deleted" });
      setDeleteAttendanceId(null);
      refresh();
    }
  };

  const confirmDeleteLaundry = () => {
    if (deleteLaundryId) {
      storage.deleteStaffLaundryJob(deleteLaundryId);
      toast({ title: t("laundryJobDeleted") || "Laundry job deleted" });
      setDeleteLaundryId(null);
      refresh();
    }
  };

  return (
    <AppLayout>
      <Header
        title={t("earnings")}
        subtitle={t("trackYourIncome")}
        onBack={() => navigate("staff-home")}
      />

      <ScrollContent>
        <div className="flex items-center justify-between">
          <Button size="icon" variant="ghost" onClick={goToPrevMonth} data-testid="button-prev-month">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <Button size="icon" variant="ghost" onClick={goToNextMonth} data-testid="button-next-month">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="icon-halo-primary w-10 h-10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("totalEarnings")}</p>
              <p className="text-3xl font-bold">{symbol}{earnings.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">{t("work")}</p>
              <p className="font-semibold">{symbol}{earnings.fromAttendance.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">{t("laundry")}</p>
              <p className="font-semibold">{symbol}{earnings.fromLaundry.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">{t("bonusTips")}</p>
              <p className="font-semibold">{symbol}{earnings.bonusAndTips.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("staff-expenses")}
            data-testid="button-expenses"
          >
            <Receipt className="w-4 h-4 mr-2" />
            {t("expenses")}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("staff-reports")}
            data-testid="button-reports"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t("reports")}
          </Button>
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm">{t("workDays")} ({attendance.length})</h3>
          {attendance.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noAttendanceThisMonth")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {attendance.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{homeNames.get(a.clientHomeId) || t("unknown")}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={a.status === 'FULL' ? 'default' : 'secondary'} className="text-xs shrink-0">
                    {a.status === 'FULL' ? t("fullDay") : t("halfDay")}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-menu-attendance-${a.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate("staff-edit-attendance", { attendanceId: a.id })}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAttendanceId(a.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {attendance.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{attendance.length - 10} {t("more")}
                </p>
              )}
            </div>
          )}
        </section>

        {laundryJobs.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold text-sm">{t("laundryJobs")} ({laundryJobs.length})</h3>
            <div className="flex flex-col gap-3">
              {laundryJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{homeNames.get(job.clientHomeId) || t("unknown")}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.itemCount} {t("items")} - {new Date(job.date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{job.recordCurrencySymbol || symbol}{job.totalEarned}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" data-testid={`button-menu-laundry-${job.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate("staff-edit-laundry", { laundryJobId: job.id })}>
                        <Edit className="w-4 h-4 mr-2" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteLaundryId(job.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </section>
        )}

        {isAuthenticated && sharedPayments.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Payments from Employers ({sharedPayments.length})</h3>
            </div>
            <div className="flex flex-col gap-3">
              {sharedPayments.map((payment) => {
                const getStatusBadge = () => {
                  switch (payment.approvalStatus) {
                    case "pending":
                      return <Badge variant="secondary" className="text-xs shrink-0" data-testid={`badge-status-${payment.id}`}>{t("pending") || "Pending"}</Badge>;
                    case "approved":
                      return <Badge variant="default" className="text-xs shrink-0 bg-green-600" data-testid={`badge-status-${payment.id}`}>Approved</Badge>;
                    case "rejected":
                      return <Badge variant="destructive" className="text-xs shrink-0" data-testid={`badge-status-${payment.id}`}>Rejected</Badge>;
                    default:
                      return null;
                  }
                };

                const paymentCurrency = payment.recordCurrencySymbol 
                  || (payment.recordCurrency 
                    ? (currencySymbols[payment.recordCurrency as keyof typeof currencySymbols] || payment.recordCurrency)
                    : symbol);

                return (
                  <div key={payment.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card" data-testid={`card-payment-${payment.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{payment.counterpartyName || payment.homePersonName || t("unknown")}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.category} - {new Date(payment.date).toLocaleDateString()}
                      </p>
                      {payment.note && (
                        <p className="text-xs text-muted-foreground truncate">{payment.note}</p>
                      )}
                    </div>
                    <p className="font-semibold text-sm shrink-0">{paymentCurrency}{payment.amount.toLocaleString()}</p>
                    {getStatusBadge()}
                    {payment.approvalStatus === "pending" && payment.needsAction && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-100"
                          onClick={() => handlePaymentAction(payment.id, "approve")}
                          disabled={actioningPaymentId === payment.id}
                          data-testid={`button-approve-payment-${payment.id}`}
                        >
                          {actioningPaymentId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handlePaymentAction(payment.id, "reject")}
                          disabled={actioningPaymentId === payment.id}
                          data-testid={`button-reject-payment-${payment.id}`}
                        >
                          {actioningPaymentId === payment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </ScrollContent>

      <ConfirmModal
        open={!!deleteAttendanceId}
        onOpenChange={() => setDeleteAttendanceId(null)}
        title={t("deleteAttendance") || "Delete Attendance?"}
        description={t("deleteAttendanceConfirm") || "This will remove this attendance entry. This action cannot be undone."}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={confirmDeleteAttendance}
      />

      <ConfirmModal
        open={!!deleteLaundryId}
        onOpenChange={() => setDeleteLaundryId(null)}
        title={t("deleteLaundryJob") || "Delete Laundry Job?"}
        description={t("deleteLaundryJobConfirm") || "This will remove this laundry job entry. This action cannot be undone."}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={confirmDeleteLaundry}
      />
    </AppLayout>
  );
}
