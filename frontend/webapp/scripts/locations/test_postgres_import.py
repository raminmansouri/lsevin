"""Real PostgreSQL transaction tests in an automatically created disposable DB.

GEONAMES_TEST_CONTAINER=lsevin-dev-postgres-1 python -m unittest discover ...
The container must have createdb/psql/dropdb and POSTGRES_USER configured.
"""
import csv
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import uuid
from import_geonames import emit_sql


@unittest.skipUnless(os.environ.get('GEONAMES_TEST_CONTAINER'), 'Set GEONAMES_TEST_CONTAINER for real PostgreSQL tests')
class PostgreSQLTests(unittest.TestCase):
    def setUp(self):
        self.container = os.environ['GEONAMES_TEST_CONTAINER']
        self.database = 'lsevin_location_import_test_' + uuid.uuid4().hex[:12]
        self.user = subprocess.check_output(['docker','exec',self.container,'printenv','POSTGRES_USER'], text=True).strip()
        subprocess.run(['docker','exec',self.container,'createdb','-U',self.user,self.database], check=True, capture_output=True)
        self.tmp = tempfile.TemporaryDirectory()
        self.country, self.city, self.new = (str(uuid.uuid4()) for _ in range(3))
        self.run_sql(f"""create schema category;
create table category.locations(id uuid primary key,code varchar(10) not null,value_translations jsonb not null,location_type_id int not null,parent_id uuid references category.locations(id),create_date timestamptz not null default now(),last_modified_date timestamptz default now(),display_order int);
create unique index country_code on category.locations(code) where location_type_id=1;
create unique index city_code on category.locations(parent_id,code) where location_type_id=2;
create table public.schema_migrations(name text primary key,checksum text not null,duration_ms int not null);
insert into category.locations(id,code,value_translations,location_type_id) values('{self.country}','IR','{{"en":"Iran"}}',1);
insert into category.locations(id,code,value_translations,location_type_id,parent_id) values('{self.city}','legacy','{{"en":"Edited","fa":"قدیمی"}}',2,'{self.country}');""")

    def tearDown(self):
        subprocess.run(['docker','exec',self.container,'dropdb','-U',self.user,self.database], check=True, capture_output=True)
        self.tmp.cleanup()

    def run_sql(self, text, success=True, direct_both=False):
        command = ['docker','exec','-i',self.container,'psql','-X','-qAt','-v','ON_ERROR_STOP=1','-U',self.user,'-d',self.database]
        if direct_both:
            command += ['-v', 'direct_both_nodes=1']
        result = subprocess.run(command, input=text, text=True, encoding='utf8', capture_output=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result

    def make_plan(self, new=True, corrupt=False):
        fingerprint = self.run_sql("select md5(string_agg(row_to_json(l)::text,'' order by id)) from category.locations l;").stdout.strip()
        out = Path(self.tmp.name) / 'import.sql'
        with out.with_suffix('.rows.tsv').open('w',encoding='utf8',newline='') as file:
            writer = csv.writer(file, delimiter='\t',lineterminator='\n')
            writer.writerow([100,self.city,'legacy',2,self.country,json.dumps({'en':'CORRUPTED' if corrupt else 'Edited','fa':'قدیمی','en-US':'Edited','fa-IR':'قدیمی'}), '{}','false'])
            writer.writerow([101,self.new,'G101',2,self.country,json.dumps({'en':'New Village','en-US':'New Village'}),'{}','true' if new else 'false'])
        emit_sql(out,out.with_suffix('.rows.tsv'),fingerprint)
        return out.read_text(encoding='utf8')

    def test_additive_upgrade_and_regenerated_rerun(self):
        self.run_sql(self.make_plan())
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'3')
        self.assertEqual(self.run_sql('select count(*) from category.location_geonames_refs;').stdout.strip(),'2')
        self.assertEqual(self.run_sql(f"select code||':'||(value_translations->>'en') from category.locations where id='{self.city}';").stdout.strip(),'legacy:Edited')
        self.run_sql(self.make_plan(new=False))
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'3')

    def test_stale_snapshot_aborts_without_changes(self):
        plan = self.make_plan()
        self.run_sql(f"update category.locations set display_order=7 where id='{self.city}';")
        result = self.run_sql(plan,success=False)
        self.assertIn('Stale location snapshot',result.stderr)
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'2')

    def test_nonempty_translation_guard_rolls_back_entire_import(self):
        result = self.run_sql(self.make_plan(corrupt=True),success=False)
        self.assertIn('Existing translation changed',result.stderr)
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'2')
        self.assertEqual(self.run_sql("select to_regclass('category.location_geonames_refs') is null;").stdout.strip(),'t')

    def test_invalid_parent_rolls_back(self):
        plan = self.make_plan().replace(self.country, str(uuid.uuid4()))
        self.run_sql(plan,success=False)
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'2')

    def test_direct_both_nodes_mode_is_transaction_scoped(self):
        self.run_sql(self.make_plan(),direct_both=True)
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'3')
        self.assertEqual(self.run_sql("select coalesce(current_setting('symmetric.triggers_disabled',true),'unset');").stdout.strip(),'unset')

    def test_scoped_snapshot_preserves_global_fingerprint_and_source_refs(self):
        self.run_sql(self.make_plan())
        self.run_sql(f"insert into category.locations(id,code,value_translations,location_type_id) values('{uuid.uuid4()}','TR','{{\"en\":\"Turkey\"}}',1);")
        query = Path(__file__).with_name('snapshot.sql').read_text(encoding='utf8')
        result = json.loads(self.run_sql('\\set country_codes IR\n' + query).stdout)
        self.assertEqual(len(result['locations']),3)
        self.assertEqual(len(result['refs']),2)
        expected = self.run_sql("select md5(string_agg(md5(row_to_json(l)::text),'' order by id)) from category.locations l;").stdout.strip()
        self.assertEqual(result['fingerprint'],expected)
        self.assertEqual(result['fingerprint_version'],2)

    def test_migration_checksum_mismatch_aborts(self):
        self.run_sql("insert into public.schema_migrations values('0072_location_geonames_refs.sql','wrong',0);")
        result = self.run_sql(self.make_plan(),success=False)
        self.assertIn('migration checksum mismatch',result.stderr)
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'2')

    def test_memory_bounded_fingerprint_applies(self):
        self.make_plan()
        out = Path(self.tmp.name) / 'import.sql'
        fingerprint = self.run_sql("select md5(string_agg(md5(row_to_json(l)::text),'' order by id)) from category.locations l;").stdout.strip()
        emit_sql(out,out.with_suffix('.rows.tsv'),fingerprint,2)
        self.run_sql(out.read_text(encoding='utf8'))
        self.assertEqual(self.run_sql('select count(*) from category.locations;').stdout.strip(),'3')


if __name__ == '__main__':
    unittest.main()
