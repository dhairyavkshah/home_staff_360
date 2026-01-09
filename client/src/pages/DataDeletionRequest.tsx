import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataDeletionRequest() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Data Deletion Request</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Request Data Deletion</h1>
            <p className="text-base font-semibold">Home Staff 360</p>
            <p className="text-sm text-muted-foreground">Your privacy matters to us</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">How to Delete Your Data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Home Staff 360 allows you to delete your account and all associated data at any time. 
              Upon deletion request, all your data is permanently removed from our servers immediately.
            </p>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Option 1: Delete from Within the App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you have access to the Home Staff 360 app, you can delete your account directly:
              </p>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 pl-2">
                <li>Open the Home Staff 360 app</li>
                <li>Go to <span className="font-medium text-foreground">Settings</span></li>
                <li>Tap on <span className="font-medium text-foreground">Profile Settings</span></li>
                <li>Scroll down and tap <span className="font-medium text-foreground">Delete Account</span></li>
                <li>Confirm your decision when prompted</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Your account and all data will be deleted immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Option 2: Request via Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you cannot access the app, you can request data deletion by email:
              </p>
              <div className="bg-muted/50 rounded-md p-4 space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span>{" "}
                  <a 
                    href="mailto:privacy@homestaff360.com?subject=Data%20Deletion%20Request" 
                    className="text-primary underline"
                  >
                    privacy@homestaff360.com
                  </a>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Subject:</span>{" "}
                  <span className="text-muted-foreground">Data Deletion Request</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Please include the phone number associated with your account in your email. 
                We will verify your identity and process your request within 30 days.
              </p>
            </CardContent>
          </Card>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">What Data Will Be Deleted?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you delete your account, the following data is permanently removed:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li>Your phone number and profile information</li>
              <li>All attendance records you created</li>
              <li>All expense records</li>
              <li>All laundry batch records</li>
              <li>All payment/transaction records</li>
              <li>All chat messages and conversations</li>
              <li>All connection links with other users</li>
              <li>All notifications</li>
              <li>All approvals and shared items</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Data Retention</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">Account data:</span> Deleted immediately upon request</li>
              <li><span className="font-medium text-foreground">Encrypted backups:</span> Retained for up to 90 days for disaster recovery, then permanently deleted</li>
              <li><span className="font-medium text-foreground">Analytics:</span> Anonymous, aggregated data that cannot identify you may be retained</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Questions?</h2>
            <p className="text-sm text-muted-foreground">
              If you have any questions about data deletion or your privacy, please contact us at{" "}
              <a href="mailto:privacy@homestaff360.com" className="text-primary underline">
                privacy@homestaff360.com
              </a>
            </p>
          </section>

          <hr className="border-border" />

          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-muted-foreground italic">
              Last Updated: January 9, 2026
            </p>
            <p className="text-sm font-medium">
              Home Staff 360 - Your Data, Your Control
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
