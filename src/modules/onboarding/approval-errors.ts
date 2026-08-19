export type ApprovalFailure = {
  code: string;
  message: string;
};

function databaseCode(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code : "";
}

function rawMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
}

export function approvalFailureFromError(error: unknown): ApprovalFailure {
  const message = rawMessage(error);
  const lower = message.toLowerCase();
  const code = databaseCode(error);

  if (lower.includes("onboarding_application_reviews") || (code === "42P01" && lower.includes("relation"))) {
    return {
      code: "migration_required",
      message: "The onboarding administration migration is missing. Publish the database migration container, then retry approval.",
    };
  }

  if (lower.includes("country and city are required")) {
    return {
      code: "location_required",
      message: "Country and city are required when creating a provider. Use LSevin location codes such as IR and tehran.",
    };
  }

  if (lower.includes("country") && lower.includes("not found")) {
    return {
      code: "country_invalid",
      message: "The country was not found in the LSevin location catalog. Use a country code such as IR.",
    };
  }

  if (lower.includes("city") && lower.includes("not found")) {
    return {
      code: "city_invalid",
      message: "The city was not found under the selected country. Use a city code such as tehran or tabriz.",
    };
  }

  if (lower.includes("provider type") && lower.includes("match")) {
    return {
      code: "provider_type_mismatch",
      message: "The selected existing provider has a different provider type. Choose a matching provider or create a new one.",
    };
  }

  if (code === "22001" || lower.includes("value too long for type character varying")) {
    return {
      code: "field_too_long",
      message: "One of the provider contact or location values exceeds the LSevin database limit. Use valid location codes and a country calling code such as +98 or +358.",
    };
  }

  if (code === "23503") {
    return {
      code: "reference_missing",
      message: "A referenced user, provider type, location, or provider no longer exists. Reload the application and repair the missing reference before approval.",
    };
  }

  if (lower.includes("application not found")) return { code: "application_missing", message: "The application no longer exists." };
  if (lower.includes("selected provider does not exist")) return { code: "provider_missing", message: "The selected provider no longer exists." };
  if (lower.includes("choose an existing provider")) return { code: "provider_required", message: "Choose an existing provider before using attach mode." };
  if (lower.includes("missing provider type")) return { code: "provider_type_missing", message: "The application references a missing provider type and cannot be approved." };

  return {
    code: "approval_failed",
    message: "Approval failed. Check the server terminal for the database error, make sure the migration container completed successfully, and retry.",
  };
}
