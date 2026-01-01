import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSoundService } from "@/lib/sound-service";
import { initSafeArea } from "@/lib/safe-area";

initSoundService();
initSafeArea();

createRoot(document.getElementById("root")!).render(<App />);
