"use client";

import React from "react";
import { useTranslations } from "next-intl";

import { IProblem } from "@/types/error";

type Props = {
  isFetching: boolean;
  hasData: boolean;
  error?: IProblem;
  fallBack: React.ReactNode;
  singleData: boolean;
  children: React.ReactNode;
};

const ClientFetchResult = ({
  isFetching,
  hasData,
  error,
  fallBack,
  singleData,
  children,
}: Props) => {
  const t = useTranslations("Common.Fetcher");

  if (isFetching) return <>{fallBack}</>;
  if (error) return <h1>{t("error", { detail: error.detail || "" })}</h1>;
  if (singleData && !hasData) return null;

  return <>{children}</>;
};

export default ClientFetchResult;
