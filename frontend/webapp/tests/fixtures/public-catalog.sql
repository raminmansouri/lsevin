-- Synthetic public catalog, for the isolated *_seo_verify_* database only.
insert into category.category_groups(id,title) values (91001,'SEO fixture categories') on conflict do nothing;
insert into category.categories(id,name_translations,description_translations,is_active,group_id,parent_id)
values
('10000000-0000-4000-8000-000000000001','{"en-US":"Care","fa-IR":"سلامت"}','{}',true,91001,null),
('10000000-0000-4000-8000-000000000002','{"en-US":"Heart care","fa-IR":"درمان قلب"}','{}',true,91001,'10000000-0000-4000-8000-000000000001'),
('10000000-0000-4000-8000-000000000003','{"en-US":"Wellness","fa-IR":"تندرستی"}','{}',true,91001,'10000000-0000-4000-8000-000000000001') on conflict do nothing;
insert into category.provider_types(id,name_translations,description_translations,is_active)
values ('20000000-0000-4000-8000-000000000001','{"en-US":"Clinic","fa-IR":"کلینیک"}','{}',true),
('20000000-0000-4000-8000-000000000002','{"en-US":"Wellness center","fa-IR":"مرکز تندرستی"}','{}',true) on conflict do nothing;
insert into category.service_providers(id,name_translations,description_translations,is_active,provider_type_id,category_id,city,country,email,phone_number_country_code,phone_number,rating,review_count,featured_score,is_sponsored,sponsored_tag,accredited,specialties)
select ('30000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
jsonb_build_object('en-US','Fixture Clinic '||i,'fa-IR','کلینیک آزمایشی '||i),'{}',i<>15,
('20000000-0000-4000-8000-'||lpad((1+i%2)::text,12,'0'))::uuid,
('10000000-0000-4000-8000-'||lpad((2+i%2)::text,12,'0'))::uuid,
case when i%2=0 then 'Tehran' else 'Dubai' end,case when i%2=0 then 'IR' else 'AE' end,
'fixture-'||i||'@example.invalid','IR','000000'||i,(i%5)+0.5,i*3,i*7,i%3=0,'Fixture sponsored',i%2=0,array['Heart','Care']
from generate_series(1,15) i on conflict do nothing;
insert into category.service_definitions(id,name_translations,description_translations,category_id,duration_minutes,pricing_model,is_active,currency,value,requires_specialist)
select ('40000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
jsonb_build_object('en-US','Heart care '||i,'fa-IR','درمان قلب '||i),jsonb_build_object('en-US','Synthetic service '||i),
('10000000-0000-4000-8000-'||lpad((2+i%2)::text,12,'0'))::uuid,30,'fixed',i<>10,'USD',100+i,false
from generate_series(1,10) i on conflict do nothing;
insert into category.provider_services(id,service_provider_id,service_definition_id,display_name_translations,description_translations,is_active,currency,value,create_date,rating,review_count,trending_score,tags)
select ('50000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
('30000000-0000-4000-8000-'||lpad((1+(i-1)/10)::text,12,'0'))::uuid,
('40000000-0000-4000-8000-'||lpad((1+(i-1)%10)::text,12,'0'))::uuid,
case when i%4=0 then jsonb_build_object('en-US','Special heart care '||i,'fa-IR','درمان ویژه '||i) else '{}'::jsonb end,
'{}',i%13<>0,'USD',50+i,now(),(i%5)+0.5,i*2,i,array['Heart','Health']
from generate_series(1,150) i on conflict do nothing;
insert into category.staff(id,name_translations,title_translations,biography_translations,is_active,rating,review_count,consultation_fee,specialty,specialty_translations)
select ('60000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
jsonb_build_object('en-US','Fixture Doctor '||i,'fa-IR','پزشک آزمایشی '||i),'{"en-US":"Specialist","fa-IR":"متخصص"}','{}',i<>5,4.5,i*10,50,
case when i%2=0 then null else 'Heart' end,'{"en-US":"Cardiology","fa-IR":"قلب"}'
from generate_series(1,5) i on conflict do nothing;
insert into category.provider_staffs(id,staff_id,notes_translations,is_active,service_provider_id,create_date)
select ('70000000-0000-4000-8000-'||lpad(i::text,12,'0'))::uuid,
('60000000-0000-4000-8000-'||lpad((1+(i-1)%5)::text,12,'0'))::uuid,'{}',true,
('30000000-0000-4000-8000-'||lpad((1+(i-1)%3)::text,12,'0'))::uuid,now()
from generate_series(1,10) i on conflict do nothing;
analyze category.provider_services;
analyze category.service_definitions;
analyze category.service_providers;
analyze category.staff;
