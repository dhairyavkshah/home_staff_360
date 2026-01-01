import { useMemo } from "react";
import { CheckCircle, MinusCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { AppLayout, ScrollContent } from "@/components/layout/AppLayout";
import { useNavigation } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import { formatDate } from "@/lib/calculations";

export function PersonCalendarScreen() {
  const { navigate, data } = useNavigation();
  const personId = data.personId as string;
  const source = data.source as "attendance" | "payables" | "quick-pay" | "person-detail" | undefined;
  
  const handleBack = () => {
    if (source === "payables") {
      navigate("payables");
    } else {
      navigate("person-detail", { personId });
    }
  };

  const person = useMemo(() => storage.getPerson(personId), [personId]);

  const attendance = useMemo(() => {
    return storage
      .getAttendanceByPerson(personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [personId]);

  if (!person) {
    return (
      <AppLayout>
        <Header title="Calendar" onBack={handleBack} />
        <ScrollContent>
          <p className="text-center text-muted-foreground">Staff not found.</p>
        </ScrollContent>
      </AppLayout>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "FULL":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "HALF":
        return <MinusCircle className="w-5 h-5 text-warning" />;
      case "ABSENT":
        return <XCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <Header
        title={`${person.name}'s Calendar`}
        subtitle="Attendance history"
        onBack={handleBack}
      />

      <ScrollContent>
        {attendance.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No attendance records yet</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {attendance.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(entry.status)}
                  <div>
                    <p className="font-medium">{formatDate(entry.date)}</p>
                    {entry.hours && (
                      <p className="text-sm text-muted-foreground">{entry.hours} hours</p>
                    )}
                    {entry.note && (
                      <p className="text-sm text-muted-foreground">{entry.note}</p>
                    )}
                  </div>
                </div>
                <span className="text-sm capitalize">{entry.status.toLowerCase()}</span>
              </div>
            ))}
          </Card>
        )}
      </ScrollContent>
    </AppLayout>
  );
}
