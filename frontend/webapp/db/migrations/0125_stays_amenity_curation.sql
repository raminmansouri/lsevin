-- Stays amenities: curate the workbook vocabulary added by 0122.
--
-- 0122 filed every workbook item under "room" or "general" and reused a handful of icons. This
-- puts each one in its real section (bathroom, food, wellness, family, business, outdoor...),
-- which drives the guest's grouped amenity list and which amenities a room type can have, and
-- gives it a more specific icon. Only rows no admin has edited yet are touched (revision = 1),
-- so a section or icon an admin already chose is kept. Options (child amenities) follow their
-- parent's section.
--
-- "barbecue" (0122) duplicated the original "bbq" (same name in every language): hotels and
-- rooms that picked it get "bbq" instead and "barbecue" is switched off (kept for history).

update stay.amenities a set grp = v.grp
  from (values
    ('squat_toilet', 'bathroom'), ('western_toilet', 'bathroom'), ('shower', 'bathroom'), ('toiletries', 'bathroom'),
    ('in_room_western_toilet', 'bathroom'),
    ('atm', 'general'),
    ('room_service', 'food'), ('coffee_shop', 'food'), ('rooftop_restaurant', 'food'), ('traditional_teahouse', 'food'),
    ('jacuzzi', 'wellness'), ('fitness_equipment', 'wellness'), ('sauna_only', 'wellness'), ('sports_hall', 'wellness'),
    ('tennis_court', 'wellness'), ('billiards_hall', 'wellness'), ('sports_field', 'wellness'),
    ('gaming_cafe', 'family'), ('childrens_playground', 'family'),
    ('conference_hall', 'business'), ('assembly_hall', 'business'), ('photocopying', 'business'), ('printer', 'business'),
    ('fax', 'business'), ('internet_cafe', 'business'),
    ('accessible_facilities', 'accessibility'),
    ('mountain_or_forest_view', 'outdoor')
  ) as v(code, grp)
 where a.code = v.code and a.revision = 1;

update stay.amenities a set icon = v.icon
  from (values
    ('squat_toilet', 'toilet'), ('western_toilet', 'toilet'), ('in_room_western_toilet', 'toilet'),
    ('western_toilets_on_guest_floors', 'toilet'), ('western_toilet_in_lobby', 'toilet'), ('squat_toilet_in_lobby', 'toilet'),
    ('toiletries', 'spray-can'),
    ('heating', 'heater'), ('air_conditioning', 'air-vent'), ('in_room_air_conditioning', 'air-vent'),
    ('kitchen', 'chef-hat'), ('gas_stove', 'cooking-pot'), ('dining_table', 'utensils-crossed'),
    ('vacuum_cleaner', 'brush-cleaning'), ('housekeeping', 'spray-can'),
    ('iranian_digital_tv_receiver', 'radio-receiver'),
    ('pool', 'waves-ladder'), ('sauna', 'thermometer-sun'), ('sauna_only', 'thermometer-sun'),
    ('sports_hall', 'volleyball'), ('tennis_court', 'volleyball'), ('sports_field', 'trophy'),
    ('childrens_playground', 'ferris-wheel'), ('table_football', 'gamepad'),
    ('fire_detection', 'alarm-smoke'), ('alarm_bell', 'siren'),
    ('safe_box', 'vault'), ('in_room_safe', 'vault'), ('door_lock_type', 'door-closed-locked'),
    ('room_service', 'concierge-bell'), ('porter', 'hand-platter'),
    ('taxi_service', 'car-taxi-front'), ('self_drive_car_rental', 'car-front'), ('ticket_service', 'tickets-plane'),
    ('telephone_operator', 'phone-call'), ('fax', 'mails'), ('charging_facilities', 'plug-zap'),
    ('balcony', 'sun'), ('writing_desk', 'lamp-desk'), ('atm', 'credit-card'), ('shopping_centre', 'store'),
    ('tea_maker', 'cup-soda'), ('vip_reception_services', 'sparkles')
  ) as v(code, icon)
 where a.code = v.code and a.revision = 1;

-- Options take their parent's section (and keep it in step with the parent).
update stay.amenities c set grp = p.grp
  from stay.amenities p
 where c.parent_code = p.code and c.grp <> p.grp;

-- Merge the duplicate barbecue into the original.
update stay.properties
   set amenity_codes = array(select distinct unnest(array_replace(amenity_codes, 'barbecue', 'bbq')))
 where 'barbecue' = any(amenity_codes);
update stay.room_types
   set amenity_codes = array(select distinct unnest(array_replace(amenity_codes, 'barbecue', 'bbq')))
 where 'barbecue' = any(amenity_codes);
update stay.amenities set is_active = false where code = 'barbecue' and revision = 1;
