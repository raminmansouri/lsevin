import type { AdminFieldConfig, AdminSchemaName, AdminTableConfig } from "./types";

const ADMIN_DEFAULT_LOCALE = "en-US";
const ADMIN_FALLBACK_LOCALE = "fa-IR";

const translationTemplate = {
  "ar-SA": "",
  "de-DE": "",
  "en-US": "",
  "es-ES": "",
  "fa-IR": "",
  "fr-FR": "",
  "ku-KU": "",
  "tr-TR": "",
};

const safeJsonbObject = (column: string) =>
  `case when jsonb_typeof(${column}) = 'object' then ${column} else '{}'::jsonb end`;

const translationLabel = (column: string, locale = ADMIN_DEFAULT_LOCALE, fallbackLocale = ADMIN_FALLBACK_LOCALE) =>
  `common.get_translation_t(${safeJsonbObject(column)}, '${locale}', '${fallbackLocale}')`;

const userRelation = {
  lookupType: "identityUsers",
  contentClassName: "w-[520px]",
  schema: "identity",
  table: "asp_net_users",
  valueColumn: "id",
  labelExpression: "concat(first_name, ' ', last_name, ' — ', email)",
  searchColumns: ["first_name", "last_name", "email", "phone_number"],
  orderBy: "created_at desc",
};

const roleRelation = {
  lookupType: "identityRoles",
  schema: "identity",
  table: "asp_net_roles",
  valueColumn: "id",
  labelExpression: "coalesce(name, id::text)",
  searchColumns: ["name", "normalized_name"],
  orderBy: "name asc",
};

const customerRelation = {
  lookupType: "customers",
  contentClassName: "w-[520px]",
  schema: "customer",
  table: "customers",
  valueColumn: "id",
  labelExpression: "concat(first_name, ' ', last_name, ' — ', email)",
  searchColumns: ["first_name", "last_name", "email", "phone_number"],
  orderBy: "create_date desc",
};

const bookingRelation = {
  lookupType: "bookings",
  contentClassName: "w-[560px]",
  schema: "booking",
  table: "bookings",
  valueColumn: "id",
  labelExpression: "concat(coalesce(confirmation_code, id::text), ' — ', selected_date::text, ' ', selected_time::text)",
  searchColumns: ["confirmation_code", "payment_reference"],
  orderBy: "create_date desc",
};

const providerRelation = {
  lookupType: "serviceProviders",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "service_providers",
  valueColumn: "id",
  labelExpression: translationLabel("name_translations"),
  searchColumns: ["email", "phone_number"],
  orderBy: "create_date desc",
};

const providerServiceRelation = {
  lookupType: "providerServices",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "provider_services",
  valueColumn: "id",
  labelExpression: translationLabel("display_name_translations"),
  orderBy: "create_date desc",
};

const staffRelation = {
  lookupType: "staff",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "staff",
  valueColumn: "id",
  labelExpression: translationLabel("name_translations"),
  orderBy: "create_date desc",
};

const addonRelation = {
  lookupType: "addons",
  schema: "category",
  table: "addons",
  valueColumn: "id",
  labelExpression: "concat(name, ' — ', price::text)",
  searchColumns: ["id", "name"],
  orderBy: "name asc",
};

const uploadRequirementRelation = {
  lookupType: "serviceUploadFileRequirements",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "service_upload_file_requirements",
  valueColumn: "id",
  labelExpression: translationLabel("title_translations"),
  orderBy: "display_order asc",
};

const documentTypeRelation = {
  lookupType: "customerDocumentTypes",
  schema: "customer",
  table: "customer_document_types",
  valueColumn: "id",
  labelExpression: "name",
  searchColumns: ["name"],
  orderBy: "id asc",
};

const walletAccountRelation = {
  lookupType: "walletAccounts",
  contentClassName: "w-[520px]",
  schema: "customer",
  table: "wallet_accounts",
  valueColumn: "id",
  labelExpression: "concat(user_id::text, ' — ', default_currency)",
  orderBy: "create_date desc",
};

const walletPaymentIntentRelation = {
  lookupType: "walletPaymentIntents",
  contentClassName: "w-[520px]",
  schema: "customer",
  table: "wallet_payment_intents",
  valueColumn: "id",
  labelExpression: "concat(status, ' — ', amount::text, ' ', currency_code)",
  orderBy: "create_date desc",
};

const pickedLocationRelation = {
  lookupType: "pickedLocations",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "picked_locations",
  valueColumn: "id",
  labelExpression: "concat(id::text, ' — ', coalesce(latitude::text, ''), ',', coalesce(longitude::text, ''))",
  orderBy: "id desc",
};

const countryLocationRelation = {
  lookupType: "countryLocations",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "locations",
  valueColumn: "id",
  labelExpression: `concat(code, ' — ', ${translationLabel("value_translations")})`,
  where: "location_type_id = 1",
  searchColumns: ["code"],
  orderBy: "display_order asc nulls last, code asc",
};

const cityLocationRelation = {
  lookupType: "cityLocations",
  contentClassName: "w-[520px]",
  schema: "category",
  table: "locations",
  valueColumn: "id",
  labelExpression: `concat(code, ' — ', ${translationLabel("value_translations")})`,
  where: "location_type_id = 2",
  searchColumns: ["code"],
  orderBy: "display_order asc nulls last, code asc",
};

const id = (name = "id"): AdminFieldConfig => ({ name, kind: "text", readonly: true, createHidden: true, updateHidden: true });
const uuid = (name: string, relation?: AdminFieldConfig["relation"], required = false): AdminFieldConfig => ({ name, kind: relation ? "select" : "text", relation, required });
const text = (name: string, required = false): AdminFieldConfig => ({ name, kind: "text", required });
const textarea = (name: string, required = false): AdminFieldConfig => ({ name, kind: "textarea", required });
const num = (name: string, required = false): AdminFieldConfig => ({ name, kind: "number", required });
const bool = (name: string, defaultValue = false): AdminFieldConfig => ({ name, kind: "boolean", defaultValue });
const date = (name: string, required = false): AdminFieldConfig => ({ name, kind: "date", required });
const time = (name: string, required = false): AdminFieldConfig => ({ name, kind: "time", required });
const datetime = (name: string): AdminFieldConfig => ({ name, kind: "datetime" });
const isRichLocalizedColumn = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes("description") || lower.includes("biography") || lower.includes("detail") || lower.includes("body") || lower.includes("content");
};

const json = (name: string, required = false): AdminFieldConfig => {
  if (name.endsWith("_translations")) {
    const richText = isRichLocalizedColumn(name);
    return {
      name,
      kind: richText ? "localized-rich" : "localized",
      required,
      defaultValue: translationTemplate,
      rows: richText ? 4 : undefined,
      maxLength: richText ? 2000 : 250,
    };
  }

  return {
    name,
    kind: "json",
    required,
    defaultValue: required ? "{}" : "",
  };
};
const array = (name: string): AdminFieldConfig => ({ name, kind: "array" });
const media = (name: string, mediaType: "image" | "video" | "all" = "all"): AdminFieldConfig => ({ name, kind: "media-single", mediaType });
const select = (name: string, options: string[], required = false): AdminFieldConfig => ({ name, kind: "select", options, required });
const created = (name = "create_date"): AdminFieldConfig => ({ name, kind: "datetime", readonly: true, createHidden: true });
const modified = (name = "last_modified_date"): AdminFieldConfig => ({ name, kind: "datetime", readonly: true, createHidden: true });

const messageTables = (schema: AdminSchemaName): AdminTableConfig[] => [
  {
    schema,
    table: "inbox_messages",
    title: `${schema} inbox messages`,
    description: "Inbox integration events. Read-only operational table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "occurred_on_utc desc",
    searchableColumns: ["type", "error"],
    listColumns: ["id", "type", "occurred_on_utc", "processed_on_utc", "error"],
    dateColumn: "occurred_on_utc",
    fields: [id(), text("type", true), json("content", true), datetime("occurred_on_utc"), datetime("processed_on_utc"), textarea("error")],
  },
  {
    schema,
    table: "outbox_messages",
    title: `${schema} outbox messages`,
    description: "Outbox integration events. Read-only operational table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "occurred_on_utc desc",
    searchableColumns: ["type", "error"],
    listColumns: ["id", "type", "occurred_on_utc", "processed_on_utc", "error"],
    dateColumn: "occurred_on_utc",
    fields: [id(), text("type", true), json("content", true), datetime("occurred_on_utc"), datetime("processed_on_utc"), textarea("error")],
  },
  {
    schema,
    table: "internal_command_messages",
    title: `${schema} internal commands`,
    description: "Internal command queue messages. Read-only operational table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "occurred_on_utc desc",
    searchableColumns: ["type", "error"],
    listColumns: ["id", "type", "occurred_on_utc", "processed_on_utc", "error"],
    dateColumn: "occurred_on_utc",
    fields: [id(), text("type", true), json("content", true), datetime("occurred_on_utc"), datetime("processed_on_utc"), textarea("error")],
  },
];

export const ADMIN_TABLES: AdminTableConfig[] = [
  {
    schema: "booking",
    table: "bookings",
    title: "Bookings",
    description: "Confirmed and pending checkout bookings, payment references, uploaded files, and selected slots.",
    primaryKey: ["id"],
    dangerousDelete: true,
    defaultOrderBy: "create_date desc",
    searchableColumns: ["confirmation_code", "payment_reference", "payment_method", "booking_status", "payment_status"],
    listColumns: ["confirmation_code", "booking_status", "payment_status", "selected_date", "selected_time", "total_amount", "paid_amount", "currency_code"],
    badgeColumn: "booking_status",
    amountColumn: "total_amount",
    dateColumn: "selected_date",
    fields: [
      uuid("provider_id", providerRelation, true), uuid("service_id", providerServiceRelation, true), uuid("specialist_id", staffRelation, true),
      date("selected_date", true), time("selected_date_from", true), time("selected_date_to", true), time("selected_time", true), time("selected_time_from", true), time("selected_time_to", true),
      text("payment_method", true), json("add_ons", true), json("upload_files", true), json("additional_services"),
      select("payment_status", ["Pending", "Paid", "Failed", "Refunded", "Cancelled"]), text("confirmation_code"), id(),
      select("booking_status", ["Pending", "Confirmed", "Cancelled", "Completed", "NoShow"], true), created(), modified(), uuid("user_id", userRelation),
      text("currency_code"), num("total_amount"), num("paid_amount"), text("payment_reference"), uuid("wallet_payment_intent_id", walletPaymentIntentRelation),
    ],
  },
  {
    schema: "booking",
    table: "booking_drafts",
    title: "Booking drafts",
    description: "In-progress booking checkout state by user, provider, service, specialist, and step.",
    primaryKey: ["id"],
    defaultOrderBy: "updated_at desc",
    searchableColumns: ["status", "payment_method", "notes"],
    listColumns: ["id", "status", "current_step", "selected_date", "selected_time", "total_amount", "currency", "updated_at"],
    badgeColumn: "status",
    amountColumn: "total_amount",
    dateColumn: "updated_at",
    fields: [id(), uuid("user_id", userRelation), uuid("provider_id", providerRelation), uuid("service_id", providerServiceRelation), uuid("specialist_id", staffRelation), date("selected_date"), time("selected_time"), time("selected_time_from"), time("selected_time_to"), bool("use_lsevin"), num("current_step", true), text("payment_method"), text("currency", true), num("subtotal_amount"), num("addons_amount"), num("total_amount"), select("status", ["Draft", "Submitted", "Expired", "Cancelled"], true), textarea("notes"), json("metadata", true), datetime("created_at"), datetime("updated_at"), datetime("submitted_at")],
  },
  {
    schema: "booking",
    table: "booking_draft_addons",
    title: "Draft add-ons",
    description: "Add-ons selected while a booking is still a draft.",
    primaryKey: ["draft_id", "addon_id"],
    defaultOrderBy: "created_at desc",
    listColumns: ["draft_id", "addon_id", "source_type", "addon_kind", "quantity", "unit_price"],
    amountColumn: "unit_price",
    fields: [uuid("draft_id", { schema: "booking", table: "booking_drafts", valueColumn: "id", labelExpression: "concat(status, ' — ', id::text)", orderBy: "updated_at desc" }, true), uuid("addon_id", addonRelation, true), text("source_type", true), text("addon_kind", true), num("quantity", true), num("unit_price", true), json("config", true), datetime("created_at")],
  },
  {
    schema: "booking",
    table: "booking_draft_documents",
    title: "Draft documents",
    description: "Files uploaded during draft checkout, optionally tied to upload requirements.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    searchableColumns: ["title", "file_name", "mime_type"],
    listColumns: ["title", "file_name", "mime_type", "size_bytes", "created_at"],
    dateColumn: "created_at",
    fields: [id(), uuid("draft_id", { schema: "booking", table: "booking_drafts", valueColumn: "id", labelExpression: "concat(status, ' — ', id::text)", orderBy: "updated_at desc" }, true), uuid("requirement_id", uploadRequirementRelation), text("title", true), text("file_name", true), media("file_url", "all"), text("mime_type"), num("size_bytes"), datetime("created_at")],
  },
  {
    schema: "booking",
    table: "booking_addons",
    title: "Booking add-ons",
    description: "Final add-ons attached to submitted bookings.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    listColumns: ["booking_id", "addon_id", "source_type", "addon_kind", "quantity", "unit_price"],
    amountColumn: "unit_price",
    fields: [id(), uuid("booking_id", bookingRelation, true), uuid("addon_id", addonRelation, true), text("source_type", true), text("addon_kind", true), num("quantity", true), num("unit_price", true), json("config", true), datetime("created_at")],
  },
  {
    schema: "booking",
    table: "booking_documents",
    title: "Booking documents",
    description: "Final booking file uploads and medical/travel documents.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    searchableColumns: ["title", "file_name", "mime_type"],
    listColumns: ["booking_id", "title", "file_name", "mime_type", "size_bytes", "created_at"],
    dateColumn: "created_at",
    fields: [id(), uuid("booking_id", bookingRelation, true), uuid("requirement_id", uploadRequirementRelation), text("title", true), text("file_name", true), media("file_url", "all"), text("mime_type"), num("size_bytes"), datetime("created_at")],
  },
  {
    schema: "booking",
    table: "payments",
    title: "Booking payments",
    description: "Payment rows attached to bookings, gateways, payloads, and external references.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    searchableColumns: ["payment_method", "gateway", "status", "external_reference"],
    listColumns: ["booking_id", "payment_method", "gateway", "amount", "currency", "status", "created_at"],
    badgeColumn: "status",
    amountColumn: "amount",
    dateColumn: "created_at",
    fields: [id(), uuid("booking_id", bookingRelation, true), uuid("user_id", userRelation), text("payment_method", true), text("gateway"), num("amount", true), text("currency", true), select("status", ["Pending", "Processing", "Paid", "Failed", "Refunded", "Cancelled"], true), text("external_reference"), json("gateway_payload", true), datetime("created_at"), datetime("updated_at")],
  },
  {
    schema: "identity",
    table: "asp_net_users",
    title: "Identity users",
    description: "Application login accounts, profile fields, confirmation flags, lockout, and profile image.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    searchableColumns: ["first_name", "last_name", "email", "user_name", "phone_number"],
    listColumns: ["first_name", "last_name", "email", "user_state", "email_confirmed", "phone_number_confirmed", "last_logged_in_at"],
    badgeColumn: "user_state",
    dateColumn: "created_at",
    fields: [id(), text("first_name", true), text("last_name", true), text("phone_number_country_code", true), datetime("last_logged_in_at"), select("user_state", ["Active", "Inactive", "Suspended", "Deleted"], true), datetime("created_at"), text("user_name", true), text("normalized_user_name", true), text("email", true), text("normalized_email", true), bool("email_confirmed"), { name: "password_hash", kind: "textarea", readonly: true, createHidden: true, updateHidden: true }, { name: "security_stamp", kind: "text", readonly: true, createHidden: true }, { name: "concurrency_stamp", kind: "text", readonly: true, createHidden: true }, text("phone_number", true), bool("phone_number_confirmed"), bool("two_factor_enabled"), datetime("lockout_end"), bool("lockout_enabled"), num("access_failed_count"), bool("is_profile_confirmed"), datetime("profile_confirmed_at"), date("birth_date"), select("gender", ["Male", "Female", "Other", "PreferNotToSay"]), textarea("address"), text("city"), text("country"), media("profile_image_url", "image"), datetime("profile_image_updated_at")],
  },
  {
    schema: "identity",
    table: "asp_net_roles",
    title: "Identity roles",
    description: "ASP.NET Identity roles used by the application.",
    primaryKey: ["id"],
    defaultOrderBy: "name asc",
    searchableColumns: ["name", "normalized_name"],
    listColumns: ["name", "normalized_name"],
    fields: [id(), text("name"), text("normalized_name"), { name: "concurrency_stamp", kind: "text", readonly: true, createHidden: true }],
  },
  {
    schema: "identity",
    table: "asp_net_user_roles",
    title: "User roles",
    description: "Join table assigning identity roles to users.",
    primaryKey: ["user_id", "role_id"],
    defaultOrderBy: "user_id asc",
    listColumns: ["user_id", "role_id"],
    fields: [uuid("user_id", userRelation, true), uuid("role_id", roleRelation, true)],
  },
  {
    schema: "identity",
    table: "asp_net_role_claims",
    title: "Role claims",
    description: "Claims attached to identity roles.",
    primaryKey: ["id"],
    defaultOrderBy: "id desc",
    searchableColumns: ["claim_type", "claim_value"],
    listColumns: ["role_id", "claim_type", "claim_value"],
    fields: [id(), uuid("role_id", roleRelation, true), text("claim_type"), textarea("claim_value")],
  },
  {
    schema: "identity",
    table: "asp_net_user_claims",
    title: "User claims",
    description: "Claims attached directly to users.",
    primaryKey: ["id"],
    defaultOrderBy: "id desc",
    searchableColumns: ["claim_type", "claim_value"],
    listColumns: ["user_id", "claim_type", "claim_value"],
    fields: [id(), uuid("user_id", userRelation, true), text("claim_type"), textarea("claim_value")],
  },
  {
    schema: "identity",
    table: "asp_net_user_logins",
    title: "External user logins",
    description: "External login providers linked to users.",
    primaryKey: ["login_provider", "provider_key"],
    defaultOrderBy: "login_provider asc",
    searchableColumns: ["login_provider", "provider_key", "provider_display_name"],
    listColumns: ["login_provider", "provider_key", "provider_display_name", "user_id"],
    fields: [text("login_provider", true), text("provider_key", true), text("provider_display_name"), uuid("user_id", userRelation, true)],
  },
  {
    schema: "identity",
    table: "asp_net_user_tokens",
    title: "User tokens",
    description: "Named tokens attached to users. Usually read-only except support/debug cases.",
    primaryKey: ["user_id", "login_provider", "name"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "user_id asc",
    searchableColumns: ["login_provider", "name"],
    listColumns: ["user_id", "login_provider", "name"],
    fields: [uuid("user_id", userRelation, true), text("login_provider", true), text("name", true), { name: "value", kind: "textarea", readonly: true }],
  },
  {
    schema: "identity",
    table: "access_tokens",
    title: "Access tokens",
    description: "Issued access tokens. Read-only; use delete/revoke through database support workflow if needed.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "created_at desc",
    searchableColumns: ["created_by_ip"],
    listColumns: ["user_id", "created_at", "expired_at", "created_by_ip"],
    dateColumn: "created_at",
    fields: [id(), uuid("user_id", userRelation, true), { name: "token", kind: "textarea", readonly: true }, datetime("created_at"), datetime("expired_at"), text("created_by_ip")],
  },
  {
    schema: "identity",
    table: "refresh_tokens",
    title: "Refresh tokens",
    description: "Refresh tokens and revocation state. Read-only except support revocation if you enable deletes.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "created_at desc",
    listColumns: ["user_id", "created_at", "expired_at", "revoked_at", "created_by_ip"],
    dateColumn: "created_at",
    fields: [id(), uuid("user_id", userRelation, true), { name: "token", kind: "textarea", readonly: true }, datetime("created_at"), datetime("expired_at"), text("created_by_ip"), datetime("revoked_at")],
  },
  {
    schema: "identity",
    table: "phone_login_codes",
    title: "Phone login codes",
    description: "OTP codes for phone login. Read-only operational/security table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "sent_at desc",
    searchableColumns: ["phone_number"],
    listColumns: ["user_id", "phone_number_country_code", "phone_number", "sent_at", "expires_at", "used_at", "attempt_count", "is_invalidated"],
    dateColumn: "sent_at",
    fields: [id(), uuid("user_id", userRelation, true), { name: "code", kind: "text", readonly: true }, datetime("sent_at"), datetime("used_at"), datetime("expires_at"), num("attempt_count"), bool("is_invalidated"), text("phone_number_country_code"), text("phone_number")],
  },
  {
    schema: "identity",
    table: "email_verification_codes",
    title: "Email verification codes",
    description: "Email verification OTPs. Read-only security table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "sent_at desc",
    searchableColumns: ["email"],
    listColumns: ["email", "sent_at", "used_at"],
    fields: [id(), text("email"), { name: "code", kind: "text", readonly: true }, datetime("sent_at"), datetime("used_at")],
  },
  {
    schema: "identity",
    table: "password_reset_codes",
    title: "Password reset codes",
    description: "Password reset OTPs. Read-only security table.",
    primaryKey: ["id"],
    readOnly: true,
    systemTable: true,
    defaultOrderBy: "sent_at desc",
    searchableColumns: ["email"],
    listColumns: ["email", "sent_at", "used_at"],
    fields: [id(), text("email"), { name: "code", kind: "text", readonly: true }, datetime("sent_at"), datetime("used_at")],
  },
  {
    schema: "identity",
    table: "user_preferences",
    title: "User preferences",
    description: "Locale, currency, location, GPS preference, theme, and notification settings.",
    primaryKey: ["user_id"],
    defaultOrderBy: "last_modified_date desc",
    searchableColumns: ["preferred_locale", "preferred_currency_code"],
    listColumns: ["user_id", "selected_source", "preferred_locale", "preferred_currency_code", "preferred_theme", "notifications_enabled"],
    badgeColumn: "selected_source",
    fields: [uuid("user_id", userRelation, true), uuid("selected_country_location_id", countryLocationRelation), uuid("selected_city_location_id", cityLocationRelation), uuid("selected_picked_location_id", pickedLocationRelation), select("selected_source", ["manual", "picked_location", "gps"], true), bool("use_current_location"), num("current_latitude"), num("current_longitude"), text("preferred_locale", true), text("preferred_currency_code", true), select("preferred_theme", ["system", "light", "dark"], true), select("distance_unit", ["km", "mi"], true), bool("notifications_enabled", true), bool("marketing_notifications_enabled"), json("extra_preferences", true), created(), modified()],
  },
  ...messageTables("identity"),
  {
    schema: "customer",
    table: "customers",
    title: "Customers",
    description: "Customer profile records linked to app users and booking/wallet behavior.",
    primaryKey: ["id"],
    defaultOrderBy: "create_date desc",
    searchableColumns: ["first_name", "last_name", "email", "phone_number", "city", "country"],
    listColumns: ["first_name", "last_name", "email", "phone_number", "country", "city", "is_active", "is_profile_confirmed"],
    badgeColumn: "is_active",
    dateColumn: "create_date",
    fields: [id(), text("phone_number", true), text("phone_number_country_code", true), text("email", true), datetime("birth_date"), json("street_translations"), text("city"), text("country"), json("detail_translations"), text("zip_code"), text("first_name", true), text("last_name", true), created(), modified(), select("gender", ["Male", "Female", "Other", "PreferNotToSay"]), bool("is_active", true), num("latitude"), num("longitude"), bool("is_profile_confirmed"), datetime("profile_confirmed_at")],
  },
  {
    schema: "customer",
    table: "customer_document_types",
    title: "Customer document types",
    description: "Lookup list for customer document categories.",
    primaryKey: ["id"],
    defaultOrderBy: "id asc",
    searchableColumns: ["name"],
    listColumns: ["id", "name"],
    fields: [id(), text("name", true)],
  },
  {
    schema: "customer",
    table: "customer_documents",
    title: "Customer documents",
    description: "Customer uploaded documents, medical files, and identity/travel documents.",
    primaryKey: ["id"],
    defaultOrderBy: "create_date desc",
    searchableColumns: ["document_url"],
    listColumns: ["customer_id", "document_type_id", "document_url", "create_date"],
    dateColumn: "create_date",
    fields: [id(), uuid("document_type_id", documentTypeRelation, true), media("document_url", "all"), uuid("customer_id", customerRelation, true), created(), modified()],
  },
  {
    schema: "customer",
    table: "consultings",
    title: "Consultings",
    description: "Customer consulting requests and category metadata.",
    primaryKey: ["id"],
    defaultOrderBy: "create_date desc",
    searchableColumns: ["description", "category_name"],
    listColumns: ["customer_id", "category_name", "description", "create_date"],
    dateColumn: "create_date",
    fields: [id(), uuid("customer_id", customerRelation, true), textarea("description", true), created(), modified(), uuid("category_id", { schema: "category", table: "categories", valueColumn: "id", labelExpression: translationLabel("name_translations"), orderBy: "display_order asc" }, true), text("category_name", true)],
  },
  {
    schema: "customer",
    table: "consulting_selected_document_references",
    title: "Consulting document references",
    description: "Join table mapping customer documents to consultings.",
    primaryKey: ["consulting_id", "customer_document_id"],
    listColumns: ["consulting_id", "customer_document_id"],
    fields: [uuid("customer_document_id", { schema: "customer", table: "customer_documents", valueColumn: "id", labelExpression: "concat(document_url, ' — ', id::text)", orderBy: "create_date desc" }, true), uuid("consulting_id", { schema: "customer", table: "consultings", valueColumn: "id", labelExpression: "concat(category_name, ' — ', id::text)", orderBy: "create_date desc" }, true)],
  },
  {
    schema: "customer",
    table: "favorites",
    title: "Favorites",
    description: "Customer saved providers, services, and specialists.",
    primaryKey: ["id"],
    defaultOrderBy: "created_at desc",
    listColumns: ["customer_id", "favorite_type", "entity_id", "created_at"],
    badgeColumn: "favorite_type",
    dateColumn: "created_at",
    fields: [id(), uuid("customer_id", customerRelation, true), select("favorite_type", ["provider", "service", "specialist"], true), text("entity_id", true), datetime("created_at")],
  },
  {
    schema: "customer",
    table: "wallet_accounts",
    title: "Wallet accounts",
    description: "One wallet account per user with default currency and active state.",
    primaryKey: ["id"],
    defaultOrderBy: "create_date desc",
    listColumns: ["user_id", "default_currency", "is_active", "create_date"],
    fields: [id(), uuid("user_id", userRelation, true), text("default_currency", true), bool("is_active", true), created(), modified()],
  },
  {
    schema: "customer",
    table: "wallet_payment_intents",
    title: "Wallet payment intents",
    description: "Top-up and booking payment intents, gateway references, client secrets, and status.",
    primaryKey: ["id"],
    defaultOrderBy: "create_date desc",
    searchableColumns: ["intent_type", "payment_method", "gateway_name", "gateway_reference", "status"],
    listColumns: ["user_id", "booking_id", "intent_type", "payment_method", "amount", "currency_code", "status"],
    badgeColumn: "status",
    amountColumn: "amount",
    dateColumn: "create_date",
    fields: [id(), uuid("wallet_account_id", walletAccountRelation, true), uuid("user_id", userRelation, true), uuid("booking_id", bookingRelation), select("intent_type", ["topup", "booking_payment"], true), select("payment_method", ["card", "bank", "apple", "wallet"], true), text("gateway_name"), text("gateway_reference"), { name: "client_secret", kind: "textarea", readonly: true }, text("redirect_url"), text("currency_code", true), num("amount", true), select("status", ["pending", "requires_action", "processing", "succeeded", "failed", "cancelled", "expired"], true), json("metadata", true), datetime("expires_at"), created(), modified()],
  },
  {
    schema: "customer",
    table: "wallet_transactions",
    title: "Wallet transactions",
    description: "Ledger-like wallet movements, booking payments, refunds, cashback, and manual adjustments.",
    primaryKey: ["id"],
    defaultOrderBy: "occurred_at desc",
    searchableColumns: ["transaction_type", "direction", "status", "title", "subtitle", "payment_method"],
    listColumns: ["user_id", "transaction_type", "direction", "status", "title", "currency_code", "amount", "occurred_at"],
    badgeColumn: "status",
    amountColumn: "amount",
    dateColumn: "occurred_at",
    fields: [id(), uuid("wallet_account_id", walletAccountRelation, true), uuid("user_id", userRelation, true), uuid("booking_id", bookingRelation), uuid("payment_intent_id", walletPaymentIntentRelation), select("transaction_type", ["topup", "booking_payment", "refund", "cashback", "referral_bonus", "manual_adjustment", "withdrawal"], true), select("direction", ["credit", "debit"], true), select("status", ["pending", "processing", "completed", "failed", "cancelled", "refunded"], true), select("payment_method", ["card", "bank", "apple", "wallet", "manual"]), text("title", true), text("subtitle"), text("currency_code", true), num("amount", true), json("metadata", true), datetime("occurred_at"), created(), modified()],
  },
  {
    schema: "customer",
    table: "wallet_balances",
    title: "Wallet balances",
    description: "Read-only view of available and pending wallet balances by account/user/currency.",
    primaryKey: ["wallet_account_id", "currency_code"],
    readOnly: true,
    defaultOrderBy: "user_id asc",
    listColumns: ["user_id", "wallet_account_id", "currency_code", "available_amount", "pending_amount"],
    amountColumn: "available_amount",
    fields: [uuid("wallet_account_id", walletAccountRelation), uuid("user_id", userRelation), text("currency_code"), num("available_amount"), num("pending_amount")],
  },
  ...messageTables("customer"),
];

export const ADMIN_TABLES_BY_KEY = Object.fromEntries(
  ADMIN_TABLES.map((table) => [`${table.schema}.${table.table}`, table])
) as Record<string, AdminTableConfig>;

export function getAdminTableConfig(schema: string, table: string) {
  return ADMIN_TABLES_BY_KEY[`${schema}.${table}`];
}

export function getAdminTablesBySchema(schema: AdminSchemaName) {
  return ADMIN_TABLES.filter((table) => table.schema === schema);
}

export function isAdminSchemaName(value: string): value is AdminSchemaName {
  return value === "booking" || value === "identity" || value === "customer";
}
