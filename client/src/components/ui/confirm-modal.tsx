import { type ReactNode } from "react";
import { AlertTriangle, Info, HelpCircle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
  onConfirm: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

const variantStyles = {
  default: {
    icon: Info,
    iconClass: "text-primary bg-primary/10",
    buttonVariant: "default" as const,
  },
  destructive: {
    icon: AlertTriangle,
    iconClass: "text-destructive bg-destructive/10",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning bg-warning/10",
    buttonVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-success bg-success/10",
    buttonVariant: "default" as const,
  },
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  const { icon: Icon, iconClass, buttonVariant } = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md page-enter" data-testid="modal-confirm">
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl" data-testid="modal-title">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center" data-testid="modal-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && <div className="py-4">{children}</div>}

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
            data-testid="button-modal-cancel"
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            className="w-full sm:w-auto"
            data-testid="button-modal-confirm"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  buttonText = "OK",
  variant = "default",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  buttonText?: string;
  variant?: "default" | "destructive" | "warning" | "success";
}) {
  const { icon: Icon, iconClass } = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md page-enter" data-testid="modal-alert">
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${iconClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
            data-testid="button-modal-ok"
          >
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
