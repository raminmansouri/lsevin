import json
import unittest

from fix_names_census import Census, assign_countries, respace, clean_census, clean_en, clean_fa, consistent, plan


def loc(id, kind, parent=None, geoname='', country='', **vt):
    vt = {k.replace('_', '-'): v for k, v in vt.items()}
    return {'id': id, 'location_type_id': str(kind), 'parent_id': parent, 'geoname_id': geoname,
            'country': country, 'vt': vt}


def census_row(name, kind='6', ostan='23', ostan_name='تهران'):
    return {'kind': kind, 'ostan_code': ostan, 'ostan': ostan_name, 'name': name}


class OrthographyTests(unittest.TestCase):
    def test_persian_letters_marks_and_bidi(self):
        self.assertEqual(clean_fa('قَلعِۀ مَريوان'), 'قلعۀ مریوان')
        self.assertEqual(clean_fa('كرمانشاه‎'), 'کرمانشاه')
        self.assertEqual(clean_fa(' پاشا  كلا '), 'پاشا کلا')

    def test_census_legacy_encoding(self):
        self.assertEqual(clean_census('مركزئ'), 'مرکزی')
        self.assertEqual(clean_census('مسگراباد'), 'مسگرآباد')
        self.assertEqual(clean_census('كشارسفلي'), 'کشار سفلی')
        self.assertEqual(clean_census('اب قلمون'), 'آب قلمون')
        self.assertEqual(clean_census('سنگان پائين'), 'سنگان پایین')

    def test_english_transliteration_marks(self):
        self.assertEqual(clean_en('Orūmīyeh'), 'Orumiyeh')
        self.assertEqual(clean_en('`Isa Dar'), 'Isa Dar')
        self.assertEqual(clean_en("Pashgeleh-ye Pa'in"), 'Pashgeleh-ye Pain')


class ConsistencyTests(unittest.TestCase):
    def test_accepts_real_romanizations(self):
        for fa, en in [('قلی', 'Qoli'), ('نصیر آباد', 'Nasirabad'), ('لردگان', 'Lordegan'),
                       ('خلیلان سفلی', 'Khalilan-e Sofla'), ('چاه دراز', 'Chah Deraz'), ('مؤمن زمین', 'Mowmen Zamin'),
                       ('ارومیه', 'Orumiyeh'), ('پشکله پایین', "Pashgeleh-ye Pa'in"),
                       ('حق الخواجه', 'Haq ol Khvajeh'), ('ایزد خواست', 'Izad Khvast'), ('گچگران', 'Gach Garan'),
                       ('گرگان', 'Gorgan')]:
            self.assertTrue(consistent(fa, en), (fa, en))

    def test_rejects_vowel_or_qualifier_conflicts(self):
        # each pair was a wrong match produced by consonant-only matching
        for fa, en in [('قیل', 'Qoli'), ('ناصر آباد', 'Nasirabad'), ('هویج', 'Haju'), ('کنگور', 'Kangar'),
                       ('خلیلان علیا', 'Khalilan-e Sofla'), ('پشکله بالا', "Pashgeleh-ye Pa'in"), ('گرگان', 'Korkan'), ('استر آباد', 'Gorgan'), ('کعب عمیر', 'Navvab-e Safavi')]:
            self.assertFalse(consistent(fa, en), (fa, en))


class PlanTests(unittest.TestCase):
    def setUp(self):
        self.iran = loc('ir', 1, en_US='Iran', fa_IR='ایران')
        self.province = loc('teh', 3, 'ir', fa_IR='استان تهران', en_US='Tehran')

    def run_plan(self, cities, census_names, seeds=(), protect=()):
        rows = [self.iran, self.province, *cities]
        changes = {}
        assign_countries(rows)
        census = Census([census_row('تهران', kind='1'), *map(census_row, census_names)],
                        [r for r in rows if r['location_type_id'] == '3'], ['ir'])
        for c in plan(rows, census, list(seeds), protect):
            changes[c['id']] = (json.loads(c['old']), json.loads(c['new']))
        return changes

    def run_plan_census(self, cities, records):
        rows = [self.iran, self.province, *cities]
        assign_countries(rows)
        census = Census([census_row('تهران', kind='1'), *records],
                        [r for r in rows if r['location_type_id'] == '3'], ['ir'])
        return {c['id']: (json.loads(c['old']), json.loads(c['new'])) for c in plan(rows, census, [], ())}

    def test_swapped_upper_lower_name_is_replaced_from_census(self):
        city = loc('c1', 2, 'teh', '737', 'IR', en_US="Pashgeleh-ye Pa'in", en="Pashgeleh-ye Pa'in",
                   fa_IR='پَشكَلِۀ بالا', fa='پَشكَلِۀ بالا')
        new = self.run_plan([city], ['پشگله بالا', 'پشگله پائين'])['c1'][1]
        self.assertEqual(new['fa-IR'], 'پشگله پایین')
        self.assertEqual(new['fa'], 'پشگله پایین')
        self.assertEqual(new['en-US'], 'Pashgeleh-ye Pain')

    def test_confirmed_name_keeps_its_own_spelling(self):
        city = loc('c1', 2, 'teh', '1', 'IR', en_US='Kazemabad', fa_IR='كاظم آباد')
        new = self.run_plan([city], ['كاظماباد'])['c1'][1]
        self.assertEqual(new['fa-IR'], 'کاظم آباد')

    def test_county_title_is_replaced_by_city_name(self):
        # Regression: Urmia was stored as 'شهرستان ارومیه' (the county's Wikipedia title)
        city = loc('c1', 2, 'teh', '121801', 'IR', en_US='Orūmīyeh', fa_IR='شهرستان ارومیه')
        new = self.run_plan([city], ['اروميه'])['c1'][1]
        self.assertEqual(new['fa-IR'], 'ارومیه')
        self.assertEqual(new['en-US'], 'Orumiyeh')

    def test_census_spelling_wins_when_both_fit_the_english(self):
        city = loc('c1', 2, 'teh', '1', 'IR', en_US='Cheshmeh Tagi', fa_IR='چِشمِه تاكی')
        self.assertEqual(self.run_plan([city], ['چشمه تاگی'])['c1'][1]['fa-IR'], 'چشمه تاگی')

    def test_seed_city_historic_name_is_replaced(self):
        # Regression: Gorgan's pre-GeoNames seed row showed استرآباد (its historic name)
        city = loc('c1', 2, 'teh', '', '', en='Gorgān', en_US='Gorgān', fa_IR='اَستِر آباد', fa_ir='گرگان')
        new = self.run_plan([city], ['گرگان'])['c1'][1]
        self.assertEqual(new['fa-IR'], 'گرگان')
        self.assertEqual(new['en-US'], 'Gorgan')
        self.assertEqual(new['fa-ir'], 'گرگان')  # other keys untouched

    def test_legacy_fa_ir_key_is_promoted(self):
        # Regression: legacy cities under Iran had only {'en', 'fa-ir'}; the Persian site showed English
        city = loc('c1', 2, 'ir', '', '', en='Tonekābon', fa_ir='تنكابن')
        new = self.run_plan([city], [])['c1'][1]
        self.assertEqual(new['fa-IR'], 'تنکابن')
        self.assertEqual(new['fa'], 'تنکابن')
        self.assertEqual(new['fa-ir'], 'تنکابن')
        self.assertEqual(new['en'], 'Tonekabon')

    def test_legacy_name_wins_over_contradicting_fa_IR_without_census(self):
        city = loc('c1', 2, 'teh', '', '', en='Gorgān', en_US='Gorgān', fa_IR='اَستِر آباد', fa_ir='گرگان')
        self.assertEqual(self.run_plan([city], [])['c1'][1]['fa-IR'], 'گرگان')

    def test_historic_legacy_name_is_replaced_by_national_census_city(self):
        # Regression: legacy 'fa-ir' held شاهی (pre-1979 name) for Qaem Shahr, directly under Iran
        city = loc('c1', 2, 'ir', '', '', en='Qaem Shahr', fa_ir='شاهی')
        rows_census = [census_row('قائم شهر', kind='5', ostan='10', ostan_name='مازندران')]
        new = self.run_plan_census([city], rows_census)['c1'][1]
        self.assertEqual(new['fa-IR'], 'قائم شهر')
        self.assertEqual(new['fa-ir'], 'قائم شهر')

    def test_unverified_legacy_name_is_used_when_census_has_no_answer(self):
        city = loc('c1', 2, 'ir', '', '', en='Aran Bidgol', fa_ir='آران')
        self.assertEqual(self.run_plan([city], [])['c1'][1]['fa-IR'], 'آران')

    def test_unverified_legacy_name_that_contradicts_english_is_not_used(self):
        # Surian's legacy name was its county (بوانات); show no Persian name rather than a wrong one
        city = loc('c1', 2, 'ir', '', '', en='Surian', fa_ir='بوانات')
        changes = self.run_plan([city], [])
        self.assertNotIn('fa-IR', changes.get('c1', ({}, {}))[1])

    def test_glued_census_names_are_respaced_from_english(self):
        self.assertEqual(respace('قلعه نوشاملو', 'Qaleh-ye Now Shamlu'), 'قلعه نو شاملو')
        self.assertEqual(respace('علیرضاچای', 'Alireza Chai'), 'علیرضا چای')
        self.assertEqual(respace('دواب', 'Do Ab'), 'دو آب')
        self.assertEqual(respace('گچگران', 'Gach Garan'), 'گچ گران')
        self.assertEqual(respace('لردگان', 'Lordegan'), 'لردگان')        # one English word: unchanged

    def test_glued_ezafe_matches(self):
        self.assertTrue(consistent('گنبدکاووس', 'Gonbad-e Kavus'))
        self.assertTrue(consistent('کوت عبدالله', 'Kut-e Abdollah'))

    def test_legacy_name_never_overrides_a_consistent_fa_IR(self):
        city = loc('c1', 2, 'teh', '', '', en='Jahrom', en_US='Jahrom', fa_IR='جهرم', fa_ir='دو')
        self.assertNotIn('c1', self.run_plan([city], []))

    def test_wikipedia_region_qualifier_is_dropped(self):
        city = loc('c1', 2, 'teh', '1', 'US', en_US='Little Rock', fa_IR='لیتل راک، آرکانزاس')
        self.assertEqual(self.run_plan([city], [])['c1'][1]['fa-IR'], 'لیتل راک')
        kept = loc('c2', 2, 'teh', '2', 'US', en_US='Washington, D.C.', fa_IR='واشینگتن، دی.سی.')
        self.assertNotIn('c2', self.run_plan([kept], []))

    def test_ambiguous_census_leaves_name_alone(self):
        city = loc('c1', 2, 'teh', '1', 'IR', en_US='Darin', fa_IR='دورن')
        changes = self.run_plan([city], ['دارین', 'درین'])
        self.assertNotIn('c1', changes)

    def test_latin_persian_is_filled_or_removed(self):
        filled = loc('c1', 2, 'teh', '1', 'IR', en_US='Tajabad', fa_IR='Tājābād')
        orphan = loc('c2', 2, 'teh', '2', 'IR', en_US='Zavat', fa_IR='Z̄avāt', fa='Z̄avāt')
        changes = self.run_plan([filled, orphan], ['تاج اباد'])
        self.assertEqual(changes['c1'][1]['fa-IR'], 'تاج آباد')
        self.assertNotIn('fa-IR', changes['c2'][1])
        self.assertNotIn('fa', changes['c2'][1])

    def test_only_fa_and_en_keys_change(self):
        city = loc('c1', 2, 'teh', '1', 'IR', en_US='Rāmhormoz', fa_IR='رامهرمز', ar_SA='رامهرمز', tr_TR='Râmhormoz')
        old, new = self.run_plan([city], ['رامهرمز'])['c1']
        self.assertEqual(new['ar-SA'], old['ar-SA'])
        self.assertEqual(new['tr-TR'], old['tr-TR'])

    def test_never_creates_name_shared_with_seed_city(self):
        # text resolution prefers the newest row, so a village must not newly take a seed city's name
        village = loc('c1', 2, 'teh', '1', 'IR', en_US='Rasht', fa_IR='رَشت')
        other = loc('c2', 2, 'teh', '2', 'IR', en_US='Rāsht', fa_IR='راشت')
        seed = {'country_id': 'ir', 'vt': {'en-US': 'Rasht', 'fa-IR': 'رشت'}}
        changes = self.run_plan([village, other], [], seeds=[seed])
        self.assertNotIn('c1', changes)   # رَشت -> رشت would newly match Persian text for the seed city
        self.assertNotIn('c2', changes)   # Rāsht -> Rasht would newly match English text

    def test_protected_profile_names_are_untouched(self):
        city = loc('c1', 2, 'teh', '1', 'IR', en_US='Tehran', fa_IR='تِهران')
        self.assertNotIn('c1', self.run_plan([city], [], protect=['tehran']))

    def test_province_prefix_and_marks(self):
        changes = self.run_plan([], [])
        self.assertEqual(changes['teh'][1]['fa-IR'], 'تهران')


if __name__ == '__main__':
    unittest.main()
