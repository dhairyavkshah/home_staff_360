import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, MinusCircle, XCircle, Users, CheckCheck, Link2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { getTodayString } from "@/lib/calculations";
import { useActiveContext } from "@/hooks/use-active-context";
import { collaborationService, type CollaborationBinding, type SharedAttendanceRecord } from "@/lib/collaboration-service";
import { realtimeService } from "@/lib/realtime-service";
import type { Person, AttendanceEntry } from "@shared/schema";

export function AttendanceScreen() {
  const { navigate } = useNavigation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { contextLabel, contextMode } = useActiveContext();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [searchQuery, setSearchQuery] = useState("");

  const [bindings, setBindings] = useState<CollaborationBinding[]>([]);
  const [sharedAttendance, setSharedAttendance] = useState<Map<string, SharedAttendanceRecord[]>>(new Map());
  const [syncingPersonIds, setSyncingPersonIds] = useState<Set<string>>(new Set());

  const accountId = storage.getActiveAccountId();
  const isAuthenticated = collaborationService.isAuthenticated();

  const getPersonBinding = useCallback((personId: string): CollaborationBinding | undefined => {
    return bindings.find(b => b.homePersonId === personId && b.isActive);
  }, [bindings]);

  const getSharedAttendanceForPerson = useCallback((personId: string, date: string): SharedAttendanceRecord | undefined => {
    const binding = getPersonBinding(personId);
    if (!binding) return undefined;
    const records = sharedAttendance.get(binding.id) || [];
    return records.find(r => r.date === date);
  }, [getPersonBinding, sharedAttendance]);

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
      console.log("[AttendanceScreen] Received attendance update:", data);
      fetchBindings();
      setRefreshKey(prev => prev + 1);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, fetchBindings]);
  
  const people = useMemo(() => {
    return accountId ? storage.getPeopleByAccount(accountId).filter(p => p.isActive !== false) : [];
  }, [accountId, refreshKey]);

  const allAttendance = useMemo(() => {
    return accountId ? storage.getAttendanceByAccount(accountId) : [];
  }, [accountId, refreshKey]);
  
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Map<string, AttendanceEntry>>();
    allAttendance.forEach(a => {
      if (!map.has(a.date)) {
        map.set(a.date, new Map());
      }
      map.get(a.date)!.set(a.personId, a);
    });
    return map;
  }, [allAttendance]);

  const todayAttendance = useMemo(() => {
    return attendanceByDate.get(selectedDate) || new Map<string, AttendanceEntry>();
  }, [attendanceByDate, selectedDate]);

  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return people;
    const query = searchQuery.toLowerCase();
    return people.filter(
      (p) => p.name.toLowerCase().includes(query) || p.role.toLowerCase().includes(query)
    );
  }, [people, searchQuery]);

  const summary = useMemo(() => {
    const records = Array.from(todayAttendance.values());
    const full = records.filter(a => a.status === 'FULL').length;
    const half = records.filter(a => a.status === 'HALF').length;
    const absent = records.filter(a => a.status === 'ABSENT').length;
    const notMarked = people.length - records.length;
    return { full, half, absent, notMarked, total: people.length };
  }, [todayAttendance, people]);

  // Clamp selectedDate to today if it's in the future
  useEffect(() => {
    const today = getTodayString();
    if (selectedDate > today) {
      setSelectedDate(today);
    }
  }, [selectedDate]);

  const syncAttendanceForLinkedPerson = useCallback(async (
    person: Person, 
    date: string, 
    status: "FULL" | "HALF" | "ABSENT",
    hoursWorked?: number,
    note?: string
  ): Promise<boolean> => {
    const binding = getPersonBinding(person.id);
    if (!binding) return false;

    setSyncingPersonIds(prev => new Set([...prev, person.id]));
    try {
      await collaborationService.submitAttendance({
        bindingId: binding.id,
        date,
        status,
        hoursWorked,
        note,
        recordSalaryType: person.salaryType,
        recordRate: person.baseRate,
        recordCurrency: person.currency,
      });
      return true;
    } catch (err) {
      console.error(`Failed to sync attendance for ${person.name}:`, err);
      return false;
    } finally {
      setSyncingPersonIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(person.id);
        return newSet;
      });
    }
  }, [getPersonBinding]);

  const handleMarkAllPresent = async () => {
    const today = getTodayString();
    if (selectedDate > today) {
      toast({ title: t("cannotMarkFutureAttendance"), variant: "destructive" });
      return;
    }

    const unmarkedPeople = people.filter(p => !todayAttendance.has(p.id));
    
    if (unmarkedPeople.length === 0) {
      toast({ title: "All staff already marked", description: "Attendance is complete for this date." });
      return;
    }
    
    let syncedCount = 0;
    const syncPromises: Promise<void>[] = [];

    unmarkedPeople.forEach(person => {
      storage.addAttendance({
        personId: person.id,
        date: selectedDate,
        status: "FULL",
      });

      const binding = getPersonBinding(person.id);
      if (binding && isAuthenticated) {
        syncPromises.push(
          syncAttendanceForLinkedPerson(person, selectedDate, "FULL").then(success => {
            if (success) syncedCount++;
          })
        );
      }
    });

    await Promise.all(syncPromises);
    
    setRefreshKey(prev => prev + 1);
    
    const syncMessage = syncedCount > 0 
      ? ` (${syncedCount} synced with linked accounts)` 
      : "";
    toast({ 
      title: "Attendance marked", 
      description: `${unmarkedPeople.length} staff marked as full day present.${syncMessage}` 
    });

    if (syncedCount > 0) {
      fetchBindings();
    }
  };

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

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, firstDayOfWeek]);

  const getDateString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const getDayStatus = (day: number) => {
    const dateStr = getDateString(day);
    const dayRecords = attendanceByDate.get(dateStr);
    if (!dayRecords || dayRecords.size === 0) return "none";
    if (dayRecords.size === people.length) return "complete";
    return "partial";
  };

  const getStatusIcon = (status: string, small = false) => {
    const size = small ? "w-4 h-4" : "w-5 h-5";
    switch (status) {
      case "FULL":
        return <CheckCircle className={`${size} text-success`} />;
      case "HALF":
        return <MinusCircle className={`${size} text-warning`} />;
      case "ABSENT":
        return <XCircle className={`${size} text-muted-foreground`} />;
      default:
        return null;
    }
  };

  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isFutureDate = (day: number) => {
    const dateStr = getDateString(day);
    return dateStr > getTodayString();
  };

  const handleDayClick = (day: number) => {
    // Prevent selecting future dates
    if (isFutureDate(day)) return;
    setSelectedDate(getDateString(day));
  };

  const handlePersonClick = (personId: string) => {
    // Clamp date to today before navigation to ensure we never pass a future date
    const today = getTodayString();
    const safeDate = selectedDate > today ? today : selectedDate;
    navigate("add-attendance", { personId, date: safeDate });
  };

  return (
    <AppLayout>
      <Header
        title={t("attendance")}
        subtitle="Mark & View Attendance"
        onBack={() => navigate("home")}
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

        <Card className="p-4 rounded-lg">
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-10" />;
              }
              const dateStr = getDateString(day);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === getTodayString();
              const status = getDayStatus(day);
              const isFuture = isFutureDate(day);
              
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={isFuture}
                  className={`
                    h-10 rounded-lg text-sm font-medium transition-colors relative
                    ${isFuture ? 'text-muted-foreground/40 cursor-not-allowed' : ''}
                    ${isSelected && !isFuture ? 'bg-primary text-primary-foreground' : !isFuture ? 'hover-elevate' : ''}
                    ${isToday && !isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                  `}
                  data-testid={`calendar-day-${day}`}
                >
                  {day}
                  {status !== "none" && !isSelected && !isFuture && (
                    <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                      status === "complete" ? "bg-success" : "bg-warning"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 rounded-lg">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-success" data-testid="stat-full">{summary.full}</p>
              <p className="text-xs text-muted-foreground">{t("fullDay")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-warning" data-testid="stat-half">{summary.half}</p>
              <p className="text-xs text-muted-foreground">{t("halfDay")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-muted-foreground" data-testid="stat-absent">{summary.absent}</p>
              <p className="text-xs text-muted-foreground">{t("absent")}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-info" data-testid="stat-not-marked">{summary.notMarked}</p>
              <p className="text-xs text-muted-foreground">Not Marked</p>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-sm flex-1">{formatSelectedDate(selectedDate)}</h3>
            {people.length > 0 && summary.notMarked > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleMarkAllPresent}
                data-testid="button-mark-all-present"
              >
                <CheckCheck className="w-4 h-4 mr-1.5" />
                Mark All Present
              </Button>
            )}
          </div>
          
          {people.length === 0 ? (
            <Card className="p-4 text-center rounded-lg">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No staff added yet</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate("add-person")}
                data-testid="button-add-staff"
              >
                <span className="mr-2">+</span>
                Add Staff
              </Button>
            </Card>
          ) : (
            <>
              {people.length > 5 && (
                <SearchBar
                  placeholder={t("searchByNameOrRole")}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  testId="search-attendance-staff"
                />
              )}
              
              {filteredPeople.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>{t("noResultsFound")}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3" data-testid="list-attendance-staff">
                  {filteredPeople.map((person) => {
                    const record = todayAttendance.get(person.id);
                    const binding = getPersonBinding(person.id);
                    const sharedRecord = getSharedAttendanceForPerson(person.id, selectedDate);
                    const isSyncing = syncingPersonIds.has(person.id);
                    const isPending = sharedRecord?.approvalStatus === "pending";
                    
                    return (
                      <div 
                        key={person.id} 
                        className="flex items-center gap-3 p-4 rounded-lg border bg-card hover-elevate cursor-pointer"
                        onClick={() => handlePersonClick(person.id)}
                        data-testid={`staff-attendance-${person.id}`}
                      >
                        <div className="icon-halo-primary w-9 h-9 shrink-0 relative">
                          <span className="text-sm font-semibold text-primary">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                          {binding && (
                            <div 
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                              title="Linked account"
                            >
                              <Link2 className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm truncate">{person.name}</p>
                            {isSyncing && (
                              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{person.role}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPending && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          )}
                          {record ? (
                            <>
                              {getStatusIcon(record.status, true)}
                              <Badge 
                                variant={record.status === 'FULL' ? 'default' : record.status === 'HALF' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {record.status === 'FULL' ? t("fullDay") : record.status === 'HALF' ? t("halfDay") : t("absent")}
                              </Badge>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-xs">Not Marked</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </ScrollContent>
    </AppLayout>
  );
}
