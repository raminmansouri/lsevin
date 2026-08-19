-- Notifications standalone module schema
-- Depends only on Core primitives and generic UUID entity references.
create schema if not exists notifications_ext;

    create table if not exists notifications_ext.templates (
      id uuid primary key default gen_random_uuid(),
      template_key text not null unique,
      title_translations jsonb not null default '{}',
      body_translations jsonb not null default '{}',
      channels text[] not null default array['in_app'],
      variables text[] not null default array[]::text[],
      is_active boolean not null default true,
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create table if not exists notifications_ext.inbox_items (
      id uuid primary key default gen_random_uuid(),
      recipient_entity_type text not null,
      recipient_entity_id uuid not null,
      title text not null,
      body text not null,
      source_module text,
      source_entity_type text,
      source_entity_id uuid,
      read_at timestamptz,
      created_at timestamptz not null default now()
    );

-- vNext notification delivery logs and event templates.
create table if not exists notifications_ext.delivery_logs (
  id uuid primary key default gen_random_uuid(),
  template_key text,
  recipient_entity_type text not null,
  recipient_entity_id uuid not null,
  channel text not null default 'in_app',
  status text not null default 'queued' check (status in ('queued','sent','failed','cancelled')),
  provider_response text,
  source_module text,
  source_entity_type text,
  source_entity_id uuid,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

insert into notifications_ext.templates(template_key,title_translations,body_translations,channels,variables,is_active,metadata) values
('claim.submitted', '{"fa-IR":"درخواست مالکیت ثبت شد","en-US":"Profile claim submitted","ar":"تم إرسال طلب الملف","tr-TR":"Profil talebi gönderildi"}'::jsonb, '{"fa-IR":"درخواست شما ثبت شد و در انتظار بررسی است.","en-US":"Your claim was submitted and is waiting for review.","ar":"تم إرسال الطلب وهو بانتظار المراجعة.","tr-TR":"Talebiniz gönderildi ve inceleme bekliyor."}'::jsonb, array['in_app','email'], array['claimId','targetType'], true, '{"journey":"profile_claim"}'::jsonb),
('payment.required', '{"fa-IR":"پرداخت مورد نیاز است","en-US":"Payment required","ar":"الدفع مطلوب","tr-TR":"Ödeme gerekiyor"}'::jsonb, '{"fa-IR":"برای فعال شدن مالکیت پروفایل، پرداخت یا تایید رسید لازم است.","en-US":"Payment or receipt verification is required to activate profile ownership.","ar":"يلزم الدفع أو تأكيد الإيصال لتفعيل ملكية الملف.","tr-TR":"Profil sahipliğini etkinleştirmek için ödeme veya makbuz onayı gerekir."}'::jsonb, array['in_app','sms','email'], array['invoiceId','amount'], true, '{"journey":"billing"}'::jsonb),
('booking.assigned', '{"fa-IR":"رزرو به شما اختصاص یافت","en-US":"Booking assigned","ar":"تم تعيين الحجز","tr-TR":"Rezervasyon atandı"}'::jsonb, '{"fa-IR":"یک رزرو جدید به شما اختصاص داده شد.","en-US":"A booking was assigned to you.","ar":"تم تعيين حجز لك.","tr-TR":"Size bir rezervasyon atandı."}'::jsonb, array['in_app','push'], array['bookingId','staffId'], true, '{"journey":"booking"}'::jsonb),
('review.reply.pending', '{"fa-IR":"پاسخ نظر در انتظار تایید","en-US":"Review reply pending approval","ar":"رد التقييم بانتظار الموافقة","tr-TR":"Yorum yanıtı onay bekliyor"}'::jsonb, '{"fa-IR":"پاسخ شما بعد از تایید منتشر می‌شود.","en-US":"Your reply will publish after moderation.","ar":"سيتم نشر الرد بعد المراجعة.","tr-TR":"Yanıtınız moderasyondan sonra yayınlanır."}'::jsonb, array['in_app'], array['reviewId'], true, '{"journey":"reviews"}'::jsonb),
('ticket.reply', '{"fa-IR":"پاسخ جدید تیکت","en-US":"New ticket reply","ar":"رد جديد على التذكرة","tr-TR":"Yeni destek yanıtı"}'::jsonb, '{"fa-IR":"یک پاسخ جدید در تیکت شما ثبت شد.","en-US":"A new reply was added to your ticket.","ar":"تمت إضافة رد جديد إلى تذكرتك.","tr-TR":"Destek talebinize yeni yanıt eklendi."}'::jsonb, array['in_app','email'], array['ticketId'], true, '{"journey":"ticketing"}'::jsonb)
on conflict (template_key) do nothing;

create index if not exists ix_notifications_templates_key on notifications_ext.templates(template_key);
create index if not exists ix_notifications_inbox_recipient on notifications_ext.inbox_items(recipient_entity_type, recipient_entity_id, created_at desc);
create index if not exists ix_notifications_delivery_logs_recipient on notifications_ext.delivery_logs(recipient_entity_type, recipient_entity_id, created_at desc);
