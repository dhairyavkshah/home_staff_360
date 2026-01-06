import { useState, useEffect } from "react";
import { Bell, CheckCheck, Clock, ChevronRight, Calendar, Shirt, Link2, AlertCircle, CheckCircle, XCircle, ArrowLeft, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigation } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { collaborationService, AppNotification } from "@/lib/collaboration-service";
import { storage } from "@/lib/storage";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function NotificationCenterScreen() {
  const { navigate, goBack } = useNavigation();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const profile = storage.getProfile();
  const currentMode = profile?.type || "HOME";

  useEffect(() => {
    loadNotifications();
  }, [currentMode]);

  async function loadNotifications() {
    if (!collaborationService.isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await collaborationService.getNotifications(currentMode as "HOME" | "STAFF");
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await collaborationService.markAllNotificationsRead(currentMode as "HOME" | "STAFF");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({
        title: "All notifications marked as read",
      });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      toast({
        title: "Failed to mark as read",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteNotification(e: React.MouseEvent, notificationId: string) {
    e.stopPropagation();
    try {
      await collaborationService.deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast({
        title: "Notification dismissed",
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast({
        title: "Failed to dismiss notification",
        variant: "destructive",
      });
    }
  }

  async function handleClearAll() {
    if (notifications.length === 0) return;
    
    setIsClearing(true);
    try {
      await collaborationService.clearAllNotifications(currentMode as "HOME" | "STAFF");
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "All notifications cleared",
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      toast({
        title: "Failed to clear notifications",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (!notification.isRead) {
      try {
        await collaborationService.markNotificationRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    // Navigate to approval detail for attendance/laundry notifications
    if (notification.entityType === "attendance" && notification.entityId) {
      navigate("approval-detail", { 
        entityType: "attendance", 
        entityId: notification.entityId,
        notificationType: notification.type
      });
    } else if (notification.entityType === "laundry" && notification.entityId) {
      navigate("approval-detail", {
        entityType: "laundry",
        entityId: notification.entityId,
        notificationType: notification.type
      });
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "attendance_submitted":
      case "attendance_approved":
      case "attendance_rejected":
        return <Calendar className="w-5 h-5" />;
      case "laundry_submitted":
      case "laundry_approved":
      case "laundry_rejected":
        return <Shirt className="w-5 h-5" />;
      case "connection_request":
      case "connection_accepted":
      case "connection_rejected":
      case "binding_created":
        return <Link2 className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  }

  function getNotificationColor(type: string) {
    if (type.includes("approved") || type.includes("accepted")) {
      return "text-green-600 bg-green-100 dark:bg-green-900/30";
    }
    if (type.includes("rejected")) {
      return "text-red-600 bg-red-100 dark:bg-red-900/30";
    }
    if (type.includes("submitted") || type.includes("request")) {
      return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    }
    return "text-primary bg-primary/10";
  }

  function getStatusBadge(type: string) {
    if (type.includes("approved") || type.includes("accepted")) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
    }
    if (type.includes("rejected")) {
      return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
    }
    if (type.includes("submitted") || type.includes("request")) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
    }
    return null;
  }

  if (!collaborationService.isAuthenticated()) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notifications</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-6 text-center max-w-sm">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Sign in Required</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Verify your phone number to receive notifications from connected accounts.
            </p>
            <Button onClick={() => navigate("phone-verification")}>
              Verify Phone
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="safe-area-top" />
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarkAllRead}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearAll}
              disabled={isClearing}
              className="text-destructive"
              data-testid="button-clear-all"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={loadNotifications}>
              Try Again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <Bell className="w-16 h-16 mb-4 text-muted-foreground/50" />
            <h2 className="text-lg font-medium mb-2">No notifications</h2>
            <p className="text-sm text-muted-foreground text-center">
              You'll see notifications here when connected accounts send attendance or laundry records for approval.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`w-full px-4 py-4 text-left hover-elevate flex items-start gap-4 group ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <button
                  className="flex items-start gap-4 flex-1 min-w-0"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </span>
                      {getStatusBadge(notification.type)}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {notification.actionRequired && (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    data-testid={`button-dismiss-${notification.id}`}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="safe-area-bottom" />
    </div>
  );
}
