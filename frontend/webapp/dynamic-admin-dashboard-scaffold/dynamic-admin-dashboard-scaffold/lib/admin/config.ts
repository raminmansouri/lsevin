import { AdminLocaleConfig, AdminOverrideMap } from "./types";
import { Layers3, FolderTree, BriefcaseMedical } from "lucide-react";

export const adminLocales: AdminLocaleConfig = {
  supported: ["en", "fa", "ar"],
  defaultLocale: "en",
  fallbackLocale: "en",
};

export const adminOverrides: AdminOverrideMap = {
  "category.categories": {
    label: "Categories",
    icon: FolderTree.name,
    listColumns: ["id", "name_translations", "slug", "display_order", "is_active"],
    defaultSort: { field: "display_order", direction: "asc" },
    columns: {
      id: { readOnly: true, form: false },
      name_translations: { fieldKind: "multilingual", label: "Name", searchable: true },
      description_translations: { fieldKind: "multilingual", label: "Description", form: true, list: false },
      image_url: { fieldKind: "image", label: "Image" },
      slug: { searchable: true },
      display_order: { fieldKind: "number", label: "Display Order" },
      is_active: { fieldKind: "boolean", label: "Active" },
      create_date: { readOnly: true, form: false },
      last_modified_date: { readOnly: true, form: false },
    },
  },
  "category.service_definitions": {
    label: "Service Definitions",
    icon: Layers3.name,
    listColumns: ["id", "category_id", "name_translations", "display_order", "is_active"],
    defaultSort: { field: "display_order", direction: "asc" },
    columns: {
      id: { readOnly: true, form: false },
      category_id: {
        label: "Category",
        fieldKind: "relation",
        relation: { displayField: "name_translations" },
      },
      name_translations: { fieldKind: "multilingual", label: "Name", searchable: true },
      description_translations: { fieldKind: "multilingual", label: "Description", form: true, list: false },
      display_order: { fieldKind: "number" },
      is_active: { fieldKind: "boolean" },
      create_date: { readOnly: true, form: false },
      last_modified_date: { readOnly: true, form: false },
    },
  },
  "category.provider_services": {
    label: "Provider Services",
    icon: BriefcaseMedical.name,
    listColumns: ["id", "service_provider_id", "service_definition_id", "display_name_translations", "value", "is_active"],
    defaultSort: { field: "create_date", direction: "desc" },
    columns: {
      id: { readOnly: true, form: false },
      service_provider_id: {
        label: "Provider",
        fieldKind: "relation",
        relation: { displayField: "name_translations" },
      },
      service_definition_id: {
        label: "Service Definition",
        fieldKind: "relation",
        relation: { displayField: "name_translations" },
      },
      display_name_translations: { fieldKind: "multilingual", label: "Display Name", searchable: true },
      description_translations: { fieldKind: "multilingual", label: "Description", list: false },
      image_url: { fieldKind: "image", label: "Image" },
      value: { fieldKind: "number", label: "Price" },
      rating: { fieldKind: "number" },
      review_count: { fieldKind: "number" },
      is_active: { fieldKind: "boolean" },
      create_date: { readOnly: true, form: false },
      last_modified_date: { readOnly: true, form: false },
    },
  },
};
