import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import appIconPath from "@/assets/app-icon.png";

interface ExitCoverScreenProps {
  isVisible: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

export function ExitCoverScreen({ isVisible, onComplete, onCancel }: ExitCoverScreenProps) {
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [exitFailed, setExitFailed] = useState(false);

  const handleCancel = useCallback(() => {
    setShowGoodbye(false);
    setExitFailed(false);
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (isVisible) {
      setShowGoodbye(true);
      setExitFailed(false);
      const timer = setTimeout(async () => {
        try {
          await onComplete();
        } catch {
          setExitFailed(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowGoodbye(false);
      setExitFailed(false);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col items-center gap-6"
          >
            <motion.img
              src={appIconPath}
              alt="Home Staff 360"
              className="w-32 h-32 rounded-3xl shadow-lg"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Home Staff 360
              </h1>
              <p className="text-muted-foreground text-sm">
                Thank you for using our app
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              className="text-center mt-4"
            >
              <p className="text-lg font-medium text-primary">
                {showGoodbye ? "See you soon!" : ""}
              </p>
            </motion.div>

            {!exitFailed && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="w-48 h-1 bg-primary/20 rounded-full overflow-hidden mt-4"
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "linear" }}
                  className="h-full bg-primary rounded-full"
                />
              </motion.div>
            )}

            {exitFailed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 mt-4"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Use your device's home button or app switcher to exit
                </p>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
