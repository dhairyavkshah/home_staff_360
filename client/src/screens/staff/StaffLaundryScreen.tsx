import { useMemo, useState, useCallback, useEffect } from "react";
import { Shirt, ChevronLeft, ChevronRight, Eye, Trash2, Calendar, Building2, Link2, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { currencySymbols } from "@shared/schema";
import { collaborationService, type CollaborationBinding, type SharedLaundryRecord } from "@/lib/collaboration-service";
import { realtimeService } from "@/lib/realtime-service";
import {
  format,
  addMonths,
  subMonths,
  parseISO,
  isSameMonth,
} from "date-fns";
import type { StaffLaundryJob } from "@shared/schema";
import { useActiveContext } from "@/hooks/use-active-context";

export function StaffLaundryScreen() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { contextLabel, contextMode } = useActiveContext();
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<StaffLaundryJob | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [bindings, setBindings] = useState<CollaborationBinding[]>([]);
  const [sharedLaundry, setSharedLaundry] = useState<SharedLaundryRecord[]>([]);
  const [actioningLaundryId, setActioningLaundryId] = useState<string | null>(null);

  const isAuthenticated = collaborationService.isAuthenticated();

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const fetchBindings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { bindings: fetchedBindings } = await collaborationService.getBindings();
      setBindings(fetchedBindings || []);

      const allLaundry: SharedLaundryRecord[] = [];
      for (const binding of (fetchedBindings || [])) {
        if (binding.isActive) {
          try {
            const { laundry } = await collaborationService.getSharedLaundry(binding.id);
            if (laundry) {
              allLaundry.push(...laundry);
            }
          } catch (err) {
            console.error(`Failed to fetch shared laundry for binding ${binding.id}:`, err);
          }
        }
      }
      setSharedLaundry(allLaundry);
    } catch (err) {
      console.error("Failed to fetch bindings:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBindings();
  }, [fetchBindings]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = realtimeService.on("collab:laundry-update", (data) => {
      console.log("[StaffLaundryScreen] Received laundry update:", data);
      fetchBindings();
      refresh();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchBindings, refresh]);

  const handleLaundryAction = useCallback(async (laundryId: string, action: "approve" | "reject") => {
    setActioningLaundryId(laundryId);
    try {
      await collaborationService.actionLaundry(laundryId, action);
      toast({
        title: action === "approve" ? "Laundry approved" : "Laundry rejected",
      });
      fetchBindings();
    } catch (err) {
      toast({
        title: t("error") || "Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setActioningLaundryId(null);
    }
  }, [fetchBindings, toast, t]);

  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  
  const activeAccount = useMemo(() => {
    if (!activeAccountId) return null;
    return storage.getAccounts().find(a => a.id === activeAccountId) || null;
  }, [activeAccountId, refreshKey]);
  
  const laundryBusinesses = useMemo(() => {
    const accounts = storage.getAccounts().filter(a => a.ownerType === 'STAFF');
    return accounts.filter(a => a.profession === 'Laundry Service');
  }, [refreshKey]);
  
  const hasLaundryBusiness = showAllContexts 
    ? laundryBusinesses.length > 0 
    : activeAccount?.profession === 'Laundry Service';
  
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getActiveClientHomesByAccount(activeAccountId);
    }
    return storage.getActiveClientHomes();
  }, [refreshKey, activeAccountId, showAllContexts]);

  const laundryJobs = useMemo(() => {
    const jobs = !showAllContexts && activeAccountId
      ? storage.getStaffLaundryJobsByAccount(activeAccountId)
      : storage.getStaffLaundryJobs();
    return jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshKey, activeAccountId, showAllContexts]);

  const filterGroups = useMemo(() => {
    if (clientHomes.length === 0) return [];
    return [{
      id: "client",
      label: "Client",
      options: clientHomes.map(h => ({ id: h.id, label: h.name })),
    }];
  }, [clientHomes]);

  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    setFilters(prev => ({ ...prev, [groupId]: optionIds }));
  };

  const filteredJobs = useMemo(() => {
    let result = laundryJobs.filter((job) => {
      const jobDate = parseISO(job.date);
      return isSameMonth(jobDate, currentMonth);
    });

    const clientFilter = filters.client || [];
    if (clientFilter.length > 0) {
      result = result.filter(job => clientFilter.includes(job.clientHomeId));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(job => {
        const clientHome = clientHomes.find(h => h.id === job.clientHomeId);
        return clientHome?.name.toLowerCase().includes(query) ||
               job.items?.some(item => item.type.toLowerCase().includes(query));
      });
    }

    return result;
  }, [laundryJobs, currentMonth, filters, searchQuery, clientHomes]);

  const filteredSharedLaundry = useMemo(() => {
    return sharedLaundry.filter((laundry) => {
      const laundryDate = parseISO(laundry.date);
      return isSameMonth(laundryDate, currentMonth);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sharedLaundry, currentMonth]);

  const monthTotal = useMemo(() => {
    return filteredJobs.reduce((sum, job) => sum + job.totalEarned, 0);
  }, [filteredJobs]);

  const monthItemCount = useMemo(() => {
    return filteredJobs.reduce((sum, job) => sum + job.itemCount, 0);
  }, [filteredJobs]);

  const getClientName = (clientHomeId: string) => {
    const clientHome = clientHomes.find(h => h.id === clientHomeId);
    return clientHome?.name || "Unknown Client";
  };

  const handleView = (job: StaffLaundryJob) => {
    navigate("staff-edit-laundry", { laundryJobId: job.id });
  };

  const handleDelete = (job: StaffLaundryJob) => {
    setDeleteTarget(job);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      storage.deleteStaffLaundryJob(deleteTarget.id);
      toast({ title: "Laundry job deleted" });
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="text-xs shrink-0">{t("pending") || "Pending"}</Badge>;
      case "approved":
        return <Badge variant="default" className="text-xs shrink-0 bg-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs shrink-0">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="screen-staff-laundry">
      <div className="safe-area-top" />

      <Header
        title="Laundry"
        onBack={() => navigate("staff-home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        onAdd={hasLaundryBusiness ? () => navigate("staff-log-laundry") : undefined}
        addTestId="button-add-laundry"
        sticky
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="content-container px-4 py-4 flex flex-col gap-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="font-semibold text-lg" data-testid="text-current-month">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
                {monthItemCount > 0 && (
                  <span className="ml-2">({monthItemCount} items)</span>
                )}
              </div>
              <div className="font-semibold text-success" data-testid="text-month-total">
                {symbol}{monthTotal.toLocaleString()}
              </div>
            </div>
          </Card>

          <SearchBar
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={setSearchQuery}
            filterGroups={filterGroups}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            testId="search-laundry-jobs"
          />

          {!hasLaundryBusiness ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state-no-business">
              <div className="icon-halo-muted w-10 h-10">
                <Building2 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">{t("noLaundryBusinesses") || "No Laundry Service businesses"}</h3>
                <p className="text-xs text-muted-foreground">{t("createLaundryBusinessFirst") || "Create a business with 'Laundry Service' profession to log laundry jobs"}</p>
              </div>
              <Button onClick={() => navigate("settings")} data-testid="button-go-to-businesses">
                <Building2 className="w-4 h-4 mr-2" />
                {t("manageAccounts") || "Manage Businesses"}
              </Button>
            </Card>
          ) : filteredJobs.length === 0 && filteredSharedLaundry.length === 0 ? (
            <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
              <div className="icon-halo-muted w-10 h-10">
                <Shirt className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-sm">No Laundry Jobs</h3>
                <p className="text-xs text-muted-foreground">Log laundry jobs to track your earnings</p>
              </div>
              <Button onClick={() => navigate("staff-log-laundry")} data-testid="button-add-first-laundry">
                <span className="mr-2">+</span>
                Log Laundry Job
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredJobs.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-semibold text-sm">My Laundry Jobs ({filteredJobs.length})</h3>
                  {filteredJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="p-4"
                      data-testid={`card-laundry-${job.id}`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="icon-halo-destructive w-9 h-9 shrink-0 mt-0.5">
                            <Shirt className="w-4 h-4 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">
                                {formatDateDisplay(job.date)}
                              </span>
                              {job.serviceType && (
                                <Badge variant="secondary" className="text-xs">
                                  {job.serviceType}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              {getClientName(job.clientHomeId)}
                            </p>

                            {job.items && job.items.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {job.items.slice(0, 3).map((item, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {item.quantity}x {item.type}
                                  </Badge>
                                ))}
                                {job.items.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.items.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-semibold text-success" data-testid={`text-total-${job.id}`}>
                            {symbol}{job.totalEarned}
                          </span>
                          <div className="flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(job)}
                              data-testid={`button-view-${job.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(job)}
                              data-testid={`button-delete-${job.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {isAuthenticated && filteredSharedLaundry.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Laundry from Linked Homes ({filteredSharedLaundry.length})</h3>
                  </div>
                  {filteredSharedLaundry.map((laundry) => {
                    const laundryCurrency = laundry.recordCurrency 
                      ? (currencySymbols[laundry.recordCurrency as keyof typeof currencySymbols] || laundry.recordCurrency)
                      : symbol;

                    const itemCount = laundry.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                    return (
                      <Card 
                        key={laundry.id} 
                        className="p-4"
                        data-testid={`card-shared-laundry-${laundry.id}`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="icon-halo-primary w-9 h-9 shrink-0 mt-0.5">
                              <Link2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {formatDateDisplay(laundry.date)}
                                </span>
                                {laundry.serviceType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {laundry.serviceType}
                                  </Badge>
                                )}
                                {getStatusBadge(laundry.approvalStatus)}
                              </div>
                              
                              <p className="text-xs text-muted-foreground">
                                {laundry.counterpartyName || laundry.homePersonName || "Linked Home"}
                              </p>

                              {laundry.items && laundry.items.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {laundry.items.slice(0, 3).map((item, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {item.quantity}x {item.type}
                                    </Badge>
                                  ))}
                                  {laundry.items.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{laundry.items.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="font-semibold text-success" data-testid={`text-total-shared-${laundry.id}`}>
                              {laundryCurrency}{laundry.total.toLocaleString()}
                            </span>
                            {laundry.approvalStatus === "pending" && laundry.needsAction && (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                  onClick={() => handleLaundryAction(laundry.id, "approve")}
                                  disabled={actioningLaundryId === laundry.id}
                                  data-testid={`button-approve-laundry-${laundry.id}`}
                                >
                                  {actioningLaundryId === laundry.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => handleLaundryAction(laundry.id, "reject")}
                                  disabled={actioningLaundryId === laundry.id}
                                  data-testid={`button-reject-laundry-${laundry.id}`}
                                >
                                  {actioningLaundryId === laundry.id ? (
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
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="safe-area-bottom" />
      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t("deleteLaundryJob")}
        description={t("deleteLaundryJobConfirm")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
