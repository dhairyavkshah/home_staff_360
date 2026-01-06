import { type Currency } from "@shared/schema";
import { Share } from "@capacitor/share";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

async function writeAndShareFile(content: string, filename: string, title: string): Promise<boolean> {
  const BOM = '\uFEFF';
  const fileContent = BOM + content;

  try {
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: fileContent,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });

    console.log('File written successfully:', writeResult.uri);

    const uriResult = await Filesystem.getUri({
      directory: Directory.Cache,
      path: filename,
    });

    console.log('File URI obtained:', uriResult.uri);

    const canShare = await Share.canShare();
    if (!canShare.value) {
      console.error('Share is not available on this device');
      return false;
    }

    await Share.share({
      title: title,
      files: [uriResult.uri],
      dialogTitle: title,
    });
    return true;
  } catch (error) {
    const errorMessage = (error as Error).message || String(error);
    
    if (errorMessage.includes('cancel') || 
        errorMessage.includes('Cancel') ||
        errorMessage.includes('dismissed') ||
        errorMessage.includes('aborted')) {
      console.log('Share was cancelled by user');
      return false;
    }
    
    console.error('Failed to save/share file:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function downloadAsFile(content: string, filename: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      return await writeAndShareFile(content, filename, 'Save File');
    } catch (error) {
      console.error('Native file sharing failed:', error);
      return false;
    }
  } else {
    const BOM = '\uFEFF';
    const fileContent = BOM + content;
    try {
      const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Failed to download file:', error);
      return false;
    }
  }
}

export async function shareReport(options: {
  title: string;
  text: string;
  filename: string;
}): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      return await writeAndShareFile(options.text, options.filename, options.title);
    } catch (error) {
      console.error('Native report sharing failed:', error);
      return false;
    }
  } else {
    const BOM = '\uFEFF';
    const fileContent = BOM + options.text;
    if (navigator.share) {
      try {
        const file = new File([fileContent], options.filename, { type: 'text/csv' });
        await navigator.share({
          title: options.title,
          files: [file],
        });
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return false;
        }
        console.error('Web share failed:', error);
      }
    }
    return await downloadAsFile(options.text, options.filename);
  }
}

export function generateStaffEarningsReport(
  data: {
    staffName: string;
    period: string;
    workEarnings: string;
    laundryEarnings: string;
    otherEarnings: string;
    totalEarnings: string;
    attendance: Array<{ date: string; clientName: string; status: string; formattedEarnings: string }>;
    laundryJobs: Array<{ date: string; clientName: string; items: number; formattedEarned: string }>;
  }
): string {
  let report = `Home Staff 360 - Earnings Report\n`;
  report += `Staff: ${data.staffName}\n`;
  report += `Period: ${data.period}\n\n`;
  
  report += `SUMMARY\n`;
  report += `Work Earnings: ${data.workEarnings}\n`;
  report += `Laundry Earnings: ${data.laundryEarnings}\n`;
  report += `Tips & Bonus: ${data.otherEarnings}\n`;
  report += `Total: ${data.totalEarnings}\n\n`;
  
  if (data.attendance.length > 0) {
    report += `WORK ATTENDANCE\n`;
    report += `Date,Client,Status,Earned\n`;
    data.attendance.forEach(a => {
      report += `${a.date},${a.clientName},${a.status},${a.formattedEarnings}\n`;
    });
    report += `\n`;
  }
  
  if (data.laundryJobs.length > 0) {
    report += `LAUNDRY JOBS\n`;
    report += `Date,Client,Items,Earned\n`;
    data.laundryJobs.forEach(j => {
      report += `${j.date},${j.clientName},${j.items},${j.formattedEarned}\n`;
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
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    CZK: 'Kč',
    DKK: 'kr',
    HKD: 'HK$',
    HUF: 'Ft',
    ILS: '₪',
    JPY: '¥',
    MXN: 'MX$',
    NOK: 'kr',
    NZD: 'NZ$',
    PHP: '₱',
    PLN: 'zł',
    RUB: '₽',
    SEK: 'kr',
    SGD: 'S$',
    THB: '฿',
    TWD: 'NT$',
    AED: 'د.إ',
    CNY: '¥',
    BRL: 'R$',
    ZAR: 'R',
    OTHER: '$',
  };
  return symbols[currency] || '$';
}
