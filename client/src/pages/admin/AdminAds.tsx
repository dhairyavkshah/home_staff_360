import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MousePointer,
  BarChart3,
  Settings,
  Loader2,
  ExternalLink,
  Video,
  RefreshCw,
} from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  weight: number;
  isActive: boolean;
  advertiser: string | null;
  targetUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  maxPlayCount: number | null;
  orientation: string;
  createdAt: string;
  updatedAt: string;
}

interface AdSettings {
  adsEnabled: boolean;
  adIntervalSeconds: number;
  adDurationSeconds: number;
}

interface AdAnalytics {
  adId: string;
  title: string;
  isActive: boolean;
  totalImpressions: number;
  completionRate: string;
  skipRate: string;
  clickThroughRate: string;
  avgWatchDuration: string;
}

export default function AdminAds() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ads");
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [settings, setSettings] = useState<AdSettings>({
    adsEnabled: true,
    adIntervalSeconds: 120,
    adDurationSeconds: 15,
  });
  const [analytics, setAnalytics] = useState<AdAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: 30,
    weight: 1,
    isActive: true,
    advertiser: "",
    targetUrl: "",
    orientation: "landscape",
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchAds = async () => {
    try {
      const response = await fetch("/api/admin/ads?limit=100", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAds(data.ads || []);
      } else if (response.status === 503) {
        setAds([]);
      }
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/ads/settings", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          adsEnabled: data.adsEnabled ?? true,
          adIntervalSeconds: data.adIntervalSeconds ?? 120,
          adDurationSeconds: data.adDurationSeconds ?? 15,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const response = await fetch("/api/admin/ads/analytics", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAds(), fetchSettings()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "analytics") {
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const response = await fetch("/api/admin/ads/settings", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({ title: "Settings saved successfully" });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: 30,
      weight: 1,
      isActive: true,
      advertiser: "",
      targetUrl: "",
      orientation: "landscape",
    });
  };

  const handleCreateAd = async () => {
    if (!formData.title || !formData.videoUrl) {
      toast({ title: "Title and Video URL are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/ads", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || null,
          duration: formData.duration,
          weight: formData.weight,
          isActive: formData.isActive,
          advertiser: formData.advertiser || null,
          targetUrl: formData.targetUrl || null,
          orientation: formData.orientation,
        }),
      });

      if (response.ok) {
        toast({ title: "Advertisement created successfully" });
        setShowCreateDialog(false);
        resetForm();
        fetchAds();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create ad");
      }
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAd = async () => {
    if (!selectedAd || !formData.title || !formData.videoUrl) {
      toast({ title: "Title and Video URL are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/ads/${selectedAd.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          videoUrl: formData.videoUrl,
          thumbnailUrl: formData.thumbnailUrl || null,
          duration: formData.duration,
          weight: formData.weight,
          isActive: formData.isActive,
          advertiser: formData.advertiser || null,
          targetUrl: formData.targetUrl || null,
          orientation: formData.orientation,
        }),
      });

      if (response.ok) {
        toast({ title: "Advertisement updated successfully" });
        setShowEditDialog(false);
        setSelectedAd(null);
        resetForm();
        fetchAds();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update ad");
      }
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!selectedAd) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/ads/${selectedAd.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast({ title: "Advertisement deleted successfully" });
        setShowDeleteDialog(false);
        setSelectedAd(null);
        fetchAds();
      } else {
        throw new Error("Failed to delete ad");
      }
    } catch (error) {
      toast({ title: "Failed to delete advertisement", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (ad: Advertisement) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      videoUrl: ad.videoUrl,
      thumbnailUrl: ad.thumbnailUrl || "",
      duration: ad.duration,
      weight: ad.weight,
      isActive: ad.isActive,
      advertiser: ad.advertiser || "",
      targetUrl: ad.targetUrl || "",
      orientation: ad.orientation,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (ad: Advertisement) => {
    setSelectedAd(ad);
    setShowDeleteDialog(true);
  };

  const toggleAdStatus = async (ad: Advertisement) => {
    try {
      const response = await fetch(`/api/admin/ads/${ad.id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !ad.isActive }),
      });

      if (response.ok) {
        toast({ title: `Ad ${ad.isActive ? "deactivated" : "activated"}` });
        fetchAds();
      }
    } catch (error) {
      toast({ title: "Failed to update ad status", variant: "destructive" });
    }
  };

  const getTotalStats = () => {
    const totalImpressions = analytics.reduce((sum, a) => sum + a.totalImpressions, 0);
    const totalWithClicks = analytics.filter(a => parseFloat(a.clickThroughRate) > 0);
    const avgCTR = totalWithClicks.length > 0
      ? totalWithClicks.reduce((sum, a) => sum + parseFloat(a.clickThroughRate), 0) / totalWithClicks.length
      : 0;
    return { totalImpressions, avgCTR };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="ads" data-testid="tab-ads">
            Advertisements
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Manage Advertisements</h2>
              <p className="text-sm text-muted-foreground">
                Create and manage video ads shown to free tier users
              </p>
            </div>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} data-testid="button-create-ad">
              <Plus className="w-4 h-4 mr-2" />
              Create Ad
            </Button>
          </div>

          {ads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Video className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">No Advertisements</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first video ad to start showing to free tier users
                  </p>
                </div>
                <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {ads.map((ad) => (
                <Card key={ad.id} data-testid={`card-ad-${ad.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4 flex-wrap">
                      <div className="w-24 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {ad.thumbnailUrl ? (
                          <img
                            src={ad.thumbnailUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Video className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{ad.title}</h3>
                          <Badge variant={ad.isActive ? "default" : "secondary"}>
                            {ad.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{ad.duration}s</Badge>
                          <Badge variant="outline">Weight: {ad.weight}</Badge>
                          <Badge variant="outline" className="capitalize">{ad.orientation}</Badge>
                        </div>
                        {ad.advertiser && (
                          <p className="text-sm text-muted-foreground mt-1">
                            By {ad.advertiser}
                          </p>
                        )}
                        {ad.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {ad.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={ad.isActive}
                          onCheckedChange={() => toggleAdStatus(ad)}
                          data-testid={`switch-ad-status-${ad.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(ad)}
                          data-testid={`button-edit-ad-${ad.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openDeleteDialog(ad)}
                          data-testid={`button-delete-ad-${ad.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {ad.targetUrl && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => window.open(ad.targetUrl!, "_blank")}
                            data-testid={`button-preview-ad-${ad.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold">Ad Analytics</h2>
              <p className="text-sm text-muted-foreground">
                View performance metrics for your advertisements
              </p>
            </div>
            <Button variant="outline" onClick={fetchAnalytics} disabled={isLoadingAnalytics}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingAnalytics ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : analytics.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Impressions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {getTotalStats().totalImpressions.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average CTR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-5 h-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {getTotalStats().avgCTR.toFixed(2)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ad Performance</CardTitle>
                  <CardDescription>
                    Detailed metrics for each advertisement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.map((ad, index) => (
                      <div
                        key={ad.adId}
                        className="flex items-center justify-between p-3 rounded-md bg-muted/50 flex-wrap gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium">{ad.title}</span>
                            <Badge variant={ad.isActive ? "default" : "secondary"} className="ml-2">
                              {ad.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span>{ad.totalImpressions.toLocaleString()} views</span>
                          <Badge variant="outline">CTR: {ad.clickThroughRate}</Badge>
                          <Badge variant="outline">Completion: {ad.completionRate}</Badge>
                          <Badge variant="outline">Skip: {ad.skipRate}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">No Analytics Data</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analytics will appear once ads start receiving impressions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Ad Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure how ads are displayed to users
            </p>
          </div>

          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Advertisements</Label>
                  <p className="text-sm text-muted-foreground">
                    Show ads to free tier users
                  </p>
                </div>
                <Switch
                  checked={settings.adsEnabled}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, adsEnabled: checked }))
                  }
                  data-testid="switch-ads-enabled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">Ad Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  min={30}
                  max={600}
                  value={settings.adIntervalSeconds}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      adIntervalSeconds: parseInt(e.target.value) || 120,
                    }))
                  }
                  data-testid="input-ad-interval"
                />
                <p className="text-xs text-muted-foreground">
                  Time between ads (30-600 seconds)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Default Ad Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={60}
                  value={settings.adDurationSeconds}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      adDurationSeconds: parseInt(e.target.value) || 15,
                    }))
                  }
                  data-testid="input-ad-duration"
                />
                <p className="text-xs text-muted-foreground">
                  Default duration for ads (5-60 seconds)
                </p>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                data-testid="button-save-settings"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Advertisement</DialogTitle>
            <DialogDescription>
              Add a new video advertisement to show to free tier users
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="create-title">Title *</Label>
                <Input
                  id="create-title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ad title"
                  data-testid="input-create-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Description</Label>
                <Textarea
                  id="create-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  data-testid="input-create-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-video-url">Video URL *</Label>
                <Input
                  id="create-video-url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://example.com/ad-video.mp4"
                  data-testid="input-create-video-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-thumbnail-url">Thumbnail URL</Label>
                <Input
                  id="create-thumbnail-url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://example.com/thumbnail.jpg"
                  data-testid="input-create-thumbnail-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-target-url">Target URL (opens on click)</Label>
                <Input
                  id="create-target-url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="https://example.com/landing-page"
                  data-testid="input-create-target-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-advertiser">Advertiser</Label>
                <Input
                  id="create-advertiser"
                  value={formData.advertiser}
                  onChange={(e) => setFormData((prev) => ({ ...prev, advertiser: e.target.value }))}
                  placeholder="Company name"
                  data-testid="input-create-advertiser"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-duration">Duration (seconds)</Label>
                  <Input
                    id="create-duration"
                    type="number"
                    min={5}
                    max={30}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))
                    }
                    data-testid="input-create-duration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-weight">Weight (1-10)</Label>
                  <Input
                    id="create-weight"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, weight: parseInt(e.target.value) || 1 }))
                    }
                    data-testid="input-create-weight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-orientation">Orientation</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger id="create-orientation" data-testid="select-create-orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="create-active">Active</Label>
                <Switch
                  id="create-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  data-testid="switch-create-active"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAd} disabled={isSubmitting} data-testid="button-submit-create">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ad"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Advertisement</DialogTitle>
            <DialogDescription>Update the advertisement details</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ad title"
                  data-testid="input-edit-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  data-testid="input-edit-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-video-url">Video URL *</Label>
                <Input
                  id="edit-video-url"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://example.com/ad-video.mp4"
                  data-testid="input-edit-video-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-thumbnail-url">Thumbnail URL</Label>
                <Input
                  id="edit-thumbnail-url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                  placeholder="https://example.com/thumbnail.jpg"
                  data-testid="input-edit-thumbnail-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-target-url">Target URL (opens on click)</Label>
                <Input
                  id="edit-target-url"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetUrl: e.target.value }))}
                  placeholder="https://example.com/landing-page"
                  data-testid="input-edit-target-url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-advertiser">Advertiser</Label>
                <Input
                  id="edit-advertiser"
                  value={formData.advertiser}
                  onChange={(e) => setFormData((prev) => ({ ...prev, advertiser: e.target.value }))}
                  placeholder="Company name"
                  data-testid="input-edit-advertiser"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duration (seconds)</Label>
                  <Input
                    id="edit-duration"
                    type="number"
                    min={5}
                    max={30}
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 30 }))
                    }
                    data-testid="input-edit-duration"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-weight">Weight (1-10)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    min={1}
                    max={10}
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, weight: parseInt(e.target.value) || 1 }))
                    }
                    data-testid="input-edit-weight"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-orientation">Orientation</Label>
                <Select
                  value={formData.orientation}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, orientation: value }))}
                >
                  <SelectTrigger id="edit-orientation" data-testid="select-edit-orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Active</Label>
                <Switch
                  id="edit-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  data-testid="switch-edit-active"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAd} disabled={isSubmitting} data-testid="button-submit-edit">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAd}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
