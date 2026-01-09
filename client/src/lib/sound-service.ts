import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

let hapticEnabled = true;
let soundEnabled = true;
let lastPlayTime = 0;
const MIN_INTERVAL = 50;

let audioContext: AudioContext | null = null;
let audioContextInitialized = false;

function getAudioContext(): AudioContext | null {
  if (audioContext) {
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  }
  
  if (audioContextInitialized) return null;
  
  try {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextInitialized = true;
    return audioContext;
  } catch {
    audioContextInitialized = true;
    return null;
  }
}

function playTapSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(2400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.008);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.015, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.008);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.01);
  } catch {
  }
}

function playPopSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.012);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.012);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.015);
  } catch {
  }
}

export function playClickSound(): void {
  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  lastPlayTime = now;

  if (hapticEnabled) {
    try {
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
          // Silently fail if haptics not available
        });
      }
    } catch {
      // Silently fail
    }
  }

  if (soundEnabled) {
    playTapSound();
  }
}

export function playSuccessSound(): void {
  if (hapticEnabled) {
    try {
      if ((window as any).Capacitor?.isNativePlatform?.()) {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
          // Silently fail if haptics not available
        });
      }
    } catch {
      // Silently fail
    }
  }

  if (soundEnabled) {
    playPopSound();
  }
}

export function setHapticEnabled(enabled: boolean): void {
  hapticEnabled = enabled;
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function isHapticEnabled(): boolean {
  return hapticEnabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function loadFeedbackSettings(): void {
  try {
    const settingsStr = localStorage.getItem('hm_settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      hapticEnabled = settings.hapticFeedbackEnabled !== false;
      soundEnabled = settings.soundEffectsEnabled !== false;
    }
  } catch {
  }
}

export function initSoundService(): void {
  loadFeedbackSettings();

  const handleInteraction = (e: MouseEvent) => {
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

  document.addEventListener('click', handleInteraction, { passive: true, capture: true });
}
