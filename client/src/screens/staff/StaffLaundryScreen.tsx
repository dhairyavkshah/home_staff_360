import { useMemo, useState } from "react";
import { Shirt, ChevronLeft, ChevronRight, Eye, Trash2, Calendar, Building2 } from "lucide-react";
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

  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  
  // Check if current context allows laundry (active account is Laundry Service, or showAllContexts and any laundry business exists)
  const activeAccount = useMemo(() => {
    if (!activeAccountId) return null;
    return storage.getAccounts().find(a => a.id === activeAccountId) || null;
  }, [activeAccountId, refreshKey]);
  
  const laundryBusinesses = useMemo(() => {
    const accounts = storage.getAccounts().filter(a => a.ownerType === 'STAFF');
    return accounts.filter(a => a.profession === 'Laundry Service');
  }, [refreshKey]);
  
  // Only allow laundry logging if: active account is Laundry Service OR (showAllContexts AND at least one laundry business exists)
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
        <div className="content-container py-4 flex flex-col gap-4">
          <Card className="p-3">
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
              <Button onClick={() => navigate("staff-businesses")} data-testid="button-go-to-businesses">
                <Building2 className="w-4 h-4 mr-2" />
                {t("goToBusinesses") || "Go to Businesses"}
              </Button>
            </Card>
          ) : filteredJobs.length === 0 ? (
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
            <div className="flex flex-col gap-1.5">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-3"
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
        </div>
      </div>

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
