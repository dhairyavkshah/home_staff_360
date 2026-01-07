import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Advertisement } from "@shared/schema";
import { adService } from "@/lib/ad-service";
import { useI18n } from "@/lib/i18n/i18n-context";

interface AdOverlayProps {
  ad: Advertisement;
  onClose: () => void;
}

const SKIP_DELAY_SECONDS = 5;

export function AdOverlay({ ad, onClose }: AdOverlayProps) {
  const { t } = useI18n();
  const [countdown, setCountdown] = useState(SKIP_DELAY_SECONDS);
  const [canSkip, setCanSkip] = useState(false);
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [hasClickedThrough, setHasClickedThrough] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasRecordedImpressionRef = useRef(false);

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const durationInterval = setInterval(() => {
      setWatchedDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(durationInterval);
    };
  }, []);

  const handleVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      setIsPortrait(videoHeight > videoWidth);
    }
  }, []);

  const recordImpressionAndClose = useCallback(
    async (skipped: boolean, clickedThrough: boolean = false) => {
      if (hasRecordedImpressionRef.current) {
        onClose();
        return;
      }
      hasRecordedImpressionRef.current = true;

      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const completed = !skipped && finalDuration >= (ad.duration || 30);

      await adService.recordImpression({
        adId: ad.id,
        watchedDuration: finalDuration,
        completed,
        skipped,
        skippedAt: skipped ? finalDuration : undefined,
        clickedThrough,
      });

      onClose();
    },
    [ad, onClose]
  );

  const handleSkip = useCallback(() => {
    if (canSkip) {
      recordImpressionAndClose(true, hasClickedThrough);
    }
  }, [canSkip, hasClickedThrough, recordImpressionAndClose]);

  const handleLearnMoreClick = useCallback(() => {
    if (ad.targetUrl) {
      setShowConsentDialog(true);
    }
  }, [ad.targetUrl]);

  const handleConsentConfirm = useCallback(() => {
    if (ad.targetUrl) {
      setHasClickedThrough(true);
      setShowConsentDialog(false);
      window.open(ad.targetUrl, "_blank", "noopener,noreferrer");
    }
  }, [ad.targetUrl]);

  const handleConsentCancel = useCallback(() => {
    setShowConsentDialog(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    recordImpressionAndClose(false, hasClickedThrough);
  }, [hasClickedThrough, recordImpressionAndClose]);

  const videoContainerClasses = isPortrait
    ? "w-full max-w-sm aspect-[9/16] rounded-lg overflow-hidden bg-black"
    : "w-full max-w-2xl aspect-video rounded-lg overflow-hidden bg-black";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex flex-col"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
        data-testid="ad-overlay"
      >
        <div className="safe-area-top" />

        <div className="absolute top-0 right-0 p-4 z-10 safe-area-top">
          <div className="mt-2">
            {canSkip ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                className="bg-white/10 border-white/20 text-white backdrop-blur-sm"
                data-testid="button-skip-ad"
              >
                <X className="w-4 h-4 mr-1" />
                Skip
              </Button>
            ) : (
              <div
                className="px-3 py-1.5 rounded-md bg-white/10 border border-white/20 text-white text-sm backdrop-blur-sm"
                data-testid="text-skip-countdown"
              >
                Skip in {countdown}s
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className={videoContainerClasses}>
            <video
              ref={videoRef}
              src={ad.videoUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              muted={false}
              onLoadedMetadata={handleVideoMetadata}
              onEnded={handleVideoEnded}
              data-testid="video-ad"
            />
          </div>
        </div>

        <div className="p-4 safe-area-bottom">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                {ad.title && (
                  <p
                    className="text-white/90 text-sm font-medium truncate"
                    data-testid="text-ad-title"
                  >
                    {ad.title}
                  </p>
                )}
                {ad.advertiser && (
                  <p
                    className="text-white/50 text-xs truncate"
                    data-testid="text-ad-advertiser"
                  >
                    {ad.advertiser}
                  </p>
                )}
              </div>

              {ad.targetUrl && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleLearnMoreClick}
                  className="shrink-0"
                  data-testid="button-learn-more"
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Learn More
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.min(100, (watchedDuration / (ad.duration || 30)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-white/50 text-xs tabular-nums" data-testid="text-ad-duration">
                {watchedDuration}s / {ad.duration || 30}s
              </span>
            </div>
          </div>
        </div>

        <AlertDialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
          <AlertDialogContent data-testid="dialog-leaving-app">
            <AlertDialogHeader>
              <AlertDialogTitle data-testid="text-leaving-app-title">
                {t("leavingAppTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription data-testid="text-leaving-app-description">
                {t("leavingAppDescription", { advertiser: ad.advertiser || "this advertiser" })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={handleConsentCancel}
                data-testid="button-cancel-leave"
              >
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConsentConfirm}
                data-testid="button-continue-leave"
              >
                {t("continueButton")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AnimatePresence>
  );
}
