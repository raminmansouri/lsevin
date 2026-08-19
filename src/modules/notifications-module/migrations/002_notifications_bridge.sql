-- Notification bridge for LSevin front/app events and provider growth subscriptions.
create schema if not exists notifications_ext;

create table if not exists notifications_ext.external_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  recipient_entity_type text not null,
  recipient_entity_id uuid not null,
  title text not null,
  body text not null,
  template_key text,
  channel text not null default 'in_app' check (channel in ('in_app','email','sms','push')),
  source_module text not null default 'lsevin-platform',
  source_entity_type text,
  source_entity_id uuid,
  locale text not null default 'fa-IR',
  metadata jsonb not null default '{}',
  status text not null default 'received' check (status in ('received','processed','failed','ignored')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists notifications_ext.audience_subscriptions (
  id uuid primary key default gen_random_uuid(),
  recipient_entity_type text not null,
  recipient_entity_id uuid not null,
  audience_key text not null,
  preferred_channel text not null default 'in_app' check (preferred_channel in ('in_app','email','sms','push')),
  locale text not null default 'fa-IR',
  status text not null default 'active' check (status in ('active','paused','unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(recipient_entity_type, recipient_entity_id, audience_key)
);

insert into notifications_ext.templates(template_key,title_translations,body_translations,channels,variables,is_active,metadata) values
('growth.campaign.sent', '{"fa-IR":"کمپین رشد ارسال شد","en-US":"Growth campaign sent","ar":"تم إرسال حملة النمو","tr-TR":"Büyüme kampanyası gönderildi"}'::jsonb, '{"fa-IR":"پیام شما از طریق سیستم اعلان ال سوین ارسال شد.","en-US":"Your message was sent through the LSevin notification system.","ar":"تم إرسال رسالتك عبر نظام إشعارات LSevin.","tr-TR":"Mesajınız LSevin bildirim sistemiyle gönderildi."}'::jsonb, array['in_app','push','sms','email'], array['campaignId','providerId'], true, '{"journey":"business_growth"}'::jsonb),
('growth.promotion.requested', '{"fa-IR":"درخواست پروموشن ثبت شد","en-US":"Promotion request submitted","ar":"تم إرسال طلب الترويج","tr-TR":"Tanıtım talebi gönderildi"}'::jsonb, '{"fa-IR":"درخواست شما برای بررسی تیم ال سوین ثبت شد.","en-US":"Your request was submitted for LSevin team review.","ar":"تم إرسال طلبك لمراجعة فريق LSevin.","tr-TR":"Talebiniz LSevin ekibi incelemesine gönderildi."}'::jsonb, array['in_app'], array['promotionRequestId','providerId'], true, '{"journey":"business_growth"}'::jsonb),
('lsevin.booking.created', '{"fa-IR":"رزرو جدید در ال سوین","en-US":"New LSevin booking","ar":"حجز جديد في LSevin","tr-TR":"Yeni LSevin rezervasyonu"}'::jsonb, '{"fa-IR":"یک رویداد رزرو جدید از پلتفرم ال سوین دریافت شد.","en-US":"A new booking event was received from LSevin platform.","ar":"تم استلام حدث حجز جديد من منصة LSevin.","tr-TR":"LSevin platformundan yeni rezervasyon etkinliği alındı."}'::jsonb, array['in_app','push'], array['bookingId','providerId'], true, '{"journey":"lsevin_bridge"}'::jsonb),
('lsevin.review.created', '{"fa-IR":"نظر جدید مشتری","en-US":"New customer review","ar":"تقييم جديد من العميل","tr-TR":"Yeni müşteri yorumu"}'::jsonb, '{"fa-IR":"یک نظر جدید در پلتفرم ال سوین ثبت شد.","en-US":"A new review was created on LSevin platform.","ar":"تم إنشاء تقييم جديد على منصة LSevin.","tr-TR":"LSevin platformunda yeni yorum oluşturuldu."}'::jsonb, array['in_app'], array['reviewId','providerId'], true, '{"journey":"lsevin_bridge"}'::jsonb)
on conflict (template_key) do nothing;

create index if not exists ix_notifications_bridge_events_recipient on notifications_ext.external_events(recipient_entity_type, recipient_entity_id, created_at desc);
create index if not exists ix_notifications_bridge_events_name on notifications_ext.external_events(event_name, created_at desc);
create index if not exists ix_notifications_bridge_subscriptions on notifications_ext.audience_subscriptions(recipient_entity_type, recipient_entity_id, status);
