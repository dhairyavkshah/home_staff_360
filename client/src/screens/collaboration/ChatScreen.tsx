import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  RefreshCw,
  MoreVertical,
  Bell,
  BellOff,
  Paperclip,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
  Download,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderAvatarData?: string;
  messageType: string;
  content: string;
  isOwn: boolean;
  createdAt: string;
  editableUntil?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  editedAt?: string;
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
    avatarData?: string;
  }>;
}

export function ChatScreen() {
  const { goBack } = useNavigation();
  const { chatId } = useNavigationData<{ chatId?: string }>();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // Edit mode state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Mobile action state - selected message shows actions
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  // Timer for editable messages
  const [, setTick] = useState(0);
  
  // Clear chat confirmation state
  const [isClearChatDialogOpen, setIsClearChatDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useRealtimeConnection();
  useRealtimeChat(chatId || null);

  // Force re-render every 10 seconds to update edit timer
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNewMessage = useCallback((message: any) => {
    console.log("[ChatScreen] Received chat:new-message:", message);
    const messageChatId = String(message.chatId);
    if (messageChatId !== chatId) return;
    
    setMessages((prev) => {
      const messageId = String(message.id);
      if (prev.some((m) => m.id === messageId)) return prev;
      return [...prev, { ...message, id: messageId, chatId: messageChatId, isOwn: false }];
    });
  }, [chatId]);

  const handleMessageReceived = useCallback((data: any) => {
    console.log("[ChatScreen] Received chat:message-received:", data);
    const message = data.message;
    if (!message) return;
    const messageChatId = String(data.chatId || message.chatId);
    if (messageChatId !== chatId) return;
    
    setMessages((prev) => {
      const messageId = String(message.id);
      if (prev.some((m) => m.id === messageId)) return prev;
      return [...prev, { ...message, id: messageId, chatId: messageChatId, isOwn: false }];
    });
  }, [chatId]);

  const handleMessageUpdated = useCallback((data: any) => {
    console.log("[ChatScreen] Received chat:message-updated:", data);
    const { messageId, content, editedAt } = data;
    const messageChatId = String(data.chatId);
    if (!messageId) return;
    // Only update if this is the current chat
    if (messageChatId !== chatId) return;
    
    setMessages((prev) => prev.map((m) => 
      m.id === messageId ? { ...m, content, isEdited: true, editedAt } : m
    ));
  }, [chatId]);

  const handleMessageDeleted = useCallback((data: any) => {
    console.log("[ChatScreen] Received chat:message-deleted:", data);
    const { messageId } = data;
    const messageChatId = String(data.chatId);
    if (!messageId) return;
    // Only update if this is the current chat
    if (messageChatId !== chatId) return;
    
    setMessages((prev) => prev.map((m) => 
      m.id === messageId ? { ...m, isDeleted: true, content: "[This message was deleted]" } : m
    ));
  }, [chatId]);

  const handleChatCleared = useCallback((data: any) => {
    console.log("[ChatScreen] Received chat:cleared:", data);
    const clearedChatId = String(data.chatId);
    if (clearedChatId !== chatId) return;
    
    // Clear all messages when chat is cleared
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "The chat history has been cleared",
    });
  }, [chatId, toast]);

  useRealtime("chat:new-message", handleNewMessage);
  useRealtime("chat:message-received", handleMessageReceived);
  useRealtime("chat:message-updated", handleMessageUpdated);
  useRealtime("chat:message-deleted", handleMessageDeleted);
  useRealtime("chat:cleared", handleChatCleared);

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
      
      const sortedMessages = (messagesRes.messages || []).sort((a: Message, b: Message) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
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

  const handleEditMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setIsEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      await collaborationService.fetchWithAuth(
        `/chats/${chatId}/messages/${editingMessageId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );

      setMessages((prev) => prev.map((m) => 
        m.id === editingMessageId 
          ? { ...m, content: editContent.trim(), isEdited: true, editedAt: new Date().toISOString() } 
          : m
      ));

      toast({ title: "Message edited", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to edit message",
        variant: "destructive",
      });
    } finally {
      setIsEditDialogOpen(false);
      setEditingMessageId(null);
      setEditContent("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await collaborationService.fetchWithAuth(
        `/chats/${chatId}/messages/${messageId}`,
        {
          method: "DELETE",
        }
      );

      setMessages((prev) => prev.map((m) => 
        m.id === messageId ? { ...m, isDeleted: true, content: "[This message was deleted]" } : m
      ));

      toast({ title: "Message deleted", variant: "success" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 'image/heif', 'image/heic',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Allowed types: JPG, PNG, PDF, DOC, DOCX, PPT, PPTX, HEIF",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('collab_token');
      const response = await fetch(`/api/chats/${chatId}/attachments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.message) {
        setMessages((prev) => [...prev, { ...result.message, isOwn: true }]);
      }

      toast({ title: "File sent", variant: "success" });
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Error",
        description: "Failed to send file",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const exportChatHistory = () => {
    if (messages.length === 0) {
      toast({
        title: "No messages",
        description: "There are no messages to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const chatExport = messages
        .filter((m) => !m.isDeleted)
        .map((m) => {
          const date = new Date(m.createdAt);
          const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString();
          const sender = m.isOwn ? "You" : (m.senderName || "Other");
          return `[${formattedDate}] ${sender}: ${m.content}`;
        })
        .join("\n");

      const header = `Chat History with ${chatName}\nExported on: ${new Date().toLocaleDateString()}\n${"=".repeat(50)}\n\n`;
      const content = header + chatExport;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-${chatName.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Chat exported",
        description: "Chat history has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export chat history",
        variant: "destructive",
      });
    }
  };

  const clearChatHistory = async () => {
    if (!chatId) return;
    
    setIsClearing(true);
    try {
      await collaborationService.fetchWithAuth(`/chats/${chatId}/clear`, {
        method: "DELETE",
      });
      setMessages([]);
      toast({
        title: "Chat cleared",
        description: "All messages have been removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat history",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
      setIsClearChatDialogOpen(false);
    }
  };

  const isEditable = (message: Message): boolean => {
    if (!message.isOwn || message.isDeleted) return false;
    if (!message.editableUntil) return false;
    return new Date(message.editableUntil) > new Date();
  };

  const getRemainingEditTime = (message: Message): string | null => {
    if (!message.editableUntil) return null;
    const remaining = new Date(message.editableUntil).getTime() - Date.now();
    if (remaining <= 0) return null;
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes}m left to edit`;
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
        <div className="safe-area-top" />
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
        <div className="safe-area-bottom" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="safe-area-top" />
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
            <DropdownMenuItem onClick={exportChatHistory} data-testid="button-export-chat">
              <Download className="w-4 h-4 mr-2" />
              Export Chat
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setIsClearChatDialogOpen(true)}
              className="text-destructive"
              data-testid="button-clear-chat"
            >
              <Trash className="w-4 h-4 mr-2" />
              Clear Chat
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
          messages.map((message) => {
            const showActions = isEditable(message) && (selectedMessageId === message.id);
            return (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${message.isOwn ? "flex-row-reverse" : ""}`}>
                  {!message.isOwn && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      {message.senderAvatarData ? (
                        <img src={message.senderAvatarData} alt={message.senderName || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <AvatarFallback>{message.senderName?.charAt(0) || 'U'}</AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <div className="relative group">
                    <div
                      className={`rounded-2xl px-4 py-2 cursor-pointer ${
                        message.isDeleted
                          ? "bg-muted/50 italic"
                          : message.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      data-testid={`message-${message.id}`}
                      onClick={() => {
                        if (isEditable(message)) {
                          setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
                        }
                      }}
                    >
                      {!message.isOwn && message.senderName && !message.isDeleted && (
                        <p className="text-xs font-medium mb-1 opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className={`flex items-center gap-2 mt-1 ${
                        message.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        <span className="text-xs">{formatTime(message.createdAt)}</span>
                        {message.isEdited && !message.isDeleted && (
                          <span className="text-xs italic">edited</span>
                        )}
                      </div>
                    </div>
                  
                  {/* Edit/Delete buttons - visible on hover (desktop) or tap (mobile) */}
                  {isEditable(message) && (
                    <div 
                      className={`absolute -top-8 right-0 flex items-center gap-1 bg-background border rounded-md shadow-sm p-1 transition-opacity ${
                        showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{ visibility: showActions ? 'visible' : undefined }}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMessage(message);
                          setSelectedMessageId(null);
                        }}
                        data-testid={`button-edit-${message.id}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                          setSelectedMessageId(null);
                        }}
                        data-testid={`button-delete-${message.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                        {getRemainingEditTime(message) && (
                          <span className="text-xs text-muted-foreground px-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRemainingEditTime(message)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".jpg,.jpeg,.png,.heif,.heic,.pdf,.doc,.docx,.ppt,.pptx"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleAttachmentClick}
            disabled={isSending}
            data-testid="button-attach"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
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

      {/* Edit Message Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Edit your message..."
            className="min-h-[100px]"
            data-testid="input-edit-message"
          />
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={!editContent.trim()}
              data-testid="button-save-edit"
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Chat Confirmation Dialog */}
      <AlertDialog open={isClearChatDialogOpen} onOpenChange={setIsClearChatDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all messages in this chat? This action cannot be undone and will remove all messages for both you and the other person.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing} data-testid="button-cancel-clear">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={clearChatHistory}
              disabled={isClearing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-clear"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                "Clear Chat"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="safe-area-bottom" />
    </div>
  );
}
