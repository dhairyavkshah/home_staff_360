import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowLeft, 
  Plus, 
  Archive, 
  RotateCcw, 
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Shield,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface BackupUser {
  id: string;
  phone: string;
  displayName: string | null;
  userType: string | null;
  isVerified: boolean;
  isActive: boolean;
}

interface BackupAdmin {
  id: string;
  name: string;
  email: string;
}

interface BackupLog {
  id: number;
  backupId: number;
  action: string;
  details: any;
  createdAt: string;
  admin: BackupAdmin | null;
}

interface Backup {
  id: number;
  userId: string | null;
  phoneNumber: string;
  backupType: string;
  status: string;
  backupData: any;
  checksum: string | null;
  createdAt: string;
  restoredAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  user: BackupUser | null;
  createdBy: BackupAdmin | null;
  restoredBy: BackupAdmin | null;
  logs?: BackupLog[];
  checksumValid?: boolean;
}

interface SearchUser {
  id: string;
  phone: string;
  displayName: string | null;
  userType: string | null;
  isVerified: boolean;
  isActive: boolean;
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
    case "restored":
      return "outline";
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
    case "restored":
      return <RotateCcw className="w-3 h-3" />;
    case "deleted":
      return <Trash2 className="w-3 h-3" />;
    default:
      return <Clock className="w-3 h-3" />;
  }
}

function getTypeBadgeVariant(type: string): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "manual":
      return "default";
    case "automatic":
      return "secondary";
    case "pre_delete":
      return "destructive";
    default:
      return "outline";
  }
}

export default function AdminBackups() {
  const [, setLocation] = useLocation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backupDetails, setBackupDetails] = useState<Backup | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [backupNotes, setBackupNotes] = useState("");
  const [deleteNotes, setDeleteNotes] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin");
      return;
    }
    fetchBackups(token);
  }, [statusFilter, typeFilter, phoneFilter, currentPage]);

  const fetchBackups = async (token: string) => {
    try {
      setIsLoading(true);
      let url = `/api/admin/backups?limit=${pageSize}&offset=${(currentPage - 1) * pageSize}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (typeFilter !== "all") {
        url += `&type=${typeFilter}`;
      }
      if (phoneFilter.trim()) {
        url += `&phone=${encodeURIComponent(phoneFilter.trim())}`;
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

  const handleSearchUsers = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || searchPhone.length < 3) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/search?phone=${encodeURIComponent(searchPhone)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        const data = await response.json();
        setError(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateBackup = () => {
    setSearchPhone("");
    setSearchResults([]);
    setSelectedUser(null);
    setBackupNotes("");
    setError(null);
    setIsCreateDialogOpen(true);
  };

  const handleSaveBackup = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedUser) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          notes: backupNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreateDialogOpen(false);
        fetchBackups(token);
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

  const handleViewDetails = async (backup: Backup) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setSelectedBackup(backup);
    setIsLoadingDetails(true);
    setIsDetailsDialogOpen(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/backups/${backup.id}`, {
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

  const handleRestoreClick = (backup: Backup) => {
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
      const response = await fetch(`/api/admin/backups/${selectedBackup.id}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setIsRestoreDialogOpen(false);
        fetchBackups(token);
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

  const handleDeleteClick = (backup: Backup) => {
    setSelectedBackup(backup);
    setDeleteNotes("");
    setError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBackup = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedBackup) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/backups/${selectedBackup.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: deleteNotes || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        fetchBackups(token);
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

  const handlePhoneFilterSearch = () => {
    setCurrentPage(1);
    const token = localStorage.getItem("adminToken");
    if (token) {
      fetchBackups(token);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && backups.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/admin/dashboard")}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Backup Management</h1>
            <p className="text-sm text-muted-foreground">Manage user data backups</p>
          </div>
          <Button onClick={handleCreateBackup} data-testid="button-create-backup">
            <Plus className="w-4 h-4 mr-2" />
            Create Backup
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              User Backups
            </CardTitle>
            <Badge variant="secondary">{total} backups</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Status:</Label>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="restored">Restored</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Type:</Label>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-32" data-testid="select-type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                    <SelectItem value="pre_delete">Pre-Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Phone:</Label>
                <div className="flex gap-1">
                  <Input
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    placeholder="Search phone..."
                    className="w-40"
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneFilterSearch()}
                    data-testid="input-phone-filter"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePhoneFilterSearch}
                    data-testid="button-search-phone"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">User</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Created</th>
                    <th className="text-left py-2 px-2 hidden lg:table-cell">Created By</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id} className="border-b" data-testid={`row-backup-${backup.id}`}>
                      <td className="py-2 px-2">
                        <div className="font-medium">{backup.phoneNumber}</div>
                        {backup.user?.displayName && (
                          <div className="text-xs text-muted-foreground">
                            {backup.user.displayName}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant={getTypeBadgeVariant(backup.backupType)}>
                          {backup.backupType.replace(/_/g, " ")}
                        </Badge>
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
                        {format(new Date(backup.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="py-2 px-2 hidden lg:table-cell text-muted-foreground">
                        {backup.createdBy?.name || "System"}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRestoreClick(backup)}
                              data-testid={`button-restore-backup-${backup.id}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
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
                        No backups found
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
      </main>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Manual Backup</DialogTitle>
            <DialogDescription>
              Search for a user by phone number to create a backup of their data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="searchPhone">Search by Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="searchPhone"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter phone number"
                  data-testid="input-search-phone"
                />
                <Button
                  variant="outline"
                  onClick={handleSearchUsers}
                  disabled={searchPhone.length < 3 || isSearching}
                  data-testid="button-search-users"
                >
                  {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Select User</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted/50 hover-elevate"
                      }`}
                      onClick={() => setSelectedUser(user)}
                      data-testid={`select-user-${user.id}`}
                    >
                      <div className="font-medium">{user.phone}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.displayName || "No name"} - {user.userType || "Unknown type"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={backupNotes}
                  onChange={(e) => setBackupNotes(e.target.value)}
                  placeholder="Add notes about this backup"
                  rows={2}
                  data-testid="input-backup-notes"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBackup}
              disabled={!selectedUser || isSaving}
              data-testid="button-save-backup"
            >
              {isSaving ? "Creating..." : "Create Backup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Backup Details
            </DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : backupDetails ? (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <div className="font-medium">{backupDetails.phoneNumber}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge
                      variant={getStatusBadgeVariant(backupDetails.status)}
                      className="flex items-center gap-1 w-fit"
                    >
                      {getStatusIcon(backupDetails.status)}
                      {backupDetails.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Backup Type</Label>
                    <Badge variant={getTypeBadgeVariant(backupDetails.backupType)}>
                      {backupDetails.backupType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <div className="text-sm">{format(new Date(backupDetails.createdAt), "MMM d, yyyy HH:mm:ss")}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Label className="font-medium">User Info</Label>
                  </div>
                  {backupDetails.user ? (
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Display Name</Label>
                        <div className="text-sm">{backupDetails.user.displayName || "Not set"}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">User Type</Label>
                        <div className="text-sm">{backupDetails.user.userType || "Unknown"}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Verified</Label>
                        <Badge variant={backupDetails.user.isVerified ? "default" : "secondary"}>
                          {backupDetails.user.isVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Active</Label>
                        <Badge variant={backupDetails.user.isActive ? "default" : "destructive"}>
                          {backupDetails.user.isActive ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground pl-6">User not found (may have been deleted)</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Label className="font-medium">Security</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Checksum</Label>
                      <div className="text-xs font-mono break-all">{backupDetails.checksum || "N/A"}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Integrity</Label>
                      <Badge variant={backupDetails.checksumValid ? "default" : "destructive"}>
                        {backupDetails.checksumValid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Created By</Label>
                      <div className="text-sm">{backupDetails.createdBy?.name || "System"}</div>
                    </div>
                    {backupDetails.restoredBy && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Restored By</Label>
                        <div className="text-sm">{backupDetails.restoredBy.name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {backupDetails.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="font-medium">Notes</Label>
                      <div className="text-sm bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                        {backupDetails.notes}
                      </div>
                    </div>
                  </>
                )}

                {backupDetails.logs && backupDetails.logs.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <Label className="font-medium">Audit Log</Label>
                      </div>
                      <div className="space-y-2 pl-6">
                        {backupDetails.logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-3 text-sm border-l-2 border-muted pl-3 py-1">
                            <div className="flex-1">
                              <div className="font-medium capitalize">{log.action}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.admin?.name || "System"} - {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                              </div>
                              {log.details && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this backup? This will restore the user's data to the
              state it was in when this backup was created.
              {selectedBackup && (
                <div className="mt-2 p-3 rounded-lg bg-muted">
                  <div className="font-medium">{selectedBackup.phoneNumber}</div>
                  <div className="text-xs">
                    Backup from {format(new Date(selectedBackup.createdAt), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              disabled={isSaving}
              data-testid="button-confirm-restore"
            >
              {isSaving ? "Restoring..." : "Restore"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backup? This action will mark the backup as deleted
              and it cannot be restored from.
              {selectedBackup && (
                <div className="mt-2 p-3 rounded-lg bg-muted">
                  <div className="font-medium">{selectedBackup.phoneNumber}</div>
                  <div className="text-xs">
                    Backup from {format(new Date(selectedBackup.createdAt), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deleteNotes">Delete Reason (Optional)</Label>
            <Textarea
              id="deleteNotes"
              value={deleteNotes}
              onChange={(e) => setDeleteNotes(e.target.value)}
              placeholder="Add a reason for deletion..."
              rows={2}
              data-testid="input-delete-notes"
            />
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBackup}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              {isSaving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
