import { Home, Briefcase, ArrowRight, Shield, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigation } from "@/lib/navigation";
import { permissionsService } from "@/lib/permissions-service";
import type { UserType } from "@shared/schema";

interface RoleCardProps {
  type: UserType;
  title: string;
  description: string;
  icon: typeof Home;
  features: string[];
  onSelect: () => void;
}

function RoleCard({ type, title, description, icon: Icon, features, onSelect }: RoleCardProps) {
  return (
    <Card
      className="p-3 flex flex-col gap-2.5 cursor-pointer hover-elevate active-elevate-2"
      onClick={onSelect}
      data-testid={`card-role-${type.toLowerCase()}`}
    >
      <div className="flex items-start gap-3">
        <div className="icon-halo-primary w-10 h-10 flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base" data-testid={`text-role-title-${type.toLowerCase()}`}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      
      <ul className="flex flex-col gap-1.5 pl-1">
        {features.map((feature, index) => (
          <li key={index} className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ArrowRight className="w-2.5 h-2.5 text-primary flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      
      <Button className="w-full mt-1" data-testid={`button-select-${type.toLowerCase()}`}>
        Continue as {title}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </Card>
  );
}

export function RoleSelectionScreen() {
  const { navigate } = useNavigation();

  const handleSelectRole = (type: UserType) => {
    if (permissionsService.hasCompletedPermissionsFlow()) {
      navigate("onboarding", { userType: type });
    } else {
      navigate("permissions", { userType: type });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background page-enter" data-testid="screen-role-selection">
      <div className="safe-area-top" />

      <div className="flex-1 overflow-y-auto">
        <div className="content-container py-4 flex flex-col gap-4">
          <div className="flex flex-col items-center text-center gap-3 fade-in-up">
            <div className="icon-halo-primary w-14 h-14">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold" data-testid="text-choose-role">
                Select Your Default Mode
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose how you will use the app primarily.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <RoleCard
              type="HOME"
              title="Home User"
              description="For home users managing domestic staff at home, and household stuff"
              icon={Home}
              features={[
                "Track staff attendance & salary payments",
                "Manage household bills & expenses",
                "Record laundry batches with pricing",
                "Generate reports & export data",
              ]}
              onSelect={() => handleSelectRole("HOME")}
            />

            <RoleCard
              type="STAFF"
              title="Staff User"
              description="For service professionals managing their work"
              icon={Briefcase}
              features={[
                "Log attendance at multiple client homes",
                "Track earnings & personal expenses",
                "Manage laundry jobs & invoices",
                "Generate business reports",
              ]}
              onSelect={() => handleSelectRole("STAFF")}
            />
          </div>

          <div className="flex items-center gap-2 px-2 fade-in-up" style={{ animationDelay: "200ms" }}>
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              You can switch between the modes and change the default mode from the Settings easily.
            </p>
          </div>

          <Card className="p-3 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 fade-in-up" style={{ animationDelay: "300ms" }}>
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-primary">100% Private</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All your data stays on your device. No cloud, no accounts, complete privacy.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="safe-area-bottom" />
    </div>
  );
}
