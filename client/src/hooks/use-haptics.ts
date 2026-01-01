import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNativePlatform = () => {
  return typeof window !== 'undefined' && 
    (window as any).Capacitor?.isNativePlatform?.() === true;
};

export const useHaptics = () => {
  const impact = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Silently fail if haptics not available
    }
  };

  const notification = async (type: NotificationType = NotificationType.Success) => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.notification({ type });
    } catch (e) {
      // Silently fail if haptics not available
    }
  };

  const selectionStart = async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.selectionStart();
    } catch (e) {
      // Silently fail
    }
  };

  const selectionChanged = async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.selectionChanged();
    } catch (e) {
      // Silently fail
    }
  };

  const selectionEnd = async () => {
    if (!isNativePlatform()) return;
    try {
      await Haptics.selectionEnd();
    } catch (e) {
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
