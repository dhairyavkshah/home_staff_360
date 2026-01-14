import { useState, useMemo } from "react";
import { Home, Edit, Trash2, MoreVertical, Plus } from "lucide-react";
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
import { SearchBar } from "@/components/SearchBar";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { currencySymbols } from "@shared/schema";
import { usePlanStatus } from "@/hooks/use-plan-status";
import { useActiveContext } from "@/hooks/use-active-context";

export function StaffClientHomesScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { planType } = usePlanStatus();
  const { contextLabel, contextMode } = useActiveContext();

  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), []);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), []);
  
  const [homes, setHomes] = useState(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  
  const clientLimit = useMemo(() => storage.checkStaffPlanLimit('clients'), [planType]);

  const handleAddClient = () => {
    if (!clientLimit.allowed) {
      toast({
        title: "Storage Full",
        description: "You've reached 1000 total records. Please delete some dormant records to add more clients.",
        variant: "destructive",
      });
      return;
    }
    navigate("staff-add-client-home");
  };

  const filteredHomes = useMemo(() => {
    let result = homes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.role.toLowerCase().includes(query)
      );
    }

    const statusFilter = filters.status || [];
    if (statusFilter.length > 0) {
      result = result.filter((h) => {
        if (statusFilter.includes("active") && h.isActive) return true;
        if (statusFilter.includes("inactive") && !h.isActive) return true;
        return false;
      });
    }

    return result;
  }, [homes, searchQuery, filters]);

  const handleDelete = () => {
    if (deleteId) {
      storage.deleteClientHome(deleteId);
      const updatedHomes = !showAllContexts && activeAccountId
        ? storage.getClientHomesByAccount(activeAccountId)
        : storage.getClientHomes();
      setHomes(updatedHomes);
      toast({ title: t("clientHomeDeleted"), variant: "success" });
      setDeleteId(null);
    }
  };

  const toggleActive = (id: string, isActive: boolean) => {
    storage.updateClientHome(id, { isActive: !isActive });
    const updatedHomes = !showAllContexts && activeAccountId
      ? storage.getClientHomesByAccount(activeAccountId)
      : storage.getClientHomes();
    setHomes(updatedHomes);
    toast({ title: isActive ? t("clientHomeDeactivated") : t("clientHomeActivated"), variant: "success" });
  };

  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    setFilters((prev) => ({ ...prev, [groupId]: optionIds }));
  };

  const filterGroups = [
    {
      id: "status",
      label: t("status"),
      options: [
        { id: "active", label: t("active") },
        { id: "inactive", label: t("inactive") },
      ],
      multiSelect: true,
    },
  ];

  return (
    <AppLayout>
      <Header
        title={t("clientHomes")}
        subtitle={t("homesYouWorkAt")}
        onBack={() => navigate("staff-home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button
            size="icon"
            onClick={handleAddClient}
            data-testid="button-add-client"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <ScrollContent>
        {homes.length > 0 && (
          <SearchBar
            placeholder={t("searchByNameOrRole")}
            value={searchQuery}
            onChange={setSearchQuery}
            filterGroups={filterGroups}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            testId="search-clients"
          />
        )}

        {homes.length === 0 ? (
          <Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
            <div className="icon-halo-muted w-10 h-10">
              <Home className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{t("noClientHomesYet")}</h3>
              <p className="text-xs text-muted-foreground">{t("addYourFirstClientDesc")}</p>
            </div>
            <Button onClick={handleAddClient} data-testid="button-add-first">
              <span className="mr-2">+</span>
              {t("addYourFirstClient")}
            </Button>
          </Card>
        ) : filteredHomes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-results">
            <p>{t("noResultsFound")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredHomes.map((home) => (
              <div 
                key={home.id} 
                className="flex items-center gap-3 p-4 rounded-lg border bg-card"
                data-testid={`card-client-${home.id}`}
              >
                <div className={home.isActive ? 'icon-halo-primary w-9 h-9' : 'icon-halo-muted w-9 h-9'}>
                  <Home className={`w-4 h-4 ${home.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{home.name}</p>
                    {!home.isActive && (
                      <Badge variant="secondary" className="text-xs shrink-0">{t("inactive")}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {home.role} • {symbol}{home.rate}/{home.salaryType === 'DAILY' ? t("day") : home.salaryType === 'HOURLY' ? t("hour") : t("month")}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" data-testid={`button-menu-${home.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("staff-edit-client-home", { clientHomeId: home.id })}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive(home.id, home.isActive)}>
                      {home.isActive ? t("markInactive") : t("markActive")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteId(home.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollContent>

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title={t("deleteClientHome")}
        description={t("deleteClientHomeConfirm")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </AppLayout>
  );
}
