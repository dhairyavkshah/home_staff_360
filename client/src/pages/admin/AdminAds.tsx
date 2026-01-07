import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  MousePointerClick,
  SkipForward,
  CheckCircle,
  CalendarIcon,
  Video,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Ad {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  weight: number;
  advertiser: string | null;
  targetUrl: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  maxPlayCount: number | null;
  orientation: "landscape" | "portrait" | "any";
  createdAt: string;
}

interface AdFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  weight: number;
  advertiser: string;
  targetUrl: string;
  isActive: boolean;
  startDate: Date | undefined;
  endDate: Date | undefined;
  maxPlayCount: number | null;
  orientation: "landscape" | "portrait" | "any";
}

interface AnalyticsOverview {
  totalImpressions: number;
  avgCompletionRate: number;
  avgSkipRate: number;
  avgClickThroughRate: number;
}

interface AdAnalytics {
  adId: number;
  adTitle: string;
  totalImpressions: number;
  completionRate: number;
  skipRate: number;
  clickThroughRate: number;
  avgWatchDuration: number;
}

interface UserAdAnalytics {
  userId: string;
  userPhone: string;
  userDisplayName: string | null;
  adId: number;
  adTitle: string;
  impressionCount: number;
  completedCount: number;
  clickedCount: number;
}

const defaultFormData: AdFormData = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  duration: 30,
  weight: 1,
  advertiser: "",
  targetUrl: "",
  isActive: true,
  startDate: undefined,
  endDate: undefined,
  maxPlayCount: null,
  orientation: "landscape",
};

export default function AdminAds() {
  const [, setLocation] = useLocation();
  const [ads, setAds] = useState<Ad[]>([]);
  const [analytics, setAnalytics] = useState<{
    overview: AnalyticsOverview;
    perAd: AdAnalytics[];
    perUser: UserAdAnalytics[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<AdFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [isTogglingAds, setIsTogglingAds] = useState(false);

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
      const [adsRes, analyticsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/ads", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/ads/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/ads/settings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (adsRes.status === 403 || analyticsRes.status === 403) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        setLocation("/admin");
        return;
      }

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAds(adsData.ads || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setAdsEnabled(settingsData.adsEnabled ?? true);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAds = async (enabled: boolean) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsTogglingAds(true);
    try {
      const response = await fetch("/api/admin/ads/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adsEnabled: enabled }),
      });

      if (response.ok) {
        setAdsEnabled(enabled);
      }
    } catch (error) {
      console.error("Failed to toggle ads:", error);
    } finally {
      setIsTogglingAds(false);
    }
  };

  const handleCreateAd = () => {
    setSelectedAd(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleEditAd = (ad: Ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      videoUrl: ad.videoUrl,
      thumbnailUrl: ad.thumbnailUrl || "",
      duration: ad.duration,
      weight: ad.weight,
      advertiser: ad.advertiser || "",
      targetUrl: ad.targetUrl || "",
      isActive: ad.isActive,
      startDate: ad.startDate ? new Date(ad.startDate) : undefined,
      endDate: ad.endDate ? new Date(ad.endDate) : undefined,
      maxPlayCount: ad.maxPlayCount,
      orientation: ad.orientation || "landscape",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (ad: Ad) => {
    setSelectedAd(ad);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveAd = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    if (!formData.title.trim() || !formData.videoUrl.trim()) {
      return;
    }

    setIsSaving(true);

    try {
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        videoUrl: formData.videoUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim() || null,
        duration: formData.duration,
        weight: formData.weight,
        advertiser: formData.advertiser.trim() || null,
        targetUrl: formData.targetUrl.trim() || null,
        isActive: formData.isActive,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null,
        maxPlayCount: formData.maxPlayCount,
        orientation: formData.orientation,
      };

      const url = selectedAd 
        ? `/api/admin/ads/${selectedAd.id}` 
        : "/api/admin/ads";
      const method = selectedAd ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to save ad:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAd = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !selectedAd) return;

    try {
      const response = await fetch(`/api/admin/ads/${selectedAd.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedAd(null);
        fetchData(token);
      }
    } catch (error) {
      console.error("Failed to delete ad:", error);
    }
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
        <div className="flex justify-end">
          <Button onClick={handleCreateAd} data-testid="button-create-ad">
            <Plus className="w-4 h-4 mr-2" />
            Create Ad
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle>Global Ad Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="adsEnabled" className="text-base font-medium">Ads Enabled</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle this off to disable all ads system-wide
                </p>
              </div>
              <Switch
                id="adsEnabled"
                checked={adsEnabled}
                disabled={isTogglingAds}
                onCheckedChange={handleToggleAds}
                data-testid="switch-global-ads-enabled"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Advertisements
            </CardTitle>
            <Badge variant="secondary">{ads.length} ads</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Title</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Advertiser</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Duration</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id} className="border-b" data-testid={`row-ad-${ad.id}`}>
                      <td className="py-2 px-2">
                        <div className="font-medium">{ad.title}</div>
                        {ad.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {ad.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell">
                        {ad.advertiser || "-"}
                      </td>
                      <td className="py-2 px-2 hidden sm:table-cell">
                        {ad.duration}s
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant={ad.isActive ? "default" : "secondary"}>
                          {ad.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAd(ad)}
                            data-testid={`button-edit-ad-${ad.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(ad)}
                            data-testid={`button-delete-ad-${ad.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {ads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No advertisements found. Create your first ad to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Total Impressions</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-total-impressions">
                  {analytics?.overview.totalImpressions || 0}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Avg Completion</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-completion">
                  {(analytics?.overview.avgCompletionRate || 0).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <SkipForward className="w-4 h-4" />
                  <span className="text-xs">Avg Skip Rate</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-skip">
                  {(analytics?.overview.avgSkipRate || 0).toFixed(1)}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <MousePointerClick className="w-4 h-4" />
                  <span className="text-xs">Avg CTR</span>
                </div>
                <div className="text-2xl font-bold" data-testid="text-avg-ctr">
                  {(analytics?.overview.avgClickThroughRate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Ad Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Ad Title</th>
                    <th className="text-left py-2 px-2">Impressions</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Completion</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">Skip Rate</th>
                    <th className="text-left py-2 px-2 hidden md:table-cell">CTR</th>
                    <th className="text-left py-2 px-2 hidden lg:table-cell">Avg Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.perAd || []).map((item) => (
                    <tr key={item.adId} className="border-b" data-testid={`row-analytics-${item.adId}`}>
                      <td className="py-2 px-2 font-medium">{item.adTitle}</td>
                      <td className="py-2 px-2">{item.totalImpressions}</td>
                      <td className="py-2 px-2 hidden sm:table-cell">{item.completionRate.toFixed(1)}%</td>
                      <td className="py-2 px-2 hidden md:table-cell">{item.skipRate.toFixed(1)}%</td>
                      <td className="py-2 px-2 hidden md:table-cell">{item.clickThroughRate.toFixed(1)}%</td>
                      <td className="py-2 px-2 hidden lg:table-cell">{item.avgWatchDuration.toFixed(1)}s</td>
                    </tr>
                  ))}
                  {(!analytics?.perAd || analytics.perAd.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">
                        No analytics data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">User</th>
                    <th className="text-left py-2 px-2">Ad</th>
                    <th className="text-left py-2 px-2">Views</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Completed</th>
                    <th className="text-left py-2 px-2 hidden sm:table-cell">Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics?.perUser || []).map((item, index) => (
                    <tr key={`${item.userId}-${item.adId}-${index}`} className="border-b" data-testid={`row-user-analytics-${index}`}>
                      <td className="py-2 px-2">
                        <div className="font-medium">{item.userDisplayName || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{item.userPhone}</div>
                      </td>
                      <td className="py-2 px-2">{item.adTitle}</td>
                      <td className="py-2 px-2">{item.impressionCount}</td>
                      <td className="py-2 px-2 hidden sm:table-cell">{item.completedCount}</td>
                      <td className="py-2 px-2 hidden sm:table-cell">{item.clickedCount}</td>
                    </tr>
                  ))}
                  {(!analytics?.perUser || analytics.perUser.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">
                        No user analytics data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAd ? "Edit Advertisement" : "Create Advertisement"}</DialogTitle>
            <DialogDescription>
              {selectedAd ? "Update the advertisement details below." : "Fill in the details to create a new advertisement."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ad title"
                data-testid="input-ad-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description (optional)"
                rows={2}
                data-testid="input-ad-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
                data-testid="input-ad-video-url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
                data-testid="input-ad-thumbnail-url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (1-30s)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={30}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                  data-testid="input-ad-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  min={1}
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                  data-testid="input-ad-weight"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPlayCount">Max Plays per Device</Label>
                <Input
                  id="maxPlayCount"
                  type="number"
                  min={1}
                  value={formData.maxPlayCount ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      maxPlayCount: val === "" ? null : parseInt(val) || null 
                    });
                  }}
                  placeholder="Unlimited"
                  data-testid="input-ad-max-plays"
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value: "landscape" | "portrait" | "any") => 
                    setFormData({ ...formData, orientation: value })
                  }
                >
                  <SelectTrigger data-testid="select-ad-orientation">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="advertiser">Advertiser Name</Label>
              <Input
                id="advertiser"
                value={formData.advertiser}
                onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })}
                placeholder="Company name (optional)"
                data-testid="input-ad-advertiser"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">Target URL</Label>
              <Input
                id="targetUrl"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="https://example.com/learn-more"
                data-testid="input-ad-target-url"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-ad-active"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                      data-testid="button-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                      data-testid="button-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel-ad"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAd}
              disabled={isSaving || !formData.title.trim() || !formData.videoUrl.trim()}
              data-testid="button-save-ad"
            >
              {isSaving ? "Saving..." : selectedAd ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAd}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AdminLayout>
  );
}
