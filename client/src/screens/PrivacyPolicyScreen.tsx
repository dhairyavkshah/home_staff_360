import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useNavigation } from "@/lib/navigation";

export function PrivacyPolicyScreen() {
  const { goBack } = useNavigation();

  return (
    <AppLayout>
      <Header title="Privacy Policy" onBack={goBack} />
      <ScrollContent>
        <Card className="space-y-5 p-5 text-sm">
          <div>
            <h1 className="text-xl font-semibold">Your data stays with you</h1>
            <p className="mt-1 text-muted-foreground">
              Home Staff 360 is a local-first app. This policy explains what the
              app stores and how you control it.
            </p>
          </div>
          <section>
            <h2 className="font-semibold">Data storage</h2>
            <p className="mt-1 text-muted-foreground">
              Profiles, staff and household records, attendance, wages, payments,
              expenses, documents, notes, reminders, photos, and settings are
              stored in the app on your device. The app does not upload these
              records to a Home Staff 360 server.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">No online account</h2>
            <p className="mt-1 text-muted-foreground">
              No phone sign-in, OTP verification, server sync, chat, SMS
              invitations, remote notifications, advertising, subscriptions, or
              usage analytics are part of the app.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Permissions and sharing</h2>
            <p className="mt-1 text-muted-foreground">
              Optional access may be used when you choose to capture or select a
              photo, create or restore a file, or schedule a local reminder.
              Exported files shared through another app are handled under that
              app's privacy policy.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Backups and deletion</h2>
            <p className="mt-1 text-muted-foreground">
              Backups and exports are copies you create and control. Android may
              also back up or transfer app data according to your device and
              Google backup settings. Use Clear all local data in Profile to
              remove app records; delete saved backup copies separately.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Your choices</h2>
            <p className="mt-1 text-muted-foreground">
              You can deny optional permissions, edit or delete local records,
              export a copy, or clear all app data. The app does not maintain an
              online account or server copy of your records.
            </p>
          </section>
          <p className="text-xs text-muted-foreground">
            Effective date: September 3, 2026
          </p>
        </Card>
      </ScrollContent>
    </AppLayout>
  );
}