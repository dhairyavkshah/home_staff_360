import { useMemo, useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { SearchBar } from "@/components/SearchBar";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { calculatePersonBalance, formatCurrency } from "@/lib/calculations";
import { useActiveContext } from "@/hooks/use-active-context";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { usePlanStatus } from "@/hooks/use-plan-status";

export function PeopleScreen() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { planType } = usePlanStatus();
  const settings = useMemo(() => storage.getSettings(), []);
  const { contextLabel, contextMode } = useActiveContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  
  const staffLimitTotal = useMemo(() => storage.checkHomePlanLimit('staff'), [planType]);

  const handleAddStaff = () => {
    if (!staffLimitTotal.allowed) {
      toast({
        title: "Storage Full",
        description: "You've reached 1000 total records. Please delete some dormant records to add more staff.",
        variant: "destructive",
      });
      return;
    }
    navigate("add-person");
  };

  const people = useMemo(() => {
    const accountId = storage.getActiveAccountId();
    const all = accountId ? storage.getPeopleByAccount(accountId) : storage.getPeople();
    return all
      .sort((a, b) => {
        const aActive = a.isActive !== false;
        const bActive = b.isActive !== false;
        if (aActive !== bActive) return bActive ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((p) => ({
        ...p,
        balance: calculatePersonBalance(p.id),
      }));
  }, [refreshKey]);

  const filteredPeople = useMemo(() => {
    let result = people;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.role.toLowerCase().includes(query)
      );
    }

    const statusFilter = filters.status || [];
    if (statusFilter.length > 0) {
      result = result.filter((p) => {
        if (statusFilter.includes("owed") && p.balance > 0) return true;
        if (statusFilter.includes("advance") && p.balance < 0) return true;
        if (statusFilter.includes("settled") && p.balance === 0) return true;
        return false;
      });
    }

    const activeStatusFilter = filters.activeStatus || [];
    if (activeStatusFilter.length > 0) {
      result = result.filter((p) => {
        const isActive = p.isActive !== false;
        if (activeStatusFilter.includes("active") && isActive) return true;
        if (activeStatusFilter.includes("inactive") && !isActive) return true;
        return false;
      });
    }

    return result;
  }, [people, searchQuery, filters]);

  const handleFilterChange = (groupId: string, optionIds: string[]) => {
    setFilters((prev) => ({ ...prev, [groupId]: optionIds }));
  };

  const handleToggleActive = (personId: string, isActive: boolean) => {
    storage.updatePerson(personId, { isActive });
    setRefreshKey(k => k + 1);
    toast({
      title: isActive ? t("staffActivated") : t("staffDeactivated"),
      description: isActive ? t("staffIsNowActive") : t("staffIsNowInactive"),
    });
  };

  const filterGroups = [
    {
      id: "status",
      label: t("status"),
      options: [
        { id: "owed", label: t("owed") },
        { id: "advance", label: t("advance") },
        { id: "settled", label: t("settled") },
      ],
      multiSelect: true,
    },
    {
      id: "activeStatus",
      label: t("activeStatus"),
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
        title={t("staff")}
        subtitle={t("manageYourTeam")}
        onBack={() => navigate("home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
        rightAction={
          <Button
            size="icon"
            onClick={handleAddStaff}
            data-testid="button-add-staff-header"
          >
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <ScrollContent>
        {people.length > 0 && (
          <SearchBar
            placeholder={t("searchByNameOrRole")}
            value={searchQuery}
            onChange={setSearchQuery}
            filterGroups={filterGroups}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            testId="search-people"
          />
        )}

        {people.length === 0 ? (
          <Card className="p-4 flex flex-col items-center gap-3 rounded-lg" data-testid="empty-state">
            <div className="icon-halo-muted w-10 h-10">
              <Users className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-sm">{t("noStaffAddedYet")}</h3>
              <p className="text-xs text-muted-foreground">
                {t("startByAddingFirstStaff")}
              </p>
            </div>
            <Button onClick={handleAddStaff} data-testid="button-add-staff-empty">
              <span className="mr-2">+</span>
              {t("addStaffVendor")}
            </Button>
          </Card>
        ) : filteredPeople.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-results">
            <p>{t("noResultsFound")}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3" data-testid="list-people">
              {filteredPeople.map((person) => {
                const isActive = person.isActive !== false;
                return (
                  <div
                    key={person.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border bg-card hover-elevate cursor-pointer ${!isActive ? 'opacity-60' : ''}`}
                    onClick={() => navigate("person-detail", { personId: person.id })}
                    data-testid={`card-person-${person.id}`}
                  >
                    <div className={`${isActive ? 'icon-halo-primary' : 'icon-halo-muted'} w-9 h-9 shrink-0`} data-testid={`avatar-${person.id}`}>
                      <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-sm truncate" data-testid={`text-name-${person.id}`}>{person.name}</p>
                        {!isActive && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {t("inactive")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground" data-testid={`text-role-${person.id}`}>{person.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right shrink-0">
                        <p className={`font-semibold text-sm ${person.balance > 0 ? "text-warning" : ""}`}>
                          {formatCurrency(person.balance, settings.currency, settings.customCurrencySymbol)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {person.balance > 0 ? t("owed") : person.balance < 0 ? t("advance") : t("settled")}
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => {
                          event?.stopPropagation();
                          handleToggleActive(person.id, checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`switch-active-${person.id}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
