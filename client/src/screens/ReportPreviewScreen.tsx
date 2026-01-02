import { FileSpreadsheet, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";

interface LedgerEntry {
  date: string;
  person: string;
  description: string;
  amount: number;
  formattedAmount: string;
  type: "wage" | "expense" | "transaction" | "laundry";
}

interface AttendanceEntry {
  date: string;
  personName: string;
  status: string;
  hours?: number;
  notes?: string;
}

interface StaffEarningsEntry {
  date: string;
  clientName: string;
  description: string;
  earnings: number;
  formattedEarnings: string;
  type: "attendance" | "laundry" | "bonus";
}

interface StaffAttendanceEntry {
  date: string;
  clientName: string;
  status: string;
  hoursWorked?: number;
  note?: string;
}

interface ReportPreviewData {
  reportType: "ledger" | "attendance" | "staff-earnings" | "staff-attendance";
  title: string;
  subtitle: string;
  summary?: Record<string, string>;
  entries: LedgerEntry[] | AttendanceEntry[] | StaffEarningsEntry[] | StaffAttendanceEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  wage: "bg-success/10 text-success",
  expense: "bg-warning/10 text-warning",
  transaction: "bg-info/10 text-info",
  laundry: "bg-primary/10 text-primary",
  attendance: "bg-success/10 text-success",
  bonus: "bg-warning/10 text-warning",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReportPreviewScreen() {
  const { goBack, data: navData } = useNavigation();
  
  const reportType = navData.reportType as ReportPreviewData["reportType"];
  const title = navData.reportTitle as string || "Report Preview";
  const subtitle = navData.subtitle as string || "";
  const summary = navData.summary as Record<string, string> | undefined;
  const entries = navData.entries as ReportPreviewData["entries"] || [];

  const renderLedgerTable = (entries: LedgerEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Date</th>
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Person</th>
            <th className="text-left p-2.5 font-medium border-b">Description</th>
            <th className="text-right p-2.5 font-medium border-b whitespace-nowrap">Amount</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Type</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover-elevate">
              <td className="p-2.5 whitespace-nowrap text-muted-foreground">{formatDate(entry.date)}</td>
              <td className="p-2.5 whitespace-nowrap font-medium">{entry.person}</td>
              <td className="p-2.5">{entry.description}</td>
              <td className="p-2.5 text-right font-medium whitespace-nowrap">{entry.formattedAmount}</td>
              <td className="p-2.5 text-center">
                <Badge variant="secondary" className={`text-xs ${TYPE_COLORS[entry.type] || ""}`}>
                  {entry.type}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAttendanceTable = (entries: AttendanceEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Date</th>
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Staff</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Status</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Hours</th>
            <th className="text-left p-2.5 font-medium border-b">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover-elevate">
              <td className="p-2.5 whitespace-nowrap text-muted-foreground">{formatDate(entry.date)}</td>
              <td className="p-2.5 whitespace-nowrap font-medium">{entry.personName}</td>
              <td className="p-2.5 text-center">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${entry.status === "Full Day" ? "bg-success/10 text-success" : entry.status === "Half Day" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}
                >
                  {entry.status}
                </Badge>
              </td>
              <td className="p-2.5 text-center text-muted-foreground">{entry.hours || "-"}</td>
              <td className="p-2.5 text-muted-foreground truncate max-w-[150px]">{entry.notes || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStaffEarningsTable = (entries: StaffEarningsEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Date</th>
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Client</th>
            <th className="text-left p-2.5 font-medium border-b">Description</th>
            <th className="text-right p-2.5 font-medium border-b whitespace-nowrap">Earnings</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Type</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover-elevate">
              <td className="p-2.5 whitespace-nowrap text-muted-foreground">{formatDate(entry.date)}</td>
              <td className="p-2.5 whitespace-nowrap font-medium">{entry.clientName}</td>
              <td className="p-2.5">{entry.description}</td>
              <td className="p-2.5 text-right font-medium whitespace-nowrap">{entry.formattedEarnings}</td>
              <td className="p-2.5 text-center">
                <Badge variant="secondary" className={`text-xs ${TYPE_COLORS[entry.type] || ""}`}>
                  {entry.type}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStaffAttendanceTable = (entries: StaffAttendanceEntry[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Date</th>
            <th className="text-left p-2.5 font-medium border-b whitespace-nowrap">Client</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Status</th>
            <th className="text-center p-2.5 font-medium border-b whitespace-nowrap">Hours</th>
            <th className="text-left p-2.5 font-medium border-b">Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={idx} className="border-b last:border-b-0 hover-elevate">
              <td className="p-2.5 whitespace-nowrap text-muted-foreground">{formatDate(entry.date)}</td>
              <td className="p-2.5 whitespace-nowrap font-medium">{entry.clientName}</td>
              <td className="p-2.5 text-center">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${entry.status === "Full Day" ? "bg-success/10 text-success" : entry.status === "Half Day" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}
                >
                  {entry.status}
                </Badge>
              </td>
              <td className="p-2.5 text-center text-muted-foreground">{entry.hoursWorked || "-"}</td>
              <td className="p-2.5 text-muted-foreground truncate max-w-[150px]">{entry.note || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable = () => {
    if (!entries || entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Table2 className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No data available</p>
        </div>
      );
    }

    switch (reportType) {
      case "ledger":
        return renderLedgerTable(entries as LedgerEntry[]);
      case "attendance":
        return renderAttendanceTable(entries as AttendanceEntry[]);
      case "staff-earnings":
        return renderStaffEarningsTable(entries as StaffEarningsEntry[]);
      case "staff-attendance":
        return renderStaffAttendanceTable(entries as StaffAttendanceEntry[]);
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <Header
        title={title || "Report Preview"}
        subtitle={subtitle}
        onBack={goBack}
      />

      <ScrollContent>
        {summary && Object.keys(summary).length > 0 && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(summary).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{key}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden">
          <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
            <Table2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-sm">
              {entries?.length || 0} {entries?.length === 1 ? "record" : "records"}
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              View Only
            </Badge>
          </div>
          <ScrollArea className="max-h-[60vh]">
            {renderTable()}
          </ScrollArea>
        </Card>
      </ScrollContent>
    </AppLayout>
  );
}
