import { useEffect, useState } from "react";
import appIconPath from "@/assets/app-icon.png";
import { useTranslation } from "@/lib/i18n/i18n-context";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useTranslation();
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => setFadeIn(true), 100);
    const fadeOutTimer = setTimeout(() => setFadeOut(true), 1800);
    const completeTimer = setTimeout(onComplete, 2300);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`h-screen flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : fadeIn ? "opacity-100" : "opacity-0"
      }`}
      data-testid="screen-splash"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center transform transition-all duration-700 ${
            fadeIn ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <img src={appIconPath} alt="Home Staff 360" className="w-full h-full object-cover" />
        </div>
        <div
          className={`flex flex-col items-center gap-0.5 transform transition-all duration-700 delay-200 ${
            fadeIn ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <h1 className="text-2xl font-bold text-white" data-testid="text-app-name">
            Home Staff 360
          </h1>
          <p className="text-white/70 text-xs" data-testid="text-tagline">
            {t("appTagline")}
          </p>
        </div>
      </div>
      <div
        className={`absolute bottom-6 flex flex-col items-center gap-0.5 transition-opacity duration-500 delay-500 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-white/50 text-xs" data-testid="text-version">
          {t("version")}: 1.0.1
        </p>
        <p className="text-white/40 text-xs" data-testid="text-branding">
          {t("craftedBy")}
        </p>
      </div>
    </div>
  );
}
