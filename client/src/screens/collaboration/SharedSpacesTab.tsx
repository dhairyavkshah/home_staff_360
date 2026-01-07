import { useState, useEffect, useMemo } from "react";
import {
  Home,
  Briefcase,
  Users,
  Plus,
  RefreshCw,
  Check,
  X,
  ChevronRight,
  Crown,
  Eye,
  Edit3,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { collaborationService } from "@/lib/collaboration-service";
import { storage } from "@/lib/storage";

interface SharedSpace {
  id: string;
  type: "household" | "business";
  name: string;
  localId: string;
  ownerId: string;
  ownerName?: string;
  isOwner: boolean;
  role: "admin" | "editor" | "viewer";
  memberCount?: number;
  members?: SpaceMember[];
  createdAt: string;
}

interface SpaceMember {
  id: string;
  userId: string;
  displayName?: string;
  phone?: string;
  role: string;
  status: string;
}

interface ShareInvitation {
  id: string;
  type: "household" | "business";
  shareId: string;
  spaceName?: string;
  ownerName?: string;
  role: string;
  invitedAt: string;
}

interface Connection {
  id: string;
  otherUser: {
    id: string;
    displayName?: string;
  };
}

export function SharedSpacesTab() {
  const { toast } = useToast();
  const profile = storage.getProfile();
  const isHome = profile?.type === "HOME";

  const [spaces, setSpaces] = useState<SharedSpace[]>([]);
  const [invitations, setInvitations] = useState<ShareInvitation[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<SharedSpace | null>(null);
  const [createType, setCreateType] = useState<"household" | "business">("household");
  const [createName, setCreateName] = useState("");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor">("viewer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = useMemo(() => storage.getAccountsForCurrentMode(), []);
  const households = useMemo(() => accounts.filter(a => a.ownerType === 'HOME'), [accounts]);
  const businesses = useMemo(() => accounts.filter(a => a.ownerType === 'STAFF'), [accounts]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [spacesRes, invitesRes, connsRes] = await Promise.all([
        collaborationService.fetchWithAuth("/shared-spaces"),
        collaborationService.fetchWithAuth("/shared-spaces/invitations"),
        collaborationService.fetchWithAuth("/connections"),
      ]);
      setSpaces(spacesRes.spaces || []);
      setInvitations(invitesRes.invitations || []);
      setConnections(connsRes.connections || []);
    } catch (error) {
      console.error("Failed to load shared spaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!createName) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the shared space",
        variant: "destructive",
      });
      return;
    }

    const localItems = createType === "household" ? households : businesses;
    const localItem = localItems.find((item: any) => item.name === createName || item.id === createName);
    
    if (!localItem) {
      toast({
        title: "Not Found",
        description: `No local ${createType} found with that name`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await collaborationService.fetchWithAuth("/shared-spaces", {
        method: "POST",
        body: JSON.stringify({
          type: createType,
          name: localItem.name || createName,
          localId: localItem.id,
        }),
      });
      toast({
        title: "Created",
        description: `Shared ${createType} created successfully`,
      });
      setShowCreateDialog(false);
      setCreateName("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to create shared space",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedSpace || !selectedConnection) return;

    const conn = connections.find((c) => c.id === selectedConnection);
    if (!conn) return;

    setIsSubmitting(true);
    try {
      await collaborationService.fetchWithAuth(
        `/api/shared-spaces/${selectedSpace.id}/invite`,
        {
          method: "POST",
          body: JSON.stringify({
            type: selectedSpace.type,
            targetUserId: conn.otherUser.id,
            role: inviteRole,
          }),
        }
      );
      toast({
        title: "Invited",
        description: `Invitation sent to ${conn.otherUser.displayName || "user"}`,
      });
      setShowInviteDialog(false);
      setSelectedConnection("");
      loadData();
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptInvite = async (invite: ShareInvitation) => {
    try {
      await collaborationService.fetchWithAuth(
        `/api/shared-spaces/invitations/${invite.id}/accept`,
        {
          method: "POST",
          body: JSON.stringify({ type: invite.type }),
        }
      );
      toast({
        title: "Joined",
        description: `You've joined ${invite.spaceName}`,
      });
      loadData();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    }
  };

  const handleDeclineInvite = async (invite: ShareInvitation) => {
    try {
      await collaborationService.fetchWithAuth(
        `/api/shared-spaces/${invite.shareId}/member/${invite.id}?type=${invite.type}`,
        { method: "DELETE" }
      );
      toast({
        title: "Declined",
        description: "Invitation declined",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Failed",
        description: "Failed to decline invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case "editor":
        return <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
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
      {invitations.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="font-medium text-sm text-muted-foreground">
            Pending Invitations ({invitations.length})
          </h4>
          <div className="flex flex-col gap-4">
            {invitations.map((inv) => (
              <Card key={inv.id} className="p-4" data-testid={`card-invite-${inv.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      {inv.type === "household" ? (
                        <Home className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <Briefcase className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{inv.spaceName || "Shared Space"}</p>
                      <p className="text-sm text-muted-foreground">
                        From {inv.ownerName || "someone"}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {inv.role}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDeclineInvite(inv)}
                      data-testid={`button-decline-${inv.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => handleAcceptInvite(inv)}
                      data-testid={`button-accept-${inv.id}`}
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

      <div className="flex items-center justify-between">
        <h4 className="font-medium">
          {isHome ? "Shared Households" : "Shared Businesses"}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCreateType(isHome ? "household" : "business");
            setShowCreateDialog(true);
          }}
          data-testid="button-create-space"
        >
          <Plus className="w-4 h-4 mr-1" />
          Share
        </Button>
      </div>

      {spaces.length === 0 ? (
        <Card className="p-4">
          <div className="text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No shared spaces yet</p>
            <p className="text-xs mt-1">
              Share your {isHome ? "household" : "business"} with connections
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {spaces.map((space) => (
            <Card
              key={space.id}
              className="p-4"
              data-testid={`card-space-${space.id}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      space.isOwner
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    {space.type === "household" ? (
                      <Home
                        className={`w-5 h-5 ${
                          space.isOwner
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    ) : (
                      <Briefcase
                        className={`w-5 h-5 ${
                          space.isOwner
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-400"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{space.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {getRoleIcon(space.role)}
                      {space.isOwner ? "Owner" : `Shared by ${space.ownerName || "someone"}`}
                      {space.memberCount !== undefined && (
                        <span className="ml-2">
                          ({space.memberCount} member{space.memberCount !== 1 ? "s" : ""})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {space.isOwner && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedSpace(space);
                      setShowInviteDialog(true);
                    }}
                    data-testid={`button-invite-${space.id}`}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {space.isOwner && space.members && space.members.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Members:</p>
                  <div className="space-y-1">
                    {space.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {member.displayName || member.phone || "User"}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              member.status === "accepted" ? "default" : "outline"
                            }
                            className="text-xs"
                          >
                            {member.status === "accepted" ? member.role : "pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {createType === "household" ? "Household" : "Business"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select {createType === "household" ? "Household" : "Business"}
              </label>
              <Select value={createName} onValueChange={setCreateName}>
                <SelectTrigger data-testid="select-local-item">
                  <SelectValue placeholder={`Select a ${createType}`} />
                </SelectTrigger>
                <SelectContent>
                  {(createType === "household" ? households : businesses).map(
                    (item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSpace}
              disabled={isSubmitting || !createName}
              data-testid="button-confirm-create"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {selectedSpace?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Connection
              </label>
              <Select
                value={selectedConnection}
                onValueChange={setSelectedConnection}
              >
                <SelectTrigger data-testid="select-connection">
                  <SelectValue placeholder="Choose a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((conn) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.otherUser.displayName || "User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "viewer" | "editor")}
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                  <SelectItem value="editor">Editor (can modify)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={isSubmitting || !selectedConnection}
              data-testid="button-confirm-invite"
            >
              {isSubmitting ? "Inviting..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
