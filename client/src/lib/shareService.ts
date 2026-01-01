import { type Currency } from "@shared/schema";

export function downloadAsFile(content: string, filename: string) {
  // Add UTF-8 BOM for Excel to properly recognize special characters like ₹, €, £
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareReport(options: {
  title: string;
  text: string;
  filename: string;
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }
  
  downloadAsFile(options.text, options.filename);
  return true;
}

export function generateStaffEarningsReport(
  data: {
    staffName: string;
    period: string;
    workEarnings: number;
    laundryEarnings: number;
    otherEarnings: number;
    totalEarnings: number;
    attendance: Array<{ date: string; clientName: string; status: string; earnings: number }>;
    laundryJobs: Array<{ date: string; clientName: string; items: number; earned: number }>;
  },
  currency: Currency,
  customSymbol?: string
): string {
  const symbol = customSymbol || getCurrencySymbol(currency);
  
  let report = `Home Staff 360 - Earnings Report\n`;
  report += `Staff: ${data.staffName}\n`;
  report += `Period: ${data.period}\n\n`;
  
  report += `SUMMARY\n`;
  report += `Work Earnings: ${symbol}${data.workEarnings.toLocaleString()}\n`;
  report += `Laundry Earnings: ${symbol}${data.laundryEarnings.toLocaleString()}\n`;
  report += `Tips & Bonus: ${symbol}${data.otherEarnings.toLocaleString()}\n`;
  report += `Total: ${symbol}${data.totalEarnings.toLocaleString()}\n\n`;
  
  if (data.attendance.length > 0) {
    report += `WORK ATTENDANCE\n`;
    report += `Date,Client,Status,Earned\n`;
    data.attendance.forEach(a => {
      report += `${a.date},${a.clientName},${a.status},${symbol}${a.earnings}\n`;
    });
    report += `\n`;
  }
  
  if (data.laundryJobs.length > 0) {
    report += `LAUNDRY JOBS\n`;
    report += `Date,Client,Items,Earned\n`;
    data.laundryJobs.forEach(j => {
      report += `${j.date},${j.clientName},${j.items},${symbol}${j.earned}\n`;
    });
  }
  
  return report;
}

export function generateStaffAttendanceReport(data: {
  staffName: string;
  period: string;
  attendance: Array<{ date: string; clientName: string; status: string; hoursWorked?: number; note?: string }>;
  summary: { fullDays: number; halfDays: number; totalDays: number };
}): string {
  let report = `Home Staff 360 - Attendance Report\n`;
  report += `Staff: ${data.staffName}\n`;
  report += `Period: ${data.period}\n\n`;
  
  report += `SUMMARY\n`;
  report += `Full Days: ${data.summary.fullDays}\n`;
  report += `Half Days: ${data.summary.halfDays}\n`;
  report += `Total Days Worked: ${data.summary.totalDays}\n\n`;
  
  if (data.attendance.length > 0) {
    report += `ATTENDANCE LOG\n`;
    report += `Date,Client,Status,Hours,Note\n`;
    data.attendance.forEach(a => {
      report += `${a.date},${a.clientName},${a.status},${a.hoursWorked || '-'},${a.note || '-'}\n`;
    });
  }
  
  return report;
}

export function generateAttendanceCSV(
  records: Array<{
    date: string;
    personName: string;
    status: string;
    hours?: number;
    notes?: string;
  }>,
  startDate: string,
  endDate: string
): string {
  let csv = `Home Staff 360 - Attendance Report\n`;
  csv += `Period: ${startDate} to ${endDate}\n`;
  csv += `\n`;
  csv += `Date,Person,Status,Hours,Notes\n`;
  
  records.forEach(record => {
    const notes = record.notes ? `"${record.notes.replace(/"/g, '""')}"` : '';
    csv += `${record.date},${record.personName},${record.status},${record.hours || ''},${notes}\n`;
  });
  
  return csv;
}

function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    OTHER: '$',
  };
  return symbols[currency];
}
