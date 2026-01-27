import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showText?: boolean;
};

export const Logo = ({ className, showText = false }: Props) => {
  const t = useTranslations("Logo");

  return (
    <Link href="/" className={cn("flex flex-col items-center", className)}>
      <span className="text-gold text-4xl font-bold tracking-wider">
        L SEVIN
      </span>
      {showText && (
        <span className="text-muted-foreground flex w-full items-center gap-1 text-sm">
          <span>{t("medical")}</span>
          <span className="bg-primary size-1 rounded-full" />
          <span>{t("tourism")}</span>
          <span className="bg-primary size-1 rounded-full" />
          <span>{t("beauty")}</span>
        </span>
      )}
    </Link>
  );
};
