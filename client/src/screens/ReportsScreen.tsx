import { useState, useMemo } from "react";
import { Download, Share2, FileText, Calendar, ChevronLeft, ChevronRight, Receipt, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useActiveContext } from "@/hooks/use-active-context";
import { storage } from "@/lib/storage";
import {
  calculateWages,
  formatCurrency,
  formatShortDate,
  formatRecordCurrency,
} from "@/lib/calculations";
import {
  shareReport,
  downloadAsFile,
  generateAttendanceCSV,
} from "@/lib/shareService";

export function ReportsScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { contextLabel, contextMode, activeAccount, showAllContexts } = useActiveContext();

  const settings = useMemo(() => storage.getSettings(), []);
  const activeAccountId = activeAccount?.id;
  const people = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getPeopleByAccount(activeAccountId);
    }
    return storage.getPeople();
  }, [activeAccountId, showAllContexts]);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const reportData = useMemo(() => {
    const filterByDate = (dateStr: string) => {
      return dateStr >= startDate && dateStr <= endDate;
    };

    let totalWages = 0;
    let totalTransactions = 0;
    let totalLaundry = 0;
    const ledgerEntries: Array<{
      date: string;
      person: string;
      description: string;
      amount: number;
      type: "wage" | "expense" | "transaction" | "laundry";
      recordCurrencySymbol?: string;
    }> = [];

    people.forEach((person) => {
      const personAttendance = storage.getAttendanceByPerson(person.id).filter((a) =>
        filterByDate(a.date)
      );

      const wages = calculateWages(person, personAttendance, settings);
      if (wages > 0) {
        totalWages += wages;
        const attendanceCurrencies = personAttendance.map(a => a.recordCurrencySymbol).filter((s): s is string => !!s);
        const uniqueCurrencies = Array.from(new Set(attendanceCurrencies));
        ledgerEntries.push({
          date: startDate,
          person: person.name,
          description: `Wages for ${personAttendance.length} day(s)`,
          amount: wages,
          type: "wage",
          recordCurrencySymbol: uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : undefined,
        });
      }

      const personTransactions = storage.getTransactionsByPerson(person.id).filter((tx) =>
        filterByDate(tx.date)
      );

      personTransactions.forEach((tx) => {
        const txAmount = tx.category === "deduction" ? -tx.amount : tx.amount;
        totalTransactions += txAmount;
        ledgerEntries.push({
          date: tx.date,
          person: person.name,
          description: `${tx.category}: ${tx.description}`,
          amount: txAmount,
          type: "transaction",
          recordCurrencySymbol: tx.recordCurrencySymbol,
        });
      });

      const personLaundry = storage.getLaundryByPerson(person.id).filter((l) =>
        filterByDate(l.date)
      );

      personLaundry.forEach((l) => {
        totalLaundry += l.total;
        const itemCount = l.items?.length || 0;
        ledgerEntries.push({
          date: l.date,
          person: person.name,
          description: `Laundry (${itemCount} items)${l.serviceType ? ` - ${l.serviceType}` : ""}`,
          amount: l.total,
          type: "laundry",
          recordCurrencySymbol: l.recordCurrencySymbol,
        });
      });
    });

    let laundryWithoutPerson = storage.getLaundry().filter((l) => 
      !l.personId && filterByDate(l.date)
    );
    if (!showAllContexts && activeAccountId) {
      laundryWithoutPerson = laundryWithoutPerson.filter((l) => l.accountId === activeAccountId);
    }

    laundryWithoutPerson.forEach((l) => {
      totalLaundry += l.total;
      const itemCount = l.items?.length || 0;
      ledgerEntries.push({
        date: l.date,
        person: l.provider || "External",
        description: `Laundry (${itemCount} items)${l.serviceType ? ` - ${l.serviceType}` : ""}`,
        amount: l.total,
        type: "laundry",
        recordCurrencySymbol: l.recordCurrencySymbol,
      });
    });

    let expenses = storage.getExpenses();
    if (!showAllContexts && activeAccountId) {
      expenses = storage.getExpensesByAccount(activeAccountId);
    }
    expenses = expenses.filter((e) => filterByDate(e.dueDate));
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    expenses.forEach((e) => {
      ledgerEntries.push({
        date: e.dueDate,
        person: "Household",
        description: `${e.title}${e.vendor ? ` - ${e.vendor}` : ""}`,
        amount: e.amount,
        type: "expense",
        recordCurrencySymbol: e.recordCurrencySymbol,
      });
    });

    ledgerEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      totalWages,
      totalTransactions,
      totalLaundry,
      totalExpenses,
      grandTotal: totalWages + totalTransactions + totalLaundry + totalExpenses,
      ledgerEntries,
    };
  }, [startDate, endDate, people, settings, activeAccountId, showAllContexts]);

  const attendanceData = useMemo(() => {
    const filterByDate = (dateStr: string) => {
      return dateStr >= startDate && dateStr <= endDate;
    };

    const records: Array<{
      date: string;
      personName: string;
      status: string;
      hours?: number;
      notes?: string;
    }> = [];

    people.forEach((person) => {
      const personAttendance = storage.getAttendanceByPerson(person.id).filter((a) =>
        filterByDate(a.date)
      );

      personAttendance.forEach((a) => {
        records.push({
          date: a.date,
          personName: person.name,
          status: a.status === "FULL" ? "Full Day" : a.status === "HALF" ? "Half Day" : "Absent",
          hours: a.hours,
          notes: a.note,
        });
      });
    });

    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const summary = {
      fullDays: records.filter((r) => r.status === "Full Day").length,
      halfDays: records.filter((r) => r.status === "Half Day").length,
      totalDays: records.filter((r) => r.status !== "Absent").length,
    };

    return { records, summary };
  }, [startDate, endDate, people]);

  const handleExportLedger = async () => {
    const lines: string[] = [];
    lines.push("Home Staff 360 - Ledger Report");
    lines.push(`Period: ${monthName}`);
    lines.push("");
    lines.push(`Total Wages,"${formatCurrency(reportData.totalWages, settings.currency, settings.customCurrencySymbol)}"`);
    lines.push(`Total Transactions,"${formatCurrency(reportData.totalTransactions, settings.currency, settings.customCurrencySymbol)}"`);
    lines.push(`Total Laundry,"${formatCurrency(reportData.totalLaundry, settings.currency, settings.customCurrencySymbol)}"`);
    lines.push(`Total Expenses,"${formatCurrency(reportData.totalExpenses, settings.currency, settings.customCurrencySymbol)}"`);
    lines.push(`Grand Total,"${formatCurrency(reportData.grandTotal, settings.currency, settings.customCurrencySymbol)}"`);
    lines.push("");
    lines.push("Date,Person,Description,Amount,Type");

    reportData.ledgerEntries.forEach((entry) => {
      const description = entry.description.replace(/"/g, '""');
      const formattedAmount = formatRecordCurrency(entry.amount, entry.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol);
      lines.push(`${entry.date},${entry.person},"${description}","${formattedAmount}",${entry.type}`);
    });

    const content = lines.join("\n");
    const success = await downloadAsFile(content, `homestaff360-ledger-${year}-${String(month + 1).padStart(2, "0")}.csv`);
    if (success) {
      toast({ title: t("success"), description: t("reportExported") });
    } else {
      toast({ title: t("error"), description: "Export failed", variant: "destructive" });
    }
  };

  const handleShareLedger = async () => {
    const lines: string[] = [];
    lines.push("Home Staff 360 - Ledger Report");
    lines.push(`Period: ${monthName}`);
    lines.push("");
    lines.push(`Total Wages: ${formatCurrency(reportData.totalWages, settings.currency, settings.customCurrencySymbol)}`);
    lines.push(`Total Transactions: ${formatCurrency(reportData.totalTransactions, settings.currency, settings.customCurrencySymbol)}`);
    lines.push(`Total Laundry: ${formatCurrency(reportData.totalLaundry, settings.currency, settings.customCurrencySymbol)}`);
    lines.push(`Total Expenses: ${formatCurrency(reportData.totalExpenses, settings.currency, settings.customCurrencySymbol)}`);
    lines.push(`Grand Total: ${formatCurrency(reportData.grandTotal, settings.currency, settings.customCurrencySymbol)}`);
    lines.push("");
    reportData.ledgerEntries.slice(0, 10).forEach((entry) => {
      lines.push(`${formatShortDate(entry.date)} - ${entry.person}: ${entry.description} (${formatRecordCurrency(entry.amount, entry.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol)})`);
    });
    if (reportData.ledgerEntries.length > 10) {
      lines.push(`... and ${reportData.ledgerEntries.length - 10} more entries`);
    }

    const shared = await shareReport({
      title: "Home Staff 360 Ledger Report",
      text: lines.join("\n"),
      filename: `homestaff360-ledger-${year}-${String(month + 1).padStart(2, "0")}.csv`,
    });

    if (shared) {
      toast({ title: t("success"), description: t("reportShared") });
    }
  };

  const handleExportAttendance = async () => {
    const content = generateAttendanceCSV(attendanceData.records, startDate, endDate);
    const success = await downloadAsFile(content, `homestaff360-attendance-${year}-${String(month + 1).padStart(2, "0")}.csv`);
    if (success) {
      toast({ title: t("success"), description: t("reportExported") });
    } else {
      toast({ title: t("error"), description: "Export failed", variant: "destructive" });
    }
  };

  const handleShareAttendance = async () => {
    const content = generateAttendanceCSV(attendanceData.records, startDate, endDate);
    const shared = await shareReport({
      title: t("attendanceReport"),
      text: content,
      filename: `homestaff360-attendance-${year}-${String(month + 1).padStart(2, "0")}.csv`,
    });

    if (shared) {
      toast({ title: t("success"), description: t("reportShared") });
    }
  };

  const handleViewLedgerReport = () => {
    const entries = reportData.ledgerEntries.map(entry => ({
      ...entry,
      formattedAmount: formatRecordCurrency(entry.amount, entry.recordCurrencySymbol, settings.currency, settings.customCurrencySymbol),
    }));
    
    navigate("report-preview", {
      reportType: "ledger",
      reportTitle: "Ledger Report",
      subtitle: monthName,
      summary: {
        "Total Wages": formatCurrency(reportData.totalWages, settings.currency, settings.customCurrencySymbol),
        "Total Expenses": formatCurrency(reportData.totalExpenses, settings.currency, settings.customCurrencySymbol),
        "Total Transactions": formatCurrency(reportData.totalTransactions, settings.currency, settings.customCurrencySymbol),
        "Grand Total": formatCurrency(reportData.grandTotal, settings.currency, settings.customCurrencySymbol),
      },
      entries,
    });
  };

  const handleViewAttendanceReport = () => {
    navigate("report-preview", {
      reportType: "attendance",
      reportTitle: t("attendanceReport"),
      subtitle: monthName,
      summary: {
        "Full Days": String(attendanceData.summary.fullDays),
        "Half Days": String(attendanceData.summary.halfDays),
        "Total Records": String(attendanceData.summary.totalDays),
      },
      entries: attendanceData.records,
    });
  };

  return (
    <AppLayout>
      <Header 
        title={t("reports")} 
        subtitle={t("viewAndShareReports")} 
        onBack={() => navigate("home")}
        contextLabel={contextLabel}
        contextMode={contextMode}
      />

      <ScrollContent>
        <section className="flex items-center justify-between">
          <Button size="icon" variant="ghost" onClick={prevMonth} data-testid="button-prev-month">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <Button size="icon" variant="ghost" onClick={nextMonth} data-testid="button-next-month">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-2.5">
          <Card className="p-3 flex flex-col items-center">
            <div className="icon-halo-primary w-9 h-9 mb-2">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xl font-bold" data-testid="text-total-wages">
              {formatCurrency(reportData.totalWages, settings.currency, settings.customCurrencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">{t("wages")}</p>
          </Card>
          <Card className="p-3 flex flex-col items-center">
            <div className="icon-halo-warning w-9 h-9 mb-2">
              <Receipt className="w-4 h-4 text-warning" />
            </div>
            <p className="text-xl font-bold" data-testid="text-total-expenses">
              {formatCurrency(reportData.totalExpenses, settings.currency, settings.customCurrencySymbol)}
            </p>
            <p className="text-xs text-muted-foreground">{t("expenses")}</p>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold">{t("exportReports")}</h3>

          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-halo-success w-9 h-9">
                <FileText className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Ledger Report</p>
                <p className="text-xs text-muted-foreground">Wages, expenses, and transactions</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleViewLedgerReport}
              data-testid="button-view-ledger"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("view")} Report
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExportLedger}
                data-testid="button-export-ledger"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("export")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleShareLedger}
                data-testid="button-share-ledger"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("sendReport")}
              </Button>
            </div>
          </Card>

          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-halo-primary w-9 h-9">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("attendanceReport")}</p>
                <p className="text-xs text-muted-foreground">{t("attendanceReportDesc")}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleViewAttendanceReport}
              data-testid="button-view-attendance"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("view")} Report
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExportAttendance}
                data-testid="button-export-attendance"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("export")}
              </Button>
              <Button
                className="flex-1"
                onClick={handleShareAttendance}
                data-testid="button-share-attendance"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("sendReport")}
              </Button>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">Summary</h3>
          <Card className="divide-y">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Staff Wages</span>
              <span className="font-medium text-sm">{formatCurrency(reportData.totalWages, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Household Expenses</span>
              <span className="font-medium text-sm">{formatCurrency(reportData.totalExpenses, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
            <div className="p-3 flex items-center justify-between bg-primary/5">
              <span className="font-semibold">{t("grandTotal")}</span>
              <span className="font-bold text-lg">{formatCurrency(reportData.grandTotal, settings.currency, settings.customCurrencySymbol)}</span>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">{t("attendance")}</h3>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <span className="text-muted-foreground">{t("fullDay")}</span>
              <span className="font-medium">{attendanceData.summary.fullDays}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-muted-foreground">{t("halfDay")}</span>
              <span className="font-medium">{attendanceData.summary.halfDays}</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-muted-foreground">Total Records</span>
              <span className="font-medium">{attendanceData.summary.totalDays}</span>
            </div>
          </Card>
        </section>
      </ScrollContent>
    </AppLayout>
  );
}
