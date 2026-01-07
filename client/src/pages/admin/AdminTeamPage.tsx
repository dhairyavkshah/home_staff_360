import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Users, Shield, Crown, User, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface AdminRole {
  id: number;
  name: string;
  precedence: number;
  permissions: string[];
}

interface Admin {
  id: string;
  email: string;
  name: string;
  roleId: number | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: AdminRole | null;
  invitedByAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface InviteFormData {
  email: string;
  name: string;
  password: string;
  roleId: number | null;
}

interface EditFormData {
  name: string;
  roleId: number | null;
  isActive: boolean;
}

const defaultInviteForm: InviteFormData = {
  email: "",
  name: "",
  password: "",
  roleId: null,
};

function getRoleBadgeVariant(roleName: string): "default" | "secondary" | "destructive" | "outline" {
  switch (roleName?.toLowerCase()) {
    case "owner":
      return "destructive";
    case "super_admin":
      return "default";
    case "admin":
      return "secondary";
    default:
      return "outline";
  }
}

function getRoleIcon(roleName: string) {
  switch (roleName?.toLowerCase()) {
    case "owner":
      return <Crown className="w-3 h-3" />;
    case "super_admin":
      return <Shield className="w-3 h-3" />;
    case "admin":
      return <User className="w-3 h-3" />;
    default:
      return <User className="w-3 h-3" />;
  }
}

function formatRoleName(name: string): string {
  return name
    ?.replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AdminTeamPage() {
  const [, setLocation] = useLocation();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteFormData>(defaultInviteForm);
  const [editForm, setEditForm] = useState<EditFormData>({ name: "", roleId: null, isActive: true });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    
    if (!token) {
      setLocation("/admin");
      return;
    }

    if (user) {
      setCurrentAdmin(JSON.parse(user));
    }

    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const response = await fetch("/api/admin/team", {
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
        setAdmins(data.admins || []);
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteAdmin = () => {
    setInviteForm(defaultInviteForm);
    setError(null);
    setIsInviteDialogOpen(true);
  };

  const handleEditAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name,
      roleId: admin.roleId,
      isActive: admin.isActive,
    });
    setError(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveInvite = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    if (!inviteForm.email.trim() || !inviteForm.name.trim() || !inviteForm.password.trim() || !inviteForm.roleId) {
      setError("All fields are required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        setIsInviteDialogOpen(false);
        fetchData(token);
      } else {
        setError(data.error || "Failed to invite admin");
      }
    } catch (error) {
      console.error("Failed to invite admin:", error);
      setError("Failed to invite admin");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedAdmin) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/team/${selectedAdmin.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchData(token);
      } else {
        setError(data.error || "Failed to update admin");
      }
    } catch (error) {
      console.error("Failed to update admin:", error);
      setError("Failed to update admin");
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentAdminPrecedence = () => {
    const admin = admins.find((a) => a.email === currentAdmin?.email);
    return admin?.role?.precedence || 999;
  };

  const canManageAdmin = (admin: Admin) => {
    const myPrecedence = getCurrentAdminPrecedence();
    const theirPrecedence = admin.role?.precedence || 999;
    return theirPrecedence > myPrecedence;
  };

  const getAvailableRoles = () => {
    const myPrecedence = getCurrentAdminPrecedence();
    return roles.filter((role) => role.precedence > myPrecedence);
  };

  const groupedAdmins = roles.map(role => ({
    role,
    members: admins.filter(admin => admin.roleId === role.id)
  })).filter(group => group.members.length > 0);

  if (isLoading) {
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
          <Button onClick={handleInviteAdmin} data-testid="button-invite-admin">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Admin
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {admins.length} team member{admins.length !== 1 ? 's' : ''} across {roles.length} role{roles.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary">{admins.length} admins</Badge>
          </CardHeader>
          <CardContent>
            {groupedAdmins.map((group) => (
              <div key={group.role.id} className="mb-6 last:mb-0" data-testid={`role-group-${group.role.id}`}>
                <div className="flex items-center gap-2 mb-3">
                  {group.role.name === 'owner' && <Crown className="w-4 h-4 text-amber-500" />}
                  {group.role.name === 'super_admin' && <Shield className="w-4 h-4 text-blue-500" />}
                  {group.role.name === 'admin' && <User className="w-4 h-4 text-green-500" />}
                  <span className="font-medium">{formatRoleName(group.role.name)}</span>
                  <Badge variant="outline" className="text-xs">{group.members.length}</Badge>
                </div>
                <div className="space-y-2 ml-6">
                  {group.members.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`admin-row-${admin.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{admin.name}</span>
                          <Badge variant={admin.isActive ? "default" : "secondary"} className="text-xs">
                            {admin.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{admin.email}</div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Last login: {admin.lastLoginAt 
                              ? format(new Date(admin.lastLoginAt), "MMM d, yyyy HH:mm")
                              : "Never"}
                          </span>
                          {admin.invitedByAdmin && (
                            <span>Invited by: {admin.invitedByAdmin.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageAdmin(admin) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAdmin(admin)}
                            data-testid={`button-edit-admin-${admin.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {admins.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No team members found
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hierarchy Overview</CardTitle>
            <CardDescription>
              Visual representation of the role hierarchy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roles.map((role, index) => {
                const memberCount = admins.filter(a => a.roleId === role.id).length;
                return (
                  <div key={role.id} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {role.name === 'owner' && <Crown className="w-4 h-4 text-amber-500" />}
                        {role.name === 'super_admin' && <Shield className="w-4 h-4 text-blue-500" />}
                        {role.name === 'admin' && <User className="w-4 h-4 text-green-500" />}
                        <span className="font-medium">{formatRoleName(role.name)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {memberCount} member{memberCount !== 1 ? 's' : ''} | Precedence: {role.precedence}
                      </p>
                    </div>
                    <Badge variant={getRoleBadgeVariant(role.name)} className="text-xs">
                      {(role.permissions || []).length} permissions
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New Admin</DialogTitle>
            <DialogDescription>
              Create a new admin account. You can only assign roles below your level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Enter name"
                data-testid="input-admin-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="admin@example.com"
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                placeholder="Enter password"
                data-testid="input-admin-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={inviteForm.roleId?.toString() || ""}
                onValueChange={(value) => setInviteForm({ ...inviteForm, roleId: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-admin-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {formatRoleName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInvite} disabled={isSaving} data-testid="button-save-invite">
              {isSaving ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin details and status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter name"
                data-testid="input-edit-admin-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editForm.roleId?.toString() || ""}
                onValueChange={(value) => setEditForm({ ...editForm, roleId: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-edit-admin-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {formatRoleName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="isActive">Active Status</Label>
              <Switch
                id="isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                data-testid="switch-edit-admin-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} data-testid="button-save-edit">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
