import { useState, useMemo } from "react";
import { Download, Share2, Calendar, TrendingUp, FileText, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { currencySymbols } from "@shared/schema";
import { useActiveContext } from "@/hooks/use-active-context";
import {
  shareReport,
  downloadAsFile,
  generateStaffEarningsReport,
  generateStaffAttendanceReport,
} from "@/lib/shareService";

type ReportType = "earnings" | "attendance";

export function StaffReportsScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { contextLabel, contextMode } = useActiveContext();

  const profile = useMemo(() => storage.getProfile(), []);
  const settings = useMemo(() => storage.getSettings(), []);
  const symbol = settings.customCurrencySymbol || currencySymbols[settings.currency];

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

  const [refreshKey, setRefreshKey] = useState(0);
  const activeAccountId = useMemo(() => storage.getActiveAccountId(), [refreshKey]);
  const showAllContexts = useMemo(() => storage.getShowAllContexts(), [refreshKey]);
  const accountIdForFilter = !showAllContexts && activeAccountId ? activeAccountId : null;
  
  const clientHomes = useMemo(() => {
    if (!showAllContexts && activeAccountId) {
      return storage.getClientHomesByAccount(activeAccountId);
    }
    return storage.getClientHomes();
  }, [activeAccountId, showAllContexts, refreshKey]);
  const homeNames = new Map(clientHomes.map((h) => [h.id, h.name]));

  const earnings = useMemo(
    () => storage.calculateStaffMonthlyEarnings(year, month, accountIdForFilter),
    [year, month, accountIdForFilter, refreshKey]
  );

  const attendance = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const records = !showAllContexts && activeAccountId 
      ? storage.getSelfAttendanceByAccount(activeAccountId)
      : storage.getSelfAttendance();
    return records.filter((a) => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });
  }, [year, month, activeAccountId, showAllContexts]);

  const laundryJobs = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const jobs = !showAllContexts && activeAccountId
      ? storage.getStaffLaundryJobsByAccount(activeAccountId)
      : storage.getStaffLaundryJobs();
    return jobs.filter((job) => {
      const date = new Date(job.date);
      return date >= monthStart && date <= monthEnd;
    });
  }, [year, month, activeAccountId, showAllContexts]);

  const attendanceSummary = useMemo(() => {
    const fullDays = attendance.filter((a) => a.status === "FULL").length;
    const halfDays = attendance.filter((a) => a.status === "HALF").length;
    return {
      fullDays,
      halfDays,
      totalDays: fullDays + halfDays * 0.5,
    };
  }, [attendance]);

  const generateReport = (type: ReportType): string => {
    const staffName = profile?.displayName || "Staff";
    const period = monthName;

    if (type === "earnings") {
      return generateStaffEarningsReport(
        {
          staffName,
          period,
          workEarnings: earnings.fromAttendance,
          laundryEarnings: earnings.fromLaundry,
          otherEarnings: earnings.bonusAndTips,
          totalEarnings: earnings.total,
          attendance: attendance
            .filter((a) => a.status !== "ABSENT")
            .map((a) => {
              const client = clientHomes.find((c) => c.id === a.clientHomeId);
              const rate = a.recordRate ?? client?.rate ?? 0;
              const earned = a.status === "FULL" ? rate : rate * 0.5;
              return {
                date: a.date,
                clientName: homeNames.get(a.clientHomeId) || "Unknown",
                status: a.status === "FULL" ? "Full Day" : "Half Day",
                earnings: earned,
              };
            }),
          laundryJobs: laundryJobs.map((job) => ({
            date: job.date,
            clientName: homeNames.get(job.clientHomeId) || "Unknown",
            items: job.itemCount,
            earned: job.totalEarned,
          })),
        },
        settings.currency,
        settings.customCurrencySymbol
      );
    } else {
      return generateStaffAttendanceReport({
        staffName,
        period,
        attendance: attendance.map((a) => ({
          date: a.date,
          clientName: homeNames.get(a.clientHomeId) || "Unknown",
          status: a.status === "FULL" ? "Full Day" : a.status === "HALF" ? "Half Day" : "Absent",
          hoursWorked: a.hoursWorked,
          note: a.note,
        })),
        summary: {
          fullDays: attendanceSummary.fullDays,
          halfDays: attendanceSummary.halfDays,
          totalDays: attendanceSummary.fullDays + attendanceSummary.halfDays,
        },
      });
    }
  };

  const handleExport = async (type: ReportType) => {
    const content = generateReport(type);
    const filename = `homestaff360-${type}-${year}-${String(month + 1).padStart(2, "0")}.csv`;
    const success = await downloadAsFile(content, filename);
    if (success) {
      toast({
        title: t("success"),
        description: t("reportExported"),
      });
    } else {
      toast({
        title: t("error"),
        description: "Export failed",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (type: ReportType) => {
    const content = generateReport(type);
    const title = type === "earnings" ? t("earningsReport") : t("attendanceReport");
    const filename = `homestaff360-${type}-${year}-${String(month + 1).padStart(2, "0")}.csv`;

    const shared = await shareReport({
      title,
      text: content,
      filename,
    });

    if (shared) {
      toast({
        title: t("success"),
        description: t("reportShared"),
      });
    }
  };

  const handleViewEarningsReport = () => {
    const entries: Array<{
      date: string;
      clientName: string;
      description: string;
      earnings: number;
      formattedEarnings: string;
      type: "attendance" | "laundry" | "bonus";
    }> = [];

    attendance
      .filter((a) => a.status !== "ABSENT")
      .forEach((a) => {
        const client = clientHomes.find((c) => c.id === a.clientHomeId);
        const rate = a.recordRate ?? client?.rate ?? 0;
        const earned = a.status === "FULL" ? rate : rate * 0.5;
        entries.push({
          date: a.date,
          clientName: homeNames.get(a.clientHomeId) || "Unknown",
          description: a.status === "FULL" ? "Full Day Work" : "Half Day Work",
          earnings: earned,
          formattedEarnings: `${symbol}${earned.toLocaleString()}`,
          type: "attendance",
        });
      });

    laundryJobs.forEach((job) => {
      entries.push({
        date: job.date,
        clientName: homeNames.get(job.clientHomeId) || "Unknown",
        description: `Laundry (${job.itemCount} items)`,
        earnings: job.totalEarned,
        formattedEarnings: `${symbol}${job.totalEarned.toLocaleString()}`,
        type: "laundry",
      });
    });

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    navigate("report-preview", {
      reportType: "staff-earnings",
      reportTitle: t("earningsReport"),
      subtitle: monthName,
      summary: {
        "Work Earnings": `${symbol}${earnings.fromAttendance.toLocaleString()}`,
        "Laundry Earnings": `${symbol}${earnings.fromLaundry.toLocaleString()}`,
        "Tips & Bonus": `${symbol}${earnings.bonusAndTips.toLocaleString()}`,
        "Total Earnings": `${symbol}${earnings.total.toLocaleString()}`,
      },
      entries,
    });
  };

  const handleViewAttendanceReport = () => {
    const entries = attendance.map((a) => ({
      date: a.date,
      clientName: homeNames.get(a.clientHomeId) || "Unknown",
      status: a.status === "FULL" ? "Full Day" : a.status === "HALF" ? "Half Day" : "Absent",
      hoursWorked: a.hoursWorked,
      note: a.note,
    }));

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    navigate("report-preview", {
      reportType: "staff-attendance",
      reportTitle: t("attendanceReport"),
      subtitle: monthName,
      summary: {
        "Full Days": String(attendanceSummary.fullDays),
        "Half Days": String(attendanceSummary.halfDays),
        "Total Days": String(attendanceSummary.totalDays),
      },
      entries,
    });
  };

  return (
    <AppLayout>
      <Header title={t("reports")} subtitle={t("viewAndShareReports")} onBack={() => navigate("staff-home")} contextLabel={contextLabel} contextMode={contextMode} />

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
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
            </div>
            <p className="text-xl font-bold" data-testid="text-total-earnings">
              {symbol}{earnings.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{t("totalEarnings")}</p>
          </Card>
          <Card className="p-3 flex flex-col items-center">
            <div className="icon-halo-warning w-9 h-9 mb-2">
              <Calendar className="w-4.5 h-4.5 text-warning" />
            </div>
            <p className="text-xl font-bold" data-testid="text-working-days">
              {attendanceSummary.totalDays}
            </p>
            <p className="text-xs text-muted-foreground">{t("workingDays")}</p>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-semibold">{t("exportReports")}</h3>

          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-halo-success w-9 h-9">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{t("earningsReport")}</p>
                <p className="text-xs text-muted-foreground">{t("earningsReportDesc")}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleViewEarningsReport}
              data-testid="button-view-earnings"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t("view")} Report
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleExport("earnings")}
                data-testid="button-export-earnings"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("export")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleShare("earnings")}
                data-testid="button-share-earnings"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("sendReport")}
              </Button>
            </div>
          </Card>

          <Card className="p-3 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-halo-primary w-9 h-9">
                <FileText className="w-4 h-4 text-primary" />
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
                onClick={() => handleExport("attendance")}
                data-testid="button-export-attendance"
              >
                <Download className="w-4 h-4 mr-2" />
                {t("export")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleShare("attendance")}
                data-testid="button-share-attendance"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("sendReport")}
              </Button>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">{t("earnings")}</h3>
          <Card className="divide-y">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("work")}</span>
              <span className="font-medium text-sm">{symbol}{earnings.fromAttendance.toLocaleString()}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("laundry")}</span>
              <span className="font-medium text-sm">{symbol}{earnings.fromLaundry.toLocaleString()}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("tipsAndBonus")}</span>
              <span className="font-medium text-sm">{symbol}{earnings.bonusAndTips.toLocaleString()}</span>
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-semibold">{t("attendance")}</h3>
          <Card className="divide-y">
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("fullDay")}</span>
              <span className="font-medium text-sm">{attendanceSummary.fullDays}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("halfDay")}</span>
              <span className="font-medium text-sm">{attendanceSummary.halfDays}</span>
            </div>
          </Card>
        </section>
      </ScrollContent>
    </AppLayout>
  );
}
