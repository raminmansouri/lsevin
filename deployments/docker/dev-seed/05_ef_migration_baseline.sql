-- schema_backup.sql is a structure-only snapshot. It contains the final EF-owned
-- tables but intentionally has no data rows, including migration history. Record
-- the migrations represented by that snapshot so EF does not recreate its tables.

insert into identity."__EFMigrationsHistory" (migration_id, product_version)
values
  ('20250201094052_Initial', '9.0.9'),
  ('20251104095049_AddOtpCode', '9.0.9')
on conflict (migration_id) do nothing;

insert into customer."__EFMigrationsHistory" (migration_id, product_version)
values
  ('20250201094041_Initial', '9.0.9'),
  ('20250319192421_AddCustomerDocument', '9.0.9'),
  ('20250331173355_AddConsulting', '9.0.9'),
  ('20250409111537_FixCustomerDocumentRelation', '9.0.9'),
  ('20250409112023_FixCustomerIdColumnInDocument', '9.0.9'),
  ('20250913092041_RemoveConsultingReason', '9.0.9'),
  ('20251007111345_LocalizeAddress', '9.0.9'),
  ('20251014090836_AddCoordinatesToAddress', '9.0.9')
on conflict (migration_id) do nothing;

insert into category."__EFMigrationsHistory" (migration_id, product_version)
values
  ('20250518083944_Initial', '9.0.9'),
  ('20250520090402_AddProviderAndStaff', '9.0.9'),
  ('20250601074154_FixPropertyNames', '9.0.9'),
  ('20250605104531_AddLocation', '9.0.9'),
  ('20250731083623_MakeAddressOptional', '9.0.9'),
  ('20250811122329_AddServiceProviderRequest', '9.0.9'),
  ('20250811132849_RenameServiceProviderRequestStatus', '9.0.9'),
  ('20250915092809_AddCategoryAndServicesLocale', '9.0.9'),
  ('20250915095650_LocalizeServiceAttributeDefinition', '9.0.9'),
  ('20250915120247_AddLocalizationForProviderType', '9.0.9'),
  ('20251005125333_LocalizedStaff', '9.0.9'),
  ('20251005155826_AddServiceProviderLocales', '9.0.9'),
  ('20251007101926_LocalizedLocation', '9.0.9'),
  ('20251007111312_LocalizeAddress', '9.0.9'),
  ('20251013182513_AddProviderGrade', '9.0.9'),
  ('20251014090808_AddCoordinatesToAddress', '9.0.9'),
  ('20251019153027_AddDurationToProviderService', '9.0.9'),
  ('20251021094937_ServiceProviderComment', '9.0.9'),
  ('20251021123012_OrderToLocation', '9.0.9'),
  ('20251026073644_ProviderTypeIcon', '9.0.9'),
  ('20260223181735_AddCurrencyTable', '9.0.9'),
  ('20260223190913_ReAddCurrencyTable', '9.0.9')
on conflict (migration_id) do nothing;
