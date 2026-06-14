import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ApiReturnType } from "@/types/network";

type MultiFetcherProps<T extends unknown[]> = {
  results: ApiReturnType<unknown>[];
  children: (data: T) => React.ReactNode;
};

const MultiServerFetchResult = async <T extends unknown[]>({
  results,
  children,
}: MultiFetcherProps<T>) => {
  const t = await getTranslations("Common.Fetcher");
  for (const result of results) {
    const { error } = result;
    if (error) {
      if (error.status === 404) {
        return notFound();
      }
      throw new Error(error.detail);
    }
  }

  // Check if all data exists
  const allData = results.every((result) => result.data !== undefined);
  if (!allData) {
    return <h1 className="text-center text-lg font-bold">{t("noData")}</h1>;
  }

  // Extract all data values
  const dataArray = results.map((result) => result.data) as T;

  return <>{children(dataArray)}</>;
};

export default MultiServerFetchResult;
