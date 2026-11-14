-- Persian (and Arabic) labels for the payment methods that were seeded with English only, so the
-- fa checkout no longer shows "Online Card Payment / Pay online securely". Adds keys only; an
-- existing translation for a language is kept (the right side of || wins, so put stored last).
-- Safe to run more than once.
update shop.payment_methods
set name_translations = '{"fa": "پرداخت آنلاین (کارت بانکی)", "fa-IR": "پرداخت آنلاین (کارت بانکی)", "ar": "الدفع الإلكتروني بالبطاقة"}'::jsonb || name_translations,
    description_translations = '{"fa": "پرداخت امن از طریق درگاه بانکی", "fa-IR": "پرداخت امن از طریق درگاه بانکی", "ar": "ادفع بأمان عبر بوابة الدفع"}'::jsonb || description_translations,
    last_modified_date = now()
where code = 'gateway_card';

update shop.payment_methods
set name_translations = '{"fa": "پرداخت در محل", "fa-IR": "پرداخت در محل"}'::jsonb || name_translations,
    description_translations = '{"fa": "پرداخت هنگام تحویل سفارش", "fa-IR": "پرداخت هنگام تحویل سفارش"}'::jsonb || description_translations,
    last_modified_date = now()
where code = 'cash_on_delivery';

update shop.payment_methods
set name_translations = '{"fa": "کارت به کارت", "fa-IR": "کارت به کارت"}'::jsonb || name_translations,
    description_translations = '{"fa": "پرداخت با انتقال کارت به کارت", "fa-IR": "پرداخت با انتقال کارت به کارت"}'::jsonb || description_translations,
    last_modified_date = now()
where code = 'manual_card';
