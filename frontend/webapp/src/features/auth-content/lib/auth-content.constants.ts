export const AUTH_PAGE_CONTENT_TYPE = "auth_page";
export const AUTH_ONBOARDING_STEP_CONTENT_TYPE = "auth_onboarding_step";

export const AUTH_CONTENT_TYPE_OPTIONS = [
  { value: AUTH_PAGE_CONTENT_TYPE, label: "Auth page" },
  { value: AUTH_ONBOARDING_STEP_CONTENT_TYPE, label: "Onboarding step" },
] as const;
