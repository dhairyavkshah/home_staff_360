import { z } from "zod";

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

export const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'OTHER'] as const;
export type Currency = typeof currencies[number];

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    OTHER: '$',
  };
  return symbols[currency];
};

export const languages = ['en', 'hi', 'gu', 'kn', 'ml', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'pt'] as const;
export type Language = typeof languages[number];

export const languageLabels: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  gu: 'ગુજરાતી (Gujarati)',
  kn: 'ಕನ್ನಡ (Kannada)',
  ml: 'മലയാളം (Malayalam)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  ar: 'العربية (Arabic)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  pt: 'Português (Portuguese)',
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
  planType: z.enum(['FREE', 'PREMIUM']).optional(),
  showAllContexts: z.boolean().optional(),
  defaultAppMode: z.enum(['HOME', 'STAFF']).optional(),
  // Guided tour completion tracking
  homeTourCompleted: z.boolean().optional(),
  staffTourCompleted: z.boolean().optional(),
  // Trial & Purchase tracking
  trialStartedAt: z.string().optional(),
  purchaseStatus: z.enum(['TRIAL', 'EXPIRED', 'PURCHASED']).optional(),
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
  planType: 'FREE',
  showAllContexts: false,
  defaultAppMode: 'HOME',
  homeTourCompleted: false,
  staffTourCompleted: false,
  purchaseStatus: 'TRIAL',
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
  AED: 'د.إ',
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
});

export type StaffEarning = z.infer<typeof staffEarningSchema>;

export const insertStaffEarningSchema = staffEarningSchema.omit({ id: true, createdAt: true });
export type InsertStaffEarning = z.infer<typeof insertStaffEarningSchema>;

export const staffExpenseSchema = z.object({
  id: z.string(),
  staffUserId: z.string(),
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

export const planTypes = ['FREE', 'PREMIUM'] as const;
export type PlanType = typeof planTypes[number];

export const purchaseStatuses = ['TRIAL', 'EXPIRED', 'PURCHASED'] as const;
export type PurchaseStatus = typeof purchaseStatuses[number];

export const TRIAL_DURATION_DAYS = 30;

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
    FREE: {
      maxHouseholds: 2,
      maxStaffTotal: 10,
      maxDocuments: 25,
    },
    PREMIUM: {
      maxHouseholds: 10,
      maxStaffTotal: 100,
      maxDocuments: 100,
    },
  },
  STAFF: {
    FREE: {
      maxBusinesses: 2,
      maxClientsTotal: 10,
      maxDocuments: 25,
    },
    PREMIUM: {
      maxBusinesses: 10,
      maxClientsTotal: 100,
      maxDocuments: 100,
    },
  },
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
