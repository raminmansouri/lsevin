import { useTranslations } from "next-intl";
import Image from "next/image";

import { Card } from "@/components/ui/card";

export const HeroSection: React.FC = () => {
  const t = useTranslations("HomePage");

  return (
    <Card className="from-gold to-gold/70 border-0 bg-gradient-to-b p-6 pb-0 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-4 text-start">
          <h1 className="text-2xl font-semibold text-zinc-700">
            {t("heroTitle")}
          </h1>
          <p className="hidden text-base text-zinc-500 md:block">
            {t("heroDescription")}
          </p>
          <p className="mb-6 hidden text-base text-zinc-500 md:block">
            {t("heroSubtext")}
          </p>
        </div>
        <Image
          src="/images/hero.png"
          alt="Doctor"
          width={195}
          height={160}
          className="max-h-[160px] max-w-[195px] self-end object-contain object-bottom md:max-h-[195px] md:max-w-[295px]"
          priority
        />
      </div>
    </Card>
  );
};

export default HeroSection;
