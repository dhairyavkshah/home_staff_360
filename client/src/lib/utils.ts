import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TIMING = {
  TOUR_START_DELAY_MS: 500,
  ANIMATION_SETTLE_MS: 300,
  UI_FEEDBACK_MS: 200,
  FADE_IN_MS: 100,
  BUTTON_FEEDBACK_MS: 150,
  SPLASH_FADE_OUT_MS: 1800,
  SPLASH_COMPLETE_MS: 2300,
  COOLDOWN_TICK_MS: 1000,
  COPY_FEEDBACK_MS: 2000,
  PHONE_CHECK_DEBOUNCE_MS: 1000,
  PERMISSION_REFRESH_DELAY_MS: 600,
  CHAT_MESSAGE_REFRESH_MS: 10000,
  LAUNCHER_DELAY_MS: 1500,
  AUTO_BACKUP_INTERVAL_MS: 60 * 60 * 1000,
  NOTIFICATION_POLL_MS: 5000,
} as const;

export const FILE_SIZE = {
  BYTES_PER_KB: 1024,
  BYTES_PER_MB: 1024 * 1024,
  MAX_FILE_SIZE_MB: 20,
  MAX_CHAT_ATTACHMENT_MB: 5,
} as const;

export const LIMITS = {
  MAX_NOTIFICATION_CACHE: 100,
  HALF_DAY_PERCENTAGE_MIN: 0,
  HALF_DAY_PERCENTAGE_MAX: 100,
  CURRENCY_THRESHOLD_FOR_FORMAT: 1000,
  NOTE_PREVIEW_LENGTH: 100,
} as const;

export function formatFileSize(bytes: number): string {
  if (bytes < FILE_SIZE.BYTES_PER_KB) return `${bytes} B`;
  if (bytes < FILE_SIZE.BYTES_PER_MB) return `${(bytes / FILE_SIZE.BYTES_PER_KB).toFixed(1)} KB`;
  return `${(bytes / FILE_SIZE.BYTES_PER_MB).toFixed(1)} MB`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}
