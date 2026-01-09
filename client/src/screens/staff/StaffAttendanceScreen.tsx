import { useState, useMemo, useCallback, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, MinusCircle, XCircle, Home, Eye, Trash2, MoreVertical, Link2, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { useActiveContext } from "@/hooks/use-active-context";
import { collaborationService, type CollaborationBinding, type SharedAttendanceRecord } from "@/lib/collaboration-service";
import { realtimeService } from "@/lib/realtime-service";

export function StaffAttendanceScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedHomeId, setSelectedHomeId] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [bindings, setBindings] = useState<CollaborationBinding[]>([]);
  const [sharedAttendance, setSharedAttendance] = useState<Map<string, SharedAttendanceRecord[]>>(new Map());
  const [actioningId, setActioningId] = useState<string | null>(null);

  const isAuthenticated = collaborationService.isAuthenticated();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const fetchBindings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { bindings: fetchedBindings } = await collaborationService.getBindings();
      setBindings(fetchedBindings || []);
      
      const newSharedAttendance = new Map<string, SharedAttendanceRecord[]>();
      for (const binding of (fetchedBindings || [])) {
        if (binding.isActive) {
          try {
            const { attendance } = await collaborationService.getSharedAttendance(binding.id);
            newSharedAttendance.set(binding.id, attendance || []);
          } catch (err) {
            console.error(`Failed to fetch shared attendance for binding ${binding.id}:`, err);
          }
        }
      }
      setSharedAttendance(newSharedAttendance);
    } catch (err) {
      console.error("Failed to fetch bindings:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unsubscribe = realtimeService.on("collab:attendance-update", (data) => {
      console.log("[StaffAttendanceScreen] Received attendance update:", data);
      fetchBindings();
      refresh();
    });
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchBindings, refresh]);

  const handleActionAttendance = async (attendanceId: string, action: "approve" | "reject") => {
    setActioningId(attendanceId);
    try {
      await collaborationService.actionAttendance(attendanceId, action);
      toast({ 
        title: action === "approve" 
          ? (t("attendanceApproved") || "Attendance approved") 
          : (t("attendanceRejected") || "Attendance rejected") 
      });
      fetchBindings();
    } catch (err) {
      toast({ 
        title: t("error") || "Error", 
        description: err instanceof Error ? err.message : "Failed to update attendance",
        variant: "destructive" 
      });
    } finally {
      setActioningId(null);
    }
  };

  const filteredSharedAttendance = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const allRecords: SharedAttendanceRecord[] = [];
    
    sharedAttendance.forEach((records) => {
      records.forEach(record => {
        const date = new Date(record.date);
        if (date >= monthStart && date <= monthEnd) {
          allRecords.push(record);
        }
      });
    });
    
    return allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sharedAttendance, year, month]);

  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [refreshKey, activeAccountId, showAllContexts]);
  
  const homeNames = useMemo(() => {
    const map = new Map<string, string>();
    clientHomes.forEach(h => map.set(h.id, h.name));
    return map;
  }, [clientHomes]);

  const attendance = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let records = !showAllContexts && activeAccountId 
      ? storage.getSelfAttendanceByAccount(activeAccountId)
      : storage.getSelfAttendance();
    records = records.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });
    if (selectedHomeId !== "all") {
      records = records.filter(a => a.clientHomeId === selectedHomeId);
    }
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [year, month, selectedHomeId, refreshKey, activeAccountId, showAllContexts]);

  const summary = useMemo(() => {
    const full = attendance.filter(a => a.status === 'FULL').length;
    const half = attendance.filter(a => a.status === 'HALF').length;
    const absent = attendance.filter(a => a.status === 'ABSENT').length;
    return { full, half, absent, total: full + half + absent };
  }, [attendance]);

  const monthName = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      storage.deleteSelfAttendance(deleteId);
      toast({ title: t("attendanceDeleted") || "Attendance deleted" });
      setDeleteId(null);
      refresh();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FULL":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "HALF":
        return <MinusCircle className="w-5 h-5 text-warning" />;
      case "ABSENT":
        return <XCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <AppLayout>
      <Header
        title={t("myAttendance")}
        subtitle={t("viewYourWorkHistory")}
        onBack={() => navigate("staff-home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent>
        <div className="flex items-center justify-between gap-2">
          <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="button-prev-month">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg">{monthName}</span>
          <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="button-next-month">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {clientHomes.length > 1 && (
          <SearchableSelect
            value={selectedHomeId}
            onValueChange={setSelectedHomeId}
            placeholder={t("allClientHomes")}
            searchPlaceholder={t("searchClientHomes") || "Search client homes..."}
            emptyMessage={t("noClientHomesFound") || "No client homes found"}
            options={[
              { value: "all", label: t("allClientHomes") },
              ...clientHomes.map(home => ({ value: home.id, label: home.name }))
            ]}
            data-testid="select-client-filter"
          />
        )}

        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-success" data-testid="stat-full-days">{summary.full}</p>
              <p className="text-xs text-muted-foreground">{t("fullDay")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning" data-testid="stat-half-days">{summary.half}</p>
              <p className="text-xs text-muted-foreground">{t("halfDay")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground" data-testid="stat-absent">{summary.absent}</p>
              <p className="text-xs text-muted-foreground">{t("absent")}</p>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("attendanceRecords")} ({attendance.length})</h3>
          </div>
          
          {attendance.length === 0 ? (
            <Card className="p-4 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t("noAttendanceThisMonth")}</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("staff-log-attendance")}
                data-testid="button-log-attendance"
              >
                {t("logAttendance")}
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {attendance.map((entry) => (
                <Card key={entry.id} className="p-4" data-testid={`card-attendance-${entry.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(entry.status)}
                      <div className="flex-1">
                        <p className="font-medium">{formatDate(entry.date)}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Home className="w-3 h-3" />
                          <span>{homeNames.get(entry.clientHomeId) || t("unknown")}</span>
                        </div>
                        {entry.hoursWorked && (
                          <p className="text-xs text-muted-foreground">{entry.hoursWorked} {t("hoursWorked")}</p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={entry.status === 'FULL' ? 'default' : entry.status === 'HALF' ? 'secondary' : 'outline'}>
                      {entry.status === 'FULL' ? t("fullDay") : entry.status === 'HALF' ? t("halfDay") : t("absent")}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" data-testid={`button-menu-${entry.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => navigate("staff-edit-attendance", { attendanceId: entry.id })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t("view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteId(entry.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {isAuthenticated && bindings.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{t("linkedEmployerRecords") || "Linked Employer Records"} ({filteredSharedAttendance.length})</h3>
            </div>
            
            {filteredSharedAttendance.length === 0 ? (
              <Card className="p-4 text-center">
                <Link2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t("noLinkedAttendanceThisMonth") || "No synced attendance records this month"}</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredSharedAttendance.map((record) => (
                  <Card key={record.id} className="p-4" data-testid={`card-shared-attendance-${record.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {getStatusIcon(record.status)}
                        <div className="flex-1">
                          <p className="font-medium">{formatDate(record.date)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Home className="w-3 h-3" />
                            <span>{record.counterpartyName || record.homePersonName || t("linkedEmployer") || "Linked Employer"}</span>
                          </div>
                          {record.hoursWorked && (
                            <p className="text-xs text-muted-foreground">{record.hoursWorked} {t("hoursWorked")}</p>
                          )}
                          {record.note && (
                            <p className="text-xs text-muted-foreground mt-1">{record.note}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={
                                record.approvalStatus === 'approved' ? 'default' : 
                                record.approvalStatus === 'rejected' ? 'destructive' : 
                                record.approvalStatus === 'revised' ? 'secondary' : 'outline'
                              }
                            >
                              {record.approvalStatus === 'approved' && <Check className="w-3 h-3 mr-1" />}
                              {record.approvalStatus === 'rejected' && <X className="w-3 h-3 mr-1" />}
                              {record.approvalStatus === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {record.approvalStatus === 'approved' ? (t("approved") || "Approved") : 
                               record.approvalStatus === 'rejected' ? (t("rejected") || "Rejected") : 
                               record.approvalStatus === 'revised' ? (t("revised") || "Revised") : 
                               (t("pending") || "Pending")}
                            </Badge>
                            {record.submittedByRole === 'HOME' && (
                              <Badge variant="outline" className="text-xs">
                                {t("fromEmployer") || "From Employer"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={record.status === 'FULL' ? 'default' : record.status === 'HALF' ? 'secondary' : 'outline'}>
                          {record.status === 'FULL' ? t("fullDay") : record.status === 'HALF' ? t("halfDay") : t("absent")}
                        </Badge>
                        {record.needsAction && record.approvalStatus === 'pending' && (
                          <div className="flex gap-1 mt-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8 text-success hover:text-success"
                              onClick={() => handleActionAttendance(record.id, "approve")}
                              disabled={actioningId === record.id}
                              data-testid={`button-approve-${record.id}`}
                            >
                              {actioningId === record.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleActionAttendance(record.id, "reject")}
                              disabled={actioningId === record.id}
                              data-testid={`button-reject-${record.id}`}
                            >
                              {actioningId === record.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <Button 
          className="w-full" 
          onClick={() => navigate("staff-log-attendance")}
          data-testid="button-log-attendance-bottom"
        >
          {t("logAttendance")}
        </Button>
      </ScrollContent>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t("deleteAttendance") || "Delete Attendance?"}
        description={t("deleteAttendanceConfirm") || "This will remove this attendance entry. This action cannot be undone."}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
