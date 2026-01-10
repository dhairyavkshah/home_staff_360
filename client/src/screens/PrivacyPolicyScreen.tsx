import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigation } from "@/lib/navigation";

export function PrivacyPolicyScreen() {
  const { goBack } = useNavigation();

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="screen-privacy-policy">
      <div className="safe-area-top" />
      <header className="sticky top-0 z-50 bg-background border-b px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
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

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
            <p className="text-lg font-semibold text-primary">Your Data, Your Device, Your Control</p>
            <p className="text-sm text-muted-foreground mt-1">Home Staff 360 uses a hybrid privacy-first architecture</p>
          </div>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Home Staff 360 ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-3">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Our Hybrid Privacy Model:</span> Home Staff 360 operates with a <span className="font-medium text-foreground">hybrid storage architecture</span> that prioritizes your privacy. Your business and operational data is stored <span className="font-medium text-foreground">exclusively on your local device</span>. Our servers only store the minimal data necessary for user authentication and enabling collaboration between users. We never store, access, or process your business data on our servers.
              </p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">1. Hybrid Storage Architecture</h2>
            
            <p className="text-sm text-muted-foreground">
              Home Staff 360 uses a <span className="font-medium text-foreground">hybrid storage model</span> with two distinct storage locations, each serving a specific purpose:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left font-medium border-b border-border">Storage Location</th>
                    <th className="px-3 py-2 text-left font-medium border-b border-border">What Is Stored</th>
                    <th className="px-3 py-2 text-left font-medium border-b border-border">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">Your Device (Primary)</td>
                    <td className="px-3 py-2">Staff records, attendance, payments, expenses, laundry, invoices, documents, clients, households, notes, settings</td>
                    <td className="px-3 py-2">All your business/operational data</td>
                  </tr>
                  <tr className="border-t border-border bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground">Our Server (Minimal)</td>
                    <td className="px-3 py-2">Phone number, password hash, user connections, chat messages, approval requests, notifications</td>
                    <td className="px-3 py-2">Authentication &amp; collaboration only</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.1 Local Device Storage (Your Primary Data)</h3>
              <p className="text-sm text-muted-foreground">The following data is stored <span className="font-medium text-foreground">exclusively on your device</span> and never leaves your device:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Staff records and profiles</li>
                <li>Attendance logs and check-in/check-out data</li>
                <li>Payment transactions and salary records</li>
                <li>Expense entries and receipts</li>
                <li>Laundry batches and tracking</li>
                <li>Invoices and billing information</li>
                <li>Documents and attachments</li>
                <li>Client and household information</li>
                <li>Personal notes and memos</li>
                <li>App settings and preferences</li>
              </ul>
              <p className="text-sm text-muted-foreground font-medium">We do NOT have access to this data. It exists only on your device.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.2 Server Storage (Authentication &amp; Collaboration Only)</h3>
              <p className="text-sm text-muted-foreground">Our servers store <span className="font-medium text-foreground">only the minimum data required</span> for:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">User Authentication</span>: Phone number and encrypted password hash for login</li>
                <li><span className="font-medium text-foreground">User Connections</span>: Links between users who choose to connect (e.g., employer to staff)</li>
                <li><span className="font-medium text-foreground">Chat Messages</span>: Messages sent between connected users</li>
                <li><span className="font-medium text-foreground">Approval Workflows</span>: Items shared between users requiring approval</li>
                <li><span className="font-medium text-foreground">Notifications</span>: System notifications for collaboration features</li>
              </ul>
              <p className="text-sm text-muted-foreground">This server data is encrypted, transmitted securely via HTTPS/TLS, and is not shared with third parties.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">1.3 Why This Hybrid Approach?</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Maximum Privacy</span>: Your sensitive business data never touches our servers</li>
                <li><span className="font-medium text-foreground">You Own Your Data</span>: Complete control over your information on your device</li>
                <li><span className="font-medium text-foreground">Collaboration Enabled</span>: Server enables real-time messaging and connections between users</li>
                <li><span className="font-medium text-foreground">No Data Mining</span>: We cannot analyze, monetize, or share your business data because we don&apos;t have it</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">2. Data Collection</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.1 Information You Provide (Stored on Server)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Phone Number</span>: Required for account authentication and verification</li>
                <li><span className="font-medium text-foreground">Password</span>: Required for secure account access (stored as encrypted hash only)</li>
                <li><span className="font-medium text-foreground">Display Name</span>: Optional profile name for personalization</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.2 Business Data You Create (Stored on Your Device Only)</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>Staff details, attendance records, payment information</li>
                <li>Expenses, laundry batches, invoices, documents</li>
                <li>Client/household information, notes, and settings</li>
              </ul>
              <p className="text-sm text-muted-foreground font-medium">This data never leaves your device and is not accessible by us.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.3 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Device Information</span>: Device type and OS for app compatibility</li>
                <li><span className="font-medium text-foreground">Usage Analytics</span>: Anonymous, aggregate metrics to improve app performance</li>
                <li><span className="font-medium text-foreground">Ad Interaction Data</span>: Impressions and clicks (not tied to personal profiles)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">2.4 Information NOT Collected</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>We do NOT collect or access your business/operational data</li>
                <li>We do NOT access your contacts, photos, or files without explicit permission</li>
                <li>We do NOT track your browsing history outside the app</li>
                <li>We do NOT sell or share your data with advertisers for targeting</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">3. Data Retention</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">Local Data</span>: Remains on your device until you delete it or uninstall the app</li>
              <li><span className="font-medium text-foreground">Server Account Data</span>: Retained while your account is active</li>
              <li><span className="font-medium text-foreground">Account Deletion</span>: Upon request, all server-stored data is permanently deleted immediately</li>
              <li><span className="font-medium text-foreground">Chat Messages</span>: Retained unless deleted by users or upon account deletion</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">4. Local Auto-Backup (Optional)</h2>
            <p className="text-sm text-muted-foreground">Home Staff 360 offers an optional automatic backup feature:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">User Consent Required</span>: Auto-backup only activates when you explicitly consent</li>
              <li><span className="font-medium text-foreground">Local Storage Only</span>: Backup files are stored on your device, NOT uploaded to our servers</li>
              <li><span className="font-medium text-foreground">Your Control</span>: You can disable auto-backup or delete backup files at any time</li>
              <li><span className="font-medium text-foreground">No Third-Party Access</span>: Local backups remain on your device and are not accessible by us</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">5. Data Sharing</h2>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.1 We Do NOT Sell Your Data</h3>
              <p className="text-sm text-muted-foreground">
                We will <span className="font-medium text-foreground">never</span> sell, rent, or trade your personal information to third parties.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.2 Collaboration Features</h3>
              <p className="text-sm text-muted-foreground">When you use collaboration features, you may share data with users you explicitly connect with. Messages are visible only to conversation participants.</p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">5.3 Limited Exceptions</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">Service Providers</span>: Trusted providers (e.g., Twilio for SMS) bound by confidentiality</li>
                <li><span className="font-medium text-foreground">Legal Requirements</span>: If required by law or court order</li>
                <li><span className="font-medium text-foreground">Safety</span>: To protect users or the public</li>
              </ul>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">6. Advertising</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li>Ads may be displayed to support free access to the app</li>
              <li>Ads are <span className="font-medium text-foreground">NOT targeted</span> based on your personal or business data</li>
              <li>We do NOT build advertising profiles from your app usage</li>
              <li>We track only anonymous, aggregate ad metrics (impressions, clicks)</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">7. Your Rights</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">Access</span>: View all your data within the app at any time</li>
              <li><span className="font-medium text-foreground">Export</span>: Export your data through the Backup feature</li>
              <li><span className="font-medium text-foreground">Delete</span>: Request complete account deletion through Settings</li>
              <li><span className="font-medium text-foreground">Portability</span>: Your data belongs to you - export it in standard format</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">8. Security Measures</h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
              <li><span className="font-medium text-foreground">Password Security</span>: Bcrypt hashing with salt</li>
              <li><span className="font-medium text-foreground">Authentication</span>: Secure JWT tokens with expiry</li>
              <li><span className="font-medium text-foreground">OTP Verification</span>: Phone verification with limited attempts</li>
              <li><span className="font-medium text-foreground">Rate Limiting</span>: Protection against brute-force attacks</li>
              <li><span className="font-medium text-foreground">Secure Connections</span>: All server communication uses HTTPS/TLS encryption</li>
              <li><span className="font-medium text-foreground">Local Security</span>: Optional PIN lock and biometric authentication</li>
            </ul>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">9. Permissions Explained</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-md">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-3 py-2 text-left font-medium">Permission</th>
                    <th className="px-3 py-2 text-left font-medium">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-t border-border"><td className="px-3 py-2">Internet</td><td className="px-3 py-2">Authentication and collaboration features</td></tr>
                  <tr className="border-t border-border"><td className="px-3 py-2">Camera</td><td className="px-3 py-2">Capture photos for receipts and profiles</td></tr>
                  <tr className="border-t border-border"><td className="px-3 py-2">Location</td><td className="px-3 py-2">Optional geolocation for attendance</td></tr>
                  <tr className="border-t border-border"><td className="px-3 py-2">Storage/Media</td><td className="px-3 py-2">Save backups, import documents</td></tr>
                  <tr className="border-t border-border"><td className="px-3 py-2">Notifications</td><td className="px-3 py-2">Receive alerts for messages</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Children&apos;s Privacy</h2>
            <p className="text-sm text-muted-foreground">
              Home Staff 360 is not intended for children under 13 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">11. Administrative Access</h2>
            
            <div className="space-y-3">
              <h3 className="text-base font-medium">11.1 Admin Panel Privacy</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li><span className="font-medium text-foreground">No Personal Data Display</span>: User names and phone numbers are not displayed on admin panels</li>
                <li><span className="font-medium text-foreground">No Business Data Access</span>: Admin cannot view your business data (it&apos;s on your device, not our server)</li>
                <li><span className="font-medium text-foreground">System Management Only</span>: Admin access is limited to platform infrastructure</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium">11.2 Limited Access Circumstances</h3>
              <p className="text-sm text-muted-foreground">We may access server-stored account data only when:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-2">
                <li>User requests help with a system issue</li>
                <li>Investigating a technical problem reported by user</li>
                <li>Required by law enforcement with proper documentation</li>
              </ul>
              <p className="text-sm text-muted-foreground font-medium">Access is always limited to server-stored data and never includes your local business data.</p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">12. Regional Compliance</h2>
            
            <div className="space-y-2">
              <h3 className="text-base font-medium">For Users in India</h3>
              <p className="text-sm text-muted-foreground">This app complies with the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium">For Users in the EU/EEA</h3>
              <p className="text-sm text-muted-foreground">This app complies with the General Data Protection Regulation (GDPR).</p>
            </div>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">13. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will be indicated by updating the &quot;Last Updated&quot; date. Your continued use constitutes acceptance of the updated policy.
            </p>
          </section>

          <hr className="border-border" />

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">14. Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              If you have questions regarding your privacy:
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Email</span>: privacy@homestaff360.com
            </p>
            <p className="text-sm text-muted-foreground">We will respond within 30 days.</p>
          </section>

          <div className="h-8" />
        </div>
      </ScrollArea>
    </div>
  );
}
