import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Shield, Crown, User, Pencil, Lock, ChevronDown, ChevronRight } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface AdminRole {
  id: number;
  name: string;
  precedence: number;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  { id: 'manage_super_admins', label: 'Manage Super Admins', description: 'Add/edit/remove super admin users' },
  { id: 'manage_admins', label: 'Manage Admins', description: 'Add/edit/remove admin users' },
  { id: 'manage_users', label: 'Manage Users', description: 'View and manage app users' },
  { id: 'manage_ads', label: 'Manage Ads', description: 'Create and manage advertisements' },
  { id: 'view_analytics', label: 'View Analytics', description: 'Access dashboard analytics' },
  { id: 'manage_settings', label: 'Manage Settings', description: 'Change system settings' },
  { id: 'manage_subscriptions', label: 'Manage Subscriptions', description: 'Handle user subscriptions' },
  { id: 'full_access', label: 'Full Access', description: 'Complete system access' },
];

function getRoleIcon(roleName: string) {
  switch (roleName?.toLowerCase()) {
    case "owner":
      return <Crown className="w-5 h-5 text-amber-500" />;
    case "super_admin":
      return <Shield className="w-5 h-5 text-blue-500" />;
    case "admin":
      return <User className="w-5 h-5 text-green-500" />;
    default:
      return <User className="w-5 h-5" />;
  }
}

function formatRoleName(name: string): string {
  return name
    ?.replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

export default function AdminRolesPage() {
  const [, setLocation] = useLocation();
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set());

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

    fetchRoles(token);
  }, []);

  const fetchRoles = async (token: string) => {
    try {
      const response = await fetch("/api/admin/roles", {
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
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentAdminRole = () => {
    return currentAdmin?.role || null;
  };

  const canEditRole = (role: AdminRole) => {
    const myRole = getCurrentAdminRole();
    if (!myRole) return false;
    if (role.name === 'owner') return false;
    if (role.name === 'super_admin' && myRole.name !== 'owner') return false;
    return role.precedence > myRole.precedence;
  };

  const handleEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    setEditPermissions([...(role.permissions || [])]);
    setError(null);
    setIsEditDialogOpen(true);
  };

  const togglePermission = (permId: string) => {
    setEditPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  const handleSavePermissions = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedRole) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions: editPermissions }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchRoles(token);
      } else {
        setError(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      setError("Failed to update role");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRoleExpand = (roleId: number) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Hierarchy
            </CardTitle>
            <CardDescription>
              Roles are ordered by precedence. Higher roles have more privileges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles.map((role, index) => (
              <div key={role.id} data-testid={`role-card-${role.id}`}>
                <div
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 cursor-pointer"
                  onClick={() => toggleRoleExpand(role.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center w-8">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      {index < roles.length - 1 && (
                        <div className="w-px h-4 bg-border mt-1" />
                      )}
                    </div>
                    {getRoleIcon(role.name)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatRoleName(role.name)}</span>
                        <Badge variant={getRoleBadgeVariant(role.name)} className="text-xs">
                          Precedence: {role.precedence}
                        </Badge>
                        {role.name === 'owner' && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Protected
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(role.permissions || []).length} permissions assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditRole(role) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        data-testid={`button-edit-role-${role.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {expandedRoles.has(role.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {expandedRoles.has(role.id) && (
                  <div className="ml-12 mt-2 p-3 border rounded-md bg-background">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).length > 0 ? (
                        (role.permissions || []).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm.replace(/_/g, " ")}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No permissions assigned</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permission Reference</CardTitle>
            <CardDescription>
              Available permissions that can be assigned to roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_PERMISSIONS.map((perm) => (
                <div key={perm.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="font-medium text-sm">{perm.label}</div>
                  <div className="text-xs text-muted-foreground">{perm.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRole && getRoleIcon(selectedRole.name)}
              Edit {selectedRole && formatRoleName(selectedRole.name)} Permissions
            </DialogTitle>
            <DialogDescription>
              Select the permissions for this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            {ALL_PERMISSIONS.map((perm) => (
              <div
                key={perm.id}
                className="flex items-start gap-3 p-2 rounded-md hover-elevate"
                onClick={() => togglePermission(perm.id)}
              >
                <Checkbox
                  id={perm.id}
                  checked={editPermissions.includes(perm.id)}
                  onCheckedChange={() => togglePermission(perm.id)}
                  data-testid={`checkbox-permission-${perm.id}`}
                />
                <div className="flex-1 cursor-pointer">
                  <label htmlFor={perm.id} className="text-sm font-medium cursor-pointer">
                    {perm.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isSaving}
              data-testid="button-save-permissions"
            >
              {isSaving ? "Saving..." : "Save Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
