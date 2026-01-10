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
            <p className="text-sm text-muted-foreground">Last Updated: January 10, 2026</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Home Staff 360 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Important</span>: Home Staff 360 is designed with a privacy-first architecture. Your business and operational data (staff records, attendance, payments, expenses, laundry data, invoices, documents, and client information) remains <span className="font-medium text-foreground">exclusively on your local device</span>. We do not store, access, or process this data on our servers. Our platform only helps you keep your data handy and secure on your own device.
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
            <h2 className="text-xl font-semibold">2. Data Storage Architecture</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.1 Local-First Architecture</h3>
              <p className="text-sm text-muted-foreground">Home Staff 360 operates with a <span className="font-medium text-foreground">privacy-first, local-storage design</span>:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Your Business Data Stays Local</span>: All operational data including staff records, attendance logs, payment transactions, expenses, laundry batches, invoices, documents, client information, and household data remains <span className="font-medium text-foreground">exclusively on your device</span></li>
                <li><span className="font-medium text-foreground">No Server Storage of Business Data</span>: We do NOT store, access, or process your business/operational data on our servers</li>
                <li><span className="font-medium text-foreground">You Own Your Data</span>: Your data is under your complete control on your local device</li>
                <li><span className="font-medium text-foreground">Platform Purpose</span>: Our platform helps you keep your data handy, organized, and secure on your own device</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.2 Server-Side Data (Collaboration Only)</h3>
              <p className="text-sm text-muted-foreground">We only store minimal data required for account management and user-to-user communication:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">User Accounts</span>: Phone number (for authentication) and encrypted password hash</li>
                <li><span className="font-medium text-foreground">User Connections</span>: Links between users who choose to connect (e.g., home user to staff user)</li>
                <li><span className="font-medium text-foreground">Chat Messages</span>: Messages sent between connected users for real-time communication</li>
                <li><span className="font-medium text-foreground">Approval Requests</span>: Workflow items shared between connected users requiring approval</li>
                <li><span className="font-medium text-foreground">Notifications</span>: System notifications for collaboration features</li>
              </ul>
              <p className="text-sm text-muted-foreground">All server-stored data is transmitted securely via HTTPS/TLS encryption and is not shared with third parties.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.3 Collaboration Purpose</h3>
              <p className="text-sm text-muted-foreground">Our server infrastructure exists solely to enable communication between users:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Home users connecting with staff users</li>
                <li>Staff users connecting with home users</li>
                <li>Home-to-home or staff-to-staff connections</li>
                <li>Real-time messaging and approval workflows between connected users</li>
              </ul>
              <p className="text-sm text-muted-foreground">We do NOT have access to your business operations data, financial records, or personal staff/client information stored on your device.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.4 Data Retention</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Local Data</span>: Remains on your device until you delete it or uninstall the app</li>
                <li><span className="font-medium text-foreground">Account Data</span>: Server-side account data is retained while your account is active</li>
                <li><span className="font-medium text-foreground">Account Deletion</span>: Upon request, all server-stored data is permanently deleted immediately</li>
                <li><span className="font-medium text-foreground">Message History</span>: Chat messages are retained unless deleted by users (within 5-minute window) or upon account deletion</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.5 Local Auto-Backup (Optional)</h3>
              <p className="text-sm text-muted-foreground">Home Staff 360 offers an optional automatic backup feature:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">User Consent Required</span>: Auto-backup only activates when you explicitly consent by checking the consent checkbox in Settings</li>
                <li><span className="font-medium text-foreground">Local Storage Only</span>: Backup files are stored in app-specific storage on your device, not uploaded to external servers</li>
                <li><span className="font-medium text-foreground">Background Processing</span>: When enabled, backups run in the background at your chosen frequency (daily, weekly, or monthly) with a visible notification</li>
                <li><span className="font-medium text-foreground">Your Control</span>: You can disable auto-backup, change frequency, or delete local backup files at any time</li>
                <li><span className="font-medium text-foreground">No Third-Party Access</span>: Local backups remain on your device and are not accessible by us or any third parties</li>
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
                <li><span className="font-medium text-foreground">Complete Deletion</span>: Upon request, we will delete all server-stored data immediately</li>
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
                  <tr><td className="p-2 border-b border-border">Internet</td><td className="p-2 border-b border-border">Required for user authentication and real-time collaboration features</td></tr>
                  <tr><td className="p-2 border-b border-border">Camera</td><td className="p-2 border-b border-border">Capture photos for receipts and profile pictures</td></tr>
                  <tr><td className="p-2 border-b border-border">Microphone</td><td className="p-2 border-b border-border">Voice messages (optional feature)</td></tr>
                  <tr><td className="p-2 border-b border-border">Location</td><td className="p-2 border-b border-border">Optional geolocation for attendance verification</td></tr>
                  <tr><td className="p-2 border-b border-border">Phone State</td><td className="p-2 border-b border-border">Auto-detect phone number for registration</td></tr>
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
            <h2 className="text-xl font-semibold">11. Administrative Access</h2>
            
            <div className="space-y-3">
              <h3 className="text-base font-medium">11.1 Admin Panel Privacy</h3>
              <p className="text-sm text-muted-foreground">Our administrative systems are designed with privacy protection:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">No Personal Data Display</span>: User names and phone numbers are not displayed on our admin panels</li>
                <li><span className="font-medium text-foreground">Limited Access</span>: Admin staff cannot browse or view user business data (as it is stored locally on devices)</li>
                <li><span className="font-medium text-foreground">System Management Only</span>: We only manage the platform infrastructure and user account registrations</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">11.2 When We May Access Data</h3>
              <p className="text-sm text-muted-foreground">We may search for specific user information only in these limited circumstances:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>When a user requests help with a system issue affecting their account</li>
                <li>When investigating a technical problem reported by the user</li>
                <li>When required by law enforcement with proper legal documentation</li>
              </ul>
              <p className="text-sm text-muted-foreground">In all cases, access is limited to server-stored data (account info, connections) and never includes your local business data.</p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Regional Compliance</h2>

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
              This Privacy Policy is effective as of January 10, 2026.
            </p>
            <p className="text-sm font-medium">
              Home Staff 360 - Your Data, Your Device, Your Control
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
