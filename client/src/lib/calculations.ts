import type { Person, AttendanceEntry, AppSettings, Transaction, LaundryBatch } from "@shared/schema";
import { currencySymbols, type Currency } from "@shared/schema";
import { storage } from "./storage";
import { 
  IndianRupee, 
  DollarSign, 
  Euro, 
  PoundSterling, 
  Banknote,
  type LucideIcon 
} from "lucide-react";

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'payment': return 'Payment';
    case 'advance': return 'Advance';
    case 'deduction': return 'Deduction';
    case 'other': return 'Other';
    default: return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

export function getCurrencyIcon(currency: Currency): LucideIcon {
  switch (currency) {
    case "INR":
      return IndianRupee;
    case "USD":
      return DollarSign;
    case "EUR":
      return Euro;
    case "GBP":
      return PoundSterling;
    case "AED":
    case "OTHER":
    default:
      return Banknote;
  }
}

export function calculateWages(
  person: Person,
  attendanceEntries: AttendanceEntry[],
  settings: AppSettings
): number {
  let totalWages = 0;

  for (const entry of attendanceEntries) {
    const salaryType = entry.recordSalaryType ?? person.salaryType;
    const baseRate = entry.recordBaseRate ?? person.baseRate;
    const halfDayPercentage = entry.recordHalfDayPercentage ?? person.halfDayPercentage ?? settings.halfDayPercentage;
    
    if (entry.status === "FULL") {
      if (salaryType === "HOURLY" && entry.hours) {
        totalWages += baseRate * entry.hours;
      } else if (salaryType === "DAILY") {
        totalWages += baseRate;
      } else if (salaryType === "MONTHLY") {
        totalWages += baseRate / 30;
      }
    } else if (entry.status === "HALF") {
      const multiplier = halfDayPercentage / 100;
      if (salaryType === "HOURLY" && entry.hours) {
        totalWages += baseRate * entry.hours * multiplier;
      } else if (salaryType === "DAILY") {
        totalWages += baseRate * multiplier;
      } else if (salaryType === "MONTHLY") {
        totalWages += (baseRate / 30) * multiplier;
      }
    }
  }

  return totalWages;
}

export interface BalanceResult {
  amount: number;
  hasMixedCurrencies: boolean;
  primaryCurrencySymbol?: string;
}

export function calculatePersonBalance(personId: string): number {
  return calculatePersonBalanceWithCurrency(personId).amount;
}

export function calculatePersonBalanceWithCurrency(personId: string): BalanceResult {
  const person = storage.getPerson(personId);
  if (!person) return { amount: 0, hasMixedCurrencies: false };

  const settings = storage.getSettings();
  const attendance = storage.getAttendanceByPerson(personId);
  const transactions = storage.getTransactionsByPerson(personId);
  const laundry = storage.getLaundryByPerson(personId);

  const earnings = calculateWages(person, attendance, settings);

  const paidTransactions = transactions
    .filter((t) => t.isPaid)
    .reduce((sum, t) => {
      if (t.category === "payment") {
        return sum - t.amount;
      } else if (t.category === "advance") {
        return sum - t.amount;
      } else if (t.category === "deduction") {
        return sum + t.amount;
      }
      return sum;
    }, 0);

  // Only deduct paid laundry from wages (unpaid laundry hasn't been settled yet)
  const paidLaundryCharges = laundry
    .filter((batch) => batch.isPaid)
    .reduce((sum, batch) => sum + batch.total, 0);

  // Check for mixed currencies across all records
  const currencySymbols = new Set<string>();
  attendance.forEach(a => {
    if (a.recordCurrencySymbol) currencySymbols.add(a.recordCurrencySymbol);
  });
  transactions.forEach(t => {
    if (t.recordCurrencySymbol) currencySymbols.add(t.recordCurrencySymbol);
  });
  laundry.forEach(l => {
    if (l.recordCurrencySymbol) currencySymbols.add(l.recordCurrencySymbol);
  });

  const hasMixedCurrencies = currencySymbols.size > 1;
  const primaryCurrencySymbol = currencySymbols.size === 1 
    ? Array.from(currencySymbols)[0] 
    : undefined;

  return {
    amount: earnings + paidTransactions - paidLaundryCharges,
    hasMixedCurrencies,
    primaryCurrencySymbol,
  };
}

// Get unpaid laundry total for a person (adds to payables)
export function getUnpaidLaundryTotal(personId: string): number {
  const laundry = storage.getLaundryByPerson(personId);
  return laundry
    .filter((batch) => !batch.isPaid)
    .reduce((sum, batch) => sum + batch.total, 0);
}

// Get total payable including unpaid laundry
export function calculateTotalPayable(personId: string): number {
  const balance = calculatePersonBalance(personId);
  const unpaidLaundry = getUnpaidLaundryTotal(personId);
  // Unpaid laundry is owed TO the employer, so it reduces what employer owes staff
  return Math.max(0, balance - unpaidLaundry);
}

export function formatCurrency(
  amount: number,
  currency: Currency,
  customSymbol?: string
): string {
  const symbol = currency === "OTHER" && customSymbol ? customSymbol : currencySymbols[currency];
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (amount < 0) {
    return `-${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

export function formatRecordCurrency(
  amount: number,
  recordCurrencySymbol: string | undefined,
  fallbackCurrency: Currency,
  fallbackCustomSymbol?: string
): string {
  if (recordCurrencySymbol) {
    return formatCurrency(amount, "OTHER", recordCurrencySymbol);
  }
  return formatCurrency(amount, fallbackCurrency, fallbackCustomSymbol);
}

export interface CurrencyTotal {
  symbol: string;
  amount: number;
}

export function groupTotalsByCurrency<T>(
  records: T[],
  getAmount: (record: T) => number,
  getCurrencySymbol: (record: T) => string | undefined,
  fallbackSymbol: string
): CurrencyTotal[] {
  const totalsMap = new Map<string, number>();
  
  for (const record of records) {
    const symbol = getCurrencySymbol(record) || fallbackSymbol;
    const amount = getAmount(record);
    totalsMap.set(symbol, (totalsMap.get(symbol) || 0) + amount);
  }
  
  return Array.from(totalsMap.entries())
    .map(([symbol, amount]) => ({ symbol, amount }))
    .filter(t => t.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

export function formatCurrencyTotals(totals: CurrencyTotal[]): string {
  if (totals.length === 0) {
    return "$0.00";
  }
  
  return totals
    .map(t => {
      const formatted = Math.abs(t.amount).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return t.amount < 0 ? `-${t.symbol}${formatted}` : `${t.symbol}${formatted}`;
    })
    .join(", ");
}

export function mergeCurrencyTotals(...totalsArrays: CurrencyTotal[][]): CurrencyTotal[] {
  const mergedMap = new Map<string, number>();
  
  for (const totals of totalsArrays) {
    for (const { symbol, amount } of totals) {
      mergedMap.set(symbol, (mergedMap.get(symbol) || 0) + amount);
    }
  }
  
  return Array.from(mergedMap.entries())
    .map(([symbol, amount]) => ({ symbol, amount }))
    .filter(t => t.amount !== 0)
    .sort((a, b) => b.amount - a.amount);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getFirstDayOfMonth(): string {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
}

export function getLastDayOfMonth(): string {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];
}

export function getDaysInRange(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function getAttendanceSummary(personId: string, startDate?: string, endDate?: string) {
  let attendance = storage.getAttendanceByPerson(personId);
  
  if (startDate && endDate) {
    attendance = attendance.filter(
      (a) => a.date >= startDate && a.date <= endDate
    );
  }

  return {
    full: attendance.filter((a) => a.status === "FULL").length,
    half: attendance.filter((a) => a.status === "HALF").length,
    absent: attendance.filter((a) => a.status === "ABSENT").length,
    total: attendance.length,
  };
}

export function getDashboardStats() {
  const accountId = storage.getActiveAccountId();
  const people = accountId ? storage.getPeopleByAccount(accountId) : storage.getPeople();
  const expenses = accountId ? storage.getExpensesByAccount(accountId) : storage.getExpenses();
  const laundry = accountId ? storage.getLaundryByAccount(accountId) : storage.getLaundry();
  const attendance = accountId ? storage.getAttendanceByAccount(accountId) : storage.getAttendance();
  const settings = storage.getSettings();
  const fallbackSymbol = currencySymbols[settings.currency] || settings.customCurrencySymbol || '$';

  const activeStaff = people.filter(p => p.isActive !== false).length;
  const activePeople = people.filter(p => p.isActive !== false);
  
  // Calculate unpaid laundry grouped by currency
  const unpaidLaundry = laundry.filter((l) => !l.isPaid);
  const unpaidLaundryByCurrency = groupTotalsByCurrency(
    unpaidLaundry,
    (l) => l.total,
    (l) => l.recordCurrencySymbol,
    fallbackSymbol
  );
  const unpaidLaundryAmount = unpaidLaundry.reduce((sum, l) => sum + l.total, 0);
  
  // Calculate total payables by summing person balances (for backward compat)
  let totalPayable = 0;
  for (const person of people) {
    const wageBalance = calculatePersonBalance(person.id);
    const unpaidLaundryTotal = getUnpaidLaundryTotal(person.id);
    const netBalance = wageBalance + unpaidLaundryTotal;
    if (netBalance > 0) {
      totalPayable += netBalance;
    }
  }
  
  // Add account-level unpaid laundry (not linked to specific person)
  totalPayable += unpaidLaundryAmount;
  
  // Subtract person-linked unpaid laundry to avoid double-counting
  for (const person of people) {
    totalPayable -= getUnpaidLaundryTotal(person.id);
  }

  const today = getTodayString();
  const unpaidBills = expenses.filter(
    (e) => !e.isPaid && e.dueDate <= today
  ).length;

  // Calculate expenses grouped by currency
  const unpaidExpenses = expenses.filter((e) => !e.isPaid);
  const expensesByCurrency = groupTotalsByCurrency(
    unpaidExpenses,
    (e) => e.amount,
    (e) => e.recordCurrencySymbol,
    fallbackSymbol
  );
  const totalExpenses = unpaidExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Calculate total laundry amount (all batches for display)
  const totalLaundryAmount = laundry.reduce((sum, l) => sum + l.total, 0);

  // Today's attendance stats
  const todayAttendance = attendance.filter((a) => a.date === today);
  const presentCount = todayAttendance.filter((a) => a.status === "FULL").length;
  const halfDayCount = todayAttendance.filter((a) => a.status === "HALF").length;
  const absentCount = todayAttendance.filter((a) => a.status === "ABSENT").length;
  const markedCount = todayAttendance.length;
  const unmarkedCount = Math.max(0, activePeople.length - markedCount);

  return {
    activeStaff,
    totalPayable,
    unpaidBills,
    totalExpenses,
    totalLaundryAmount,
    unpaidLaundryAmount,
    // New: currency-grouped totals for display on dashboard
    unpaidLaundryByCurrency,
    expensesByCurrency,
    todayAttendance: {
      present: presentCount,
      halfDay: halfDayCount,
      absent: absentCount,
      marked: markedCount,
      unmarked: unmarkedCount,
    },
    currency: settings.currency,
    customCurrencySymbol: settings.customCurrencySymbol,
  };
}
