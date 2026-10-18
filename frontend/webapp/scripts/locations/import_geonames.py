#!/usr/bin/env python3
"""Additive GeoNames catalogue import. Python 3.11+, standard library only.

prepare downloads source archives; plan produces a reviewable SQL transaction from
a database snapshot. No credentials are read and no database writes are made here.
See README.md for snapshot/apply commands, coverage and ambiguity handling.
"""
import argparse
import csv
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import unicodedata
import urllib.request
import uuid
import zipfile

BASE = 'https://download.geonames.org/export/dump/'
COUNTRIES = {
    'IR': ('Iran', 'ایران'), 'TR': ('Turkey', 'ترکیه'),
    'AZ': ('Azerbaijan', 'آذربایجان'), 'TJ': ('Tajikistan', 'تاجیکستان'),
    'IQ': ('Iraq', 'عراق'), 'OM': ('Oman', 'عمان'), 'QA': ('Qatar', 'قطر'),
    'AE': ('United Arab Emirates', 'امارات متحده عربی'),
    'AM': ('Armenia', 'ارمنستان'), 'AF': ('Afghanistan', 'افغانستان'),
    'PK': ('Pakistan', 'پاکستان'), 'TM': ('Turkmenistan', 'ترکمنستان'),
    'GE': ('Georgia', 'گرجستان'), 'RU': ('Russia', 'روسیه'),
    'KZ': ('Kazakhstan', 'قزاقستان'), 'UZ': ('Uzbekistan', 'ازبکستان'),
    'CN': ('China', 'چین'), 'IN': ('India', 'هند'), 'KW': ('Kuwait', 'کویت'),
    'SA': ('Saudi Arabia', 'عربستان سعودی'), 'JO': ('Jordan', 'اردن'),
    'SY': ('Syria', 'سوریه'), 'GR': ('Greece', 'یونان'),
    'BG': ('Bulgaria', 'بلغارستان'), 'BH': ('Bahrain', 'بحرین'),
}
# Actual application languages plus native languages of the requested countries.
LANGUAGES = {
    'en': 'en-US', 'fa': 'fa-IR', 'ar': 'ar-SA', 'tr': 'tr-TR',
    'de': 'de-DE', 'es': 'es-ES', 'fr': 'fr-FR', 'ku': 'ku',
    'ru': 'ru-RU', 'tg': 'tg-TJ', 'zh': 'zh-CN', 'az': 'az-AZ',
    'hy': 'hy-AM', 'ka': 'ka-GE', 'ur': 'ur-PK', 'ps': 'ps-AF',
    'tk': 'tk-TM', 'kk': 'kk-KZ', 'uz': 'uz-UZ', 'hi': 'hi-IN',
    'el': 'el-GR', 'bg': 'bg-BG',
}
# Inhabited settlements, including capitals/admin seats and religious settlements.
# Excludes abandoned/destroyed/historical places, city sections, and groups of places.
SETTLEMENT_CODES = {'PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLA5', 'PPLC', 'PPLG', 'PPLR'}
NAMESPACE = uuid.UUID('4888fb01-22eb-5fc2-a5f8-a4f58de67b8c')


def normal(value):
    value = unicodedata.normalize('NFKD', value).casefold().translate(str.maketrans('يك', 'یک'))
    return ''.join(c for c in value if c.isalnum() and not unicodedata.combining(c))


def sql_quote(value):
    if value is None:
        return 'NULL'
    return "'" + str(value).replace("'", "''") + "'"


def download(data_dir, relative):
    target = data_dir / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if target.suffix == '.zip':
            with zipfile.ZipFile(target) as z:
                if z.testzip():
                    raise ValueError(f'Corrupt cached archive: {target}')
        return
    partial = target.with_suffix(target.suffix + '.partial')
    # Atomic cache; interrupted files are never accepted as complete downloads.
    request = urllib.request.Request(BASE + relative, headers={'User-Agent': 'Lsevin-location-import/1.0'})
    with urllib.request.urlopen(request, timeout=180) as response, partial.open('wb') as out:
        shutil.copyfileobj(response, out)
    if target.suffix == '.zip':
        with zipfile.ZipFile(partial) as z:
            if z.testzip():
                raise ValueError(f'Corrupt download: {relative}')
    partial.replace(target)
    print(f'Downloaded {relative}: {target.stat().st_size:,} bytes', flush=True)


def prepare(data_dir, countries):
    data_dir.mkdir(parents=True, exist_ok=True)
    files = ['countryInfo.txt', 'admin1CodesASCII.txt', 'readme.txt']
    files += [f'{c}.zip' for c in countries]
    files += [f'alternatenames/{c}.zip' for c in countries]
    with ThreadPoolExecutor(max_workers=5) as pool:
        list(pool.map(lambda f: download(data_dir, f), files))
    manifest = {
        'retrieved_at': datetime.now(timezone.utc).isoformat(),
        'license': 'CC BY 4.0', 'attribution': 'GeoNames https://www.geonames.org/',
        'files': {f: {'url': BASE + f, 'sha256': hashlib.sha256((data_dir / f).read_bytes()).hexdigest()}
                  for f in files},
    }
    (data_dir / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')


def tsv(path, member=None):
    if member:
        with zipfile.ZipFile(path) as z, z.open(member) as raw:
            for line in io.TextIOWrapper(raw, encoding='utf8'):
                if line.strip() and not line.startswith('#'):
                    yield line.rstrip('\r\n').split('\t')
    else:
        with path.open(encoding='utf8') as raw:
            for line in raw:
                if line.strip() and not line.startswith('#'):
                    yield line.rstrip('\r\n').split('\t')


def load_country(data_dir, cc):
    info = next(row for row in tsv(data_dir / 'countryInfo.txt') if row[0] == cc)
    features = {}

    def feature(gid, name, ascii_name, kind, admin1='', feature_code='', lat=None, lon=None, population=0):
        names = {name.strip(), ascii_name.strip()} - {''}
        features[str(gid)] = {'geoname_id': str(gid), 'country': cc, 'kind': kind,
            'admin1': admin1, 'feature_code': feature_code, 'latitude': lat, 'longitude': lon,
            'population': population, 'translations': {'en-US': ascii_name.strip() or name.strip()},
            'aliases': names, 'preferred': {}}

    feature(info[16], COUNTRIES[cc][0], COUNTRIES[cc][0], 1, feature_code='PCLI')
    features[info[16]]['translations']['fa-IR'] = COUNTRIES[cc][1]
    for row in tsv(data_dir / 'admin1CodesASCII.txt'):
        if row[0].startswith(cc + '.'):
            feature(row[3], row[1], row[2], 3, row[0].split('.', 1)[1], 'ADM1')
    for row in tsv(data_dir / f'{cc}.zip', f'{cc}.txt'):
        if len(row) != 19:
            raise ValueError(f'Malformed country record {cc}: {row[:1]}')
        if row[8] != cc:
            continue
        if row[6] == 'P' and row[7] in SETTLEMENT_CODES:
            feature(row[0], row[1], row[2], 2, row[10], row[7], float(row[4]), float(row[5]), int(row[14] or 0))
    # Missing archive is a hard failure; never silently declare a country translated.
    for row in tsv(data_dir / 'alternatenames' / f'{cc}.zip', f'{cc}.txt'):
        if len(row) < 8:
            raise ValueError(f'Malformed alternate record in {cc}')
        _, gid, language, name, preferred, short, colloquial, historic, *period = row
        f = features.get(gid)
        if not f or not name.strip() or colloquial == '1' or historic == '1':
            continue
        # A nonempty end date indicates a former name even if the historic flag is absent.
        if len(period) > 1 and period[1].strip():
            continue
        if language in LANGUAGES or not language:
            f['aliases'].add(name.strip())
        lang = language.split('-')[0]
        if lang not in LANGUAGES:
            continue
        rank = (preferred == '1', short == '1', -int(row[0]))
        if lang not in f['preferred'] or rank > f['preferred'][lang]:
            f['preferred'][lang] = rank
            f['translations'][LANGUAGES[lang]] = name.strip()
    # The user's requested country names are explicit, and are used only to fill gaps.
    features[info[16]]['translations'].update({'en-US': COUNTRIES[cc][0], 'fa-IR': COUNTRIES[cc][1]})
    # Store both locale spellings: legacy .NET uses regional tags; web selectors use base tags.
    for f in features.values():
        for lang, key in LANGUAGES.items():
            if key in f['translations']:
                f['translations'][lang] = f['translations'][key]
        del f['preferred']
    return list(features.values())


def missing_translations(existing, incoming):
    """Preserve nonempty values, including admin edits and base/regional variants."""
    if not isinstance(existing, dict):
        raise ValueError('Legacy translations are not a JSON object; manual review required')
    result = dict(existing)
    for lang, key in LANGUAGES.items():
        old = next((existing[k] for k in (lang, key)
                    if isinstance(existing.get(k), str) and existing[k].strip()), None)
        for k in {lang, key}:
            if not isinstance(existing.get(k), str) or not existing[k].strip():
                value = old or incoming.get(k)
                if value:
                    result[k] = value
    return result


class Matcher:
    def __init__(self, snapshot):
        self.existing = {r['id']: r for r in snapshot['locations']}
        self.refs = {str(r['geoname_id']): r['location_id'] for r in snapshot.get('refs', [])}
        self.claimed = {v: k for k, v in self.refs.items()}
        self.country_cache = {}
        self.index = defaultdict(set)
        for row in self.existing.values():
            country = self.country_of(row['id'])
            values = row['value_translations']
            if isinstance(values, dict):
                for value in [row['code'], *values.values()]:
                    if isinstance(value, str) and normal(value):
                        self.index[(country, row['location_type_id'], normal(value))].add(row['id'])

    def country_of(self, loc_id, seen=None):
        if loc_id in self.country_cache:
            return self.country_cache[loc_id]
        seen = (seen or set()) | {loc_id}
        row = self.existing[loc_id]
        if row['location_type_id'] == 1:
            country = row['code'].upper()
        elif row['parent_id'] in seen or row['parent_id'] not in self.existing:
            raise ValueError('Cycle or missing parent in existing location hierarchy')
        else:
            country = self.country_of(row['parent_id'], seen)
        self.country_cache[loc_id] = country
        return country

    def candidates(self, f, parent_id):
        gid, kind, cc = f['geoname_id'], f['kind'], f['country']
        if gid in self.refs:
            row = self.existing[self.refs[gid]]
            if row['location_type_id'] != kind or self.country_of(row['id']) != cc:
                raise ValueError(f'Conflicting persisted source identity {gid}')
            return {row['id']}
        if kind == 1:
            return {r['id'] for r in self.existing.values()
                    if r['location_type_id'] == 1 and r['code'].upper() == cc}
        candidates = set()
        for name in f['aliases']:
            candidates.update(self.index.get((cc, kind, normal(name)), ()))
        if kind == 3:
            # Historical seed codes use GeoNames admin1; validate name agreement
            # before trusting them, since admin codes can change over time.
            code_matches = {r['id'] for r in self.existing.values()
                            if r['location_type_id'] == 3 and self.country_of(r['id']) == cc
                            and r['code'].upper() == f"{cc}-{f['admin1']}".upper()}
            if code_matches:
                return code_matches & candidates or code_matches | candidates
        # Country-parented legacy cities can match a province-parented source city.
        # If a same-name legacy city has another province, quarantine rather than
        # create a potential duplicate based on an uncertain administrative mapping.
        scoped = {i for i in candidates if self.existing[i]['parent_id'] == parent_id
                  or self.existing[self.existing[i]['parent_id']]['location_type_id'] == 1}
        return scoped or candidates

    def choose_level(self, features, parent_ids):
        candidates = {f['geoname_id']: self.candidates(f, parent_ids[f['geoname_id']]) for f in features}
        reverse = defaultdict(set)
        for gid, ids in candidates.items():
            for loc_id in ids:
                reverse[loc_id].add(gid)
        outcomes = []
        # Different GeoNames IDs with same name and coordinate may themselves be
        # duplicate source features. Quarantine both; never collapse real villages.
        positions = Counter((normal(f['translations']['en-US']), f['latitude'], f['longitude'])
                            for f in features if f['kind'] == 2)
        for f in features:
            gid = f['geoname_id']
            ids = candidates[gid]
            reason = None
            if f['kind'] == 2 and positions[(normal(f['translations']['en-US']), f['latitude'], f['longitude'])] > 1:
                reason = 'duplicate_source_name_and_coordinate'
            elif gid not in self.refs and (len(ids) > 1 or any(len(reverse[i]) > 1 or
                    (i in self.claimed and self.claimed[i] != gid) for i in ids)):
                reason = 'ambiguous_legacy_match'
            elif gid not in self.refs and len(ids) == 1 and f['kind'] != 1:
                row = self.existing[next(iter(ids))]
                if f['kind'] == 2 and row['parent_id'] != parent_ids[gid] and self.existing[row['parent_id']]['location_type_id'] != 1:
                    reason = 'conflicting_province'
                elif f['kind'] == 3 and not ({normal(v) for v in row['value_translations'].values() if isinstance(v, str)} & {normal(v) for v in f['aliases']}):
                    reason = 'admin_code_name_disagreement'
            if reason:
                outcomes.append((f, None, reason, sorted(ids)))
                continue
            loc_id = next(iter(ids), str(uuid.uuid5(NAMESPACE, 'geonames:' + gid)))
            if not ids and loc_id in self.existing:
                raise ValueError(f'Deterministic ID collision: {gid}')
            if ids:
                self.claimed[loc_id] = gid
            outcomes.append((f, loc_id, None, []))
        return outcomes


def plan(data_dir, countries, snapshot_path, output):
    snapshot = json.loads(snapshot_path.read_text(encoding='utf8'))
    if not re.fullmatch('[0-9a-f]{32}', snapshot['fingerprint']):
        raise ValueError('Snapshot fingerprint missing/invalid')
    manifest = json.loads((data_dir / 'manifest.json').read_text(encoding='utf8'))
    required = {'countryInfo.txt', 'admin1CodesASCII.txt', 'readme.txt'}
    required.update(f'{cc}.zip' for cc in countries)
    required.update(f'alternatenames/{cc}.zip' for cc in countries)
    if not required <= manifest['files'].keys():
        raise ValueError('Source manifest does not cover every requested country; run prepare first')
    # Source drift after download invalidates the reproducibility manifest.
    for f, meta in manifest['files'].items():
        if hashlib.sha256((data_dir / f).read_bytes()).hexdigest() != meta['sha256']:
            raise ValueError(f'Source checksum changed: {f}')
    matcher = Matcher(snapshot)
    report = {'source': manifest, 'snapshot_fingerprint': snapshot['fingerprint'],
              'fingerprint_version': snapshot.get('fingerprint_version', 1),
              'countries': {}, 'totals': Counter(), 'languages': LANGUAGES,
              'scope': 'inhabited cities, towns and villages; no population threshold or row cap'}
    output.parent.mkdir(parents=True, exist_ok=True)
    rows_file = output.with_suffix('.rows.tsv')
    review_file = output.with_suffix('.review.jsonl')
    missing_file = output.with_suffix('.missing-fa.jsonl')
    with rows_file.open('w', encoding='utf8', newline='') as out, review_file.open('w', encoding='utf8') as review, missing_file.open('w', encoding='utf8') as missing:
        writer = csv.writer(out, delimiter='\t', lineterminator='\n')
        for cc in countries:
            features = load_country(data_dir, cc)
            country = next(f for f in features if f['kind'] == 1)
            provinces = [f for f in features if f['kind'] == 3]
            cities = [f for f in features if f['kind'] == 2]
            stats = Counter(source_countries=1, source_provinces=len(provinces), source_settlements=len(cities))
            coverage = Counter()
            parents, resolved = {}, {}
            country_id = None
            for level in ([country], provinces, cities):
                for f in level:
                    parents[f['geoname_id']] = None if f['kind'] == 1 else (
                        country_id if f['kind'] == 3 else resolved.get(f['admin1'], country_id))
                valid = [f for f in level if f['kind'] == 1 or parents[f['geoname_id']] is not None]
                for f in level:
                    if f['kind'] != 1 and parents[f['geoname_id']] is None:
                        stats['held'] += 1
                        review.write(json.dumps({'country': cc, 'geoname_id': f['geoname_id'], 'reason': 'unresolved_parent'}, ensure_ascii=False) + '\n')
                for f, loc_id, reason, matches in matcher.choose_level(valid, parents):
                    if reason:
                        stats['held'] += 1
                        review.write(json.dumps({'country': cc, 'geoname_id': f['geoname_id'], 'name': f['translations']['en-US'], 'reason': reason, 'existing_ids': matches}, ensure_ascii=False) + '\n')
                        if f['kind'] == 3:
                            resolved[f['admin1']] = None
                        continue
                    if f['kind'] == 1:
                        country_id = loc_id
                    if f['kind'] == 3:
                        resolved[f['admin1']] = loc_id
                    old = matcher.existing.get(loc_id)
                    translations = missing_translations(old['value_translations'], f['translations']) if old else f['translations']
                    stats['matched' if old else 'inserted'] += 1
                    if old and translations != old['value_translations']:
                        stats['translations_enriched'] += 1
                    if f['kind'] == 2:
                        for lang, key in LANGUAGES.items():
                            if translations.get(lang) or translations.get(key):
                                coverage[lang] += 1
                        if not translations.get('fa-IR'):
                            missing.write(json.dumps({'country': cc, 'geoname_id': f['geoname_id'], 'name': translations['en-US']}, ensure_ascii=False) + '\n')
                    metadata = {k: f[k] for k in ('country', 'kind', 'admin1', 'feature_code', 'latitude', 'longitude', 'population')}
                    code = old['code'] if old else cc if f['kind'] == 1 else 'G' + f['geoname_id']
                    if len(code) > 10:
                        raise ValueError('Source identifier does not fit location.code')
                    writer.writerow([f['geoname_id'], loc_id, code, f['kind'], old['parent_id'] if old else parents[f['geoname_id']],
                        json.dumps(translations, ensure_ascii=False), json.dumps(metadata, ensure_ascii=False), 'false' if old else 'true'])
            report['countries'][cc] = {'counts': dict(stats), 'settlement_language_coverage': dict(coverage)}
            report['totals'].update(stats)
            print(cc, dict(stats), 'Persian settlements', coverage['fa'], flush=True)
    report['totals'] = dict(report['totals'])
    report['rows_sha256'] = hashlib.sha256(rows_file.read_bytes()).hexdigest()
    output.with_suffix('.report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    emit_sql(output, rows_file, snapshot['fingerprint'], snapshot.get('fingerprint_version', 1))


def emit_sql(output, rows_file, fingerprint, fingerprint_version=1):
    if fingerprint_version not in (1, 2):
        raise ValueError('Unsupported snapshot fingerprint version')
    row_fingerprint = 'row_to_json(l)::text' if fingerprint_version == 1 else 'md5(row_to_json(l)::text)'
    migration_path = Path(__file__).resolve().parents[2] / 'db/migrations/0072_location_geonames_refs.sql'
    migration = migration_path.read_text(encoding='utf8')
    checksum = hashlib.sha256(migration_path.read_bytes()).hexdigest()
    with output.open('w', encoding='utf8', newline='\n') as out:
        out.write('\\set ON_ERROR_STOP on\nBEGIN;\nSET LOCAL lock_timeout = \'15s\';\nSET LOCAL statement_timeout = \'15min\';\n')
        out.write('-- Keep capture enabled by default. For an operator-managed direct import\n'
                  '-- into BOTH replicated databases, invoke psql -v direct_both_nodes=1.\n'
                  "\\if :{?direct_both_nodes}\nSELECT set_config('symmetric.triggers_disabled', '1', true);\n\\endif\n")
        out.write('SELECT pg_advisory_xact_lock(8142337015);\nLOCK TABLE category.locations IN SHARE ROW EXCLUSIVE MODE;\n')
        out.write("DO $$ BEGIN IF (SELECT md5(string_agg(" + row_fingerprint + ", '' ORDER BY id)) FROM category.locations l) IS DISTINCT FROM " + sql_quote(fingerprint) + " THEN RAISE EXCEPTION 'Stale location snapshot: regenerate plan; no changes applied'; END IF; END $$;\n")
        out.write("DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.schema_migrations WHERE name='0072_location_geonames_refs.sql' AND checksum <> " + sql_quote(checksum) + ") THEN RAISE EXCEPTION 'Source identity migration checksum mismatch'; END IF; END $$;\n")
        out.write(migration + '\n')
        out.write("INSERT INTO public.schema_migrations(name,checksum,duration_ms) VALUES ('0072_location_geonames_refs.sql'," + sql_quote(checksum) + ",0) ON CONFLICT (name) DO NOTHING;\n")
        out.write('CREATE TEMP TABLE geo_before ON COMMIT DROP AS SELECT * FROM category.locations;\n')
        out.write('CREATE TEMP TABLE geo_import (geoname_id bigint PRIMARY KEY, id uuid UNIQUE, code varchar(10), kind integer, parent_id uuid, translations jsonb, metadata jsonb, is_new boolean) ON COMMIT DROP;\n')
        out.write("COPY geo_import FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', NULL '');\n")
        with rows_file.open(encoding='utf8') as rows:
            shutil.copyfileobj(rows, out)
        out.write('\\.\n')
        for kind in (1, 3, 2):
            out.write('INSERT INTO category.locations (id,code,value_translations,location_type_id,parent_id,create_date,display_order) '
                      f'SELECT id,code,translations,kind,parent_id,now(),NULL FROM geo_import WHERE is_new AND kind={kind};\n')
        out.write('UPDATE category.locations l SET value_translations=i.translations,last_modified_date=now() FROM geo_import i '
                  'WHERE NOT i.is_new AND l.id=i.id AND l.value_translations IS DISTINCT FROM i.translations;\n')
        out.write('INSERT INTO category.location_geonames_refs (geoname_id,location_id,source_metadata) '
                  'SELECT geoname_id,id,metadata FROM geo_import ON CONFLICT (geoname_id) DO NOTHING;\n')
        out.write("DO $$ BEGIN\nIF EXISTS (SELECT 1 FROM geo_before b LEFT JOIN category.locations l ON l.id=b.id WHERE l.id IS NULL OR l.code IS DISTINCT FROM b.code OR l.parent_id IS DISTINCT FROM b.parent_id OR l.location_type_id <> b.location_type_id OR l.create_date <> b.create_date OR l.display_order IS DISTINCT FROM b.display_order) THEN RAISE EXCEPTION 'Existing location identity changed'; END IF;\n")
        out.write("IF EXISTS (SELECT 1 FROM geo_before b JOIN category.locations l ON l.id=b.id CROSS JOIN LATERAL jsonb_each(b.value_translations) e WHERE jsonb_typeof(e.value)='string' AND btrim(e.value #>> '{}')<>'' AND l.value_translations->e.key IS DISTINCT FROM e.value) THEN RAISE EXCEPTION 'Existing translation changed'; END IF;\n")
        out.write("IF EXISTS (SELECT 1 FROM geo_import i LEFT JOIN category.location_geonames_refs r ON r.geoname_id=i.geoname_id WHERE r.location_id IS DISTINCT FROM i.id) THEN RAISE EXCEPTION 'Conflicting source identities'; END IF;\nEND $$;\n")
        out.write("SELECT count(*) FILTER (WHERE is_new) AS inserted, count(*) FILTER (WHERE NOT is_new) AS matched FROM geo_import;\nCOMMIT;\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['prepare', 'plan'])
    parser.add_argument('--data-dir', type=Path, required=True)
    parser.add_argument('--countries', default=','.join(COUNTRIES))
    parser.add_argument('--snapshot', type=Path)
    parser.add_argument('--out', type=Path)
    args = parser.parse_args()
    countries = args.countries.split(',')
    if not countries or len(countries) != len(set(countries)) or set(countries) - COUNTRIES.keys():
        parser.error('Expected unique ISO country codes from the requested country list')
    if args.command == 'prepare':
        prepare(args.data_dir, countries)
    else:
        if not args.snapshot or not args.out:
            parser.error('plan requires --snapshot and --out')
        plan(args.data_dir, countries, args.snapshot, args.out)


if __name__ == '__main__':
    main()
