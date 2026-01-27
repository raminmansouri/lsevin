import { getTranslations } from "next-intl/server";

import { LocaleParams, TranslationType } from "@/types/next";

type Props = {
  params: Promise<LocaleParams>;
  tanslationNameSpace: string;
  children: (t: TranslationType) => React.ReactNode;
};
const LocaleBoundary = async ({
  children,
  params,
  tanslationNameSpace,
}: Props) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: tanslationNameSpace });
  return children(t);
};

export default LocaleBoundary;
