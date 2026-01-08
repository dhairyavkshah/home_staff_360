import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Smartphone, Link2, Activity, Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Archive, Phone, User } from "lucide-react";
import * as XLSX from "xlsx";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Stats {
  totalUsers: number;
  verifiedUsers: number;
  totalDevices: number;
  totalLinks: number;
  activeLinks: number;
}

interface BackupStats {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  recent: Array<{
    id: number;
    phoneNumber: string;
    status: string;
    backupType: string;
    createdAt: string;
    userName: string | null;
  }>;
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

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  const [usernameSearch, setUsernameSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState({ username: "", phone: "" });
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all");
  const [isVerifiedFilter, setIsVerifiedFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setAppliedSearch({ username: usernameSearch, phone: phoneSearch });
    setPage(1);
    setHasSearched(true);
  };

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

    fetchInitialData(token);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    // Only fetch users if a search has been performed (to reduce server load)
    if (token && hasSearched) {
      fetchUsers(token);
    }
  }, [appliedSearch, userTypeFilter, isVerifiedFilter, isActiveFilter, page, hasSearched]);

  const fetchInitialData = async (token: string) => {
    try {
      const [statsRes, backupStatsRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/backups/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok) {
        if (statsRes.status === 403) {
          handleLogout();
          return;
        }
      }

      const statsData = await statsRes.json();
      const backupStatsData = backupStatsRes.ok ? await backupStatsRes.json() : null;

      setStats(statsData);
      setBackupStats(backupStatsData);
      
      // Don't fetch users on initial load - wait for search to reduce server load
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = useCallback(async (token: string) => {
    setIsUsersLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("page", page.toString());
      
      if (appliedSearch.username) {
        params.set("name", appliedSearch.username);
      }
      if (appliedSearch.phone) {
        params.set("phone", appliedSearch.phone);
      }
      if (userTypeFilter !== "all") {
        params.set("userType", userTypeFilter);
      }
      if (isVerifiedFilter !== "all") {
        params.set("isVerified", isVerifiedFilter === "verified" ? "true" : "false");
      }
      if (isActiveFilter !== "all") {
        params.set("isActive", isActiveFilter === "active" ? "true" : "false");
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) {
          handleLogout();
          return;
        }
      }

      const data: UsersResponse = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsUsersLoading(false);
    }
  }, [appliedSearch, userTypeFilter, isVerifiedFilter, isActiveFilter, page, limit]);

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

  const handleExportExcel = () => {
    const exportData = users.map(user => ({
      Phone: user.phone,
      Name: user.displayName || "-",
      Type: user.userType || "-",
      Verified: user.isVerified ? "Yes" : "No",
      Active: user.isActive ? "Yes" : "No",
      Connections: user.connectCount,
      "Last Login": user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "-",
      "Created At": new Date(user.createdAt).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `users-export-${date}.xlsx`);
  };

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const renderPagination = () => {
    const pageNumbers: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
          Showing {users.length} of {totalCount} users (Page {page} of {totalPages})
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(1)}
            disabled={page === 1}
            data-testid="button-pagination-first"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            data-testid="button-pagination-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {pageNumbers.map(pageNum => (
            <Button
              key={pageNum}
              variant={pageNum === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(pageNum)}
              data-testid={`button-pagination-page-${pageNum}`}
            >
              {pageNum}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            data-testid="button-pagination-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            data-testid="button-pagination-last"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</p>
                <p className="text-[10px] text-muted-foreground">{stats?.verifiedUsers || 0} verified</p>
              </div>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Devices</p>
                <p className="text-xl font-bold" data-testid="text-total-devices">{stats?.totalDevices || 0}</p>
                <p className="text-[10px] text-muted-foreground">Registered</p>
              </div>
              <Smartphone className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Collaborations</p>
                <p className="text-xl font-bold" data-testid="text-total-links">{stats?.totalLinks || 0}</p>
                <p className="text-[10px] text-muted-foreground">{stats?.activeLinks || 0} active</p>
              </div>
              <Link2 className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-xl font-bold text-green-600">Online</p>
                <p className="text-[10px] text-muted-foreground">Server running</p>
              </div>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {backupStats && (
          <Card className="cursor-pointer hover-elevate p-3" onClick={() => setLocation("/admin/backups")}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Archive className="w-4 h-4" />
                Backup Statistics
              </div>
              <Badge variant="secondary" className="text-xs" data-testid="badge-backup-total">{backupStats.total} total</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-green-600" data-testid="text-backup-completed">{backupStats.completed}</p>
                <p className="text-[10px] text-muted-foreground">Completed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600" data-testid="text-backup-pending">{backupStats.pending}</p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600" data-testid="text-backup-failed">{backupStats.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[150px]">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Username"
                  value={usernameSearch}
                  onChange={(e) => setUsernameSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-username"
                />
              </div>
              <div className="relative flex-1 min-w-[150px]">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Phone (with country code)"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-phone"
                />
              </div>
              <Button
                onClick={handleSearch}
                data-testid="button-search"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Select value={userTypeFilter} onValueChange={handleFilterChange(setUserTypeFilter)}>
                <SelectTrigger className="w-[140px]" data-testid="select-user-type">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="HOME">HOME</SelectItem>
                  <SelectItem value="STAFF">STAFF</SelectItem>
                </SelectContent>
              </Select>

              <Select value={isVerifiedFilter} onValueChange={handleFilterChange(setIsVerifiedFilter)}>
                <SelectTrigger className="w-[140px]" data-testid="select-is-verified">
                  <SelectValue placeholder="Verified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="not-verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>

              <Select value={isActiveFilter} onValueChange={handleFilterChange(setIsActiveFilter)}>
                <SelectTrigger className="w-[140px]" data-testid="select-is-active">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={users.length === 0}
                data-testid="button-export-excel"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>

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
                  {isUsersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        {hasSearched ? (
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-muted-foreground/50" />
                            <p>No matching records found</p>
                            <p className="text-xs">Try adjusting your search criteria</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-muted-foreground/50" />
                            <p>Search for users</p>
                            <p className="text-xs">Enter a username or phone number above and click Search</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && renderPagination()}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
