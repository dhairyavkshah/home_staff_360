import { type Currency, currencySymbols } from "@shared/schema";

function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export async function downloadAsFile(content: string, filename: string): Promise<boolean> {
  const BOM = '\uFEFF';
  const fileContent = BOM + content;

  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: fileContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      console.log('File saved to Documents:', writeResult.uri);

      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: filename,
      });

      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Save Report',
          files: [uriResult.uri],
          dialogTitle: 'Save or Share Report',
        });
      }
      
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      
      if (errorMessage.includes('cancel') || 
          errorMessage.includes('Cancel') ||
          errorMessage.includes('dismissed') ||
          errorMessage.includes('aborted')) {
        console.log('Share was cancelled by user (file is still saved)');
        return true;
      }
      
      console.error('Failed to save file on native:', error);
      return false;
    }
  } else {
    try {
      const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          link.click();
          resolve();
        }, 100);
      });
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to download file on web:', error);
      return false;
    }
  }
}

export async function shareReport(options: {
  title: string;
  text: string;
  filename: string;
}): Promise<boolean> {
  const BOM = '\uFEFF';
  const fileContent = BOM + options.text;

  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      await Filesystem.writeFile({
        path: options.filename,
        data: fileContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: options.filename,
      });

      console.log('File ready for sharing:', uriResult.uri);

      const canShare = await Share.canShare();
      if (!canShare.value) {
        console.error('Share is not available on this device');
        return false;
      }

      await Share.share({
        title: options.title,
        files: [uriResult.uri],
        dialogTitle: options.title,
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
      
      console.error('Native share failed:', error);
      return false;
    }
  } else {
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([fileContent], options.filename, { type: 'text/csv;charset=utf-8' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: options.title,
            files: [file],
          });
          return true;
        }
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('Web share was cancelled by user');
          return false;
        }
        console.error('Web Share API failed:', error);
      }
    }
    
    console.log('Web Share API not available, falling back to download');
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

export async function downloadBase64File(
  base64Data: string,
  filename: string,
  mimeType: string
): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");

      let pureBase64 = base64Data;
      if (base64Data.includes(',')) {
        pureBase64 = base64Data.split(',')[1];
      }

      await Filesystem.writeFile({
        path: filename,
        data: pureBase64,
        directory: Directory.Cache,
      });

      const uriResult = await Filesystem.getUri({
        directory: Directory.Cache,
        path: filename,
      });

      console.log('File ready for sharing:', uriResult.uri);

      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: filename,
          files: [uriResult.uri],
          dialogTitle: 'Save or Open File',
        });
      }
      
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      
      if (errorMessage.includes('cancel') || 
          errorMessage.includes('Cancel') ||
          errorMessage.includes('dismissed') ||
          errorMessage.includes('aborted')) {
        console.log('Share was cancelled by user');
        return true;
      }
      
      console.error('Failed to save/share file on native:', error);
      return false;
    }
  } else {
    try {
      let base64Content = base64Data;
      if (base64Data.includes(',')) {
        base64Content = base64Data.split(',')[1];
      }
      
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          link.click();
          resolve();
        }, 100);
      });
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Failed to download file on web:', error);
      return false;
    }
  }
}

export async function openBase64File(
  base64Data: string,
  filename: string,
  mimeType: string
): Promise<boolean> {
  if (isNativePlatform()) {
    return downloadBase64File(base64Data, filename, mimeType);
  } else {
    try {
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${filename}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #1a1a1a; }
                  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  iframe { width: 100vw; height: 100vh; border: none; }
                </style>
              </head>
              <body>
                ${mimeType.startsWith('image/') 
                  ? `<img src="${base64Data}" alt="${filename}" />`
                  : `<iframe src="${base64Data}"></iframe>`
                }
              </body>
            </html>
          `);
          newWindow.document.close();
          return true;
        }
      }
      return downloadBase64File(base64Data, filename, mimeType);
    } catch (error) {
      console.error('Failed to open file:', error);
      return downloadBase64File(base64Data, filename, mimeType);
    }
  }
}

function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency] || '$';
}
