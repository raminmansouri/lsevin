#!/usr/bin/env python3
"""Correct GeoNames-imported location names against Iran's official census. Python 3.11+, stdlib only.

census  converts the Statistical Centre of Iran 1395 (2016) settlement workbooks to CSV.
plan    reads exported location rows and produces a reviewable, row-guarded change plan.
No credentials are read and no database writes are made here. See README.md.

Only `value_translations` text changes. Ids, codes, parents, types and other locales are
never touched, and no row is added or deleted.
"""
import argparse
import csv
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree import ElementTree

csv.field_size_limit(2**31 - 1)

CENSUS_URL = 'https://www.amar.org.ir/Portals/0/census/1395/results/abadi/CN95_HouseholdPopulationVillage_{:02d}.xlsx'
CENSUS_PROVINCES = 31
# English names in these countries are GeoNames/BGN romanizations of a non-Latin script; the
# transliteration marks (a-macron, h-dot, ayn quotes) are not part of the everyday English name.
# Latin-script countries (TR, AZ, UZ, ...) keep their diacritics.
BGN_COUNTRIES = {'IR', 'AF', 'IQ', 'SY', 'JO', 'SA', 'OM', 'AE', 'QA', 'BH', 'KW', 'PK'}
FA_KEYS, EN_KEYS = ('fa', 'fa-IR'), ('en', 'en-US')
CITY, PROVINCE = '2', '3'

BIDI = dict.fromkeys(map(ord, '‎‏‪‫‬‭‮⁦⁧⁨⁩﻿'), None)
ARABIC_TO_PERSIAN = str.maketrans({'ك': 'ک', 'ي': 'ی', 'ى': 'ی', 'ـ': None})
HARAKAT = re.compile('[ً-ٰٟۖ-ۭ]')
ARABIC_SCRIPT = re.compile('[؀-ۿ]')
LATIN = re.compile('[A-Za-zÀ-ɏḀ-ỿ]')
ZWNJ = '‌'


def clean_fa(value):
    """Persian orthography: Persian kaf/yeh, no vowel marks, bidi controls or tatweel."""
    s = unicodedata.normalize('NFC', value).translate(BIDI).translate(ARABIC_TO_PERSIAN)
    s = HARAKAT.sub('', s)
    s = re.sub(r'\s*' + ZWNJ + r'\s*', ZWNJ, s)
    return re.sub(r'\s+', ' ', s).strip(' ' + ZWNJ)


def clean_census(value):
    """The census workbooks use a legacy encoding: final ئ for ی, no madda, glued words."""
    s = clean_fa(value)
    s = re.sub(r'ئ(?=\s|$)', 'ی', s)
    s = re.sub(r'(?<!آ)اباد', 'آباد', s)
    s = re.sub(r'آباد(?=[^\sیه' + ZWNJ + r'])', 'آباد ', s)
    s = re.sub(r'(?<=\S)(سفلی|علیا|وسطی)(?=\s|$)', r' \1', s)
    s = re.sub(r'(?:^|(?<=\s))اب(?=\s|$)', 'آب', s)
    return s.replace('پائین', 'پایین')


def clean_en(value):
    s = unicodedata.normalize('NFKD', value)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub('[`‘’ʼʻʿʾ´\'"“”]', '', s)
    return re.sub(r'\s+', ' ', s).strip(' -')


def is_persian(value):
    return bool(value) and bool(ARABIC_SCRIPT.search(value)) and not LATIN.search(value)


def fa_key(value):
    """Spelling-insensitive key: ignores spaces, ZWNJ, madda and final-yeh encoding."""
    s = clean_census(value)
    for a, b in (('آ', 'ا'), ('ۀ', 'ه'), ('ة', 'ه'), ('ئ', 'ی'), ('أ', 'ا')):
        s = s.replace(a, b)
    return re.sub(r'[\s‌\-]', '', s)


def _collapse(s):
    return re.sub(r'(.)\1+', r'\1', s)


_FA_SKEL = str.maketrans({
    'ا': '', 'آ': '', 'أ': '', 'إ': '', 'ع': '', 'ء': '', 'ئ': '', 'ؤ': '', 'و': '', 'ی': '',
    'ه': 'h', 'ح': 'h', 'ۀ': 'h', 'ة': 'h', 'خ': 'K', 'غ': 'Q', 'ق': 'Q', 'ک': 'k', 'گ': 'g',
    'ج': 'j', 'چ': 'C', 'ش': 'S', 'ژ': 'J', 'ز': 'z', 'ذ': 'z', 'ض': 'z', 'ظ': 'z',
    'س': 's', 'ث': 's', 'ص': 's', 'ت': 't', 'ط': 't', 'ب': 'b', 'پ': 'p', 'ف': 'f',
    'د': 'd', 'ر': 'r', 'ل': 'l', 'م': 'm', 'ن': 'n', ' ': '', ZWNJ: '', '-': ''})


def fa_skeleton(value):
    """Consonant skeleton, used only to pre-filter candidates cheaply."""
    return _collapse(clean_census(value).translate(_FA_SKEL))


def en_skeleton(value):
    s = clean_en(value).lower()
    for a, b in (('kh', 'K'), ('gh', 'Q'), ('q', 'Q'), ('ch', 'C'), ('sh', 'S'), ('zh', 'J')):
        s = s.replace(a, b)
    return _collapse(re.sub(r'[aeiouyvw\s\-.]', '', s))


# Romanizations each Persian letter can produce in GeoNames' BGN-style names.
# ک also accepts g: older maps, written before گ was distinguished, give گ as ک.
_ROMAN = {
    'ب': 'b', 'پ': 'p', 'ت': 't', 'ط': 't', 'ث': 's', 'س': 's', 'ص': 's', 'ج': 'j', 'چ': 'ch',
    'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ز': 'z', 'ض': 'z', 'ظ': 'z', 'ر': 'r', 'ژ': 'zh',
    'ش': 'sh', 'غ': '(?:gh|q)', 'ق': '(?:q|gh)', 'ف': 'f', 'ک': '(?:k|g)', 'گ': 'g', 'ل': 'l', 'م': 'm',
    'ن': 'n', 'آ': 'a', 'ع': '', 'ء': '', 'ئ': "(?:y|')?", 'أ': 'a', 'ؤ': '(?:ow|o|u)',
}
_WORDS = {'سفلی': 'sofla', 'علیا': 'olya', 'وسطی': 'vosta', 'بالا': 'bala', 'پایین': 'pa(?:y)?in',
          'آباد': 'abad', 'قلعه': "qal(?:'?e)?h?", 'امامزاده': '[ei]mamzadeh', 'امام': '[ei]mam',
          'شیخ': 'she(?:y|i)kh', 'حسین': 'hos(?:s)?e(?:y|i)n', 'ده': 'deh', 'اله': '(?:oll|all|el|l)ah'}
_SV = '[aeo]?'            # unwritten short vowel
_SEP = '(?:-?y?e)?[ -]?'  # ezafe or word break


def _word_regex(word):
    if word in _WORDS:
        return _WORDS[word]
    parts = []
    for i, ch in enumerate(word):
        if ch == 'ا':
            p = '[aeo]' if i == 0 else 'a'
        elif ch == 'و':
            p = '(?:u|o|v|ow|ou|w)'
        elif ch == 'ی':
            p = '(?:iy|i|y|ey|ei|ay|e)'
        elif ch == 'ه':
            p = '(?:eh|ah|e|a|h)' if i == len(word) - 1 else '(?:h|e)'
        elif ch in 'ۀة':
            p = '(?:eh|e|at|h)'
        elif ch in _ROMAN:
            p = f'(?:{_ROMAN[ch]})+' if _ROMAN[ch] else ''
        else:
            return None
        parts.append(p)
    return _SV.join(parts)


_regex_cache = {}


def _name_regex(fa):
    if fa not in _regex_cache:
        words = [_word_regex(w) for w in re.split(r'[\s‌]+', clean_census(fa)) if w]
        _regex_cache[fa] = re.compile('^' + _SEP.join(words) + '$') if words and None not in words else None
    return _regex_cache[fa]


def consistent(fa, en):
    """True when the English name is a possible romanization of the Persian name."""
    rx = _name_regex(fa)
    return bool(rx and rx.match(re.sub(r'\s+', ' ', clean_en(en).lower())))


# ---------------------------------------------------------------- census workbooks

def _xlsx_rows(path):
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ElementTree.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns):
                strings.append(''.join(t.text or '' for t in si.iter('{%s}t' % ns['m'])))
        sheet = ElementTree.fromstring(z.read('xl/worksheets/sheet1.xml'))
        for row in sheet.iter('{%s}row' % ns['m']):
            values = {}
            for c in row.findall('m:c', ns):
                col = re.match(r'[A-Z]+', c.get('r')).group()
                idx = 0
                for ch in col:
                    idx = idx * 26 + ord(ch) - 64
                v = c.find('m:v', ns)
                text = ''.join(t.text or '' for t in c.iter('{%s}t' % ns['m'])) if c.get('t') == 'inlineStr' else (v.text if v is not None else '')
                values[idx - 1] = strings[int(text)] if c.get('t') == 's' and text else text
            yield [values.get(i, '').strip() for i in range(18)]


def census_rows(paths):
    """Record kinds: 1 province, 2 county, 3 district, 4 rural district, 5 city, 6/8 settlement."""
    for path in paths:
        for r in _xlsx_rows(path):
            kind = r[11]
            if kind not in {'1', '2', '3', '4', '5', '6', '8'}:
                continue
            name = r[10] if kind in {'6', '8'} else {'1': r[1], '2': r[3], '3': r[5], '4': r[7], '5': r[7]}[kind]
            yield {'kind': kind, 'ostan_code': r[0], 'ostan': r[1], 'shahrestan': r[3], 'abadi_code': r[9],
                   'name': name, 'population': r[15] if r[15].isdigit() else ''}


# ---------------------------------------------------------------- planning

def load_locations(path):
    """CSV from README's export: id,location_type_id,parent_id,geoname_id,country,value_translations."""
    with open(path, encoding='utf8', newline='') as fh:
        rows = list(csv.DictReader(fh))
    for r in rows:
        r['vt'] = json.loads(r['value_translations'])
    return rows


def assign_countries(rows):
    """Provinces carry no GeoNames country; take it from the Iran country row or their cities."""
    iran = {r['id'] for r in rows if r['location_type_id'] == '1' and r['vt'].get('en-US') == 'Iran'}
    child = defaultdict(Counter)
    for r in rows:
        if r['country'] and r['parent_id']:
            child[r['parent_id']][r['country']] += 1
    for r in rows:
        if r['location_type_id'] == PROVINCE and not r['country']:
            if r['parent_id'] in iran:
                r['country'] = 'IR'
            elif child[r['id']]:
                r['country'] = child[r['id']].most_common(1)[0][0]


class Census:
    def __init__(self, records, provinces):
        names = {c['ostan_code']: c['ostan'] for c in records if c['kind'] == '1'}
        self.province_code = {}
        for p in provinces:
            key = fa_key(re.sub(r'^استان\s*', '', clean_fa(p['vt'].get('fa-IR') or p['vt'].get('fa') or '')))
            hits = [code for code, name in names.items() if fa_key(name) == key]
            if len(hits) == 1:
                self.province_code[p['id']] = hits[0]
        self.by_key = defaultdict(set)
        self.by_skeleton = defaultdict(set)
        for c in records:
            # numbered city rows are municipal districts (شیراز1), not places
            if c['kind'] in {'6', '8'} or (c['kind'] == '5' and not re.search(r'\d', c['name'])):
                if c['name'].strip():
                    name = clean_census(c['name'])
                    self.by_key[c['ostan_code'], fa_key(name)].add(name)
                    self.by_skeleton[c['ostan_code'], fa_skeleton(name)].add(name)

    def verdict(self, province_id, en, current_fa):
        """Return (verdict, replacement or None). Replacement only for one unambiguous census name."""
        code = self.province_code.get(province_id)
        if not code:
            return 'no_province', None
        persian = is_persian(current_fa)
        in_census = persian and (code, fa_key(current_fa)) in self.by_key
        agrees = persian and consistent(current_fa, en)
        pool = self.by_skeleton.get((code, en_skeleton(en)), set()) if en else set()
        candidates = {}
        for n in sorted(pool):  # deterministic: several census spellings can share one key
            if consistent(n, en):
                candidates.setdefault(fa_key(n), n)
        if agrees and in_census:
            return 'confirmed', None
        if agrees and fa_key(current_fa) in candidates:
            return 'confirmed', None
        if agrees and len(candidates) != 1:
            return 'consistent_not_in_census', None
        # one census spelling fits the English: the census wins (تاکی -> تاگی for Tagi)
        if len(candidates) == 1:
            return ('replaced' if persian else 'filled'), next(iter(candidates.values()))
        if in_census:
            return 'census_name_en_mismatch', None
        return ('ambiguous' if candidates else 'unmatched'), None


def plan(rows, census, seed_rows, protected=()):
    """Yield change records. `seed_rows` are pre-GeoNames cities; a change never makes a GeoNames
    row newly share a name with one, because text resolution prefers the newer row."""
    assign_countries(rows)
    country_of = {r['id']: r['parent_id'] for r in rows if r['location_type_id'] == PROVINCE}
    seed_names = defaultdict(set)
    for s in seed_rows:
        for v in s['vt'].values():
            if isinstance(v, str) and v.strip():
                seed_names[s['country_id']].add(v.strip().lower())
    protected = {p.lower() for p in protected}
    stats = Counter()
    for r in rows:
        vt, kind, cc = r['vt'], r['location_type_id'], r['country']
        new, reasons = dict(vt), set()
        for k in FA_KEYS:
            v = vt.get(k)
            if isinstance(v, str) and is_persian(v):
                c = clean_fa(v)
                if kind == PROVINCE:
                    c = re.sub(r'^استان\s+', '', c)
                if c != v:
                    new[k] = c
                    reasons.add('fa_orthography')
        if cc == 'IR' and kind == CITY and r['geoname_id']:
            en = clean_en(vt.get('en-US') or vt.get('en') or '')
            verdict, replacement = census.verdict(r['parent_id'], en, new.get('fa-IR') or new.get('fa') or '')
            stats['ir_' + verdict] += 1
            if replacement:
                for k in FA_KEYS:
                    new[k] = replacement
                reasons.add('census_' + verdict)
            for k in FA_KEYS:
                v = new.get(k)
                if isinstance(v, str) and v and LATIN.search(v) and not ARABIC_SCRIPT.search(v):
                    del new[k]  # a romanization stored as Persian; readers fall back to English
                    reasons.add('fa_latin_removed')
        if cc in BGN_COUNTRIES and kind in {CITY, PROVINCE}:
            for k in EN_KEYS:
                v = vt.get(k)
                if isinstance(v, str) and v and clean_en(v) and clean_en(v) != v:
                    new[k] = clean_en(v)
                    reasons.add('en_marks')
        if new == vt:
            continue
        old_values = {v.strip().lower() for v in vt.values() if isinstance(v, str)}
        # profile text resolves only countries and cities (active-location.ts)
        if kind in {'1', CITY} and old_values & protected:
            stats['skipped_protected'] += 1
            continue
        if kind == CITY and r['geoname_id']:
            names = seed_names.get(country_of.get(r['parent_id'], r['parent_id']), set())
            for k, v in list(new.items()):
                if isinstance(v, str) and v != vt.get(k) and v.strip().lower() in names - old_values:
                    if k in vt:
                        new[k] = vt[k]
                    else:
                        del new[k]
                    stats['kept_to_avoid_seed_collision'] += 1
            if new == vt:
                continue
        for reason in reasons:
            stats['reason_' + reason] += 1
        stats['rows_changed'] += 1
        yield {'id': r['id'], 'old': json.dumps(vt, ensure_ascii=False, sort_keys=True),
               'new': json.dumps(new, ensure_ascii=False, sort_keys=True), 'reasons': ','.join(sorted(reasons)),
               'en_before': vt.get('en-US', ''), 'en_after': new.get('en-US', ''),
               'fa_before': vt.get('fa-IR', ''), 'fa_after': new.get('fa-IR', '')}
    plan.stats = stats


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    c = sub.add_parser('census', help='convert downloaded census .xlsx files to one CSV')
    c.add_argument('--data-dir', type=Path, required=True)
    c.add_argument('--out', type=Path, required=True)
    p = sub.add_parser('plan', help='write plan.csv (id, old, new) and plan.report.json')
    p.add_argument('--locations', type=Path, required=True)
    p.add_argument('--seed-cities', type=Path, required=True)
    p.add_argument('--census', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    p.add_argument('--protect', default='', help='comma-separated names stored as profile text; rows carrying them are never changed')
    args = parser.parse_args(argv)
    if args.command == 'census':
        files = sorted(args.data_dir.glob('CN95_HouseholdPopulationVillage_*.xlsx'))
        if len(files) != CENSUS_PROVINCES:
            raise SystemExit(f'expected {CENSUS_PROVINCES} province workbooks, found {len(files)}')
        records = list(census_rows(files))
        with args.out.open('w', encoding='utf8', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=list(records[0]))
            w.writeheader()
            w.writerows(records)
        print(json.dumps(Counter(r['kind'] for r in records)))
        return
    rows = load_locations(args.locations)
    with args.seed_cities.open(encoding='utf8', newline='') as fh:
        seeds = [dict(s, vt=json.loads(s['value_translations'])) for s in csv.DictReader(fh)]
    with args.census.open(encoding='utf8', newline='') as fh:
        records = list(csv.DictReader(fh))
    assign_countries(rows)
    census = Census(records, [r for r in rows if r['location_type_id'] == PROVINCE and r['country'] == 'IR'])
    changes = list(plan(rows, census, seeds, [x for x in args.protect.split(',') if x]))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open('w', encoding='utf8', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=list(changes[0]))
        w.writeheader()
        w.writerows(changes)
    report = {'provinces_mapped': len(census.province_code), 'stats': dict(sorted(plan.stats.items()))}
    args.out.with_suffix('.report.json').write_text(json.dumps(report, indent=2), encoding='utf8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
