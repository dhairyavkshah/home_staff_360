import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNativePlatform = () => {
  try {
    return typeof window !== 'undefined' && 
      (window as any).Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
};

export const useHaptics = () => {
  const impact = (style: ImpactStyle = ImpactStyle.Light) => {
    if (!isNativePlatform()) return;
    try {
      Haptics.impact({ style }).catch(() => {
        // Silently fail if haptics not available
      });
    } catch {
      // Silently fail if haptics not available
    }
  };

  const notification = (type: NotificationType = NotificationType.Success) => {
    if (!isNativePlatform()) return;
    try {
      Haptics.notification({ type }).catch(() => {
        // Silently fail if haptics not available
      });
    } catch {
      // Silently fail if haptics not available
    }
  };

  const selectionStart = () => {
    if (!isNativePlatform()) return;
    try {
      Haptics.selectionStart().catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  };

  const selectionChanged = () => {
    if (!isNativePlatform()) return;
    try {
      Haptics.selectionChanged().catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  };

  const selectionEnd = () => {
    if (!isNativePlatform()) return;
    try {
      Haptics.selectionEnd().catch(() => {
        // Silently fail
      });
    } catch {
      // Silently fail
    }
  };

  const lightTap = () => impact(ImpactStyle.Light);
  const mediumTap = () => impact(ImpactStyle.Medium);
  const heavyTap = () => impact(ImpactStyle.Heavy);
  const successNotification = () => notification(NotificationType.Success);
  const warningNotification = () => notification(NotificationType.Warning);
  const errorNotification = () => notification(NotificationType.Error);

  return {
    impact,
    notification,
    selectionStart,
    selectionChanged,
    selectionEnd,
    lightTap,
    mediumTap,
    heavyTap,
    successNotification,
    warningNotification,
    errorNotification,
  };
};

export { ImpactStyle, NotificationType };
