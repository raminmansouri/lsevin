"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ILocationCountry } from "@/features/shared/types/location";
import { ICurrentUser, IUserDocuments } from "@/features/shared/types/user";

import { ProfileTab, useProfileTabs } from "../hooks/use-profile-tabs";
import {
  UserAdditionalInfoForm,
  UserAdditionalInfoFormSkeleton,
} from "./user-additional-info-form";
import {
  UserBaseInfoForm,
  UserBaseInfoFormSkeleton,
} from "./user-base-info-form";
import {
  UserDocumentsForm,
  UserDocumentsFormSkeleton,
} from "./user-documents-form";
import UserDocumentsList from "./user-documents-list";

type ProfileTabsProps = {
  user: ICurrentUser;
  documents: IUserDocuments[];
  countries: ILocationCountry[];
};

export function ProfileTabs({ user, documents, countries }: ProfileTabsProps) {
  const { activeTab, setActiveTab } = useProfileTabs();
  const t = useTranslations("User.Profile");

  const handleValueChange = (value: string) => {
    setActiveTab(value as ProfileTab);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleValueChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">
          <span className="truncate overflow-hidden whitespace-nowrap">
            {t("tabs.basic")}
          </span>
        </TabsTrigger>
        <TabsTrigger value="additional">
          <span className="truncate overflow-hidden whitespace-nowrap">
            {t("tabs.additional")}
          </span>
        </TabsTrigger>
        <TabsTrigger value="documents">
          <span className="truncate overflow-hidden whitespace-nowrap">
            {t("tabs.documents")}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="mt-6">
        <UserBaseInfoForm {...user} />
      </TabsContent>
      <TabsContent value="additional" className="mt-6">
        <UserAdditionalInfoForm {...user} countries={countries} />
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        <div className="space-y-6">
          <UserDocumentsForm />
          <UserDocumentsList documents={documents} />
        </div>
      </TabsContent>
    </Tabs>
  );
}

export const ProfileTabsSkeleton = () => {
  return (
    <Tabs className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="basic">
          <Skeleton className="h-4 w-24" />
        </TabsTrigger>
        <TabsTrigger value="additional">
          <Skeleton className="h-4 w-24" />
        </TabsTrigger>
        <TabsTrigger value="documents">
          <Skeleton className="h-4 w-24" />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="mt-6">
        <UserBaseInfoFormSkeleton />
      </TabsContent>
      <TabsContent value="additional" className="mt-6">
        <UserAdditionalInfoFormSkeleton />
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        <UserDocumentsFormSkeleton />
      </TabsContent>
    </Tabs>
  );
};
