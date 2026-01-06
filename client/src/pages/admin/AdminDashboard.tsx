import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Smartphone, Link2, Activity, LogOut, Film } from "lucide-react";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  totalDevices: number;
  totalLinks: number;
  activeLinks: number;
}

interface User {
  id: string;
  phone: string;
  displayName: string | null;
  userType: string | null;
  isVerified: boolean;
  isActive: boolean;
  connectCount: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");
    
    if (!token) {
      setLocation("/admin");
      return;
    }

    if (user) {
      setAdminUser(JSON.parse(user));
    }

    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/users?limit=20", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        if (statsRes.status === 403 || usersRes.status === 403) {
          handleLogout();
          return;
        }
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();

      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setLocation("/admin");
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      setUsers(users.map(u => 
        u.id === userId ? { ...u, isActive: !currentStatus } : u
      ));
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Home Staff 360</h1>
            <p className="text-sm text-muted-foreground">Super Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            {adminUser && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {adminUser.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/ads")}
              data-testid="button-admin-ads"
            >
              <Film className="w-4 h-4 mr-2" />
              Ads
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-users">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.verifiedUsers || 0} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Devices</CardTitle>
              <Smartphone className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-devices">
                {stats?.totalDevices || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
              <Link2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-links">
                {stats?.totalLinks || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.activeLinks || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">Server running</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Phone</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Name</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Type</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b" data-testid={`row-user-${user.id}`}>
                      <td className="py-2 px-2">{user.phone}</td>
                      <td className="py-2 px-2 hidden md:table-cell">
                        {user.displayName || "-"}
                      </td>
                      <td className="py-2 px-2 hidden sm:table-cell">
                        {user.userType || "-"}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1 flex-wrap">
                          {user.isVerified && (
                            <Badge variant="secondary" className="text-xs">Verified</Badge>
                          )}
                          <Badge 
                            variant={user.isActive ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {user.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          data-testid={`button-toggle-user-${user.id}`}
                        >
                          {user.isActive ? "Disable" : "Enable"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
