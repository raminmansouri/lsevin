import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ApiReturnType } from "@/types/network";

type FetcherProps<T> = {
  result: ApiReturnType<T>;
  singleData?: boolean;
  children: (data: T) => React.ReactNode;
};

const ServerFetchResult = async <T extends unknown>({
  result,
  singleData,
  children,
}: FetcherProps<T>) => {
  const t = await getTranslations("Common.Fetcher");
  const { data, error } = result;

  if (error) {
    switch (error.status) {
      case 404:
        if (singleData) return notFound();
        else return null;
      default:
        throw new Error(error.detail);
    }
  }

  if (!data) {
    if (singleData) return notFound();
    else
      return <h1 className="text-center text-lg font-bold">{t("noData")}</h1>;
  }

  return <>{children(data)}</>;
};

export default ServerFetchResult;
