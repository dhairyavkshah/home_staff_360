import { ConfirmModal } from "@/components/ui/confirm-modal";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  discardLabel?: string;
  cancelLabel?: string;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onCancel,
  title = "Unsaved Changes",
  description = "You have unsaved changes that will be lost if you leave this page. Would you like to save your work first?",
  discardLabel = "Discard Changes",
  cancelLabel = "Continue Editing",
}: UnsavedChangesDialogProps) {
  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText={discardLabel}
      cancelText={cancelLabel}
      variant="warning"
      onConfirm={onDiscard}
      onCancel={onCancel}
    />
  );
}
