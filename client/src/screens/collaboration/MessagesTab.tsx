import { useState, useEffect } from "react";
import {
  MessageCircle,
  RefreshCw,
  Bell,
  BellOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigation } from "@/lib/navigation";
import { collaborationService } from "@/lib/collaboration-service";
import { formatDistanceToNow } from "date-fns";

interface ChatParticipant {
  id: string;
  userId: string;
  displayName?: string;
  isMuted: boolean;
  unreadCount: number;
}

interface Chat {
  id: string;
  connectionId: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  otherParticipant?: ChatParticipant & {
    displayName?: string;
  };
  isMuted: boolean;
  unreadCount: number;
}

export function MessagesTab() {
  const { navigate } = useNavigation();
  const { toast } = useToast();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const result = await collaborationService.fetchWithAuth("/chats");
      setChats(result.chats || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = (chatId: string) => {
    navigate("chat", { chatId });
  };

  const toggleMute = async (chatId: string, currentlyMuted: boolean) => {
    try {
      await collaborationService.fetchWithAuth(
        `/chats/${chatId}/${currentlyMuted ? "unmute" : "mute"}`,
        { method: "POST" }
      );
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId ? { ...c, isMuted: !currentlyMuted } : c
        )
      );
      toast({
        title: currentlyMuted ? "Unmuted" : "Muted",
        description: currentlyMuted
          ? "You will receive notifications"
          : "Notifications silenced for this chat",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update mute settings",
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Messages Yet</h3>
        <p className="text-muted-foreground text-center text-sm mb-4">
          Connect with people to start messaging
        </p>
        <Button
          variant="outline"
          onClick={loadChats}
          data-testid="button-refresh-chats"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {chats.map((chat) => (
        <Card
          key={chat.id}
          className="p-4 hover-elevate cursor-pointer"
          onClick={() => openChat(chat.id)}
          data-testid={`card-chat-${chat.id}`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              {chat.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-medium">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">
                  {chat.otherParticipant?.displayName || "User"}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatTime(chat.lastMessageAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {chat.lastMessagePreview || "No messages yet"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {chat.isMuted && (
                <Badge variant="outline" className="text-xs">
                  <BellOff className="w-3 h-3" />
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(chat.id, chat.isMuted);
                }}
                data-testid={`button-mute-${chat.id}`}
              >
                {chat.isMuted ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
