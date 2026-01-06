import { useState, useEffect, useMemo } from "react";
import {
  Link2,
  Users,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Wifi,
  WifiOff,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  collaborationService,
  type CollaborationLink,
} from "@/lib/collaboration-service";
import { storage } from "@/lib/storage";
import { ConnectionsTab } from "./ConnectionsTab";
import { MessagesTab } from "./MessagesTab";
import { SharedSpacesTab } from "./SharedSpacesTab";

export function CollaborationHubScreen() {
  const { navigate, goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("connections");
  const [links, setLinks] = useState<CollaborationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  const profile = useMemo(() => storage.getProfile(), []);
  const isHome = profile?.type === "HOME";

  useEffect(() => {
    loadLinks();
    updateConnectionStatus();

    const handleOnline = () => updateConnectionStatus();
    const handleOffline = () => setConnectionStatus("disconnected");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateConnectionStatus = () => {
    setConnectionStatus(collaborationService.getConnectionStatus());
  };

  const loadLinks = async () => {
    if (!collaborationService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const activeLinks = await collaborationService.getActiveLinks();
      setLinks(activeLinks);
    } catch (error) {
      console.error("Failed to load links:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await loadLinks();
      toast({
        title: t("success"),
        description: t("synced"),
      });
    } catch {
      toast({
        title: t("error"),
        description: t("syncFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const activeLinks = links.filter((l) => l.status === "accepted");
  const pendingLinks = links.filter((l) => l.status === "pending");

  const ConnectionIndicator = () => (
    <div className="flex items-center gap-2">
      {connectionStatus === "connected" ? (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Wifi className="w-4 h-4" />
          <span className="text-xs">{t("online")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-muted-foreground">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">{t("offline")}</span>
        </div>
      )}
    </div>
  );

  const renderLinkCard = (link: CollaborationLink) => {
    const isAccepted = link.status === "accepted";
    const isPending = link.status === "pending";
    const isExpired = link.status === "expired";

    return (
      <Card key={link.id} className="p-4" data-testid={`card-link-${link.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isAccepted
                  ? "bg-green-100 dark:bg-green-900/30"
                  : isPending
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-muted"
              }`}
            >
              {isAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : isPending ? (
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {link.linkType === "HOME_TO_STAFF"
                  ? isHome
                    ? "Staff Member"
                    : "Employer"
                  : isHome
                  ? "Staff Member"
                  : "Employer"}
              </p>
              <p className="text-sm text-muted-foreground">
                {link.linkType === "HOME_TO_STAFF"
                  ? t("linkWithStaff")
                  : t("linkWithEmployer")}
              </p>
            </div>
          </div>
          <Badge
            variant={
              isAccepted
                ? "default"
                : isPending
                ? "secondary"
                : "outline"
            }
          >
            {isAccepted
              ? t("linkActive")
              : isPending
              ? t("linkPending")
              : isExpired
              ? t("linkExpired")
              : link.status}
          </Badge>
        </div>

        {isPending && (
          <div className="mt-3 p-3 bg-muted rounded-md">
            <p className="text-sm font-mono text-center">{link.code}</p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {t("codeExpires")}: {new Date(link.expiresAt).toLocaleString()}
            </p>
          </div>
        )}
      </Card>
    );
  };

  const renderLinksTab = () => (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{t("syncStatus")}</p>
              <ConnectionIndicator />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            data-testid="button-sync"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? t("syncing") : t("syncNow")}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-medium">{t("linkedAccounts")}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("link-account")}
          data-testid="button-add-link"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeLinks.length === 0 && pendingLinks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Link2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">{t("noLinkedAccounts")}</h3>
          <p className="text-muted-foreground text-center text-sm mb-6">
            {t("linkYourFirstAccount")}
          </p>
          <Button onClick={() => navigate("link-account")} data-testid="button-link-first">
            <Plus className="w-4 h-4 mr-2" />
            {t("linkAccount")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeLinks.map(renderLinkCard)}

          {pendingLinks.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-muted-foreground pt-2">
                {t("pendingInvites")} ({pendingLinks.length})
              </h4>
              {pendingLinks.map(renderLinkCard)}
            </>
          )}
        </div>
      )}

      <Card
        className="p-4 hover-elevate cursor-pointer"
        onClick={() => navigate("sync-activity")}
        data-testid="card-sync-activity"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{t("syncActivity")}</p>
            <p className="text-sm text-muted-foreground">{t("recentSync")}</p>
          </div>
        </div>
      </Card>
    </div>
  );

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
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="connections" data-testid="tab-connections">
                <Users className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="messages" data-testid="tab-messages">
                <MessageCircle className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="spaces" data-testid="tab-spaces">
                <Share2 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="links" data-testid="tab-links">
                <Link2 className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollContent>
          {activeTab === "connections" && <ConnectionsTab />}
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "spaces" && <SharedSpacesTab />}
          {activeTab === "links" && renderLinksTab()}
        </ScrollContent>
      </div>
    </AppLayout>
  );
}
