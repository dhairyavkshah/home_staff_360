import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useI18n } from "@/lib/i18n/i18n-context";

interface ExitAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExit: () => void;
  onStay?: () => void;
}

export function ExitAppDialog({
  open,
  onOpenChange,
  onExit,
  onStay,
}: ExitAppDialogProps) {
  const { t } = useI18n();
  
  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("exitAppTitle")}
      description={t("exitAppDescription")}
      confirmText={t("exitApp")}
      cancelText={t("stayInApp")}
      variant="warning"
      onConfirm={onExit}
      onCancel={onStay}
    />
  );
}
