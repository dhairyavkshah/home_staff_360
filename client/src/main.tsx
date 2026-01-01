import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initSoundService } from "@/lib/sound-service";

initSoundService();

createRoot(document.getElementById("root")!).render(<App />);
