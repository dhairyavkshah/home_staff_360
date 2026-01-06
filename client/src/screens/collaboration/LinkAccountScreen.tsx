import { useState, useCallback } from "react";
import {
  Link2,
  Copy,
  Share2,
  QrCode,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { collaborationService } from "@/lib/collaboration-service";
import { storage } from "@/lib/storage";

export function LinkAccountScreen() {
  const { goBack } = useNavigation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const profile = storage.getProfile();
  const isHome = profile?.type === "HOME";

  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleCreateInvite = useCallback(async () => {
    setIsLoading(true);
    try {
      const linkType = isHome ? "HOME_TO_STAFF" : "STAFF_TO_HOME";
      const response = await collaborationService.createCollaborationLink(linkType);
      if (response.success) {
        setGeneratedCode(response.code);
        setExpiresAt(new Date(response.expiresAt));
        toast({
          title: t("success"),
          description: t("inviteCode") + ": " + response.code,
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("error"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isHome, toast, t]);

  const handleAcceptInvite = useCallback(async () => {
    if (!inviteCode.trim()) {
      toast({
        title: t("error"),
        description: t("enterInviteCode"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await collaborationService.acceptCollaborationLink(inviteCode);
      if (response.success) {
        toast({
          title: t("success"),
          description: t("inviteAccepted"),
        });
        goBack();
      } else {
        toast({
          title: t("error"),
          description: response.message || t("invalidCode"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: error instanceof Error ? error.message : t("invalidCode"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, toast, t, goBack]);

  const handleCopyCode = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      toast({
        title: t("success"),
        description: t("codeCopied"),
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast({
        title: t("error"),
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  }, [generatedCode, toast, t]);

  const handleShareCode = useCallback(async () => {
    if (!generatedCode) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Home Staff 360 Invite",
          text: `Join me on Home Staff 360! Use invite code: ${generatedCode}`,
        });
      } else {
        handleCopyCode();
      }
    } catch {
      handleCopyCode();
    }
  }, [generatedCode, handleCopyCode]);

  return (
    <AppLayout>
      <Header
        title={t("linkAccount")}
        onBack={goBack}
      />
      <ScrollContent>
        <div className="p-4 space-y-4">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" data-testid="tab-create-invite">
                {t("createInviteCode")}
              </TabsTrigger>
              <TabsTrigger value="accept" data-testid="tab-accept-invite">
                {t("acceptInvite")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-medium">
                    {isHome ? t("linkWithStaff") : t("linkWithEmployer")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create an invite code to share with your {isHome ? "staff" : "employer"}
                  </p>
                </div>

                {!generatedCode ? (
                  <Button
                    onClick={handleCreateInvite}
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-create-invite"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4 mr-2" />
                    )}
                    {t("createInviteCode")}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-md text-center">
                      <p className="text-2xl font-mono font-bold tracking-wider">
                        {generatedCode}
                      </p>
                      {expiresAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("codeExpires")}: {expiresAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCopyCode}
                        className="flex-1"
                        data-testid="button-copy-code"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : (
                          <Copy className="w-4 h-4 mr-2" />
                        )}
                        {t("copyCode")}
                      </Button>
                      <Button
                        onClick={handleShareCode}
                        className="flex-1"
                        data-testid="button-share-code"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        {t("shareInviteCode")}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="accept" className="space-y-4 mt-4">
              <Card className="p-4 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-medium">{t("acceptInvite")}</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter the invite code you received
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-code">{t("inviteCode")}</Label>
                  <Input
                    id="invite-code"
                    placeholder={t("inviteCodePlaceholder")}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="text-center text-lg font-mono tracking-wider"
                    data-testid="input-invite-code"
                  />
                </div>

                <Button
                  onClick={handleAcceptInvite}
                  disabled={isLoading || inviteCode.length < 8}
                  className="w-full"
                  data-testid="button-accept-invite"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("acceptInvite")}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollContent>
    </AppLayout>
  );
}
