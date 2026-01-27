import { useLocale } from "next-intl";

import { Direction, getDirection } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

const useDirection = (): { dir: Direction; isRtl: boolean } => {
  const locale = useLocale();
  const dir = getDirection(locale as LocaleTypes);

  return { dir, isRtl: dir === "rtl" };
};

export default useDirection;
