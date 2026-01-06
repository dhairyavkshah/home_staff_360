import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Smartphone,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { SiPhonepe, SiGooglepay, SiPaytm } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/calculations";
import type { Currency } from "@shared/schema";

interface PayNowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payeeName: string;
  amount: number;
  currency: Currency;
  customCurrencySymbol?: string;
  description?: string;
  onPaymentConfirmed: () => void;
  onPaymentCancelled?: () => void;
}

type PaymentStep = "method" | "upi" | "confirm";

export function PayNowModal({
  open,
  onOpenChange,
  payeeName,
  amount,
  currency,
  customCurrencySymbol,
  description,
  onPaymentConfirmed,
  onPaymentCancelled,
}: PayNowModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>("method");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const resetModal = () => {
    setStep("method");
    setPaymentMethod("");
    setUpiId("");
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleSelectMethod = (method: string) => {
    setPaymentMethod(method);
    setStep("upi");
  };

  const generateUPILink = () => {
    if (!upiId) return null;
    
    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: amount.toString(),
      cu: currency === "INR" ? "INR" : "USD",
      tn: description || `Payment to ${payeeName}`,
    });
    
    switch (paymentMethod) {
      case "gpay":
        return `gpay://upi/pay?${params.toString()}`;
      case "phonepe":
        return `phonepe://pay?${params.toString()}`;
      case "paytm":
        return `paytm://pay?${params.toString()}`;
      default:
        return `upi://pay?${params.toString()}`;
    }
  };

  const handleProceedToPayment = () => {
    if (!upiId.trim()) {
      toast({
        title: "UPI ID Required",
        description: "Please enter the payee's UPI ID",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const upiLink = generateUPILink();
    
    if (upiLink) {
      window.open(upiLink, "_blank");
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      setStep("confirm");
    }, 1500);
  };

  const handleConfirmPayment = (success: boolean) => {
    if (success) {
      onPaymentConfirmed();
      toast({
        title: "Payment Marked as Paid",
        description: `Payment of ${formatCurrency(amount, currency, customCurrencySymbol)} to ${payeeName} recorded`,
      });
    } else {
      onPaymentCancelled?.();
      toast({
        title: "Payment Not Completed",
        description: "You can try again later",
      });
    }
    handleClose();
  };

  const paymentMethods = [
    { id: "gpay", name: "Google Pay", icon: SiGooglepay, color: "text-blue-600" },
    { id: "phonepe", name: "PhonePe", icon: SiPhonepe, color: "text-purple-600" },
    { id: "paytm", name: "Paytm", icon: SiPaytm, color: "text-blue-500" },
    { id: "upi", name: "Other UPI", icon: Smartphone, color: "text-foreground" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "method" && "Select Payment Method"}
            {step === "upi" && "Enter UPI Details"}
            {step === "confirm" && "Confirm Payment"}
          </DialogTitle>
          <DialogDescription>
            Pay {formatCurrency(amount, currency, customCurrencySymbol)} to {payeeName}
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="grid grid-cols-2 gap-3 py-4">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Button
                  key={method.id}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => handleSelectMethod(method.id)}
                  data-testid={`button-pay-${method.id}`}
                >
                  <Icon className={`w-8 h-8 ${method.color}`} />
                  <span className="text-sm">{method.name}</span>
                </Button>
              );
            })}
          </div>
        )}

        {step === "upi" && (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="upiId">Payee UPI ID</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="name@upi or phone@bank"
                data-testid="input-upi-id"
              />
              <p className="text-xs text-muted-foreground">
                Enter the UPI ID of {payeeName}
              </p>
            </div>

            <DialogFooter className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("method")}>
                Back
              </Button>
              <Button 
                onClick={handleProceedToPayment} 
                disabled={isProcessing}
                data-testid="button-proceed-payment"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening App...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <div className="flex flex-col gap-4 py-4">
            <p className="text-center text-muted-foreground">
              Did you complete the payment of{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(amount, currency, customCurrencySymbol)}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">{payeeName}</span>?
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                size="lg"
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => handleConfirmPayment(true)}
                data-testid="button-confirm-yes"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Yes, Paid
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => handleConfirmPayment(false)}
                data-testid="button-confirm-no"
              >
                <XCircle className="w-5 h-5 mr-2" />
                No
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
