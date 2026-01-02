import { useMemo, useState } from "react";
import { Shirt, ChevronLeft, ChevronRight, Eye, Trash2, Check, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { formatCurrency, formatRecordCurrency, groupTotalsByCurrency, formatCurrencyTotals } from "@/lib/calculations";
import { getCurrencySymbol } from "@shared/schema";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useActiveContext } from "@/hooks/use-active-context";
import {
  format,
  addMonths,
  subMonths,
  parseISO,
  isSameMonth,
} from "date-fns";
import type { LaundryBatch } from "@shared/schema";

export function LaundryViewScreen() {
  const { navigate, data } = useNavigation();
  const source = data.source as "attendance" | "payables" | "quick-pay" | "person-detail" | undefined;
  
  const handleBack = () => {
    if (source === "payables") {
      navigate("payables");
    } else {
      navigate("home");
    }
  };
  const { t } = useTranslation();
  const { toast } = useToast();
  const { activeAccount, showAllContexts, contextLabel, contextMode } = useActiveContext();
  const settings = useMemo(() => storage.getSettings(), []);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deleteTarget, setDeleteTarget] = useState<LaundryBatch | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const activeAccountId = activeAccount?.id;

  const laundryBatches = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getLaundryByAccount(activeAccountId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return storage.getLaundry()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshKey, activeAccountId, showAllContexts]);

  const people = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getPeopleByAccount(activeAccountId);
    }
    return storage.getPeople();
  }, [refreshKey, activeAccountId, showAllContexts]);

  const laundryStaff = useMemo(() => {
    return people.filter(p => 
      p.isActive && (
        p.role?.toLowerCase() === 'laundry' || 
        p.role?.toLowerCase().includes('laundry')
      )
    );
  }, [people]);

  const getPersonName = (personId?: string) => {
    if (!personId) return "Not assigned";
    const person = people.find((p) => p.id === personId);
    return person?.name || "Unknown";
  };

  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    laundryBatches.forEach(batch => {
      if (batch.serviceType) types.add(batch.serviceType);
    });
    return Array.from(types);
  }, [laundryBatches]);

  const filterGroups = useMemo(() => {
    const groups = [];
    groups.push({
      id: "status",
      label: t("status"),
      options: [
        { id: "unpaid", label: t("unpaid") },
        { id: "paid", label: t("paid") },
      ],
    });
    if (laundryStaff.length > 0) {
      groups.push({
        id: "staff",
        label: t("staff"),
        options: laundryStaff.map(p => ({ id: p.id, label: p.name })),
      });
    }
    if (serviceTypes.length > 0) {
      groups.push({
        id: "serviceType",
        label: t("serviceType"),
        options: serviceTypes.map(type => ({ id: type, label: type })),
      });
    }
    return groups;
  }, [laundryStaff, serviceTypes, t]);

  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    setFilters(prev => ({ ...prev, [groupId]: optionIds }));
  };

  const filteredBatches = useMemo(() => {
    let result = laundryBatches.filter((batch) => {
      const batchDate = parseISO(batch.date);
      return isSameMonth(batchDate, currentMonth);
    });

    const staffFilter = filters.staff || [];
    if (staffFilter.length > 0) {
      result = result.filter(batch => batch.personId && staffFilter.includes(batch.personId));
    }

    const serviceTypeFilter = filters.serviceType || [];
    if (serviceTypeFilter.length > 0) {
      result = result.filter(batch => batch.serviceType && serviceTypeFilter.includes(batch.serviceType));
    }

    const statusFilter = filters.status || [];
    if (statusFilter.length === 1) {
      if (statusFilter.includes("paid")) {
        result = result.filter(batch => batch.isPaid);
      } else if (statusFilter.includes("unpaid")) {
        result = result.filter(batch => !batch.isPaid);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(batch => {
        const personName = getPersonName(batch.personId).toLowerCase();
        return personName.includes(query) ||
               batch.provider?.toLowerCase().includes(query) ||
               batch.items?.some(item => item.type.toLowerCase().includes(query));
      });
    }

    return result;
  }, [laundryBatches, currentMonth, filters, searchQuery, people]);

  const fallbackSymbol = getCurrencySymbol(settings.currency, settings.customCurrencySymbol);
  
  const monthTotalsByCurrency = useMemo(() => {
    return groupTotalsByCurrency(
      filteredBatches,
      (b) => b.total,
      (b) => b.recordCurrencySymbol,
      fallbackSymbol
    );
  }, [filteredBatches, fallbackSymbol]);

  const monthItemCount = useMemo(() => {
    return filteredBatches.reduce((sum, b) => {
      return sum + (b.items?.reduce((iSum, item) => iSum + item.quantity, 0) || 0);
    }, 0);
  }, [filteredBatches]);

  const handleView = (batch: LaundryBatch) => {
    navigate("add-laundry", { laundryId: batch.id });
  };

  const handleDelete = (batch: LaundryBatch) => {
    setDeleteTarget(batch);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      storage.deleteLaundry(deleteTarget.id);
      toast({ title: "Laundry entry deleted" });
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleAddNew = () => {
    if (laundryStaff.length === 0) {
      toast({
        title: t("noLaundryStaff") || "No Laundry Staff",
        description: t("addLaundryStaffFirst") || "Please add a laundry staff member first before creating laundry entries.",
        variant: "destructive",
      });
      return;
    }
    navigate("add-laundry");
  };

  const handleTogglePaid = (batch: LaundryBatch) => {
    if (batch.isPaid) {
      storage.markLaundryUnpaid(batch.id);
      toast({ title: t("markedAsUnpaid") || "Marked as unpaid" });
    } else {
      storage.markLaundryPaid(batch.id);
      toast({ title: t("markedAsPaid") || "Marked as paid" });
    }
    setRefreshKey((k) => k + 1);
  };

  const formatDateDisplay = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d");
    } catch {
      return dateStr;
    }
  };


  return (
    <AppLayout>
      <Header
        title={t("laundry")}
        subtitle="View laundry history"
        onBack={handleBack}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button
            size="icon"
            onClick={handleAddNew}
            data-testid="button-add-laundry"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <ScrollContent>
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2 mb-3">
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

          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="text-muted-foreground">
              {filteredBatches.length} {filteredBatches.length === 1 ? "entry" : "entries"}
              {monthItemCount > 0 && (
                <span className="ml-2">({monthItemCount} items)</span>
              )}
            </div>
            <div className="font-semibold" data-testid="text-month-total">
              {formatCurrencyTotals(monthTotalsByCurrency)}
            </div>
          </div>
        </Card>

        <SearchBar
          placeholder="Search entries..."
          value={searchQuery}
          onChange={setSearchQuery}
          filterGroups={filterGroups}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          testId="search-laundry"
        />

        {filteredBatches.length === 0 ? (
          <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
            <div className="icon-halo-muted w-10 h-10">
              <Shirt className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{t("noLaundryEntries")}</h3>
              <p className="text-xs text-muted-foreground">{t("noLaundryEntriesThisMonth")}</p>
            </div>
            <Button onClick={handleAddNew} data-testid="button-add-first-laundry">
              <span className="mr-2">+</span>
              {t("addLaundry")}
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredBatches.map((batch) => (
              <Card
                key={batch.id}
                className="p-3"
                data-testid={`card-laundry-${batch.id}`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="icon-halo-primary w-9 h-9 shrink-0 mt-0.5">
                      <Shirt className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {formatDateDisplay(batch.date)}
                      </span>
                        {batch.serviceType && (
                          <Badge variant="secondary" className="text-xs">
                            {batch.serviceType}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {batch.personId && <span>{getPersonName(batch.personId)}</span>}
                        {batch.provider && <span> • {batch.provider}</span>}
                      </p>

                      {batch.items && batch.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {batch.items.slice(0, 3).map((item, idx) => (
                            <Badge
                              key={item.id || idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {item.quantity}x {item.type}
                            </Badge>
                          ))}
                          {batch.items.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{batch.items.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-semibold" data-testid={`text-total-${batch.id}`}>
                      {formatRecordCurrency(batch.total, batch.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)}
                    </span>
                    <Badge 
                      variant={batch.isPaid ? "secondary" : "destructive"} 
                      className="text-xs cursor-pointer"
                      onClick={() => handleTogglePaid(batch)}
                      data-testid={`badge-status-${batch.id}`}
                    >
                      {batch.isPaid ? (
                        <><Check className="w-3 h-3 mr-1" />{t("paid")}</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" />{t("unpaid")}</>
                      )}
                    </Badge>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(batch)}
                        data-testid={`button-view-${batch.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(batch)}
                        data-testid={`button-delete-${batch.id}`}
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
      </ScrollContent>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t("deleteLaundryEntry")}
        description={t("deleteLaundryEntryConfirm")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </AppLayout>
  );
}
