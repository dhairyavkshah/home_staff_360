import { z } from "zod";
import { pgTable, varchar, text, boolean, timestamp, integer, serial, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const STORAGE_KEYS = {
  SETTINGS: 'hm_settings',
  HOME_SETTINGS: 'hm_home_settings',
  STAFF_SETTINGS: 'hm_staff_settings',
  PROFILE: 'hm_profile',
  ACCOUNTS: 'hm_accounts',
  PEOPLE: 'hm_people',
  ATTENDANCE: 'hm_attendance',
  TRANSACTIONS: 'hm_transactions',
  LAUNDRY: 'hm_laundry',
  EXPENSES: 'hm_expenses',
} as const;

export const userTypes = ['HOME', 'STAFF'] as const;
export type UserType = typeof userTypes[number];

export const userProfileSchema = z.object({
  id: z.string(),
  type: z.enum(userTypes),
  displayName: z.string().min(1),
  createdAt: z.string(),
  activeAccountId: z.string().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const insertUserProfileSchema = userProfileSchema.omit({ id: true, createdAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export const accountSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  ownerType: z.enum(userTypes),
  name: z.string().min(1),
  description: z.string().optional(),
  profession: z.string().optional(),
  createdAt: z.string(),
});

export type Account = z.infer<typeof accountSchema>;

export const insertAccountSchema = accountSchema.omit({ id: true, createdAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export const BUSINESS_PROFESSIONS = [
  'Maid Service',
  'Cooking',
  'Laundry Service',
  'Driver',
  'Nanny / Child Care',
  'Gardening',
  'Security',
  'Cleaning',
  'Catering',
  'Personal Assistant',
  'Pet Care',
  'Elder Care',
  'Tutoring',
  'Other',
] as const;

export const currencies = [
  'INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'CZK', 'DKK', 'HKD', 
  'HUF', 'ILS', 'JPY', 'MXN', 'NOK', 'NZD', 'PHP', 'PLN', 'RUB', 'SEK', 
  'SGD', 'THB', 'TWD', 'AED', 'CNY', 'BRL', 'ZAR', 'OTHER'
] as const;
export type Currency = typeof currencies[number];

export interface CurrencyConfig {
  code: Currency;
  name: string;
  symbol: string;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', decimals: 2 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', decimals: 2 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', decimals: 2 },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', decimals: 2 },
  CZK: { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', locale: 'cs-CZ', decimals: 2 },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr', locale: 'da-DK', decimals: 2 },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', locale: 'zh-HK', decimals: 2 },
  HUF: { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', locale: 'hu-HU', decimals: 0 },
  ILS: { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', locale: 'he-IL', decimals: 2 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimals: 0 },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', locale: 'es-MX', decimals: 2 },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO', decimals: 2 },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', locale: 'en-NZ', decimals: 2 },
  PHP: { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'en-PH', decimals: 2 },
  PLN: { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', locale: 'pl-PL', decimals: 2 },
  RUB: { code: 'RUB', name: 'Russian Rouble', symbol: '₽', locale: 'ru-RU', decimals: 2 },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE', decimals: 2 },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', decimals: 2 },
  THB: { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH', decimals: 2 },
  TWD: { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', locale: 'zh-TW', decimals: 2 },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', decimals: 2 },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', decimals: 2 },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', decimals: 2 },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA', decimals: 2 },
  OTHER: { code: 'OTHER', name: 'Custom', symbol: '$', locale: 'en-US', decimals: 2 },
};

export const getCurrencySymbol = (currency: Currency, customSymbol?: string): string => {
  if (currency === 'OTHER' && customSymbol) {
    return customSymbol;
  }
  return CURRENCIES[currency].symbol;
};

export const languages = ['en', 'hi', 'gu', 'kn', 'ml', 'mr', 'pa', 'te', 'ta', 'ur', 'bn', 'or', 'as', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'pt', 'ru'] as const;
export type Language = typeof languages[number];

export const languageLabels: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  gu: 'ગુજરાતી (Gujarati)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  mr: 'मराठी (Marathi)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
  ur: 'اردو (Urdu)',
  bn: 'বাংলা (Bengali)',
  or: 'ଓଡ଼ିଆ (Odia)',
  as: 'অসমীয়া (Assamese)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  ar: 'العربية (Arabic)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  pt: 'Português (Portuguese)',
  ru: 'Русский (Russian)',
};

export const salaryTypes = ['MONTHLY', 'DAILY', 'HOURLY'] as const;
export type SalaryType = typeof salaryTypes[number];

export const attendanceStatuses = ['FULL', 'HALF', 'ABSENT'] as const;
export type AttendanceStatus = typeof attendanceStatuses[number];

export const recurrenceTypes = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const;
export type RecurrenceType = typeof recurrenceTypes[number];

export const transactionCategories = ['payment', 'advance', 'deduction', 'other'] as const;
export type TransactionCategory = typeof transactionCategories[number];

export const expenseCategories = [
  'recurring-bill', 'utilities', 'groceries', 'maintenance', 
  'supplies', 'rent', 'insurance', 'transport', 'other'
] as const;
export type ExpenseCategory = typeof expenseCategories[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  'recurring-bill': 'Recurring Bill',
  'utilities': 'Utilities',
  'groceries': 'Groceries',
  'maintenance': 'Maintenance',
  'supplies': 'Supplies',
  'rent': 'Rent',
  'insurance': 'Insurance',
  'transport': 'Transport',
  'other': 'Other',
};

export const STAFF_ROLES = [
  'Maid', 'Cook', 'Driver', 'Nanny', 'Gardener', 'Watchman',
  'Caretaker', 'Cleaner', 'Helper', 'Housekeeper', 'Laundry',
  'Babysitter', 'Nurse', 'Tutor', 'Pet Caretaker', 'Other'
] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Bank Transfer', 'Card', 'Wallet', 'Cheque', 'Other'
] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export const SALARY_TYPE_LABELS: Record<SalaryType, string> = {
  MONTHLY: 'Monthly',
  DAILY: 'Daily',
  HOURLY: 'Hourly',
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  FULL: 'Full Day',
  HALF: 'Half Day',
  ABSENT: 'Absent',
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: 'None',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export const appSettingsSchema = z.object({
  currency: z.enum(currencies),
  customCurrencySymbol: z.string().optional(),
  language: z.enum(languages).optional(),
  salaryStartDay: z.number().min(1).max(31),
  halfDayPercentage: z.number().min(0).max(100),
  hasCompletedOnboarding: z.boolean(),
  pinEnabled: z.boolean().optional(),
  pinCode: z.string().optional(),
  householdName: z.string().optional(),
  darkMode: z.boolean().optional(),
  planType: z.enum(['STANDARD', 'PREMIUM']).optional(),
  showAllContexts: z.boolean().optional(),
  defaultAppMode: z.enum(['HOME', 'STAFF']).optional(),
  // Guided tour completion tracking
  homeTourCompleted: z.boolean().optional(),
  staffTourCompleted: z.boolean().optional(),
  // Purchase tracking
  trialStartedAt: z.string().optional(),
  purchaseStatus: z.enum(['STANDARD', 'PURCHASED']).optional(),
  purchaseDate: z.string().optional(),
  purchaseCountry: z.string().optional(),
  // Feedback settings
  hapticFeedbackEnabled: z.boolean().optional(),
  soundEffectsEnabled: z.boolean().optional(),
  // Location & Country settings
  country: z.string().optional(),
  detectedCountry: z.string().optional(),
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultSettings: AppSettings = {
  currency: 'USD',
  language: 'en',
  salaryStartDay: 1,
  halfDayPercentage: 50,
  hasCompletedOnboarding: false,
  pinEnabled: false,
  darkMode: false,
  planType: 'STANDARD',
  showAllContexts: false,
  defaultAppMode: 'HOME',
  homeTourCompleted: false,
  staffTourCompleted: false,
  purchaseStatus: 'STANDARD',
  hapticFeedbackEnabled: true,
  soundEffectsEnabled: true,
};

export const homeSettingsSchema = z.object({
  householdName: z.string().optional(),
  currency: z.enum(currencies),
  customCurrencySymbol: z.string().optional(),
  language: z.enum(languages).optional(),
  salaryStartDay: z.number().min(1).max(31),
  halfDayPercentage: z.number().min(0).max(100),
});

export type HomeSettings = z.infer<typeof homeSettingsSchema>;

export const defaultHomeSettings: HomeSettings = {
  currency: 'USD',
  language: 'en',
  salaryStartDay: 1,
  halfDayPercentage: 50,
};

export const staffSettingsSchema = z.object({
  vendorName: z.string().optional(),
  currency: z.enum(currencies),
  customCurrencySymbol: z.string().optional(),
  language: z.enum(languages).optional(),
});

export type StaffSettings = z.infer<typeof staffSettingsSchema>;

export const defaultStaffSettings: StaffSettings = {
  currency: 'USD',
  language: 'en',
};

export const personSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  name: z.string().min(1),
  role: z.string().min(1),
  phone: z.string().min(10),
  salaryType: z.enum(salaryTypes),
  baseRate: z.number().min(0),
  halfDayPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  photoData: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  currency: z.enum(currencies).optional(),
  customCurrencySymbol: z.string().optional(),
});

export type Person = z.infer<typeof personSchema>;

export const insertPersonSchema = personSchema.omit({ id: true, createdAt: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;

export const attendanceEntrySchema = z.object({
  id: z.string(),
  personId: z.string(),
  date: z.string(),
  status: z.enum(attendanceStatuses),
  hours: z.number().positive().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  recordSalaryType: z.enum(salaryTypes).optional(),
  recordBaseRate: z.number().optional(),
  recordHalfDayPercentage: z.number().optional(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;

export const insertAttendanceSchema = attendanceEntrySchema.omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export const transactionSchema = z.object({
  id: z.string(),
  personId: z.string(),
  category: z.string(),
  description: z.string(),
  transactionNo: z.string().optional(),
  amount: z.number(),
  date: z.string(),
  isPaid: z.boolean(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const insertTransactionSchema = transactionSchema.omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export const LAUNDRY_ITEM_TYPES = [
  'Shirt', 'T-shirt', 'Pants', 'Jeans', 'Bedsheet', 'Towel', 'Saree', 'Kurta',
  'Dress', 'Jacket', 'Blanket', 'Pillow Cover', 'Blazer', '3 Piece Suit',
  '4 Piece Suit', 'Salwar Suit', 'Gown', 'Baby Cloth', 'Wedding Dress', 'Other'
] as const;

export type LaundryItemType = typeof LAUNDRY_ITEM_TYPES[number];

export const LAUNDRY_SERVICE_TYPES = [
  'Wash & Fold',
  'Ironing',
  'Dry Cleaning',
] as const;

export type LaundryServiceType = typeof LAUNDRY_SERVICE_TYPES[number];

export const laundryItemSchema = z.object({
  id: z.string(),
  type: z.string().min(1),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
  subtotal: z.number(),
  details: z.string().optional(),
});

export type LaundryItem = z.infer<typeof laundryItemSchema>;

export const laundryBatchSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  personId: z.string().optional(),
  staffId: z.string().optional(),
  provider: z.string().optional(),
  serviceType: z.enum(LAUNDRY_SERVICE_TYPES).optional(),
  date: z.string(),
  items: z.array(laundryItemSchema),
  pickupDelivery: z.boolean().optional(),
  pickupDeliveryCharge: z.number().optional(),
  itemsTotal: z.number().optional(),
  total: z.number(),
  isPaid: z.boolean().default(false),
  paidAt: z.string().optional(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type LaundryBatch = z.infer<typeof laundryBatchSchema>;

export const insertLaundryBatchSchema = laundryBatchSchema.omit({ id: true, createdAt: true });
export type InsertLaundryBatch = z.infer<typeof insertLaundryBatchSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  category: z.string(),
  customCategory: z.string().optional(),
  title: z.string().min(1),
  vendor: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string(),
  recurrence: z.enum(recurrenceTypes),
  reminderDays: z.number().min(0).optional(),
  isPaid: z.boolean(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const insertExpenseSchema = expenseSchema.omit({ id: true, createdAt: true });
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export const backupDataSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  settings: appSettingsSchema,
  profile: userProfileSchema.optional(),
  accounts: z.array(accountSchema).optional(),
  people: z.array(personSchema),
  attendance: z.array(attendanceEntrySchema),
  transactions: z.array(transactionSchema),
  laundry: z.array(laundryBatchSchema),
  expenses: z.array(expenseSchema),
});

export type BackupData = z.infer<typeof backupDataSchema>;

export const currencySymbols: Record<Currency, string> = {
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

// ============ STAFF USER SPECIFIC SCHEMAS ============

export const clientHomeSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string().min(1),
  address: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  role: z.string().min(1),
  salaryType: z.enum(salaryTypes),
  rate: z.number().positive(),
  isActive: z.boolean(),
  createdAt: z.string(),
  currency: z.enum(currencies).optional(),
  customCurrencySymbol: z.string().optional(),
});

export type ClientHome = z.infer<typeof clientHomeSchema>;

export const insertClientHomeSchema = clientHomeSchema.omit({ id: true, createdAt: true });
export type InsertClientHome = z.infer<typeof insertClientHomeSchema>;

export const selfAttendanceSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
  clientHomeId: z.string(),
  date: z.string(),
  status: z.enum(attendanceStatuses),
  hoursWorked: z.number().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  recordSalaryType: z.enum(salaryTypes).optional(),
  recordRate: z.number().optional(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type SelfAttendance = z.infer<typeof selfAttendanceSchema>;

export const insertSelfAttendanceSchema = selfAttendanceSchema.omit({ id: true, createdAt: true });
export type InsertSelfAttendance = z.infer<typeof insertSelfAttendanceSchema>;

export const staffLaundryJobSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
  accountId: z.string().optional(),
  clientHomeId: z.string(),
  date: z.string(),
  itemCount: z.number().int().nonnegative(),
  ratePerItem: z.number().nonnegative(),
  totalEarned: z.number(),
  items: z.array(laundryItemSchema).optional(),
  serviceType: z.string().optional(),
  pickupDelivery: z.boolean().optional(),
  pickupDeliveryCharge: z.number().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type StaffLaundryJob = z.infer<typeof staffLaundryJobSchema>;

export const insertStaffLaundryJobSchema = staffLaundryJobSchema.omit({ id: true, createdAt: true });
export type InsertStaffLaundryJob = z.infer<typeof insertStaffLaundryJobSchema>;

export const staffEarningSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
  clientHomeId: z.string().optional(),
  date: z.string(),
  amount: z.number(),
  type: z.enum(['salary', 'laundry', 'bonus', 'tip', 'advance', 'other']),
  description: z.string().optional(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type StaffEarning = z.infer<typeof staffEarningSchema>;

export const insertStaffEarningSchema = staffEarningSchema.omit({ id: true, createdAt: true });
export type InsertStaffEarning = z.infer<typeof insertStaffEarningSchema>;

export const staffExpenseSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
  accountId: z.string().optional(),
  clientHomeId: z.string().optional(),
  title: z.string().min(1),
  category: z.string(),
  amount: z.number().positive(),
  dueDate: z.string(),
  isPaid: z.boolean().default(false),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  recurrence: z.enum(["one-time", "weekly", "monthly", "yearly"]).default("one-time"),
  reminderDays: z.number().optional(),
  createdAt: z.string(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});
export type StaffExpense = z.infer<typeof staffExpenseSchema>;

export const insertStaffExpenseSchema = staffExpenseSchema.omit({ id: true, createdAt: true });
export type InsertStaffExpense = z.infer<typeof insertStaffExpenseSchema>;

// ============ STAFF INVOICE SCHEMA ============

export const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];

export const invoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  amount: z.number(),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const staffInvoiceSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
  clientHomeId: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema),
  subtotal: z.number(),
  taxRate: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number(),
  status: z.enum(invoiceStatuses),
  notes: z.string().optional(),
  createdAt: z.string(),
  paidDate: z.string().optional(),
  recordCurrency: z.string().optional(),
  recordCurrencySymbol: z.string().optional(),
});

export type StaffInvoice = z.infer<typeof staffInvoiceSchema>;

export const insertStaffInvoiceSchema = staffInvoiceSchema.omit({ id: true, createdAt: true });
export type InsertStaffInvoice = z.infer<typeof insertStaffInvoiceSchema>;

export const STAFF_STORAGE_KEYS = {
  CLIENT_HOMES: 'hm_staff_client_homes',
  SELF_ATTENDANCE: 'hm_staff_self_attendance',
  LAUNDRY_JOBS: 'hm_staff_laundry_jobs',
  EARNINGS: 'hm_staff_earnings',
  EXPENSES: 'hm_staff_expenses',
  INVOICES: 'hm_staff_invoices',
} as const;

// ============ PLAN TYPES AND LIMITS ============

export const planTypes = ['STANDARD', 'PREMIUM'] as const;
export type PlanType = typeof planTypes[number];

export const purchaseStatuses = ['STANDARD', 'PURCHASED'] as const;
export type PurchaseStatus = typeof purchaseStatuses[number];

export const PRICING = {
  INR: { amount: 299, symbol: '₹', label: '₹299' },
  USD: { amount: 30, symbol: '$', label: '$30' },
  EUR: { amount: 30, symbol: '€', label: '€30' },
  GBP: { amount: 25, symbol: '£', label: '£25' },
  AED: { amount: 110, symbol: 'د.إ', label: '110 د.إ' },
  OTHER: { amount: 30, symbol: '$', label: '$30' },
} as const;

export const PLAN_LIMITS = {
  HOME: {
    maxHouseholds: 10,
  },
  STAFF: {
    maxBusinesses: 10,
  },
} as const;

export const STORAGE_LIMITS = {
  totalRecordsWarning: 900,
  totalRecordsSoftLimit: 1000,
} as const;

// ============ DOCUMENT CATEGORIES ============

export const HOME_DOCUMENT_CATEGORIES = [
  'Identity Proof',
  'Address Proof',
  'Rental / Ownership Documents',
  'Staff Documents',
  'Bills & Utilities',
  'Maintenance & Repairs',
  'Insurance',
  'Receipts & Invoices',
  'Legal Documents',
  'Photos / Media',
  'Other',
] as const;
export type HomeDocumentCategory = typeof HOME_DOCUMENT_CATEGORIES[number];

export const STAFF_DOCUMENT_CATEGORIES = [
  'Identity Proof',
  'Work Proof',
  'Client Agreements',
  'Payment Proofs',
  'Certifications',
  'Licenses',
  'Bills & Expenses',
  'Photos / Media',
  'Other',
] as const;
export type StaffDocumentCategory = typeof STAFF_DOCUMENT_CATEGORIES[number];

// ============ DOCUMENT SCHEMA ============

export const linkedRecordTypes = ['EXPENSE', 'TRANSACTION', 'PERSON', 'LAUNDRY', 'CLIENT_HOME'] as const;
export type LinkedRecordType = typeof linkedRecordTypes[number];

export const documentSchema = z.object({
  id: z.string(),
  ownerType: z.enum(userTypes),
  accountId: z.string(),
  category: z.string(),
  description: z.string().optional(),
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  fileData: z.string(),
  linkedRecordType: z.enum(linkedRecordTypes).optional(),
  linkedRecordId: z.string().optional(),
  createdAt: z.string(),
});

export type Document = z.infer<typeof documentSchema>;

export const insertDocumentSchema = documentSchema.omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export const DOCUMENT_STORAGE_KEY = 'hm_documents';

// ============ SERVER-SIDE DATABASE SCHEMAS (Drizzle ORM) ============
// These schemas match the existing database structure with varchar IDs

export const userStatuses = ['pending_verification', 'active', 'suspended', 'archived'] as const;
export type UserStatus = typeof userStatuses[number];

export const serverUsers = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  passwordHash: text("password_hash"),
  userType: varchar("user_type", { length: 50 }),
  displayName: varchar("display_name", { length: 100 }),
  avatarData: text("avatar_data"),
  avatarUpdatedAt: timestamp("avatar_updated_at"),
  planTier: varchar("plan_tier", { length: 50 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }),
  subscriptionExpiryDate: timestamp("subscription_expiry_date"),
  otpHash: text("otp_hash"),
  otpExpiresAt: timestamp("otp_expires_at"),
  otpAttemptCount: integer("otp_attempt_count").default(0),
  otpAttemptResetAt: timestamp("otp_attempt_reset_at"),
  otpLastSentAt: timestamp("otp_last_sent_at"),
  isVerified: boolean("is_verified").default(false),
  isNewUser: boolean("is_new_user").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  preferredLanguage: varchar("preferred_language", { length: 10 }),
  lastLoginAt: timestamp("last_login_at"),
  lastActiveAt: timestamp("last_active_at"),
  deviceInfo: text("device_info"),
  isActive: boolean("is_active").default(true),
  connectCount: integer("connect_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serverUsersRelations = relations(serverUsers, ({ many }) => ({
  devices: many(devices),
  collaborationLinksAsHome: many(collaborationLinks, { relationName: "homeUser" }),
  collaborationLinksAsStaff: many(collaborationLinks, { relationName: "staffUser" }),
}));

export const insertServerUserSchema = z.object({
  id: z.string().max(255),
  phone: z.string().min(10).max(20),
  userType: z.string().max(50).optional(),
  displayName: z.string().max(100).optional(),
  isVerified: z.boolean().optional(),
  preferredLanguage: z.string().max(10).optional(),
});
export type InsertServerUser = z.infer<typeof insertServerUserSchema>;
export type ServerUser = typeof serverUsers.$inferSelect;

export const devices = pgTable("devices", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  deviceId: varchar("device_id", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 50 }),
  deviceName: varchar("device_name", { length: 100 }),
  pushToken: text("push_token"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(serverUsers, {
    fields: [devices.userId],
    references: [serverUsers.id],
  }),
}));

export const insertDeviceSchema = z.object({
  id: z.string().max(255),
  userId: z.string().max(255),
  deviceId: z.string().max(255),
  platform: z.string().max(50).optional(),
  deviceName: z.string().max(100).optional(),
  pushToken: z.string().optional(),
  lastSyncAt: z.date().optional(),
});
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Device = typeof devices.$inferSelect;

export const collaborationStatuses = ['pending', 'active', 'suspended', 'revoked'] as const;
export type CollaborationStatus = typeof collaborationStatuses[number];

export const collaborationLinks = pgTable("collaboration_links", {
  id: varchar("id", { length: 255 }).primaryKey(),
  homeUserId: varchar("home_user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  homeAccountId: varchar("home_account_id", { length: 100 }).notNull(),
  staffUserId: varchar("staff_user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  staffAccountId: varchar("staff_account_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 30 }).default('pending').notNull(),
  invitationCode: varchar("invitation_code", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const collaborationLinksRelations = relations(collaborationLinks, ({ one, many }) => ({
  homeUser: one(serverUsers, {
    fields: [collaborationLinks.homeUserId],
    references: [serverUsers.id],
    relationName: "homeUser",
  }),
  staffUser: one(serverUsers, {
    fields: [collaborationLinks.staffUserId],
    references: [serverUsers.id],
    relationName: "staffUser",
  }),
  messages: many(collaborationMessages),
}));

export const insertCollaborationLinkSchema = z.object({
  id: z.string().max(255),
  homeUserId: z.string().max(255),
  homeAccountId: z.string().max(100),
  staffUserId: z.string().max(255),
  staffAccountId: z.string().max(100),
  status: z.enum(collaborationStatuses).optional(),
  invitationCode: z.string().max(50).optional(),
  expiresAt: z.date().optional(),
});
export type InsertCollaborationLink = z.infer<typeof insertCollaborationLinkSchema>;
export type CollaborationLink = typeof collaborationLinks.$inferSelect;

export const collaborationMessages = pgTable("collaboration_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  linkId: varchar("link_id", { length: 255 }).references(() => collaborationLinks.id).notNull(),
  fromDeviceId: varchar("from_device_id", { length: 255 }).references(() => devices.id),
  messageType: varchar("message_type", { length: 50 }).notNull(),
  payload: text("payload").notNull(),
  stateVersion: integer("state_version").default(1).notNull(),
  isProcessed: boolean("is_processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collaborationMessagesRelations = relations(collaborationMessages, ({ one }) => ({
  link: one(collaborationLinks, {
    fields: [collaborationMessages.linkId],
    references: [collaborationLinks.id],
  }),
  fromDevice: one(devices, {
    fields: [collaborationMessages.fromDeviceId],
    references: [devices.id],
  }),
}));

export const insertCollaborationMessageSchema = z.object({
  id: z.string().max(255),
  linkId: z.string().max(255),
  fromDeviceId: z.string().max(255).optional(),
  messageType: z.string().max(50),
  payload: z.string(),
  stateVersion: z.number().optional(),
  isProcessed: z.boolean().optional(),
});
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;

// ============ MULTI-TIER ADMIN HIERARCHY ============

// Admin role types for type safety
export const adminRoleNames = ['owner', 'super_admin', 'admin'] as const;
export type AdminRoleName = typeof adminRoleNames[number];

// Invitation statuses
export const adminInvitationStatuses = ['pending', 'accepted', 'expired'] as const;
export type AdminInvitationStatus = typeof adminInvitationStatuses[number];

// Admin roles table - defines the hierarchy with precedence
// Precedence: 1 = highest (owner), 2 = super_admin, 3 = admin
export const adminRolesTable = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  precedence: integer("precedence").notNull(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminRolesTableRelations = relations(adminRolesTable, ({ many }) => ({
  users: many(adminUsers),
  invitations: many(adminInvitations),
}));

export const insertAdminRoleSchema = z.object({
  name: z.string().min(1),
  precedence: z.number().int().min(1),
  permissions: z.array(z.string()).optional(),
});
export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRolesTable.$inferSelect;

// Admin users table - with role hierarchy support
export const adminUsers = pgTable("admin_users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  roleId: integer("role_id").references(() => adminRolesTable.id),
  isActive: boolean("is_active").default(true).notNull(),
  invitedBy: varchar("invited_by", { length: 255 }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  role: one(adminRolesTable, {
    fields: [adminUsers.roleId],
    references: [adminRolesTable.id],
  }),
  invitedByAdmin: one(adminUsers, {
    fields: [adminUsers.invitedBy],
    references: [adminUsers.id],
    relationName: "invitedAdmins",
  }),
  invitedAdmins: many(adminUsers, { relationName: "invitedAdmins" }),
  sentInvitations: many(adminInvitations),
}));

export const insertAdminUserSchema = z.object({
  id: z.string().max(255),
  email: z.string().email().max(255),
  passwordHash: z.string(),
  name: z.string().max(100),
  roleId: z.number().int().optional(),
  isActive: z.boolean().optional(),
  invitedBy: z.string().max(255).optional(),
});
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Admin invitations table - for inviting new admins
export const adminInvitations = pgTable("admin_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  roleId: integer("role_id").references(() => adminRolesTable.id).notNull(),
  token: text("token").unique().notNull(),
  status: text("status").default('pending').notNull(),
  invitedById: varchar("invited_by_id", { length: 255 }).references(() => adminUsers.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminInvitationsRelations = relations(adminInvitations, ({ one }) => ({
  role: one(adminRolesTable, {
    fields: [adminInvitations.roleId],
    references: [adminRolesTable.id],
  }),
  invitedBy: one(adminUsers, {
    fields: [adminInvitations.invitedById],
    references: [adminUsers.id],
  }),
}));

export const insertAdminInvitationSchema = z.object({
  email: z.string().email(),
  roleId: z.number().int(),
  token: z.string().min(1),
  status: z.enum(adminInvitationStatuses).optional(),
  invitedById: z.string().max(255).optional(),
  expiresAt: z.date(),
});
export type InsertAdminInvitation = z.infer<typeof insertAdminInvitationSchema>;
export type AdminInvitation = typeof adminInvitations.$inferSelect;

// Default admin permissions by role
export const DEFAULT_ADMIN_PERMISSIONS = {
  owner: [
    'manage_super_admins',
    'manage_admins',
    'manage_users',
    'manage_ads',
    'view_analytics',
    'manage_settings',
    'manage_subscriptions',
    'full_access',
  ],
  super_admin: [
    'manage_admins',
    'manage_users',
    'manage_ads',
    'view_analytics',
    'manage_settings',
  ],
  admin: [
    'manage_users',
    'view_analytics',
  ],
} as const;

// Seed data for default admin roles (use in migration or seed script):
// INSERT INTO admin_roles (name, precedence, permissions) VALUES
//   ('owner', 1, '["manage_super_admins","manage_admins","manage_users","manage_ads","view_analytics","manage_settings","manage_subscriptions","full_access"]'),
//   ('super_admin', 2, '["manage_admins","manage_users","manage_ads","view_analytics","manage_settings"]'),
//   ('admin', 3, '["manage_users","view_analytics"]');

// ============ REAL-TIME COLLABORATION SYSTEM ============

// Binding connects a home user's staff person with a staff user's client record
export const collaborationBindings = pgTable("collaboration_bindings", {
  id: varchar("id", { length: 255 }).primaryKey(),
  linkId: varchar("link_id", { length: 255 }).references(() => collaborationLinks.id).notNull(),
  // Home user side - person they employ
  homePersonId: varchar("home_person_id", { length: 255 }).notNull(),
  homePersonName: varchar("home_person_name", { length: 100 }),
  // Staff user side - client they work for
  staffClientId: varchar("staff_client_id", { length: 255 }).notNull(),
  staffClientName: varchar("staff_client_name", { length: 100 }),
  // Binding status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const collaborationBindingsRelations = relations(collaborationBindings, ({ one, many }) => ({
  link: one(collaborationLinks, {
    fields: [collaborationBindings.linkId],
    references: [collaborationLinks.id],
  }),
  attendanceRecords: many(sharedAttendance),
  laundryRecords: many(sharedLaundry),
}));

export const insertCollaborationBindingSchema = z.object({
  id: z.string().max(255),
  linkId: z.string().max(255),
  homePersonId: z.string().max(255),
  homePersonName: z.string().max(100).optional(),
  staffClientId: z.string().max(255),
  staffClientName: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});
export type InsertCollaborationBinding = z.infer<typeof insertCollaborationBindingSchema>;
export type CollaborationBinding = typeof collaborationBindings.$inferSelect;

// Approval workflow statuses
export const approvalStatuses = ['pending', 'approved', 'rejected', 'revised'] as const;
export type ApprovalStatus = typeof approvalStatuses[number];

// Shared attendance - one record per binding per day with approval workflow
export const sharedAttendance = pgTable("shared_attendance", {
  id: varchar("id", { length: 255 }).primaryKey(),
  bindingId: varchar("binding_id", { length: 255 }).references(() => collaborationBindings.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  status: varchar("status", { length: 20 }).notNull(), // FULL, HALF, ABSENT
  hoursWorked: integer("hours_worked"),
  note: text("note"),
  // Approval workflow
  approvalStatus: varchar("approval_status", { length: 20 }).default('pending').notNull(),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => serverUsers.id).notNull(),
  submittedByRole: varchar("submitted_by_role", { length: 10 }).notNull(), // HOME or STAFF
  actionRequiredBy: varchar("action_required_by", { length: 255 }).references(() => serverUsers.id),
  // Revision tracking
  currentRevisionId: varchar("current_revision_id", { length: 255 }),
  revisionCount: integer("revision_count").default(0),
  // Rate snapshot for calculations
  recordSalaryType: varchar("record_salary_type", { length: 20 }),
  recordRate: integer("record_rate"),
  recordCurrency: varchar("record_currency", { length: 10 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
});

export const sharedAttendanceRelations = relations(sharedAttendance, ({ one, many }) => ({
  binding: one(collaborationBindings, {
    fields: [sharedAttendance.bindingId],
    references: [collaborationBindings.id],
  }),
  submitter: one(serverUsers, {
    fields: [sharedAttendance.submittedBy],
    references: [serverUsers.id],
  }),
  revisions: many(attendanceRevisions),
}));

export const insertSharedAttendanceSchema = z.object({
  id: z.string().max(255),
  bindingId: z.string().max(255),
  date: z.string().max(10),
  status: z.enum(attendanceStatuses),
  hoursWorked: z.number().optional(),
  note: z.string().optional(),
  approvalStatus: z.enum(approvalStatuses).optional(),
  submittedBy: z.string().max(255),
  submittedByRole: z.enum(userTypes),
  actionRequiredBy: z.string().max(255).optional(),
  recordSalaryType: z.string().max(20).optional(),
  recordRate: z.number().optional(),
  recordCurrency: z.string().max(10).optional(),
});
export type InsertSharedAttendance = z.infer<typeof insertSharedAttendanceSchema>;
export type SharedAttendance = typeof sharedAttendance.$inferSelect;

// Attendance revisions - track changes and remarks
export const attendanceRevisions = pgTable("attendance_revisions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  attendanceId: varchar("attendance_id", { length: 255 }).references(() => sharedAttendance.id).notNull(),
  revisionNumber: integer("revision_number").notNull(),
  // What changed
  previousStatus: varchar("previous_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }),
  previousHours: integer("previous_hours"),
  newHours: integer("new_hours"),
  // Rejection/revision remarks
  remarks: text("remarks"),
  action: varchar("action", { length: 20 }).notNull(), // submitted, approved, rejected, revised
  actionBy: varchar("action_by", { length: 255 }).references(() => serverUsers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attendanceRevisionsRelations = relations(attendanceRevisions, ({ one }) => ({
  attendance: one(sharedAttendance, {
    fields: [attendanceRevisions.attendanceId],
    references: [sharedAttendance.id],
  }),
  actor: one(serverUsers, {
    fields: [attendanceRevisions.actionBy],
    references: [serverUsers.id],
  }),
}));

export const insertAttendanceRevisionSchema = z.object({
  id: z.string().max(255),
  attendanceId: z.string().max(255),
  revisionNumber: z.number(),
  previousStatus: z.string().max(20).optional(),
  newStatus: z.string().max(20).optional(),
  previousHours: z.number().optional(),
  newHours: z.number().optional(),
  remarks: z.string().optional(),
  action: z.string().max(20),
  actionBy: z.string().max(255),
});
export type InsertAttendanceRevision = z.infer<typeof insertAttendanceRevisionSchema>;
export type AttendanceRevision = typeof attendanceRevisions.$inferSelect;

// Shared laundry - one record per batch with approval workflow
export const sharedLaundry = pgTable("shared_laundry", {
  id: varchar("id", { length: 255 }).primaryKey(),
  bindingId: varchar("binding_id", { length: 255 }).references(() => collaborationBindings.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  // Laundry details stored as JSON
  items: text("items").notNull(), // JSON array of items
  itemsTotal: integer("items_total"),
  pickupDelivery: boolean("pickup_delivery").default(false),
  pickupDeliveryCharge: integer("pickup_delivery_charge"),
  total: integer("total").notNull(),
  serviceType: varchar("service_type", { length: 50 }),
  // Approval workflow
  approvalStatus: varchar("approval_status", { length: 20 }).default('pending').notNull(),
  submittedBy: varchar("submitted_by", { length: 255 }).references(() => serverUsers.id).notNull(),
  submittedByRole: varchar("submitted_by_role", { length: 10 }).notNull(),
  actionRequiredBy: varchar("action_required_by", { length: 255 }).references(() => serverUsers.id),
  // Revision tracking
  currentRevisionId: varchar("current_revision_id", { length: 255 }),
  revisionCount: integer("revision_count").default(0),
  // Currency snapshot
  recordCurrency: varchar("record_currency", { length: 10 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
});

export const sharedLaundryRelations = relations(sharedLaundry, ({ one, many }) => ({
  binding: one(collaborationBindings, {
    fields: [sharedLaundry.bindingId],
    references: [collaborationBindings.id],
  }),
  submitter: one(serverUsers, {
    fields: [sharedLaundry.submittedBy],
    references: [serverUsers.id],
  }),
  revisions: many(laundryRevisions),
}));

export const insertSharedLaundrySchema = z.object({
  id: z.string().max(255),
  bindingId: z.string().max(255),
  date: z.string().max(10),
  items: z.string(),
  itemsTotal: z.number().optional(),
  pickupDelivery: z.boolean().optional(),
  pickupDeliveryCharge: z.number().optional(),
  total: z.number(),
  serviceType: z.string().max(50).optional(),
  approvalStatus: z.enum(approvalStatuses).optional(),
  submittedBy: z.string().max(255),
  submittedByRole: z.enum(userTypes),
  actionRequiredBy: z.string().max(255).optional(),
  recordCurrency: z.string().max(10).optional(),
});
export type InsertSharedLaundry = z.infer<typeof insertSharedLaundrySchema>;
export type SharedLaundry = typeof sharedLaundry.$inferSelect;

// Laundry revisions
export const laundryRevisions = pgTable("laundry_revisions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  laundryId: varchar("laundry_id", { length: 255 }).references(() => sharedLaundry.id).notNull(),
  revisionNumber: integer("revision_number").notNull(),
  // What changed - stored as JSON diff
  previousData: text("previous_data"),
  newData: text("new_data"),
  // Remarks
  remarks: text("remarks"),
  action: varchar("action", { length: 20 }).notNull(),
  actionBy: varchar("action_by", { length: 255 }).references(() => serverUsers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const laundryRevisionsRelations = relations(laundryRevisions, ({ one }) => ({
  laundry: one(sharedLaundry, {
    fields: [laundryRevisions.laundryId],
    references: [sharedLaundry.id],
  }),
  actor: one(serverUsers, {
    fields: [laundryRevisions.actionBy],
    references: [serverUsers.id],
  }),
}));

export const insertLaundryRevisionSchema = z.object({
  id: z.string().max(255),
  laundryId: z.string().max(255),
  revisionNumber: z.number(),
  previousData: z.string().optional(),
  newData: z.string().optional(),
  remarks: z.string().optional(),
  action: z.string().max(20),
  actionBy: z.string().max(255),
});
export type InsertLaundryRevision = z.infer<typeof insertLaundryRevisionSchema>;
export type LaundryRevision = typeof laundryRevisions.$inferSelect;

// ============================================
// Collab Connections (Facebook-style Friends List)
// ============================================

export const connectionStatuses = ['pending', 'accepted', 'blocked'] as const;
export type ConnectionStatus = typeof connectionStatuses[number];

// Connection requests by phone number
export const collabConnectionInvites = pgTable("collab_connection_invites", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Who is sending the invite
  senderId: varchar("sender_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  senderMode: varchar("sender_mode", { length: 10 }).notNull(), // HOME or STAFF
  // Target phone number (may not be registered yet)
  targetPhone: varchar("target_phone", { length: 20 }).notNull(),
  targetPhoneNormalized: varchar("target_phone_normalized", { length: 20 }).notNull(),
  // If target is registered, link to their user
  targetUserId: varchar("target_user_id", { length: 255 }).references(() => serverUsers.id),
  // Status
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  // Optional message
  message: text("message"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  respondedAt: timestamp("responded_at"),
});

export const collabConnectionInvitesRelations = relations(collabConnectionInvites, ({ one }) => ({
  sender: one(serverUsers, {
    fields: [collabConnectionInvites.senderId],
    references: [serverUsers.id],
    relationName: "inviteSender",
  }),
  target: one(serverUsers, {
    fields: [collabConnectionInvites.targetUserId],
    references: [serverUsers.id],
    relationName: "inviteTarget",
  }),
}));

export const insertCollabConnectionInviteSchema = z.object({
  id: z.string().max(255),
  senderId: z.string().max(255),
  senderMode: z.enum(userTypes),
  targetPhone: z.string().max(20),
  targetPhoneNormalized: z.string().max(20),
  targetUserId: z.string().max(255).optional(),
  status: z.enum(connectionStatuses).optional(),
  message: z.string().optional(),
});
export type InsertCollabConnectionInvite = z.infer<typeof insertCollabConnectionInviteSchema>;
export type CollabConnectionInvite = typeof collabConnectionInvites.$inferSelect;

// Established connections between users
export const collabConnections = pgTable("collab_connections", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // User A (the one who initiated, or alphabetically first)
  userAId: varchar("user_a_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  userAMode: varchar("user_a_mode", { length: 10 }).notNull(),
  // User B
  userBId: varchar("user_b_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  userBMode: varchar("user_b_mode", { length: 10 }).notNull(),
  // Connection metadata
  status: varchar("status", { length: 20 }).default('accepted').notNull(),
  nickname: varchar("nickname", { length: 100 }), // Optional nickname for the connection
  // Who initiated (for history)
  initiatedBy: varchar("initiated_by", { length: 255 }).references(() => serverUsers.id).notNull(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const collabConnectionsRelations = relations(collabConnections, ({ one }) => ({
  userA: one(serverUsers, {
    fields: [collabConnections.userAId],
    references: [serverUsers.id],
    relationName: "connectionUserA",
  }),
  userB: one(serverUsers, {
    fields: [collabConnections.userBId],
    references: [serverUsers.id],
    relationName: "connectionUserB",
  }),
  initiator: one(serverUsers, {
    fields: [collabConnections.initiatedBy],
    references: [serverUsers.id],
    relationName: "connectionInitiator",
  }),
}));

export const insertCollabConnectionSchema = z.object({
  id: z.string().max(255),
  userAId: z.string().max(255),
  userAMode: z.enum(userTypes),
  userBId: z.string().max(255),
  userBMode: z.enum(userTypes),
  status: z.enum(connectionStatuses).optional(),
  nickname: z.string().max(100).optional(),
  initiatedBy: z.string().max(255),
});
export type InsertCollabConnection = z.infer<typeof insertCollabConnectionSchema>;
export type CollabConnection = typeof collabConnections.$inferSelect;

// ============================================
// Direct Messaging / Chat
// ============================================

export const chatTypes = ['direct', 'group'] as const;
export type ChatType = typeof chatTypes[number];

// Chat conversations
export const collabChats = pgTable("collab_chats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 20 }).default('direct').notNull(),
  name: varchar("name", { length: 100 }), // For group chats
  // For direct chats, store connection reference
  connectionId: varchar("connection_id", { length: 255 }).references(() => collabConnections.id),
  // Last activity for sorting
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: varchar("last_message_preview", { length: 200 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const collabChatsRelations = relations(collabChats, ({ one, many }) => ({
  connection: one(collabConnections, {
    fields: [collabChats.connectionId],
    references: [collabConnections.id],
  }),
  participants: many(chatParticipants),
  messages: many(chatMessages),
}));

export const insertCollabChatSchema = z.object({
  id: z.string().max(255),
  type: z.enum(chatTypes).optional(),
  name: z.string().max(100).optional(),
  connectionId: z.string().max(255).optional(),
});
export type InsertCollabChat = z.infer<typeof insertCollabChatSchema>;
export type CollabChat = typeof collabChats.$inferSelect;

// Chat participants
export const chatParticipants = pgTable("chat_participants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chatId: varchar("chat_id", { length: 255 }).references(() => collabChats.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  userMode: varchar("user_mode", { length: 10 }).notNull(),
  // Role in group chats
  role: varchar("role", { length: 20 }).default('member'),
  // Read tracking
  lastReadAt: timestamp("last_read_at"),
  lastReadMessageId: varchar("last_read_message_id", { length: 255 }),
  // Preferences
  isMuted: boolean("is_muted").default(false),
  // Timestamps
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const chatParticipantsRelations = relations(chatParticipants, ({ one }) => ({
  chat: one(collabChats, {
    fields: [chatParticipants.chatId],
    references: [collabChats.id],
  }),
  user: one(serverUsers, {
    fields: [chatParticipants.userId],
    references: [serverUsers.id],
  }),
}));

export const insertChatParticipantSchema = z.object({
  id: z.string().max(255),
  chatId: z.string().max(255),
  userId: z.string().max(255),
  userMode: z.enum(userTypes),
  role: z.string().max(20).optional(),
});
export type InsertChatParticipant = z.infer<typeof insertChatParticipantSchema>;
export type ChatParticipant = typeof chatParticipants.$inferSelect;

// Chat messages
export const messageStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'] as const;
export type MessageStatus = typeof messageStatuses[number];

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 255 }).primaryKey(),
  chatId: varchar("chat_id", { length: 255 }).references(() => collabChats.id).notNull(),
  senderId: varchar("sender_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  senderMode: varchar("sender_mode", { length: 10 }).notNull(),
  // Message content
  content: text("content").notNull(),
  // Status
  status: varchar("status", { length: 20 }).default('sent').notNull(),
  // Client ID for deduplication
  clientMessageId: varchar("client_message_id", { length: 255 }),
  // Reply reference
  replyToId: varchar("reply_to_id", { length: 255 }),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
});

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(collabChats, {
    fields: [chatMessages.chatId],
    references: [collabChats.id],
  }),
  sender: one(serverUsers, {
    fields: [chatMessages.senderId],
    references: [serverUsers.id],
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
    relationName: "messageReplies",
  }),
}));

export const insertChatMessageSchema = z.object({
  id: z.string().max(255),
  chatId: z.string().max(255),
  senderId: z.string().max(255),
  senderMode: z.enum(userTypes),
  content: z.string(),
  status: z.enum(messageStatuses).optional(),
  clientMessageId: z.string().max(255).optional(),
  replyToId: z.string().max(255).optional(),
});
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ============================================
// Shared Spaces (Household/Business Groups)
// ============================================

export const shareRoles = ['admin', 'editor', 'viewer'] as const;
export type ShareRole = typeof shareRoles[number];

// Household shares - one household shared with many users
export const householdShares = pgTable("household_shares", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Owner of the household (admin by default)
  ownerId: varchar("owner_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  // Local household ID from owner's app
  localHouseholdId: varchar("local_household_id", { length: 255 }).notNull(),
  householdName: varchar("household_name", { length: 100 }).notNull(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const householdSharesRelations = relations(householdShares, ({ one, many }) => ({
  owner: one(serverUsers, {
    fields: [householdShares.ownerId],
    references: [serverUsers.id],
  }),
  members: many(householdShareMembers),
}));

export const insertHouseholdShareSchema = z.object({
  id: z.string().max(255),
  ownerId: z.string().max(255),
  localHouseholdId: z.string().max(255),
  householdName: z.string().max(100),
});
export type InsertHouseholdShare = z.infer<typeof insertHouseholdShareSchema>;
export type HouseholdShare = typeof householdShares.$inferSelect;

// Household share members
export const householdShareMembers = pgTable("household_share_members", {
  id: varchar("id", { length: 255 }).primaryKey(),
  shareId: varchar("share_id", { length: 255 }).references(() => householdShares.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  role: varchar("role", { length: 20 }).default('viewer').notNull(),
  // Invitation status
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const householdShareMembersRelations = relations(householdShareMembers, ({ one }) => ({
  share: one(householdShares, {
    fields: [householdShareMembers.shareId],
    references: [householdShares.id],
  }),
  user: one(serverUsers, {
    fields: [householdShareMembers.userId],
    references: [serverUsers.id],
  }),
}));

export const insertHouseholdShareMemberSchema = z.object({
  id: z.string().max(255),
  shareId: z.string().max(255),
  userId: z.string().max(255),
  role: z.enum(shareRoles).optional(),
  status: z.string().max(20).optional(),
});
export type InsertHouseholdShareMember = z.infer<typeof insertHouseholdShareMemberSchema>;
export type HouseholdShareMember = typeof householdShareMembers.$inferSelect;

// Business shares - one business shared with many staff users
export const businessShares = pgTable("business_shares", {
  id: varchar("id", { length: 255 }).primaryKey(),
  // Owner of the business (admin by default)
  ownerId: varchar("owner_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  // Local business ID from owner's app
  localBusinessId: varchar("local_business_id", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 100 }).notNull(),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessSharesRelations = relations(businessShares, ({ one, many }) => ({
  owner: one(serverUsers, {
    fields: [businessShares.ownerId],
    references: [serverUsers.id],
  }),
  members: many(businessShareMembers),
}));

export const insertBusinessShareSchema = z.object({
  id: z.string().max(255),
  ownerId: z.string().max(255),
  localBusinessId: z.string().max(255),
  businessName: z.string().max(100),
});
export type InsertBusinessShare = z.infer<typeof insertBusinessShareSchema>;
export type BusinessShare = typeof businessShares.$inferSelect;

// Business share members
export const businessShareMembers = pgTable("business_share_members", {
  id: varchar("id", { length: 255 }).primaryKey(),
  shareId: varchar("share_id", { length: 255 }).references(() => businessShares.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  role: varchar("role", { length: 20 }).default('viewer').notNull(),
  // Invitation status
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessShareMembersRelations = relations(businessShareMembers, ({ one }) => ({
  share: one(businessShares, {
    fields: [businessShareMembers.shareId],
    references: [businessShares.id],
  }),
  user: one(serverUsers, {
    fields: [businessShareMembers.userId],
    references: [serverUsers.id],
  }),
}));

export const insertBusinessShareMemberSchema = z.object({
  id: z.string().max(255),
  shareId: z.string().max(255),
  userId: z.string().max(255),
  role: z.enum(shareRoles).optional(),
  status: z.string().max(20).optional(),
});
export type InsertBusinessShareMember = z.infer<typeof insertBusinessShareMemberSchema>;
export type BusinessShareMember = typeof businessShareMembers.$inferSelect;

// Notification types
export const notificationTypes = [
  'connection_request',
  'connection_accepted',
  'connection_rejected',
  'attendance_submitted',
  'attendance_approved',
  'attendance_rejected',
  'laundry_submitted',
  'laundry_approved',
  'laundry_rejected',
  'binding_created',
  'chat_message',
  'share_invitation',
  'share_accepted',
] as const;
export type NotificationType = typeof notificationTypes[number];

// User notifications
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id).notNull(),
  userMode: varchar("user_mode", { length: 10 }).notNull(), // HOME or STAFF
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  // Related entity
  entityType: varchar("entity_type", { length: 50 }), // attendance, laundry, connection
  entityId: varchar("entity_id", { length: 255 }),
  // Additional data as JSON
  payload: text("payload"),
  // Action required
  actionRequired: boolean("action_required").default(false),
  actionType: varchar("action_type", { length: 50 }), // approve, reject, view
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isActioned: boolean("is_actioned").default(false),
  actionedAt: timestamp("actioned_at"),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(serverUsers, {
    fields: [notifications.userId],
    references: [serverUsers.id],
  }),
}));

export const insertNotificationSchema = z.object({
  id: z.string().max(255),
  userId: z.string().max(255),
  userMode: z.enum(userTypes),
  type: z.enum(notificationTypes),
  title: z.string().max(255),
  message: z.string().optional(),
  entityType: z.string().max(50).optional(),
  entityId: z.string().max(255).optional(),
  payload: z.string().optional(),
  actionRequired: z.boolean().optional(),
  actionType: z.string().max(50).optional(),
  isRead: z.boolean().optional(),
  expiresAt: z.date().optional(),
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ============================================
// Advertisement System
// ============================================

export const adOrientations = ['landscape', 'portrait', 'any'] as const;
export type AdOrientation = typeof adOrientations[number];

export const advertisements = pgTable("advertisements", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull().default(30), // in seconds, max 30
  weight: integer("weight").notNull().default(1), // for equal distribution, all ads should have same weight
  isActive: boolean("is_active").notNull().default(true),
  advertiser: varchar("advertiser", { length: 255 }),
  targetUrl: text("target_url"), // URL to open when user taps the ad
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxPlayCount: integer("max_play_count"), // null = unlimited, number = max times to show per device
  orientation: varchar("orientation", { length: 20 }).default("landscape").notNull(), // landscape, portrait, any
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const adSettings = pgTable("ad_settings", {
  id: serial("id").primaryKey(),
  adsEnabled: boolean("ads_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by", { length: 255 }).references(() => adminUsers.id),
});

export const insertAdvertisementSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().min(1).max(30).default(30),
  weight: z.number().min(1).default(1),
  isActive: z.boolean().default(true),
  advertiser: z.string().max(255).optional(),
  targetUrl: z.string().url().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  maxPlayCount: z.number().int().positive().optional().nullable(),
  orientation: z.enum(adOrientations).default("landscape"),
});
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisements.$inferSelect;

export const insertAdSettingsSchema = z.object({
  adsEnabled: z.boolean().default(true),
});
export type InsertAdSettings = z.infer<typeof insertAdSettingsSchema>;
export type AdSettings = typeof adSettings.$inferSelect;

export const adImpressions = pgTable("ad_impressions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  adId: varchar("ad_id", { length: 255 }).references(() => advertisements.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id),
  sessionId: varchar("session_id", { length: 255 }), // For anonymous tracking
  deviceId: varchar("device_id", { length: 255 }),
  watchedDuration: integer("watched_duration").notNull().default(0), // seconds actually watched
  completed: boolean("completed").notNull().default(false), // watched till end or skipped after 5s
  skipped: boolean("skipped").notNull().default(false),
  skippedAt: integer("skipped_at"), // seconds when skipped
  clickedThrough: boolean("clicked_through").notNull().default(false), // tapped to go to advertiser
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdImpressionSchema = z.object({
  adId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  deviceId: z.string().optional(),
  watchedDuration: z.number().min(0).default(0),
  completed: z.boolean().default(false),
  skipped: z.boolean().default(false),
  skippedAt: z.number().optional(),
  clickedThrough: z.boolean().default(false),
});
export type InsertAdImpression = z.infer<typeof insertAdImpressionSchema>;
export type AdImpression = typeof adImpressions.$inferSelect;

// ============================================
// Offline-First Sync Queue Types (Client-side only)
// ============================================

export const syncOperationTypes = [
  'submit_attendance',
  'approve_attendance',
  'reject_attendance',
  'revise_attendance',
  'submit_laundry',
  'approve_laundry',
  'reject_laundry',
  'revise_laundry',
  'create_binding',
  'accept_connection',
  'reject_connection',
] as const;
export type SyncOperationType = typeof syncOperationTypes[number];

export const syncQueueStatuses = ['pending', 'in_progress', 'completed', 'failed', 'conflict'] as const;
export type SyncQueueStatus = typeof syncQueueStatuses[number];

export const syncQueueItemSchema = z.object({
  id: z.string(),
  operationType: z.enum(syncOperationTypes),
  endpoint: z.string(),
  method: z.enum(['POST', 'PATCH', 'DELETE']),
  payload: z.string(), // JSON stringified payload
  entityType: z.string().optional(), // attendance, laundry, binding
  entityId: z.string().optional(),
  bindingId: z.string().optional(),
  status: z.enum(syncQueueStatuses),
  retryCount: z.number().default(0),
  maxRetries: z.number().default(3),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  lastAttemptAt: z.string().optional(),
  completedAt: z.string().optional(),
  // For conflict detection
  baseVersion: z.number().optional(),
  clientRequestId: z.string(), // Idempotency key
});
export type SyncQueueItem = z.infer<typeof syncQueueItemSchema>;

// Shared record view model for approval UI
export const sharedRecordSchema = z.object({
  id: z.string(),
  type: z.enum(['attendance', 'laundry']),
  bindingId: z.string(),
  date: z.string(),
  approvalStatus: z.enum(approvalStatuses),
  submittedBy: z.string(),
  submittedByRole: z.enum(userTypes),
  submittedByName: z.string().optional(),
  actionRequiredBy: z.string().optional(),
  currentRevisionId: z.string().optional(),
  rejectionRemarks: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  // Record-specific data stored as JSON
  recordData: z.string(), // JSON payload
  // Currency info
  currency: z.string().optional(),
});
export type SharedRecord = z.infer<typeof sharedRecordSchema>;

// Revision entry for history display
export const revisionEntrySchema = z.object({
  id: z.string(),
  recordId: z.string(),
  recordType: z.enum(['attendance', 'laundry']),
  revisionNumber: z.number(),
  action: z.enum(['submitted', 'approved', 'rejected', 'revised']),
  actionBy: z.string(),
  actionByRole: z.enum(userTypes),
  actionByName: z.string().optional(),
  remarks: z.string().optional(),
  previousData: z.string().optional(), // JSON
  newData: z.string().optional(), // JSON
  createdAt: z.string(),
});
export type RevisionEntry = z.infer<typeof revisionEntrySchema>;

// ============================================
// User Backup Management System
// ============================================

export const backupTypes = ['manual', 'automatic', 'pre_delete'] as const;
export type BackupType = typeof backupTypes[number];

export const backupStatuses = ['pending', 'completed', 'failed', 'restored', 'deleted'] as const;
export type BackupStatus = typeof backupStatuses[number];

export const backupLogActions = ['created', 'restored', 'deleted', 'failed'] as const;
export type BackupLogAction = typeof backupLogActions[number];

// User backups table - stores user data snapshots
export const userBackups = pgTable("user_backups", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).references(() => serverUsers.id),
  phoneNumber: text("phone_number").notNull(),
  backupType: varchar("backup_type", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default('pending').notNull(),
  backupData: jsonb("backup_data"),
  checksum: text("checksum"),
  createdById: varchar("created_by_id", { length: 255 }).references(() => adminUsers.id),
  restoredById: varchar("restored_by_id", { length: 255 }).references(() => adminUsers.id),
  restoredAt: timestamp("restored_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const userBackupsRelations = relations(userBackups, ({ one, many }) => ({
  user: one(serverUsers, {
    fields: [userBackups.userId],
    references: [serverUsers.id],
  }),
  createdBy: one(adminUsers, {
    fields: [userBackups.createdById],
    references: [adminUsers.id],
    relationName: "backupsCreated",
  }),
  restoredBy: one(adminUsers, {
    fields: [userBackups.restoredById],
    references: [adminUsers.id],
    relationName: "backupsRestored",
  }),
  logs: many(backupLogs),
}));

export const insertUserBackupSchema = z.object({
  userId: z.string().max(255).nullable().optional(),
  phoneNumber: z.string(),
  backupType: z.enum(backupTypes),
  status: z.enum(backupStatuses).optional(),
  backupData: z.any().optional(),
  checksum: z.string().optional(),
  createdById: z.string().max(255).optional(),
  restoredById: z.string().max(255).optional(),
  restoredAt: z.date().optional(),
  expiresAt: z.date().optional(),
  notes: z.string().optional(),
});
export type InsertUserBackup = z.infer<typeof insertUserBackupSchema>;
export type UserBackup = typeof userBackups.$inferSelect;

// Backup logs table - audit trail for backup operations
export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  backupId: integer("backup_id").references(() => userBackups.id).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  adminId: varchar("admin_id", { length: 255 }).references(() => adminUsers.id),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const backupLogsRelations = relations(backupLogs, ({ one }) => ({
  backup: one(userBackups, {
    fields: [backupLogs.backupId],
    references: [userBackups.id],
  }),
  admin: one(adminUsers, {
    fields: [backupLogs.adminId],
    references: [adminUsers.id],
  }),
}));

export const insertBackupLogSchema = z.object({
  backupId: z.number(),
  action: z.enum(backupLogActions),
  adminId: z.string().max(255).optional(),
  details: z.any().optional(),
});
export type InsertBackupLog = z.infer<typeof insertBackupLogSchema>;
export type BackupLog = typeof backupLogs.$inferSelect;
