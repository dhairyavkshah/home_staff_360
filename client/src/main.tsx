import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSoundService } from "@/lib/sound-service";
import { initSafeArea } from "@/lib/safe-area";

// Suppress unhandled promise rejections from Capacitor plugins in web mode
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  // Check if this is a Capacitor-related error (usually from plugins not working in web)
  if (reason && (
    String(reason).includes('Capacitor') ||
    String(reason).includes('Haptics') ||
    String(reason).includes('not implemented') ||
    String(reason).includes('not available') ||
    (reason.message && (
      String(reason.message).includes('Capacitor') ||
      String(reason.message).includes('Haptics') ||
      String(reason.message).includes('not implemented') ||
      String(reason.message).includes('not available')
    ))
  )) {
    event.preventDefault();
    return;
  }
  // Also suppress generic errors that look like plugin failures
  if (reason && typeof reason === 'object' && !reason.message && !reason.stack) {
    event.preventDefault();
    return;
  }
});

// Suppress generic errors thrown as non-Error objects
window.addEventListener('error', (event) => {
  if (event.error === undefined || event.error === null) {
    event.preventDefault();
    return;
  }
  if (typeof event.error === 'object' && !event.error.message && !event.error.stack) {
    event.preventDefault();
    return;
  }
});

initSoundService();
initSafeArea();

// Remove Replit dev banner elements (for mobile/production builds)
function removeDevBanners() {
  const selectors = [
    '[data-replit-dev-banner]',
    '#replit-dev-banner',
    '.replit-dev-banner',
    '[data-replit-runtime-error-modal]',
    '#replit-runtime-error-modal',
    '.__replit_dev_banner__'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // Also check for fixed positioned divs at top without id/class (common dev overlay pattern)
  const allDivs = document.querySelectorAll('body > div');
  allDivs.forEach(div => {
    const style = window.getComputedStyle(div);
    if (style.position === 'fixed' && style.top === '0px' && 
        !div.id && !div.className && div !== document.getElementById('root')) {
      div.remove();
    }
  });
}

// Run immediately and after short delay to catch dynamically injected banners
removeDevBanners();
setTimeout(removeDevBanners, 100);
setTimeout(removeDevBanners, 500);

createRoot(document.getElementById("root")!).render(<App />);
