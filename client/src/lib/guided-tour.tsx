import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { storage } from "./storage";
import { useNavigation } from "./navigation";
import type { UserType } from "@shared/schema";

export interface TourStep {
  id: string;
  screen?: string;
  targetId: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

const HOME_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetId: "tour-dashboard",
    title: "Welcome to Home Staff 360",
    description: "This is your dashboard where you can see an overview of your household management at a glance.",
    placement: "center",
  },
  {
    id: "overview-cards",
    targetId: "tour-overview-section",
    title: "Quick Overview",
    description: "These cards show your active staff count, pending payments, and upcoming bills. Tap any card to go to that section.",
    placement: "bottom",
  },
  {
    id: "staff-management",
    targetId: "tour-staff-card",
    title: "Staff Management",
    description: "Add and manage your household staff here. Track their details, roles, and salary information.",
    placement: "bottom",
  },
  {
    id: "attendance",
    targetId: "tour-attendance-card",
    title: "Attendance Tracking",
    description: "Mark daily attendance for your staff as Full Day, Half Day, or Absent. View attendance history by person or date.",
    placement: "bottom",
  },
  {
    id: "payables",
    targetId: "tour-payables-card",
    title: "Wage & Salary Payables",
    description: "Track pending salary payments and record payments, advances, or deductions for your staff.",
    placement: "bottom",
  },
  {
    id: "expenses",
    targetId: "tour-expenses-card",
    title: "Expenses",
    description: "Record and track your household expenses like utility bills, groceries, maintenance, and more.",
    placement: "top",
  },
  {
    id: "laundry",
    targetId: "tour-laundry-card",
    title: "Laundry Tracking",
    description: "Log laundry batches with itemized clothing counts and pricing for your laundry service.",
    placement: "top",
  },
  {
    id: "reports",
    targetId: "tour-reports-card",
    title: "Reports & Export",
    description: "Generate detailed reports and export your data for record-keeping or sharing.",
    placement: "top",
  },
  {
    id: "settings",
    targetId: "tour-settings-button",
    title: "Settings",
    description: "Customize your app preferences, manage households, backup data, and more. You can replay this tour from Settings anytime.",
    placement: "bottom",
  },
];

const STAFF_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetId: "tour-dashboard",
    title: "Welcome to Home Staff 360",
    description: "This is your dashboard where you can track your work across multiple client homes.",
    placement: "center",
  },
  {
    id: "overview-cards",
    targetId: "tour-overview-section",
    title: "Quick Overview",
    description: "See your active clients, today's attendance, earnings, and more at a glance. Tap any card to go to that section.",
    placement: "bottom",
  },
  {
    id: "client-homes",
    targetId: "tour-clients-card",
    title: "Client Homes",
    description: "Add and manage the homes where you provide services. Track details for each client.",
    placement: "bottom",
  },
  {
    id: "attendance",
    targetId: "tour-attendance-card",
    title: "Log Attendance",
    description: "Record your daily attendance at each client home. Track your working days easily.",
    placement: "bottom",
  },
  {
    id: "earnings",
    targetId: "tour-earnings-card",
    title: "Earnings",
    description: "Track your salary earnings from different client homes. Keep a record of all payments received.",
    placement: "bottom",
  },
  {
    id: "expenses",
    targetId: "tour-expenses-card",
    title: "Personal Expenses",
    description: "Record your business-related expenses like travel, supplies, and other costs.",
    placement: "top",
  },
  {
    id: "laundry",
    targetId: "tour-laundry-card",
    title: "Laundry Jobs",
    description: "If you provide laundry services, track your jobs and earnings here.",
    placement: "top",
  },
  {
    id: "invoices",
    targetId: "tour-invoices-card",
    title: "Invoices",
    description: "Create and manage invoices for your clients. Keep track of paid and pending invoices.",
    placement: "top",
  },
  {
    id: "settings",
    targetId: "tour-settings-button",
    title: "Settings",
    description: "Customize your app preferences, manage businesses, backup data, and more. You can replay this tour from Settings anytime.",
    placement: "bottom",
  },
];

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: (mode: UserType) => void;
  stopTour: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within GuidedTourProvider");
  return ctx;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function TourOverlay({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const isLastStep = currentIndex === totalSteps - 1;
  const isFirstStep = currentIndex === 0;

  useEffect(() => {
    const findTarget = () => {
      const el = document.querySelector(`[data-tour-id="${step.targetId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setTargetRect(null);
      }
    };

    requestAnimationFrame(findTarget);
    const timeout = setTimeout(findTarget, 100);
    
    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget, true);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget, true);
    };
  }, [step.targetId]);

  const getTooltipStyle = (): React.CSSProperties => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(320, viewportWidth - 32);
    const tooltipEstimatedHeight = 160;
    const padding = 16;
    const edgePadding = 16;

    if (!targetRect || step.placement === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        maxWidth: `${tooltipWidth}px`,
        width: `calc(100vw - ${edgePadding * 2}px)`,
      };
    }

    const placement = step.placement || "bottom";
    let top: number;
    let left: number;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    switch (placement) {
      case "top":
        top = targetRect.top - padding - tooltipEstimatedHeight;
        left = targetCenterX - tooltipWidth / 2;
        break;
      case "bottom":
        top = targetRect.top + targetRect.height + padding;
        left = targetCenterX - tooltipWidth / 2;
        break;
      case "left":
        top = targetCenterY - tooltipEstimatedHeight / 2;
        left = targetRect.left - padding - tooltipWidth;
        break;
      case "right":
        top = targetCenterY - tooltipEstimatedHeight / 2;
        left = targetRect.left + targetRect.width + padding;
        break;
      default:
        top = targetRect.top + targetRect.height + padding;
        left = targetCenterX - tooltipWidth / 2;
    }

    if (left < edgePadding) left = edgePadding;
    if (left + tooltipWidth > viewportWidth - edgePadding) {
      left = viewportWidth - edgePadding - tooltipWidth;
    }

    if (top < edgePadding) {
      top = targetRect.top + targetRect.height + padding;
    }
    if (top + tooltipEstimatedHeight > viewportHeight - edgePadding) {
      top = targetRect.top - padding - tooltipEstimatedHeight;
      if (top < edgePadding) {
        top = edgePadding;
      }
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `${tooltipWidth}px`,
      width: `calc(100vw - ${edgePadding * 2}px)`,
    };
  };

  const tooltipStyle = getTooltipStyle();

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999]" 
      data-testid="tour-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/60" />
      
      {targetRect && step.placement !== "center" && (
        <div
          className="absolute rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-background"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            background: "transparent",
            pointerEvents: "none",
          }}
        />
      )}

      <Card
        className="absolute p-4 shadow-xl z-[10000]"
        style={tooltipStyle}
        data-testid="tour-tooltip"
      >
        <button
          onClick={onSkip}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted"
          data-testid="button-tour-close"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="pr-6">
          <h3 className="font-semibold text-base mb-1" data-testid="text-tour-title">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-tour-description">
            {step.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} of {totalSteps}
          </span>
          
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                data-testid="button-tour-prev"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            {isFirstStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                data-testid="button-tour-skip"
              >
                Skip
              </Button>
            )}

            {isLastStep ? (
              <Button
                size="sm"
                onClick={onComplete}
                data-testid="button-tour-done"
              >
                <Check className="w-4 h-4 mr-1" />
                Done
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onNext}
                data-testid="button-tour-next"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>,
    document.body
  );
}

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourMode, setTourMode] = useState<UserType>("HOME");
  const { navigate } = useNavigation();

  const steps = tourMode === "HOME" ? HOME_TOUR_STEPS : STAFF_TOUR_STEPS;

  const startTour = useCallback((mode: UserType) => {
    setTourMode(mode);
    setCurrentStep(0);
    setIsActive(true);
    
    if (mode === "HOME") {
      navigate("home");
    } else {
      navigate("staff-home");
    }
  }, [navigate]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const markComplete = useCallback((mode: UserType) => {
    const settings = storage.getSettings();
    if (mode === "HOME") {
      storage.saveSettings({ ...settings, homeTourCompleted: true });
    } else {
      storage.saveSettings({ ...settings, staffTourCompleted: true });
    }
  }, []);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    markComplete(tourMode);
    stopTour();
  }, [markComplete, tourMode, stopTour]);

  const complete = useCallback(() => {
    markComplete(tourMode);
    stopTour();
  }, [markComplete, tourMode, stopTour]);

  const value: TourContextValue = {
    isActive,
    currentStep,
    totalSteps: steps.length,
    startTour,
    stopTour,
    next,
    prev,
    skip,
    complete,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {isActive && steps[currentStep] && (
        <TourOverlay
          step={steps[currentStep]}
          currentIndex={currentStep}
          totalSteps={steps.length}
          onNext={next}
          onPrev={prev}
          onSkip={skip}
          onComplete={complete}
        />
      )}
    </TourContext.Provider>
  );
}

export function shouldShowTour(mode: UserType): boolean {
  const settings = storage.getSettings();
  if (mode === "HOME") {
    return !settings.homeTourCompleted;
  }
  return !settings.staffTourCompleted;
}

export function resetTourCompletion(mode: UserType): void {
  const settings = storage.getSettings();
  if (mode === "HOME") {
    storage.saveSettings({ ...settings, homeTourCompleted: false });
  } else {
    storage.saveSettings({ ...settings, staffTourCompleted: false });
  }
}
