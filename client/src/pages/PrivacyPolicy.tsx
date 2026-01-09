import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicy() {
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
        <h1 className="text-lg font-semibold">Privacy Policy</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-base font-semibold">Home Staff 360</p>
            <p className="text-sm text-muted-foreground">Last Updated: January 8, 2026</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Home Staff 360 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application and cloud-based services.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Data Collection</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Phone Number</span>: Required for account authentication and verification</li>
                <li><span className="font-medium text-foreground">Password</span>: Required for secure account access (stored as encrypted hash)</li>
                <li><span className="font-medium text-foreground">Display Name</span>: Optional profile name for personalization</li>
                <li><span className="font-medium text-foreground">Household/Business Data</span>: Staff details, attendance records, payment information, expenses, laundry batches, and invoices you create within the app</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Device Information</span>: Device type and operating system for app compatibility</li>
                <li><span className="font-medium text-foreground">Usage Data</span>: Anonymous analytics to improve app performance</li>
                <li><span className="font-medium text-foreground">Connection Data</span>: When using real-time features, we maintain WebSocket connections for live updates</li>
                <li><span className="font-medium text-foreground">Ad Interaction Data</span>: When ads are displayed, we track impressions, completion rates, and clicks (not tied to personal profiles)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.3 Information NOT Collected</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>We do NOT access your contacts, photos, or files without explicit permission</li>
                <li>We do NOT track your browsing history outside the app</li>
                <li>We do NOT sell or share your data with advertisers for targeting</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Data Storage</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.1 Live Cloud Architecture</h3>
              <p className="text-sm text-muted-foreground">Home Staff 360 v1.0 operates as a <span className="font-medium text-foreground">live, cloud-connected service</span>:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Primary Storage</span>: All your data is securely stored on our cloud servers</li>
                <li><span className="font-medium text-foreground">Real-Time Sync</span>: Data syncs instantly across all your connected devices</li>
                <li><span className="font-medium text-foreground">Secure Transmission</span>: All data is transmitted over encrypted HTTPS/TLS connections</li>
                <li><span className="font-medium text-foreground">Server Encryption</span>: Data at rest is encrypted using industry-standard encryption</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.2 Data Processing Locations</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Our servers are hosted on secure, compliant cloud infrastructure</li>
                <li>Data may be processed in multiple regions to ensure low latency and high availability</li>
                <li>We adhere to international data protection standards</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.3 Data Retention</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Active Accounts</span>: Data is retained while your account is active</li>
                <li><span className="font-medium text-foreground">Account Deletion</span>: Upon request, all data is permanently deleted within 30 days</li>
                <li><span className="font-medium text-foreground">Backups</span>: Encrypted backups are retained for disaster recovery (up to 90 days)</li>
                <li><span className="font-medium text-foreground">Message History</span>: Chat messages are retained indefinitely unless deleted by users (within 5-minute window) or upon account deletion</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Data Sharing</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">3.1 We Do NOT Sell Your Data</h3>
              <p className="text-sm text-muted-foreground">
                We will <span className="font-medium text-foreground">never</span> sell, rent, or trade your personal information to third parties.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">3.2 Collaboration Features</h3>
              <p className="text-sm text-muted-foreground">When you use collaboration features:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Connected Users</span>: You may share data (attendance, laundry batches, expenses) with users you explicitly connect with</li>
                <li><span className="font-medium text-foreground">Real-Time Messaging</span>: Messages are visible only to participants in the conversation</li>
                <li><span className="font-medium text-foreground">Approval Workflows</span>: Shared items require explicit approval from recipients</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">3.3 Limited Exceptions</h3>
              <p className="text-sm text-muted-foreground">We may share information only in these circumstances:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">With Your Consent</span>: When you explicitly share data with connected users through our collaboration features</li>
                <li><span className="font-medium text-foreground">Service Providers</span>: With trusted providers who assist in delivering our services (e.g., SMS verification via Twilio), bound by strict confidentiality agreements</li>
                <li><span className="font-medium text-foreground">Legal Requirements</span>: If required by law, court order, or government request</li>
                <li><span className="font-medium text-foreground">Safety</span>: To protect the rights, safety, or property of our users or the public</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Advertising</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">4.1 Ad Display</h3>
              <p className="text-sm text-muted-foreground">
                Home Staff 360 may display advertisements to support free access to the app.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">4.2 No Personalized Targeting</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Ads are <span className="font-medium text-foreground">not targeted</span> based on your personal data, household information, or financial details</li>
                <li>We do NOT build advertising profiles from your app usage</li>
                <li>Ad selection is based on random rotation, not personal preferences</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">4.3 Ad Interaction Tracking</h3>
              <p className="text-sm text-muted-foreground">We track anonymous, aggregate metrics for ads:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Impression counts</li>
                <li>Completion rates</li>
                <li>Skip rates</li>
                <li>Click-through rates</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                This data is used solely to measure ad performance and is not linked to individual user profiles.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Your Rights</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.1 Access Your Data</h3>
              <p className="text-sm text-muted-foreground">You can view all your data within the app at any time.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.2 Export Your Data</h3>
              <p className="text-sm text-muted-foreground">You can export your data through the Backup feature in Settings, creating a downloadable file you control.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.3 Delete Your Data</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Account Deletion</span>: Request complete account deletion through Settings &gt; Profile &gt; Delete Account</li>
                <li><span className="font-medium text-foreground">Complete Deletion</span>: Upon request, we will delete all server-stored data within 30 days</li>
                <li><span className="font-medium text-foreground">Message Deletion</span>: You can delete messages you sent within 5 minutes of sending</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.4 Opt-Out Options</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Collaboration</span>: Collaboration features are optional and connections can be removed</li>
                <li><span className="font-medium text-foreground">Notifications</span>: Manage notification preferences in app settings</li>
                <li><span className="font-medium text-foreground">Location</span>: Deny location permission if you don't want location-tagged attendance</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.5 Data Portability</h3>
              <p className="text-sm text-muted-foreground">Your data belongs to you. Use the export feature to obtain a copy of all your information in a standard format.</p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Security Measures</h2>
            <p className="text-sm text-muted-foreground">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">Password Security</span>: Bcrypt hashing with salt (10 rounds)</li>
              <li><span className="font-medium text-foreground">Authentication</span>: Secure JWT tokens with 30-day expiry</li>
              <li><span className="font-medium text-foreground">OTP Verification</span>: Phone verification with 10-minute code expiry</li>
              <li><span className="font-medium text-foreground">Rate Limiting</span>: Protection against brute-force attacks</li>
              <li><span className="font-medium text-foreground">Local Security</span>: Optional PIN lock and biometric authentication</li>
              <li><span className="font-medium text-foreground">Secure Connections</span>: All server communication uses HTTPS/TLS encryption</li>
              <li><span className="font-medium text-foreground">Real-Time Security</span>: WebSocket connections are authenticated and encrypted</li>
              <li><span className="font-medium text-foreground">Data Encryption</span>: Server-side encryption for data at rest</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Permissions Explained</h2>
            <p className="text-sm text-muted-foreground">Our app requests the following permissions for specific features:</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 border-b border-border font-medium">Permission</th>
                    <th className="text-left p-2 border-b border-border font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr><td className="p-2 border-b border-border">Internet</td><td className="p-2 border-b border-border">Required for cloud sync and real-time collaboration</td></tr>
                  <tr><td className="p-2 border-b border-border">Camera</td><td className="p-2 border-b border-border">Capture photos for receipts and profile pictures</td></tr>
                  <tr><td className="p-2 border-b border-border">Microphone</td><td className="p-2 border-b border-border">Voice messages (optional feature)</td></tr>
                  <tr><td className="p-2 border-b border-border">Location</td><td className="p-2 border-b border-border">Optional geolocation for attendance verification</td></tr>
                  <tr><td className="p-2 border-b border-border">Phone State</td><td className="p-2 border-b border-border">Auto-detect phone number for registration</td></tr>
                  <tr><td className="p-2 border-b border-border">Phone Calls</td><td className="p-2 border-b border-border">Enable direct calling of staff/clients</td></tr>
                  <tr><td className="p-2 border-b border-border">Storage/Media</td><td className="p-2 border-b border-border">Save backups, import documents and photos</td></tr>
                  <tr><td className="p-2 border-b border-border">Notifications</td><td className="p-2 border-b border-border">Receive alerts for messages and approvals</td></tr>
                  <tr><td className="p-2 border-b border-border">Vibration</td><td className="p-2 border-b border-border">Haptic feedback for interactions</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              All permissions are optional except Internet access, which is required for the app to function.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
            <p className="text-sm text-muted-foreground">
              Home Staff 360 is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes through:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Your continued use of the app after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Contact Us</h2>
            <p className="text-sm text-muted-foreground">If you have questions, concerns, or requests regarding your privacy:</p>
            <p className="text-sm"><span className="font-medium">Email</span>: <a href="mailto:privacy@homestaff360.com" className="text-primary underline">privacy@homestaff360.com</a></p>
            <p className="text-sm text-muted-foreground">We will respond to privacy-related inquiries within 30 days.</p>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Regional Compliance</h2>

            <div className="space-y-2">
              <h3 className="text-base font-medium">For Users in India</h3>
              <p className="text-sm text-muted-foreground">
                This app complies with the Digital Personal Data Protection Act, 2023 (DPDP Act). You have the right to access, correct, and erase your personal data.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">For Users in the European Union</h3>
              <p className="text-sm text-muted-foreground">
                This app is designed with GDPR principles in mind. EU users have additional rights including data portability and the right to object to processing.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">For Users in the United States</h3>
              <p className="text-sm text-muted-foreground">
                California residents have rights under CCPA. We do not sell personal information as defined by California law.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-muted-foreground italic">
              This Privacy Policy is effective as of January 8, 2026.
            </p>
            <p className="text-sm font-medium">
              Home Staff 360 - Your Data, Securely Connected
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
