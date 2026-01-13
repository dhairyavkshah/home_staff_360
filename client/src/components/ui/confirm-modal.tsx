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
      <DialogContent 
        className="max-w-xs w-[calc(100%-2rem)] page-enter" 
        data-testid="modal-confirm"
        style={{ top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="flex flex-col items-center text-center gap-2 pt-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-base font-semibold" data-testid="modal-title">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-center text-sm" data-testid="modal-description">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {children && <div className="py-2">{children}</div>}

        <DialogFooter className="flex flex-col gap-2 mt-1">
          <Button
            variant={buttonVariant}
            onClick={handleConfirm}
            className="w-full"
            data-testid="button-modal-confirm"
          >
            {confirmText}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full"
            data-testid="button-modal-cancel"
          >
            {cancelText}
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
      <DialogContent 
        className="max-w-xs w-[calc(100%-2rem)] page-enter" 
        data-testid="modal-alert"
        style={{ top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader className="flex flex-col items-center text-center gap-2 pt-1">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-center text-sm">
                {description}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>
        <DialogFooter className="mt-1">
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
