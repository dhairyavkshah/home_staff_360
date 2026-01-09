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

createRoot(document.getElementById("root")!).render(<App />);
