import { format, parseISO, isValid, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addDays, subDays, startOfWeek, endOfWeek, getDay, isBefore, isAfter, formatDistanceToNow } from "date-fns";

export function formatDate(date: string | Date, formatString = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, formatString);
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, "MMM d");
}

export function formatDateLong(date: string | Date): string {
  return formatDate(date, "MMMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM d, yyyy h:mm a");
}

export function formatTime(date: string | Date): string {
  return formatDate(date, "h:mm a");
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromISODateString(dateString: string): Date {
  return parseISO(dateString);
}

export function getDaysInMonth(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

export function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  return eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
}

export function getRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return !isBefore(date, start) && !isAfter(date, end);
}

export function getDayOfWeekName(dayIndex: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex] || "";
}

export function getDayOfWeekShort(dayIndex: number): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[dayIndex] || "";
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex] || "";
}

export function getMonthNameShort(monthIndex: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex] || "";
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export { isToday, isSameDay, addDays, subDays, differenceInDays, getDay, startOfMonth, endOfMonth, parseISO, isValid };
