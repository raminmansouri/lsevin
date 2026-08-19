alter type provider_portal.application_status add value if not exists 'changes_requested';

create index if not exists ix_onboarding_applications_applicant_status
  on provider_portal.onboarding_applications(applicant_user_id, status, last_modified_date desc);

create index if not exists ix_onboarding_documents_application_kind
  on provider_portal.onboarding_documents(application_id, document_kind, create_date desc);

alter table provider_portal.onboarding_application_reviews
  drop constraint if exists ck_onboarding_application_reviews_action;
alter table provider_portal.onboarding_application_reviews
  add constraint ck_onboarding_application_reviews_action check (
    action in ('submitted','resubmitted','opened','approved_created','approved_attached','rejected','changes_requested','reopened','disabled')
  );
