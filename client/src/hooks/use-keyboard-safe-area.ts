import { getSafeAreaInsets, type SafeAreaInsets } from "@/lib/safe-area";

export function getSafeAreaValues(): { top: number; bottom: number } {
  const insets = getSafeAreaInsets();
  return {
    top: Math.max(insets.top, 48),
    bottom: insets.bottom,
  };
}

export function getAvailableViewportHeight(): number {
  if (typeof window === 'undefined') return 800;
  return window.visualViewport?.height || window.innerHeight;
}

export { useSafeArea } from "@/lib/safe-area-provider";
export type { SafeAreaInsets };
