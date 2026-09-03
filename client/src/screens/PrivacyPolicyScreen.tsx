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
              Home Staff 360 is designed to work locally and offline.
            </p>
          </div>
          <section>
            <h2 className="font-semibold">Data storage</h2>
            <p className="mt-1 text-muted-foreground">
              Profiles, people, attendance, wages, expenses, notes, photos,
              settings, and other records are stored on your device. The app
              does not upload these records to a Home Staff 360 server.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Accounts and communication</h2>
            <p className="mt-1 text-muted-foreground">
              The app does not require phone sign-in, OTP verification, or an
              online account. It does not send SMS invitations, collaboration
              requests, chat messages, advertisements, or remote notifications.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Device permissions</h2>
            <p className="mt-1 text-muted-foreground">
              Optional device permissions are used only for features you
              choose, such as selecting a profile photo, saving a backup, or
              scheduling a local reminder.
            </p>
          </section>
          <section>
            <h2 className="font-semibold">Backups and deletion</h2>
            <p className="mt-1 text-muted-foreground">
              Backups are files you create and control. You can remove your
              profile and all app records using Clear all local data in
              Profile. Uninstalling the app may also remove locally stored
              records, so keep your own backup if needed.
            </p>
          </section>
          <p className="text-xs text-muted-foreground">
            Last updated: September 3, 2026
          </p>
        </Card>
      </ScrollContent>
    </AppLayout>
  );
}