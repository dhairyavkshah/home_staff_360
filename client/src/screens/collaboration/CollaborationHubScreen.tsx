import { useState } from "react";
import { Users, MessageCircle, Share2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { collaborationService } from "@/lib/collaboration-service";
import { ConnectionsTab } from "./ConnectionsTab";
import { MessagesTab } from "./MessagesTab";
import { SharedSpacesTab } from "./SharedSpacesTab";
import { useRealtimeConnection } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";

export function CollaborationHubScreen() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();

  useRealtimeConnection();

  const [activeTab, setActiveTab] = useState("connections");

  if (!collaborationService.isAuthenticated()) {
    return (
      <AppLayout>
        <Header
          title={t("collaborationHub")}
          onBack={goBack}
        />
        <ScrollContent>
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Link2 className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t("phoneVerification")}</h3>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Verify your phone number to enable collaboration features
            </p>
            <Button
              onClick={() => navigate("phone-verification")}
              data-testid="button-verify-phone"
            >
              {t("verifyPhone")}
            </Button>
          </div>
        </ScrollContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header
        title={t("collaborationHub")}
        onBack={goBack}
      />
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="connections" data-testid="tab-connections">
                <Users className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="messages" data-testid="tab-messages">
                <MessageCircle className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="spaces" data-testid="tab-spaces">
                <Share2 className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollContent>
          {activeTab === "connections" && <ConnectionsTab />}
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "spaces" && <SharedSpacesTab />}
        </ScrollContent>
      </div>
    </AppLayout>
  );
}
