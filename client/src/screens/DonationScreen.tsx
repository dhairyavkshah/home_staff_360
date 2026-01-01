import { useState } from "react";
import { Heart, Mail, FileText, IndianRupee, CreditCard, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";

export function DonationScreen() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const suggestedAmounts = [99, 199, 499, 999];

  const handleDonate = async () => {
    if (!amount || parseInt(amount) < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      toast({
        title: "Payment Not Configured",
        description: "Donation payments are being set up. Please try again later.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      const options = {
        key: razorpayKeyId,
        amount: parseInt(amount) * 100,
        currency: "INR",
        name: "Home Staff 360",
        description: "Support the Developer",
        handler: function (response: { razorpay_payment_id: string }) {
          toast({
            title: "Thank You!",
            description: `Your donation was successful. Payment ID: ${response.razorpay_payment_id}`,
          });
          setAmount("");
          setEmail("");
          setNotes("");
        },
        prefill: {
          email: email || undefined,
        },
        notes: {
          message: notes || "Donation for Home Staff 360",
        },
        theme: {
          color: "#0B57D0",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch {
      toast({
        title: "Error",
        description: "Could not initialize payment. Please try again.",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <AppLayout>
      <Header
        title="Support the Developer"
        onBack={() => navigate("settings")}
      />

      <ScrollContent className="p-4 pb-24">
        <div className="flex flex-col gap-6">
          <Card className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-pink-200 dark:border-pink-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-pink-900 dark:text-pink-100 mb-2">
                  Thank You for Using Home Staff 360!
                </h2>
                <p className="text-sm text-pink-700 dark:text-pink-300 leading-relaxed">
                  This app is completely free to use with all features unlocked. If you find it helpful in managing your household or work, please consider supporting the developer with a small donation.
                </p>
                <p className="text-sm text-pink-700 dark:text-pink-300 leading-relaxed mt-2">
                  Your contribution helps us keep improving the app, fix bugs, add new features, and keep it free for everyone.
                </p>
              </div>
            </div>
          </Card>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Quick Amounts
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {suggestedAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === String(amt) ? "default" : "outline"}
                  onClick={() => setAmount(String(amt))}
                  className="h-12"
                  data-testid={`button-amount-${amt}`}
                >
                  <IndianRupee className="w-3 h-3 mr-1" />
                  {amt}
                </Button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Donation Details
            </h3>
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                  Amount (INR)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter custom amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  data-testid="input-donation-amount"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-donation-email"
                />
                <p className="text-xs text-muted-foreground">
                  We'll send a thank you note to this email
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Message (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Leave a note for the developer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  data-testid="input-donation-notes"
                />
              </div>
            </Card>
          </section>

          <Button
            onClick={handleDonate}
            disabled={isProcessing || !amount}
            className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white"
            data-testid="button-donate-submit"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {isProcessing ? "Processing..." : `Donate ${amount ? `₹${amount}` : ""}`}
          </Button>

          <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Payments are securely processed through Razorpay. Your payment information is never stored on this device.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
