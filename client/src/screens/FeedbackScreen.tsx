import { useState } from "react";
import { Send, MessageSquare, User, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";

export function FeedbackScreen() {
  const { goBack } = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!message.trim()) {
      newErrors.message = "Please describe your issue or suggestion";
    } else if (message.trim().length < 10) {
      newErrors.message = "Please provide more details (at least 10 characters)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const mailtoSubject = encodeURIComponent("Feedback: Home Staff 360");
    const mailtoBody = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n---\nSent from Home Staff 360 v2.0`
    );
    const mailtoLink = `mailto:support@homestaff360.com?subject=${mailtoSubject}&body=${mailtoBody}`;
    window.open(mailtoLink, "_blank");
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AppLayout>
        <Header
          title="Feedback"
          onBack={goBack}
        />
        <ScrollContent>
          <div className="content-container flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="icon-halo-success w-16 h-16">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Your email app should have opened with the feedback. Please send the email to complete your submission.
              </p>
            </div>
            <Button onClick={goBack} data-testid="button-back-to-settings">
              Back to Settings
            </Button>
          </div>
        </ScrollContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title="Feedback & Support"
        onBack={goBack}
      />
      <ScrollContent>
        <div className="content-container pb-8 flex flex-col gap-6">
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="icon-halo-info w-10 h-10">
                <MessageSquare className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="font-semibold">Report Bug or Suggest Improvement</h2>
                <p className="text-xs text-muted-foreground">
                  Help us make the app better for everyone
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                data-testid="input-feedback-name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Your Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-destructive" : ""}
                data-testid="input-feedback-email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                Your Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Describe the bug you encountered or your suggestion for improvement..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`min-h-[150px] ${errors.message ? "border-destructive" : ""}`}
                data-testid="input-feedback-message"
              />
              {errors.message && (
                <p className="text-xs text-destructive">{errors.message}</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            data-testid="button-submit-feedback"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Feedback
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This will open your email app to send feedback to our support team at support@theteam360.com
          </p>
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
