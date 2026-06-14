import { ResponsiveModal } from "@/components/responsive-modal";
import { Card, CardContent } from "@/components/ui/card";

import { useConsultingDetailModal } from "../hooks/use-consulting-detail-modal";
import { IConsulting } from "../types";

type Props = {
  consulting?: IConsulting;
};

export const ConsultingDetailsModal = ({ consulting }: Props) => {
  const { consultingId, close } = useConsultingDetailModal();
  if (!consultingId || !consulting) return null;

  return (
    <ResponsiveModal
      open={!!consultingId}
      onOpenChange={close}
      title={`${consulting.customerName}`}
      description={`${consulting.customerEmail}`}
    >
      <Card className="border-0 bg-transparent shadow-none">
        <CardContent className="space-y-6 px-0">
          <div>
            <p className="text-muted-foreground text-sm">
              {consulting.categoryName}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              {consulting.description || "---"}
            </p>
          </div>
        </CardContent>
      </Card>
    </ResponsiveModal>
  );
};
