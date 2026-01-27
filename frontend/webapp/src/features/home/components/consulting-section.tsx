import { MessageCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export const ConsultingSection: React.FC = () => {
  const t = useTranslations("HomePage");

  return (
    <Card className="border-0 shadow">
      <div className="w-full overflow-hidden rounded-t-xl bg-gradient-to-b from-[#D5DEE7] to-[#CBD5E3]">
        <Image
          src="/images/consulting.png"
          alt="Medical Consulting"
          width={668}
          height={123}
          className="max-h-[123px] w-full object-cover md:max-h-[200px]"
        />
      </div>

      <CardFooter className="flex justify-between px-4 py-4 md:px-6 md:py-5">
        <div className="flex items-center gap-2">
          <MessageCircleIcon className="size-4" />
          <span className="text-xs font-semibold text-zinc-700 md:text-sm">
            {t("consultationRequest")}
          </span>
        </div>

        <Button
          variant="link"
          size="sm"
          className="gap-2 md:h-9 md:px-4 md:py-2 md:text-sm"
          asChild
        >
          <Link href="/consulting">{t("registerRequest")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ConsultingSection;
