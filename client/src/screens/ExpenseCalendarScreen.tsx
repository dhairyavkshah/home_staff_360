import { useMemo, useState } from "react";
import { Check, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { formatCurrency, formatDate, getTodayString } from "@/lib/calculations";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import type { Expense } from "@shared/schema";

const INTENSITY_THRESHOLDS = {
  low: 500,
  medium: 2000,
  high: 5000,
};

const INTENSITY_COLORS = {
  none: "",
  low: "bg-yellow-200 dark:bg-yellow-900/50",
  medium: "bg-orange-300 dark:bg-orange-800/50",
  high: "bg-red-400 dark:bg-red-700/50",
  veryHigh: "bg-red-600 dark:bg-red-600/70",
};

export function ExpenseCalendarScreen() {
  const { navigate, goBack } = useNavigation();
  const settings = useMemo(() => storage.getSettings(), []);
  const today = getTodayString();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const expenses = useMemo(() => {
    const accountId = storage.getActiveAccountId();
    const all = accountId ? storage.getExpensesByAccount(accountId) : storage.getExpenses();
    return all.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, []);

  const expensesByDate = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    expenses.forEach((expense) => {
      const date = expense.dueDate;
      if (!map[date]) map[date] = [];
      map[date].push(expense);
    });
    return map;
  }, [expenses]);

  const getDayTotal = (dateStr: string) => {
    const dayExpenses = expensesByDate[dateStr] || [];
    return dayExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getIntensityClass = (amount: number) => {
    if (amount === 0) return INTENSITY_COLORS.none;
    if (amount < INTENSITY_THRESHOLDS.low) return INTENSITY_COLORS.low;
    if (amount < INTENSITY_THRESHOLDS.medium) return INTENSITY_COLORS.medium;
    if (amount < INTENSITY_THRESHOLDS.high) return INTENSITY_COLORS.high;
    return INTENSITY_COLORS.veryHigh;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDayModal(true);
  };

  const handleAddExpense = () => {
    setShowDayModal(false);
    navigate("add-expense", { date: selectedDate || undefined });
  };

  const selectedDateExpenses = selectedDate ? (expensesByDate[selectedDate] || []) : [];

  return (
    <AppLayout>
      <Header
        title="Expense Calendar"
        subtitle="Bills by due date"
        onBack={() => navigate("expenses")}
      />

      <ScrollContent>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3 className="font-semibold text-lg">
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

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = dateStr === today;
              const dayTotal = getDayTotal(dateStr);
              const intensityClass = getIntensityClass(dayTotal);
              const hasExpenses = dayTotal > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                    transition-colors hover-elevate
                    ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
                    ${isToday ? "ring-2 ring-primary" : ""}
                    ${intensityClass}
                  `}
                  data-testid={`day-${dateStr}`}
                >
                  <span className={isToday ? "font-bold" : ""}>
                    {format(day, "d")}
                  </span>
                  {hasExpenses && (
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Intensity:</span>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 rounded bg-yellow-200 dark:bg-yellow-900/50" />
              <span>Low</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 rounded bg-orange-300 dark:bg-orange-800/50" />
              <span>Med</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 rounded bg-red-400 dark:bg-red-700/50" />
              <span>High</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 rounded bg-red-600 dark:bg-red-600/70" />
              <span>Very High</span>
            </div>
          </div>
        </Card>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold">Upcoming Bills</h3>
          {expenses.filter((e) => !e.isPaid && e.dueDate >= today).length === 0 ? (
            <Card className="p-4 text-center text-muted-foreground">
              No upcoming bills
            </Card>
          ) : (
            <Card className="divide-y">
              {expenses
                .filter((e) => !e.isPaid && e.dueDate >= today)
                .slice(0, 5)
                .map((expense) => {
                  const isOverdue = !expense.isPaid && expense.dueDate < today;
                  const isDueSoon = !expense.isPaid && expense.dueDate === today;

                  return (
                    <div key={expense.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            expense.isPaid
                              ? "bg-success/10"
                              : isOverdue
                              ? "bg-destructive/10"
                              : "bg-warning/10"
                          }`}
                        >
                          {expense.isPaid ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : isOverdue ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Clock className="w-5 h-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Due {formatDate(expense.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatCurrency(expense.amount, settings.currency, settings.customCurrencySymbol)}
                        </p>
                        {isDueSoon && <Badge variant="outline">Due Today</Badge>}
                      </div>
                    </div>
                  );
                })}
            </Card>
          )}
        </section>
      </ScrollContent>

      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate ? format(parseISO(selectedDate), "EEEE, MMMM d, yyyy") : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {selectedDateExpenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No expenses on this day
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDateExpenses.map((expense) => (
                  <Card key={expense.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(expense.amount, settings.currency, settings.customCurrencySymbol)}
                      </p>
                      {expense.isPaid ? (
                        <Badge variant="secondary" className="bg-success/10 text-success">Paid</Badge>
                      ) : (
                        <Badge variant="outline">Unpaid</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Button onClick={handleAddExpense} className="w-full" data-testid="button-add-expense-modal">
              <span className="mr-2">+</span>
              Add Expense for {selectedDate ? format(parseISO(selectedDate), "MMM d") : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
