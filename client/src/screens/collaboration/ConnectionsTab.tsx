import { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Check,
  X,
  RefreshCw,
  Loader2,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation";
import { collaborationService } from "@/lib/collaboration-service";
import { storage } from "@/lib/storage";

interface Connection {
  id: string;
  otherUser: {
    id: string;
    displayName?: string;
    phone?: string;
    mode: string;
  };
  nickname?: string;
  chatId?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  status: string;
  createdAt: string;
}

interface ConnectionInvite {
  id: string;
  senderId: string;
  senderMode: string;
  senderName?: string;
  senderPhone?: string;
  targetUserId?: string;
  targetName?: string;
  status: string;
  message?: string;
  createdAt: string;
}

interface SearchResult {
  user: {
    id: string;
    displayName?: string;
    phone: string;
    isVerified: boolean;
  } | null;
  alreadyConnected: boolean;
  pendingInvite: boolean;
}

export function ConnectionsTab() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ConnectionInvite[]>([]);
  const [sentInvites, setSentInvites] = useState<ConnectionInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSending, setIsSending] = useState(false);

  const profile = storage.getProfile();
  const currentMode = profile?.type || "HOME";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [connectionsRes, receivedRes, sentRes] = await Promise.all([
        collaborationService.fetchWithAuth("/api/connections"),
        collaborationService.fetchWithAuth("/api/connections/invites/received"),
        collaborationService.fetchWithAuth("/api/connections/invites/sent"),
      ]);

      setConnections(connectionsRes.connections || []);
      setReceivedInvites(receivedRes.invites || []);
      setSentInvites(sentRes.invites || []);
    } catch (error) {
      console.error("Failed to load connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    try {
      const result = await collaborationService.fetchWithAuth(
        `/api/connections/search?phone=${encodeURIComponent(searchPhone)}&mode=${currentMode}`
      );
      setSearchResult(result);
      if (!result.user) {
        toast({
          title: "No User Found",
          description: "No registered user found with this phone number",
        });
      }
    } catch (error: any) {
      if (error.message?.includes("429")) {
        toast({
          title: "Rate Limited",
          description: "Too many searches. Please wait a moment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Search Failed",
          description: "Failed to search for user",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult?.user) return;

    setIsSending(true);
    try {
      const result = await collaborationService.fetchWithAuth(
        "/api/connections/request",
        {
          method: "POST",
          body: JSON.stringify({
            targetUserId: searchResult.user.id,
            senderMode: currentMode,
          }),
        }
      );

      if (result.autoAccept) {
        toast({
          title: "Auto-Accepted",
          description: "You had a pending invite from this user. Connection established!",
        });
      } else {
        toast({
          title: "Request Sent",
          description: "Connection request sent successfully",
        });
      }

      setSearchPhone("");
      setSearchResult(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      await collaborationService.fetchWithAuth(
        `/api/connections/invites/${inviteId}/accept`,
        {
          method: "POST",
          body: JSON.stringify({ receiverMode: currentMode }),
        }
      );
      toast({
        title: "Connected",
        description: "Connection established successfully",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to accept invite",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    try {
      await collaborationService.fetchWithAuth(
        `/api/connections/invites/${inviteId}/reject`,
        { method: "POST" }
      );
      toast({
        title: "Declined",
        description: "Invite declined",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to decline invite",
        variant: "destructive",
      });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await collaborationService.fetchWithAuth(
        `/api/connections/${connectionId}`,
        { method: "DELETE" }
      );
      toast({
        title: "Removed",
        description: "Connection removed",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to remove connection",
        variant: "destructive",
      });
    }
  };

  const openChat = (chatId: string) => {
    navigate("chat", { chatId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" />
          Find People
        </h4>
        <div className="flex gap-4">
          <Input
            placeholder="+1234567890"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="flex-1"
            data-testid="input-search-phone"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            data-testid="button-search-user"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {searchResult?.user && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{searchResult.user.displayName || "User"}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {searchResult.user.phone}
                  </p>
                </div>
              </div>
              {searchResult.alreadyConnected ? (
                <Badge variant="secondary">Connected</Badge>
              ) : searchResult.pendingInvite ? (
                <Badge variant="outline">Pending</Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSendRequest}
                  disabled={isSending}
                  data-testid="button-send-request"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {receivedInvites.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Pending Requests ({receivedInvites.length})
          </h4>
          <div className="flex flex-col gap-4">
            {receivedInvites.map((invite) => (
              <Card key={invite.id} className="p-4" data-testid={`card-invite-${invite.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.senderName || "Someone"}</p>
                      <p className="text-sm text-muted-foreground">
                        {invite.senderPhone || "Wants to connect"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleRejectInvite(invite.id)}
                      data-testid={`button-reject-${invite.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleAcceptInvite(invite.id)}
                      data-testid={`button-accept-${invite.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sentInvites.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Sent Requests ({sentInvites.length})
          </h4>
          <div className="flex flex-col gap-4">
            {sentInvites.map((invite) => (
              <Card key={invite.id} className="p-4" data-testid={`card-sent-${invite.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm">{invite.targetName || "Pending..."}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Awaiting</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h4 className="font-medium">
          My Connections ({connections.length})
        </h4>
        {connections.length === 0 ? (
          <Card className="p-4">
            <div className="text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No connections yet</p>
              <p className="text-xs mt-1">Search for people by phone number to connect</p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {connections.map((conn) => (
              <Card
                key={conn.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => conn.chatId && openChat(conn.chatId)}
                data-testid={`card-connection-${conn.id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {conn.nickname || conn.otherUser.displayName || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conn.lastMessagePreview
                          ? conn.lastMessagePreview.substring(0, 40) + (conn.lastMessagePreview.length > 40 ? "..." : "")
                          : conn.otherUser.phone || `${conn.otherUser.mode} mode`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.chatId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(conn.chatId!);
                        }}
                        data-testid={`button-chat-${conn.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveConnection(conn.id);
                      }}
                      data-testid={`button-remove-${conn.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
