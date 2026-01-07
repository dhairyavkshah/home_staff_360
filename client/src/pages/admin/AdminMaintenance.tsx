import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Play,
  Square,
  Send,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Users,
  Radio,
  History
} from "lucide-react";
import { format } from "date-fns";

interface MaintenanceWindow {
  id: number;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  startAt: string;
  endAt: string | null;
  durationMinutes: number;
  recurrence: "none" | "weekly" | "monthly";
  weekday: number | null;
  dayOfMonth: number | null;
  forceLogout: boolean;
  showMaintenancePage: boolean;
  status: "draft" | "scheduled" | "active" | "completed" | "cancelled";
  createdAt: string;
}

interface MaintenanceBroadcast {
  id: number;
  windowId: number | null;
  broadcastType: "scheduled" | "adhoc";
  title: string;
  message: string;
  severity: string;
  sentAt: string;
  forceLogout: boolean;
  targetUserCount: number | null;
  deliveredCount: number | null;
}

interface ActiveSession {
  id: number;
  windowId: number | null;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
  forceLogoutEnabled: boolean;
  maintenancePageEnabled: boolean;
  endTime: string | null;
  message: string | null;
}

interface WindowFormData {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  startAt: string;
  endAt: string;
  durationMinutes: number;
  recurrence: "none" | "weekly" | "monthly";
  weekday: number;
  dayOfMonth: number;
  forceLogout: boolean;
  showMaintenancePage: boolean;
  status: "draft" | "scheduled";
}

interface BroadcastFormData {
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  forceLogout: boolean;
  durationMinutes: number;
}

const defaultWindowFormData: WindowFormData = {
  title: "",
  message: "",
  severity: "info",
  startAt: "",
  endAt: "",
  durationMinutes: 60,
  recurrence: "none",
  weekday: 0,
  dayOfMonth: 1,
  forceLogout: false,
  showMaintenancePage: true,
  status: "draft",
};

const defaultBroadcastFormData: BroadcastFormData = {
  title: "",
  message: "",
  severity: "info",
  forceLogout: false,
  durationMinutes: 30,
};

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminMaintenance() {
  const [, setLocation] = useLocation();
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [broadcasts, setBroadcasts] = useState<MaintenanceBroadcast[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("windows");
  
  const [isWindowDialogOpen, setIsWindowDialogOpen] = useState(false);
  const [isBroadcastDialogOpen, setIsBroadcastDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  
  const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);
  const [windowFormData, setWindowFormData] = useState<WindowFormData>(defaultWindowFormData);
  const [broadcastFormData, setBroadcastFormData] = useState<BroadcastFormData>(defaultBroadcastFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin");
      return;
    }
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const [windowsRes, broadcastsRes, sessionsRes] = await Promise.all([
        fetch("/api/admin/maintenance/windows", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/maintenance/broadcasts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/maintenance/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (windowsRes.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setLocation("/admin");
        return;
      }

      if (windowsRes.ok) {
        const data = await windowsRes.json();
        setWindows(data.windows || []);
      }

      if (broadcastsRes.ok) {
        const data = await broadcastsRes.json();
        setBroadcasts(data.broadcasts || []);
      }

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setActiveSession(data.activeSession || null);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWindow = () => {
    setSelectedWindow(null);
    setWindowFormData(defaultWindowFormData);
    setIsWindowDialogOpen(true);
  };

  const handleEditWindow = (window: MaintenanceWindow) => {
    setSelectedWindow(window);
    setWindowFormData({
      title: window.title,
      message: window.message,
      severity: window.severity,
      startAt: window.startAt ? format(new Date(window.startAt), "yyyy-MM-dd'T'HH:mm") : "",
      endAt: window.endAt ? format(new Date(window.endAt), "yyyy-MM-dd'T'HH:mm") : "",
      durationMinutes: window.durationMinutes,
      recurrence: window.recurrence,
      weekday: window.weekday ?? 0,
      dayOfMonth: window.dayOfMonth ?? 1,
      forceLogout: window.forceLogout,
      showMaintenancePage: window.showMaintenancePage,
      status: window.status === "draft" || window.status === "scheduled" ? window.status : "draft",
    });
    setIsWindowDialogOpen(true);
  };

  const handleSaveWindow = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsSaving(true);
    try {
      const url = selectedWindow
        ? `/api/admin/maintenance/windows/${selectedWindow.id}`
        : "/api/admin/maintenance/windows";
      const method = selectedWindow ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...windowFormData,
          startAt: windowFormData.startAt ? new Date(windowFormData.startAt).toISOString() : new Date().toISOString(),
          endAt: windowFormData.endAt ? new Date(windowFormData.endAt).toISOString() : null,
          weekday: windowFormData.recurrence === "weekly" ? windowFormData.weekday : null,
          dayOfMonth: windowFormData.recurrence === "monthly" ? windowFormData.dayOfMonth : null,
        }),
      });

      if (response.ok) {
        setIsWindowDialogOpen(false);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to save window:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWindow = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedWindow) return;

    try {
      const response = await fetch(`/api/admin/maintenance/windows/${selectedWindow.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedWindow(null);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to delete window:", error);
    }
  };

  const handleActivateWindow = async (window: MaintenanceWindow) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/maintenance/windows/${window.id}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to activate window:", error);
    }
  };

  const handleDeactivateWindow = async (window: MaintenanceWindow) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/maintenance/windows/${window.id}/deactivate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to deactivate window:", error);
    }
  };

  const handleDeactivateAll = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch("/api/admin/maintenance/deactivate-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setIsDeactivateDialogOpen(false);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to deactivate all:", error);
    }
  };

  const handleSendBroadcast = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/maintenance/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(broadcastFormData),
      });

      if (response.ok) {
        setIsBroadcastDialogOpen(false);
        setBroadcastFormData(defaultBroadcastFormData);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to send broadcast:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "active":
        return "default";
      case "scheduled":
        return "secondary";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Maintenance Management</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {activeSession && (
          <Card className="border-destructive">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-destructive animate-pulse" />
                  <CardTitle className="text-destructive">Maintenance Active</CardTitle>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeactivateDialogOpen(true)}
                  data-testid="button-deactivate-all"
                >
                  <Square className="h-4 w-4 mr-2" />
                  End Maintenance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{activeSession.message || "Maintenance in progress"}</p>
              {activeSession.endTime && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ends: {format(new Date(activeSession.endTime), "PPp")}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {activeSession.forceLogoutEnabled && (
                  <Badge variant="destructive">Force Logout</Badge>
                )}
                {activeSession.maintenancePageEnabled && (
                  <Badge variant="secondary">Maintenance Page</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="windows" data-testid="tab-windows">
              <Calendar className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="broadcasts" data-testid="tab-broadcasts">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="windows" className="space-y-4 mt-4">
            <div className="flex justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-medium">Maintenance Windows</h2>
                <p className="text-sm text-muted-foreground">Schedule maintenance periods and notifications</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBroadcastFormData(defaultBroadcastFormData);
                    setIsBroadcastDialogOpen(true);
                  }}
                  data-testid="button-adhoc-broadcast"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Ad-hoc Broadcast
                </Button>
                <Button onClick={handleCreateWindow} data-testid="button-create-window">
                  <Plus className="h-4 w-4 mr-2" />
                  New Window
                </Button>
              </div>
            </div>

            {windows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Maintenance Windows</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a maintenance window to schedule downtime notifications
                  </p>
                  <Button onClick={handleCreateWindow} data-testid="button-create-window-empty">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Window
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {windows.map((window) => (
                  <Card key={window.id} data-testid={`card-window-${window.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{window.title}</h3>
                            <Badge variant={getSeverityBadgeVariant(window.severity)}>
                              {getSeverityIcon(window.severity)}
                              <span className="ml-1">{window.severity}</span>
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(window.status)}>
                              {window.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {window.message}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Starts: {format(new Date(window.startAt), "PPp")}</span>
                            <span>Duration: {window.durationMinutes} min</span>
                            {window.recurrence !== "none" && (
                              <span>
                                Recurs: {window.recurrence}
                                {window.recurrence === "weekly" && window.weekday !== null && 
                                  ` (${weekdays[window.weekday]})`}
                                {window.recurrence === "monthly" && window.dayOfMonth !== null && 
                                  ` (Day ${window.dayOfMonth})`}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {window.forceLogout && (
                              <Badge variant="outline" className="text-xs">Force Logout</Badge>
                            )}
                            {window.showMaintenancePage && (
                              <Badge variant="outline" className="text-xs">Maintenance Page</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {window.status === "active" ? (
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeactivateWindow(window)}
                              data-testid={`button-deactivate-${window.id}`}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="icon"
                              onClick={() => handleActivateWindow(window)}
                              data-testid={`button-activate-${window.id}`}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditWindow(window)}
                            data-testid={`button-edit-${window.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedWindow(window);
                              setIsDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${window.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="broadcasts" className="space-y-4 mt-4">
            <div>
              <h2 className="text-lg font-medium">Broadcast History</h2>
              <p className="text-sm text-muted-foreground">Past maintenance notifications sent to users</p>
            </div>

            {broadcasts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">No Broadcasts Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Broadcast history will appear here after you send notifications
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((broadcast) => (
                  <Card key={broadcast.id} data-testid={`card-broadcast-${broadcast.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium truncate">{broadcast.title}</h3>
                            <Badge variant={getSeverityBadgeVariant(broadcast.severity)}>
                              {getSeverityIcon(broadcast.severity)}
                              <span className="ml-1">{broadcast.severity}</span>
                            </Badge>
                            <Badge variant="outline">
                              {broadcast.broadcastType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {broadcast.message}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Sent: {format(new Date(broadcast.sentAt), "PPp")}</span>
                            {broadcast.targetUserCount && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {broadcast.targetUserCount} users
                              </span>
                            )}
                          </div>
                          {broadcast.forceLogout && (
                            <Badge variant="destructive" className="mt-2 text-xs">Force Logout</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isWindowDialogOpen} onOpenChange={setIsWindowDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWindow ? "Edit Maintenance Window" : "New Maintenance Window"}
            </DialogTitle>
            <DialogDescription>
              Schedule a maintenance period and configure notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={windowFormData.title}
                onChange={(e) => setWindowFormData({ ...windowFormData, title: e.target.value })}
                placeholder="Scheduled Maintenance"
                data-testid="input-window-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={windowFormData.message}
                onChange={(e) => setWindowFormData({ ...windowFormData, message: e.target.value })}
                placeholder="We're performing scheduled maintenance. The app will be briefly unavailable."
                rows={3}
                data-testid="input-window-message"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={windowFormData.severity}
                  onValueChange={(v: "info" | "warning" | "critical") => 
                    setWindowFormData({ ...windowFormData, severity: v })}
                >
                  <SelectTrigger data-testid="select-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={windowFormData.durationMinutes}
                  onChange={(e) => setWindowFormData({ ...windowFormData, durationMinutes: parseInt(e.target.value) || 60 })}
                  data-testid="input-duration"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startAt">Start Time</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={windowFormData.startAt}
                onChange={(e) => setWindowFormData({ ...windowFormData, startAt: e.target.value })}
                data-testid="input-start-at"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End Time (optional)</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={windowFormData.endAt}
                onChange={(e) => setWindowFormData({ ...windowFormData, endAt: e.target.value })}
                data-testid="input-end-at"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select
                value={windowFormData.recurrence}
                onValueChange={(v: "none" | "weekly" | "monthly") => 
                  setWindowFormData({ ...windowFormData, recurrence: v })}
              >
                <SelectTrigger data-testid="select-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {windowFormData.recurrence === "weekly" && (
              <div className="space-y-2">
                <Label htmlFor="weekday">Day of Week</Label>
                <Select
                  value={String(windowFormData.weekday)}
                  onValueChange={(v) => setWindowFormData({ ...windowFormData, weekday: parseInt(v) })}
                >
                  <SelectTrigger data-testid="select-weekday">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdays.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {windowFormData.recurrence === "monthly" && (
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={windowFormData.dayOfMonth}
                  onChange={(e) => setWindowFormData({ ...windowFormData, dayOfMonth: parseInt(e.target.value) || 1 })}
                  data-testid="input-day-of-month"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="forceLogout">Force User Logout</Label>
                <p className="text-xs text-muted-foreground">
                  Sign out all users when maintenance starts
                </p>
              </div>
              <Switch
                id="forceLogout"
                checked={windowFormData.forceLogout}
                onCheckedChange={(checked) => setWindowFormData({ ...windowFormData, forceLogout: checked })}
                data-testid="switch-force-logout"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showMaintenancePage">Show Maintenance Page</Label>
                <p className="text-xs text-muted-foreground">
                  Display a maintenance screen to users
                </p>
              </div>
              <Switch
                id="showMaintenancePage"
                checked={windowFormData.showMaintenancePage}
                onCheckedChange={(checked) => setWindowFormData({ ...windowFormData, showMaintenancePage: checked })}
                data-testid="switch-maintenance-page"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={windowFormData.status}
                onValueChange={(v: "draft" | "scheduled") => 
                  setWindowFormData({ ...windowFormData, status: v })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWindowDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWindow} disabled={isSaving || !windowFormData.title || !windowFormData.message} data-testid="button-save-window">
              {isSaving ? "Saving..." : selectedWindow ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBroadcastDialogOpen} onOpenChange={setIsBroadcastDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Ad-hoc Broadcast</DialogTitle>
            <DialogDescription>
              Send an immediate notification to all users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-title">Title</Label>
              <Input
                id="broadcast-title"
                value={broadcastFormData.title}
                onChange={(e) => setBroadcastFormData({ ...broadcastFormData, title: e.target.value })}
                placeholder="Important Announcement"
                data-testid="input-broadcast-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-message">Message</Label>
              <Textarea
                id="broadcast-message"
                value={broadcastFormData.message}
                onChange={(e) => setBroadcastFormData({ ...broadcastFormData, message: e.target.value })}
                placeholder="Describe the situation or maintenance being performed..."
                rows={3}
                data-testid="input-broadcast-message"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="broadcast-severity">Severity</Label>
              <Select
                value={broadcastFormData.severity}
                onValueChange={(v: "info" | "warning" | "critical") => 
                  setBroadcastFormData({ ...broadcastFormData, severity: v })}
              >
                <SelectTrigger data-testid="select-broadcast-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="broadcast-forceLogout">Force User Logout</Label>
                <p className="text-xs text-muted-foreground">
                  Sign out all users immediately
                </p>
              </div>
              <Switch
                id="broadcast-forceLogout"
                checked={broadcastFormData.forceLogout}
                onCheckedChange={(checked) => setBroadcastFormData({ ...broadcastFormData, forceLogout: checked })}
                data-testid="switch-broadcast-force-logout"
              />
            </div>
            {broadcastFormData.forceLogout && (
              <div className="space-y-2">
                <Label htmlFor="broadcast-duration">Maintenance Duration (minutes)</Label>
                <Input
                  id="broadcast-duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={broadcastFormData.durationMinutes}
                  onChange={(e) => setBroadcastFormData({ ...broadcastFormData, durationMinutes: parseInt(e.target.value) || 30 })}
                  data-testid="input-broadcast-duration"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBroadcastDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendBroadcast} 
              disabled={isSaving || !broadcastFormData.title || !broadcastFormData.message}
              data-testid="button-send-broadcast"
            >
              {isSaving ? "Sending..." : "Send Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Window?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this maintenance window and all associated broadcasts.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWindow} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Maintenance Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the current maintenance session and allow users to access the app normally.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateAll} data-testid="button-confirm-deactivate">
              End Maintenance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
