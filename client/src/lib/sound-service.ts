const CLICK_SOUND_FREQUENCY = 1800;
const CLICK_SOUND_DURATION = 15;
const CLICK_SOUND_VOLUME = 0.08;

let audioContext: AudioContext | null = null;
let isEnabled = true;
let lastPlayTime = 0;
const MIN_INTERVAL = 30;

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function playClickSound(): void {
  if (!isEnabled) return;
  
  const now = Date.now();
  if (now - lastPlayTime < MIN_INTERVAL) return;
  lastPlayTime = now;
  
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(CLICK_SOUND_FREQUENCY, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(CLICK_SOUND_VOLUME, ctx.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + CLICK_SOUND_DURATION / 1000);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + CLICK_SOUND_DURATION / 1000);
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
  
  const initAudioContext = () => {
    getAudioContext();
    document.removeEventListener('touchstart', initAudioContext);
    document.removeEventListener('click', initAudioContext);
  };
  
  document.addEventListener('touchstart', initAudioContext, { once: true, passive: true });
  document.addEventListener('click', initAudioContext, { once: true, passive: true });
}
