import { useState, useEffect, useCallback } from "react";
import {
  checkShouldShowReminder,
  markReminderShown,
  markDonationComplete,
  initializeDonationNotifications,
} from "@/lib/donation-reminder";

interface UseDonationReminderResult {
  shouldShowReminder: boolean;
  dismissReminder: () => void;
  markDonated: () => void;
}

export function useDonationReminder(): UseDonationReminderResult {
  const [shouldShowReminder, setShouldShowReminder] = useState(false);

  useEffect(() => {
    const shouldShow = checkShouldShowReminder();
    setShouldShowReminder(shouldShow);
    
    initializeDonationNotifications();
  }, []);

  const dismissReminder = useCallback(() => {
    markReminderShown();
    setShouldShowReminder(false);
  }, []);

  const markDonated = useCallback(() => {
    markDonationComplete();
    setShouldShowReminder(false);
  }, []);

  return {
    shouldShowReminder,
    dismissReminder,
    markDonated,
  };
}
