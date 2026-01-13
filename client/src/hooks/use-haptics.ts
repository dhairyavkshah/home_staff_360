// Check once at module load if we're on native platform
const isNativeApp = (() => {
  try {
    const capacitor = (window as any).Capacitor;
    return capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform() === true;
  } catch {
    return false;
  }
})();

export const useHaptics = () => {
  const impact = (style: 'Light' | 'Medium' | 'Heavy' = 'Light') => {
    if (!isNativeApp) return;
    try {
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        const impactStyle = style === 'Heavy' ? ImpactStyle.Heavy : 
                           style === 'Medium' ? ImpactStyle.Medium : ImpactStyle.Light;
        Haptics.impact({ style: impactStyle }).catch(() => {});
      }).catch(() => {});
    } catch {
      // Silently fail
    }
  };

  const notification = (type: 'Success' | 'Warning' | 'Error' = 'Success') => {
    if (!isNativeApp) return;
    try {
      import('@capacitor/haptics').then(({ Haptics, NotificationType }) => {
        const notifType = type === 'Error' ? NotificationType.Error :
                         type === 'Warning' ? NotificationType.Warning : NotificationType.Success;
        Haptics.notification({ type: notifType }).catch(() => {});
      }).catch(() => {});
    } catch {
      // Silently fail
    }
  };

  const selectionStart = () => {
    if (!isNativeApp) return;
    try {
      import('@capacitor/haptics').then(({ Haptics }) => {
        Haptics.selectionStart().catch(() => {});
      }).catch(() => {});
    } catch {
      // Silently fail
    }
  };

  const selectionChanged = () => {
    if (!isNativeApp) return;
    try {
      import('@capacitor/haptics').then(({ Haptics }) => {
        Haptics.selectionChanged().catch(() => {});
      }).catch(() => {});
    } catch {
      // Silently fail
    }
  };

  const selectionEnd = () => {
    if (!isNativeApp) return;
    try {
      import('@capacitor/haptics').then(({ Haptics }) => {
        Haptics.selectionEnd().catch(() => {});
      }).catch(() => {});
    } catch {
      // Silently fail
    }
  };

  const lightTap = () => impact('Light');
  const mediumTap = () => impact('Medium');
  const heavyTap = () => impact('Heavy');
  const successNotification = () => notification('Success');
  const warningNotification = () => notification('Warning');
  const errorNotification = () => notification('Error');

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
