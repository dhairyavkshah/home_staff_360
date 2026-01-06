import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  Shirt, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  History,
  User,
  MessageSquare,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigation, useNavigationData } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { collaborationService } from "@/lib/collaboration-service";
import { syncQueue } from "@/lib/sync-queue";
import { storage } from "@/lib/storage";
import { format, parseISO } from "date-fns";
import type { UserType } from "@shared/schema";

interface AttendanceRecord {
  id: string;
  bindingId: string;
  date: string;
  status: string;
  hoursWorked?: number;
  note?: string;
  approvalStatus: string;
  submittedBy: string;
  submittedByRole: UserType;
  actionRequiredBy?: string;
  rejectionRemarks?: string;
  recordSalaryType?: string;
  recordRate?: number;
  recordCurrency?: string;
  createdAt: string;
}

interface LaundryRecord {
  id: string;
  bindingId: string;
  date: string;
  items: Array<{ name: string; quantity: number; rate: number; subtotal: number }>;
  itemsTotal?: number;
  pickupDelivery?: boolean;
  pickupDeliveryCharge?: number;
  total: number;
  serviceType?: string;
  approvalStatus: string;
  submittedBy: string;
  submittedByRole: UserType;
  actionRequiredBy?: string;
  rejectionRemarks?: string;
  recordCurrency?: string;
  createdAt: string;
}

interface RevisionHistoryItem {
  id: string;
  revisionNumber: number;
  action: string;
  actionBy: string;
  actionByRole: UserType;
  remarks?: string;
  createdAt: string;
}

export function ApprovalDetailScreen() {
  const { goBack } = useNavigation();
  const { entityType, entityId } = useNavigationData();
  const { t, tLabel } = useTranslation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const [record, setRecord] = useState<AttendanceRecord | LaundryRecord | null>(null);
  const [revisions, setRevisions] = useState<RevisionHistoryItem[]>([]);
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const profile = storage.getProfile();
  const currentMode = profile?.type || "HOME";
  const isOnline = syncQueue.isOnline();

  // Local cache keys for offline support
  const CACHE_KEY = `hm_shared_records_cache`;

  function getCachedRecord(type: string, id: string): { record: any; revisions: any[] } | null {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      return cache[`${type}_${id}`] || null;
    } catch {
      return null;
    }
  }

  function setCachedRecord(type: string, id: string, record: any, revisions: any[]) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
      cache[`${type}_${id}`] = { record, revisions, cachedAt: new Date().toISOString() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error("Failed to cache record:", e);
    }
  }

  useEffect(() => {
    loadRecord();
  }, [entityType, entityId]);

  async function loadRecord() {
    if (!entityType || !entityId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // First, try to load from cache for instant display
      const cached = getCachedRecord(entityType, entityId);
      if (cached) {
        setRecord(cached.record);
        setRevisions(cached.revisions || []);
      }
      
      // Then fetch fresh data if online
      if (isOnline && collaborationService.isAuthenticated()) {
        try {
          if (entityType === "attendance") {
            const response = await collaborationService.getSharedAttendanceById(entityId);
            setRecord(response.attendance);
            setRevisions(response.revisions || []);
            setCachedRecord(entityType, entityId, response.attendance, response.revisions || []);
          } else if (entityType === "laundry") {
            const response = await collaborationService.getSharedLaundryById(entityId);
            setRecord(response.laundry);
            setRevisions(response.revisions || []);
            setCachedRecord(entityType, entityId, response.laundry, response.revisions || []);
          }
        } catch (fetchErr) {
          // If fetch fails but we have cache, still show cached data
          if (!cached) {
            throw fetchErr;
          }
          console.warn("Failed to fetch fresh data, using cache:", fetchErr);
        }
      } else if (!cached) {
        // Offline and no cache
        toast({
          title: "Offline",
          description: "Unable to load record. Please connect to the internet.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to load record:", err);
      toast({
        title: "Error",
        description: "Failed to load record details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function applyOptimisticUpdate(newStatus: string, remarks?: string) {
    if (!record || !entityType || !entityId) return;
    
    // Update local state immediately
    const updatedRecord = { 
      ...record, 
      approvalStatus: newStatus,
      rejectionRemarks: remarks || record.rejectionRemarks
    };
    setRecord(updatedRecord);
    
    // Add optimistic revision
    const newRevision: RevisionHistoryItem = {
      id: `pending_${Date.now()}`,
      revisionNumber: revisions.length,
      action: newStatus === "approved" ? "approved" : "rejected",
      actionBy: "You",
      actionByRole: currentMode as UserType,
      remarks,
      createdAt: new Date().toISOString()
    };
    setRevisions([newRevision, ...revisions]);
    
    // Update cache with optimistic state
    setCachedRecord(entityType, entityId, updatedRecord, [newRevision, ...revisions]);
  }

  async function handleApprove() {
    if (!record) return;

    setIsActioning(true);
    try {
      // Apply optimistic update first
      applyOptimisticUpdate("approved");
      
      if (isOnline) {
        if (entityType === "attendance") {
          await collaborationService.actionAttendance(record.id, "approve");
        } else {
          await collaborationService.actionLaundry(record.id, "approve");
        }
        toast({
          title: "Approved",
          description: `${entityType === "attendance" ? "Attendance" : "Laundry"} record approved successfully`,
        });
      } else {
        // Queue for later sync
        syncQueue.enqueue({
          operationType: entityType === "attendance" ? "approve_attendance" : "approve_laundry",
          endpoint: `/${entityType === "attendance" ? "shared-attendance" : "shared-laundry"}/${record.id}/action`,
          method: "PATCH",
          payload: { action: "approve" },
          entityType,
          entityId: record.id,
          bindingId: record.bindingId,
        });
        toast({
          title: "Queued for sync",
          description: "Approval will be sent when internet is available",
        });
      }
      goBack();
    } catch (err) {
      console.error("Failed to approve:", err);
      // Revert optimistic update on error
      loadRecord();
      toast({
        title: "Error",
        description: "Failed to approve record",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  }

  async function handleReject() {
    if (!record) return;

    if (!rejectionRemarks.trim()) {
      toast({
        title: "Remarks required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsActioning(true);
    try {
      // Apply optimistic update first
      applyOptimisticUpdate("rejected", rejectionRemarks);
      
      if (isOnline) {
        if (entityType === "attendance") {
          await collaborationService.actionAttendance(record.id, "reject", rejectionRemarks);
        } else {
          await collaborationService.actionLaundry(record.id, "reject", rejectionRemarks);
        }
        toast({
          title: "Rejected",
          description: `${entityType === "attendance" ? "Attendance" : "Laundry"} record rejected`,
        });
      } else {
        // Queue for later sync
        syncQueue.enqueue({
          operationType: entityType === "attendance" ? "reject_attendance" : "reject_laundry",
          endpoint: `/${entityType === "attendance" ? "shared-attendance" : "shared-laundry"}/${record.id}/action`,
          method: "PATCH",
          payload: { action: "reject", remarks: rejectionRemarks },
          entityType,
          entityId: record.id,
          bindingId: record.bindingId,
        });
        toast({
          title: "Queued for sync",
          description: "Rejection will be sent when internet is available",
        });
      }
      goBack();
    } catch (err) {
      console.error("Failed to reject:", err);
      // Revert optimistic update on error
      loadRecord();
      toast({
        title: "Error",
        description: "Failed to reject record",
        variant: "destructive",
      });
    } finally {
      setIsActioning(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-600">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600">Rejected</Badge>;
      case "revised":
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Revised</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending</Badge>;
    }
  }

  function canTakeAction(): boolean {
    if (!record) return false;
    // Can take action if it's pending and we're the action required party
    // For now, simplified logic: if pending, you can act
    return record.approvalStatus === "pending";
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Review Record</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col h-full bg-background">
        <header className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 bg-background border-b">
          <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Review Record</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <AlertCircle className="w-12 h-12 mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Record not found</p>
        </div>
      </div>
    );
  }

  const isAttendance = entityType === "attendance";
  const attendanceRecord = record as AttendanceRecord;
  const laundryRecord = record as LaundryRecord;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">
              {isAttendance ? "Attendance Review" : "Laundry Review"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(record.date), "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
        {getStatusBadge(record.approvalStatus)}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Offline indicator */}
          {!isOnline && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Offline - Actions will sync when online</span>
              </div>
            </Card>
          )}

          {/* Record Details Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              {isAttendance ? (
                <Calendar className="w-5 h-5 text-primary" />
              ) : (
                <Shirt className="w-5 h-5 text-primary" />
              )}
              <h2 className="font-semibold">Record Details</h2>
            </div>

            {isAttendance ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary">{attendanceRecord.status}</Badge>
                </div>
                {attendanceRecord.hoursWorked && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours Worked</span>
                    <span>{attendanceRecord.hoursWorked}h</span>
                  </div>
                )}
                {attendanceRecord.recordSalaryType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pay Type</span>
                    <span className="capitalize">{attendanceRecord.recordSalaryType}</span>
                  </div>
                )}
                {attendanceRecord.recordRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>{attendanceRecord.recordCurrency} {attendanceRecord.recordRate}</span>
                  </div>
                )}
                {attendanceRecord.note && (
                  <div>
                    <span className="text-muted-foreground text-sm">Note</span>
                    <p className="mt-1 text-sm">{attendanceRecord.note}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {laundryRecord.items && laundryRecord.items.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm">Items</span>
                    <div className="mt-1 space-y-1">
                      {(typeof laundryRecord.items === 'string' 
                        ? JSON.parse(laundryRecord.items) 
                        : laundryRecord.items
                      ).map((item: { name: string; quantity: number; subtotal: number }, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{laundryRecord.recordCurrency} {item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {laundryRecord.pickupDelivery && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup/Delivery</span>
                    <span>{laundryRecord.recordCurrency} {laundryRecord.pickupDeliveryCharge || 0}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{laundryRecord.recordCurrency} {laundryRecord.total}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Submitted By Card */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Submitted By</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {record.submittedByRole === "HOME" ? "Home User" : "Staff User"}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(parseISO(record.createdAt), "MMM d, yyyy h:mm a")}
              </span>
            </div>
          </Card>

          {/* Rejection Remarks (if rejected) */}
          {record.approvalStatus === "rejected" && record.rejectionRemarks && (
            <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-red-700 dark:text-red-400">Rejection Reason</h2>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">{record.rejectionRemarks}</p>
            </Card>
          )}

          {/* Revision History */}
          {revisions.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">History</h2>
              </div>
              <div className="space-y-3">
                {revisions.map((revision, idx) => (
                  <div key={revision.id} className="relative pl-4 border-l-2 border-muted">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{revision.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(revision.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      By {revision.actionByRole === "HOME" ? "Home User" : "Staff User"}
                    </p>
                    {revision.remarks && (
                      <p className="text-sm mt-1 text-muted-foreground italic">"{revision.remarks}"</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Rejection Remarks</h2>
              </div>
              <Label htmlFor="rejection-remarks" className="text-sm text-muted-foreground">
                Please provide a reason for rejection (required)
              </Label>
              <Textarea
                id="rejection-remarks"
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="Enter your remarks..."
                className="mt-2"
                rows={3}
                data-testid="input-rejection-remarks"
              />
            </Card>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canTakeAction() && (
        <div className="p-4 border-t bg-background">
          {showRejectForm ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowRejectForm(false)}
                disabled={isActioning}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={isActioning || !rejectionRemarks.trim()}
                data-testid="button-confirm-reject"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm Reject
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRejectForm(true)}
                disabled={isActioning}
                data-testid="button-reject"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={handleApprove}
                disabled={isActioning}
                data-testid="button-approve"
              >
                {isActioning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Approve
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Already actioned message */}
      {record.approvalStatus !== "pending" && (
        <div className="p-4 border-t bg-background">
          <div className="text-center text-sm text-muted-foreground">
            This record has been {record.approvalStatus}
          </div>
        </div>
      )}
    </div>
  );
}
