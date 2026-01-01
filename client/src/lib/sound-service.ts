import { Haptics, ImpactStyle } from '@capacitor/haptics';

let isEnabled = true;
let lastPlayTime = 0;
const MIN_INTERVAL = 50;

export async function playClickSound(): Promise<void> {
  if (!isEnabled) return;
  
  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  lastPlayTime = now;
  
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
  }
}

export function setSoundEnabled(enabled: boolean): void {
  isEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return isEnabled;
}

export function initSoundService(): void {
  const handleInteraction = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    const isInteractive = 
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[role="tab"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[role="option"]') ||
      target.closest('[role="checkbox"]') ||
      target.closest('[role="switch"]') ||
      target.closest('[role="radio"]') ||
      target.closest('[data-testid]') ||
      target.classList.contains('hover-elevate') ||
      target.closest('.hover-elevate') ||
      target.closest('[data-radix-collection-item]');
    
    if (isInteractive) {
      playClickSound();
    }
  };

  document.addEventListener('pointerdown', handleInteraction, { passive: true, capture: true });
}
