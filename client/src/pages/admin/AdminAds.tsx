import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Film } from "lucide-react";

export default function AdminAds() {
  return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Film className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-lg" data-testid="text-ads-disabled">
                Ads Feature Disabled
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                The advertisements feature is currently disabled.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
