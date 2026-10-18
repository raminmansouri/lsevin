import unittest
import tempfile
import zipfile
from pathlib import Path
from import_geonames import Matcher, missing_translations, normal, SETTLEMENT_CODES, LANGUAGES, load_country


def row(id, kind, code, parent=None, en=None, **translations):
    return {'id': id, 'location_type_id': kind, 'code': code, 'parent_id': parent,
            'value_translations': {'en-US': en or code, **translations}}


def feature(gid, name, kind=2, country='IR', **kwargs):
    return {'geoname_id': str(gid), 'kind': kind, 'country': country, 'admin1': '01',
            'translations': {'en-US': name}, 'aliases': {name}, 'latitude': 10,
            'longitude': int(gid), **kwargs}


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.rows = [row('country', 1, 'IR'), row('province', 3, 'IR-01', 'country', 'Province'),
                     row('city', 2, 'old-code', 'country', 'Tehrān')]

    def test_normalizes_arabic_persian_and_accents(self):
        self.assertEqual(normal('Tehrān'), normal('TEHRAN'))
        self.assertEqual(normal('كيش'), normal('کیش'))

    def test_preserves_nonempty_admin_edits(self):
        old = {'en-US': 'Edited', 'fa-IR': 'نام قدیمی', 'extra': 'Custom'}
        merged = missing_translations(old, {'en-US': 'Source', 'fa-IR': 'نام جدید', 'tr': 'Name'})
        self.assertEqual(merged['en-US'], 'Edited')
        self.assertEqual(merged['fa'], 'نام قدیمی')
        self.assertEqual(merged['extra'], 'Custom')

    def test_fills_empty_but_never_fakes_persian(self):
        result = missing_translations({'en': 'English', 'fa': ''}, {'en-US': 'Source'})
        self.assertEqual(result['en-US'], 'English')
        self.assertNotIn('fa-IR', result)

    def test_matches_legacy_city_and_preserves_uuid(self):
        matcher = Matcher({'locations': self.rows})
        result = matcher.choose_level([feature(1, 'Tehran')], {'1': 'province'})
        self.assertEqual(result[0][1:3], ('city', None))
        self.assertEqual(matcher.existing['city']['parent_id'], 'country')

    def test_ambiguous_existing_names_are_held(self):
        matcher = Matcher({'locations': self.rows + [row('city2', 2, 'other', 'province', 'Tehran')]})
        result = matcher.choose_level([feature(1, 'Tehran')], {'1': 'province'})
        self.assertEqual(result[0][2], 'ambiguous_legacy_match')

    def test_multiple_source_places_cannot_claim_one_legacy_city(self):
        matcher = Matcher({'locations': self.rows})
        result = matcher.choose_level([feature(1, 'Tehran'), feature(2, 'Tehran')], {'1': 'province', '2': 'province'})
        self.assertTrue(all(x[2] == 'ambiguous_legacy_match' for x in result))

    def test_different_villages_with_same_name_remain_distinct(self):
        matcher = Matcher({'locations': self.rows[:2]})
        result = matcher.choose_level([feature(1, 'Village'), feature(2, 'Village')], {'1': 'province', '2': 'province'})
        self.assertNotEqual(result[0][1], result[1][1])
        self.assertTrue(all(x[2] is None for x in result))

    def test_duplicate_source_coordinate_is_held(self):
        matcher = Matcher({'locations': self.rows[:2]})
        result = matcher.choose_level([feature(1, 'Village'), feature(2, 'Village', longitude=1)], {'1': 'province', '2': 'province'})
        self.assertTrue(all(x[2] == 'duplicate_source_name_and_coordinate' for x in result))

    def test_source_id_makes_rerun_stable(self):
        matcher = Matcher({'locations': self.rows, 'refs': [{'geoname_id': 1, 'location_id': 'city'}]})
        result = matcher.choose_level([feature(1, 'Completely renamed')], {'1': 'province'})
        self.assertEqual(result[0][1:3], ('city', None))

    def test_new_source_cannot_reclaim_already_mapped_city(self):
        matcher = Matcher({'locations': self.rows, 'refs': [{'geoname_id': 1, 'location_id': 'city'}]})
        result = matcher.choose_level([feature(2, 'Tehran')], {'2': 'province'})
        self.assertEqual(result[0][2], 'ambiguous_legacy_match')

    def test_conflicting_country_source_identity_fails(self):
        matcher = Matcher({'locations': self.rows, 'refs': [{'geoname_id': 1, 'location_id': 'city'}]})
        with self.assertRaisesRegex(ValueError, 'Conflicting persisted'):
            matcher.choose_level([feature(1, 'Tehran', country='TR')], {'1': 'province'})

    def test_other_province_does_not_merge(self):
        matcher = Matcher({'locations': self.rows[:2] + [row('city', 2, 'old', 'province', 'Tehran')]})
        result = matcher.choose_level([feature(1, 'Tehran')], {'1': 'country'})
        self.assertEqual(result[0][2], 'conflicting_province')

    def test_cycle_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Cycle'):
            Matcher({'locations': [row('a', 2, 'A', 'b'), row('b', 3, 'B', 'a')]})

    def test_scope_and_languages(self):
        self.assertIn('PPL', SETTLEMENT_CODES)
        self.assertNotIn('PPLX', SETTLEMENT_CODES)
        self.assertNotIn('PPLH', SETTLEMENT_CODES)
        self.assertTrue({'en','fa','ar','tr','de','es','fr','ku','ru','tg','zh'} <= LANGUAGES.keys())

    def test_source_parser_includes_zero_population_village_and_current_translations(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            info = [''] * 19
            info[0], info[16] = 'IR', '100'
            (root / 'countryInfo.txt').write_text('\t'.join(info) + '\n', encoding='utf8')
            (root / 'admin1CodesASCII.txt').write_text('IR.01\tProvince\tProvince\t101\n', encoding='utf8')
            place = ['200','Village','Village','','30','50','P','PPL','IR','','01','','','','0','','','Asia/Tehran','2026-10-18']
            old = list(place)
            old[0], old[7] = '201', 'PPLH'
            with zipfile.ZipFile(root / 'IR.zip', 'w') as z:
                z.writestr('IR.txt', '\t'.join(place) + '\n' + '\t'.join(old) + '\n')
            (root / 'alternatenames').mkdir()
            with zipfile.ZipFile(root / 'alternatenames/IR.zip', 'w') as z:
                z.writestr('IR.txt', '1\t200\tfa\tروستا\t1\t\t\t\n2\t200\tfa\tنام تاریخی\t1\t\t\t1\n3\t200\tde\tDorf\t1\t\t\t\n')
            features = load_country(root, 'IR')
            self.assertEqual(len(features), 3)
            village = next(f for f in features if f['geoname_id'] == '200')
            self.assertEqual(village['translations']['fa'], 'روستا')
            self.assertEqual(village['translations']['de-DE'], 'Dorf')
            self.assertEqual(village['population'], 0)


if __name__ == '__main__':
    unittest.main()
