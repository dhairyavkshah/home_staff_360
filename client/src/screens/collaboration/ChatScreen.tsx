import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  MoreVertical,
  Bell,
  BellOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { useToast } from "@/hooks/use-toast";
import { collaborationService } from "@/lib/collaboration-service";
import { formatDistanceToNow } from "date-fns";
import { useRealtime, useRealtimeChat, useRealtimeConnection } from "@/hooks/use-realtime";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  messageType: string;
  content: string;
  isOwn: boolean;
  createdAt: string;
}

interface ChatInfo {
  id: string;
  type: string;
  name?: string;
  connectionId: string;
  isMuted: boolean;
  participants: Array<{
    userId: string;
    displayName?: string;
    mode: string;
  }>;
}

export function ChatScreen() {
  const { goBack } = useNavigation();
  const { chatId } = useNavigationData<{ chatId?: string }>();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useRealtimeConnection();
  useRealtimeChat(chatId || null);

  const handleNewMessage = useCallback((message: any) => {
    if (message.chatId !== chatId) return;
    
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, { ...message, isOwn: false }];
    });
  }, [chatId]);

  useRealtime("chat:new-message", handleNewMessage);

  useEffect(() => {
    if (chatId) {
      loadChatData();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatData = async () => {
    if (!chatId) return;
    
    setIsLoading(true);
    try {
      const [messagesRes, chatRes] = await Promise.all([
        collaborationService.fetchWithAuth(`/chats/${chatId}/messages`),
        collaborationService.fetchWithAuth(`/chats/${chatId}`),
      ]);
      
      setMessages((messagesRes.messages || []).reverse());
      setChatInfo(chatRes.chat || null);
      
      await collaborationService.fetchWithAuth(`/chats/${chatId}/read`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to load chat:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const result = await collaborationService.fetchWithAuth(
        `/chats/${chatId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            messageType: "text",
            content: messageContent,
          }),
        }
      );

      if (result.message) {
        setMessages((prev) => [...prev, { ...result.message, isOwn: true }]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const toggleMute = async () => {
    if (!chatId || !chatInfo) return;

    try {
      await collaborationService.fetchWithAuth(`/chats/${chatId}/mute`, {
        method: "PATCH",
        body: JSON.stringify({ muted: !chatInfo.isMuted }),
      });
      setChatInfo((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
      toast({
        title: chatInfo.isMuted ? "Unmuted" : "Muted",
        description: chatInfo.isMuted
          ? "You will receive notifications"
          : "Notifications silenced for this chat",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const otherParticipant = chatInfo?.participants?.[0];
  const chatName = chatInfo?.name || otherParticipant?.displayName || "Chat";

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b bg-background">
          <Button
            size="icon"
            variant="ghost"
            onClick={goBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <p className="font-medium">Loading...</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b bg-background">
        <Button
          size="icon"
          variant="ghost"
          onClick={goBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{chatName}</p>
          {otherParticipant?.mode && (
            <p className="text-xs text-muted-foreground">
              {otherParticipant.mode === "HOME" ? "Home User" : "Staff"}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-chat-menu">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={toggleMute}>
              {chatInfo?.isMuted ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Unmute
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Mute
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={loadChatData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                data-testid={`message-${message.id}`}
              >
                {!message.isOwn && message.senderName && (
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {message.senderName}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t bg-background p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isSending}
            data-testid="input-message"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || isSending}
            data-testid="button-send"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
