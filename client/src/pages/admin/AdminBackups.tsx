import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Database, 
  RotateCcw, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  HardDrive,
  FileJson,
  Shield,
  Calendar,
  Table
} from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface SystemBackup {
  id: number;
  name: string;
  description: string | null;
  status: string;
  schemaVersion: string;
  checksum: string | null;
  tablesIncluded: string[] | null;
  totalRecords: number | null;
  fileSizeBytes: number | null;
  createdById: string | null;
  createdAt: string;
  notes: string | null;
  backupData?: any;
}

interface BackupStats {
  total: number;
  completed: number;
  deleted: number;
  latestBackup: {
    id: number;
    name: string;
    createdAt: string;
    totalRecords: number | null;
    fileSizeBytes: number | null;
  } | null;
  totalSizeBytes: number;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
      return "secondary";
    case "failed":
    case "deleted":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-3 h-3" />;
    case "pending":
      return <Clock className="w-3 h-3" />;
    case "failed":
      return <AlertCircle className="w-3 h-3" />;
    case "deleted":
      return <Trash2 className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 B";
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export default function AdminBackups() {
  const [, setLocation] = useLocation();
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<SystemBackup | null>(null);
  const [backupDetails, setBackupDetails] = useState<SystemBackup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [backupName, setBackupName] = useState("");
  const [backupDescription, setBackupDescription] = useState("");
  const [backupNotes, setBackupNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin");
      return;
    }
    fetchBackups(token);
    fetchStats(token);
  }, [statusFilter, currentPage]);

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch("/api/admin/system-backups-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch backup stats:", error);
    }
  };

  const fetchBackups = async (token: string) => {
    try {
      setIsLoading(true);
      let url = `/api/admin/system-backups?limit=${pageSize}&offset=${(currentPage - 1) * pageSize}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403 || response.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setLocation("/admin");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = () => {
    setBackupName("");
    setBackupDescription("");
    setBackupNotes("");
    setError(null);
    setIsCreateDialogOpen(true);
  };

  const handleSaveBackup = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !backupName.trim()) {
      setError("Backup name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/system-backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: backupName.trim(),
          description: backupDescription.trim() || undefined,
          notes: backupNotes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setSuccessMessage("System backup created successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchBackups(token);
        fetchStats(token);
      } else {
        setError(data.error || "Failed to create backup");
      }
    } catch (error) {
      console.error("Create backup error:", error);
      setError("Failed to create backup");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = async (backup: SystemBackup) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setSelectedBackup(backup);
    setIsLoadingDetails(true);
    setIsDetailsDialogOpen(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/system-backups/${backup.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBackupDetails(data);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to load backup details");
      }
    } catch (error) {
      console.error("Load details error:", error);
      setError("Failed to load backup details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDownload = async (backup: SystemBackup) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/system-backups/${backup.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `homestaff360-backup-${backup.name.replace(/[^a-zA-Z0-9]/g, '-')}-${backup.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Download error:", error);
      setError("Failed to download backup");
    }
  };

  const handleRestoreClick = (backup: SystemBackup) => {
    setSelectedBackup(backup);
    setError(null);
    setIsRestoreDialogOpen(true);
  };

  const handleRestoreBackup = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedBackup) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/system-backups/${selectedBackup.id}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsRestoreDialogOpen(false);
        setSuccessMessage("System restored successfully from backup");
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchBackups(token);
        fetchStats(token);
      } else {
        setError(data.error || "Failed to restore backup");
      }
    } catch (error) {
      console.error("Restore backup error:", error);
      setError("Failed to restore backup");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (backup: SystemBackup) => {
    setSelectedBackup(backup);
    setError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBackup = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedBackup) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/system-backups/${selectedBackup.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSuccessMessage("Backup deleted successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchBackups(token);
        fetchStats(token);
      } else {
        setError(data.error || "Failed to delete backup");
      }
    } catch (error) {
      console.error("Delete backup error:", error);
      setError("Failed to delete backup");
    } finally {
      setIsSaving(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && backups.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={handleCreateBackup} data-testid="button-create-backup">
            <Plus className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>

        {successMessage && (
          <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-sm text-muted-foreground">Active Backups</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <HardDrive className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatBytes(stats.totalSizeBytes)}</p>
                    <p className="text-sm text-muted-foreground">Total Size</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Table className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.latestBackup?.totalRecords?.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">Records (Latest)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {stats.latestBackup 
                        ? format(new Date(stats.latestBackup.createdAt), "MMM d, yyyy")
                        : "No backups"
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Backups
              </CardTitle>
              <CardDescription>
                Full database snapshots including all users, admins, and configuration
              </CardDescription>
            </div>
            <Badge variant="secondary">{total} backups</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Status:</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-36" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Backups</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Records</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Size</th>
                    <th className="text-left py-2 px-2 hidden lg:table-cell">Created</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b" data-testid={`row-backup-${backup.id}`}>
                      <td className="py-2 px-2">
                        <div className="font-medium">{backup.name}</div>
                        {backup.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {backup.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <Badge
                          variant={getStatusBadgeVariant(backup.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(backup.status)}
                          {backup.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell text-muted-foreground">
                        {backup.totalRecords?.toLocaleString() || "-"}
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell text-muted-foreground">
                        {formatBytes(backup.fileSizeBytes)}
                      </td>
                      <td className="py-2 px-2 hidden lg:table-cell text-muted-foreground">
                        {format(new Date(backup.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(backup)}
                            data-testid={`button-view-backup-${backup.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {backup.status === "completed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownload(backup)}
                                data-testid={`button-download-backup-${backup.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestoreClick(backup)}
                                data-testid={`button-restore-backup-${backup.id}`}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {backup.status !== "deleted" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(backup)}
                              data-testid={`button-delete-backup-${backup.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {backups.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No system backups found. Create your first backup to protect your data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Create System Backup
            </DialogTitle>
            <DialogDescription>
              Create a complete snapshot of all database tables including users, admins, and configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="backupName">Backup Name *</Label>
              <Input
                id="backupName"
                value={backupName}
                onChange={(e) => setBackupName(e.target.value)}
                placeholder="e.g., Pre-maintenance backup"
                data-testid="input-backup-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupDescription">Description</Label>
              <Input
                id="backupDescription"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                placeholder="Optional description"
                data-testid="input-backup-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupNotes">Notes</Label>
              <Textarea
                id="backupNotes"
                value={backupNotes}
                onChange={(e) => setBackupNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                data-testid="input-backup-notes"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="font-medium mb-1">This backup will include:</p>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li>All registered users and their profiles</li>
                <li>Admin accounts and roles</li>
                <li>Collaboration data and messages</li>
                <li>Advertisements and impressions</li>
                <li>Maintenance windows and broadcasts</li>
                <li>All other system configuration</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBackup}
              disabled={isSaving || !backupName.trim()}
              data-testid="button-confirm-create"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create Backup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              Backup Details
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : backupDetails ? (
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <p className="font-medium">{backupDetails.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge variant={getStatusBadgeVariant(backupDetails.status)}>
                      {backupDetails.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Schema Version</Label>
                    <p>{backupDetails.schemaVersion}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Total Records</Label>
                    <p>{backupDetails.totalRecords?.toLocaleString() || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">File Size</Label>
                    <p>{formatBytes(backupDetails.fileSizeBytes)}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p>{format(new Date(backupDetails.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
                  </div>
                </div>

                {backupDetails.description && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{backupDetails.description}</p>
                  </div>
                )}

                {backupDetails.notes && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <p className="text-sm whitespace-pre-wrap">{backupDetails.notes}</p>
                  </div>
                )}

                {backupDetails.checksum && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Checksum</Label>
                    <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                      {backupDetails.checksum}
                    </code>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tables Included</Label>
                  <div className="flex flex-wrap gap-1">
                    {backupDetails.tablesIncluded?.map((table) => (
                      <Badge key={table} variant="secondary" className="text-xs">
                        {table}
                      </Badge>
                    ))}
                  </div>
                </div>

                {backupDetails.backupData?.tables && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Record Counts by Table</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(backupDetails.backupData.tables).map(([table, data]: [string, any]) => (
                          <div key={table} className="flex justify-between p-2 bg-muted/30 rounded">
                            <span className="text-muted-foreground">{table}</span>
                            <span className="font-medium">{Array.isArray(data) ? data.length : 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Failed to load details</p>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {backupDetails?.status === "completed" && (
              <Button onClick={() => handleDownload(backupDetails)}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" />
              Restore System Backup
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will replace ALL current database data with the backup from{" "}
                <strong>{selectedBackup && format(new Date(selectedBackup.createdAt), "MMMM d, yyyy 'at' HH:mm")}</strong>.
              </p>
              <p className="text-destructive font-medium">
                Warning: This action cannot be undone. All current data will be permanently lost.
              </p>
              <p>
                Make sure you have created a backup of the current state before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRestoreBackup();
              }}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore Backup
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the backup "{selectedBackup?.name}"? 
              The backup data will be removed and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteBackup();
              }}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Backup"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
