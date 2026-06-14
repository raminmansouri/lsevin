import os
import json
import time
import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

import psycopg
from psycopg.rows import dict_row
from openai import OpenAI
from tenacity import retry, wait_exponential_jitter, stop_after_attempt, retry_if_exception_type

# ---------------- Logging ----------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("translator")

# ---------------- Config ----------------
@dataclass(frozen=True)
class TableSpec:
    table: str
    pk: str
    columns: List[str]  # translation jsonb columns


TARGET_LOCALES = ["en-US", "ar-SA", "de-DE", "es-ES", "fr-FR", "tr-TR", "ku-KU"]
PREFERRED_SOURCE_LOCALES = ["fa-IR", "en-US"]  # pick first available from JSON

TABLES: List[TableSpec] = [
    TableSpec(table="category.categories", pk="id", columns=["name_translations"]),
    TableSpec(table="category.service_definitions", pk="id", columns=["name_translations"]),
    TableSpec(table="category.service_providers", pk="id", columns=["name_translations", "description_translations"]),
]

MODEL = os.getenv("OPENAI_TRANSLATION_MODEL", "gpt-5-mini")

# ---------------- OpenAI ----------------
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])


class TemporaryOpenAIError(Exception):
    pass


@retry(
    wait=wait_exponential_jitter(initial=1, max=20),
    stop=stop_after_attempt(6),
    retry=retry_if_exception_type((TemporaryOpenAIError, TimeoutError)),
)
def translate_text_humanlike(source_text: str, source_locale: str, target_locale: str) -> str:
    """Returns translated string only. Retries on transient errors."""
    if not source_text or not source_text.strip():
        return source_text

    instructions = (
        "You are a professional human translator. "
        "Translate naturally (not literal, not machiney), preserving meaning, tone, and domain terminology. "
        "Preserve proper nouns, product/brand names, doctor/clinic names unless the target language normally translates them. "
        "Do NOT add explanations. Do NOT quote. Do NOT include extra punctuation beyond what the translation needs."
    )

    payload = {"source_locale": source_locale, "target_locale": target_locale, "text": source_text}

    try:
        resp = client.responses.create(
            model=MODEL,
            input=[
                {"role": "system", "content": instructions},
                {
                    "role": "user",
                    "content": (
                        "Return a JSON object with exactly one key: translated_text.\n"
                        f"Input JSON:\n{json.dumps(payload, ensure_ascii=False)}"
                    ),
                },
            ],
            text={"format": {"type": "json_object"}},
        )

        data = json.loads(resp.output_text)
        out = (data.get("translated_text") or "").strip()
        if not out:
            raise TemporaryOpenAIError("Empty translated_text from model")
        return out

    except (json.JSONDecodeError, KeyError) as e:
        raise TemporaryOpenAIError(f"Bad JSON from model: {e}")
    except Exception as e:
        msg = str(e).lower()
        if "timeout" in msg or "temporarily" in msg or "rate limit" in msg or "429" in msg or "5" in msg:
            raise TemporaryOpenAIError(str(e))
        raise


# ---------------- Rich JSON handling (Lexical-like) ----------------
def try_parse_json(s: str) -> Optional[Any]:
    if not s:
        return None
    s2 = s.strip()
    if not s2:
        return None
    if not (s2.startswith("{") or s2.startswith("[")):
        return None
    try:
        return json.loads(s2)
    except Exception:
        return None


def extract_and_translate_lexical_json(obj: Any, source_locale: str, target_locale: str) -> Tuple[Any, int]:
    """
    Walks a Lexical-ish JSON tree and translates fields where node.type == 'text' and node.text exists.
    Returns (new_obj, translated_count).
    """
    count = 0

    def walk(node: Any) -> Any:
        nonlocal count
        if isinstance(node, dict):
            if node.get("type") == "text" and isinstance(node.get("text"), str):
                original = node["text"]
                translated = translate_text_humanlike(original, source_locale, target_locale)
                node = dict(node)
                node["text"] = translated
                count += 1
                return node

            return {k: walk(v) for k, v in node.items()}

        if isinstance(node, list):
            return [walk(x) for x in node]

        return node

    return walk(obj), count


# ---------------- DB helpers ----------------
def pick_source_locale(translations: Dict[str, Any]) -> Optional[str]:
    for loc in PREFERRED_SOURCE_LOCALES:
        if loc in translations and isinstance(translations[loc], str) and translations[loc].strip():
            return loc
    for loc, val in translations.items():
        if isinstance(val, str) and val.strip():
            return loc
    return None


def compute_missing_locales(translations: Dict[str, Any]) -> List[str]:
    existing = {k for k, v in translations.items() if isinstance(v, str) and v.strip()}
    return [loc for loc in TARGET_LOCALES if loc not in existing]


def upsert_audit(
    conn: psycopg.Connection,
    table_name: str,
    column_name: str,
    row_pk: str,
    source_locale: str,
    target_locale: str,
    source_text: str,
    translated_text: Optional[str],
    status: str,
    error: Optional[str],
):
    conn.execute(
        """
        insert into translation_audit
          (table_name, column_name, row_pk, source_locale, target_locale, source_text, translated_text, status, error, model)
        values
          (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (table_name, column_name, row_pk, source_locale, target_locale, source_text, translated_text, status, error, MODEL),
    )


def process_table_column(conn: psycopg.Connection, spec: TableSpec, column: str, batch_size: int = 50) -> int:
    """
    Pull a batch of rows that still miss at least one target locale for this column.
    Uses FOR UPDATE SKIP LOCKED so you can run multiple workers safely.
    """
    q = f"""
    select {spec.pk} as pk, {column} as tr
    from {spec.table}
    where {column} is not null
      and (
        {" or ".join([f"not ({column} ? %s)" for _ in TARGET_LOCALES])}
      )
    order by {spec.pk}
    limit %s
    for update skip locked
    """
    params = TARGET_LOCALES + [batch_size]

    rows = conn.execute(q, params).fetchall()
    if not rows:
        return 0

    for r in rows:
        pk_val = r["pk"]
        pk = str(pk_val)

        tr = r["tr"]
        if not isinstance(tr, dict):
            tr = dict(tr) if tr else {}

        source_locale = pick_source_locale(tr)
        if not source_locale:
            log.info("skip row (no source text)", extra={"table": spec.table, "column": column, "pk": pk})
            continue

        missing = compute_missing_locales(tr)
        if not missing:
            continue

        source_val = tr.get(source_locale)
        if not isinstance(source_val, str) or not source_val.strip():
            continue

        for target_locale in missing:
            try:
                # IMPORTANT: parse fresh per locale (avoid reusing mutated object)
                parsed = try_parse_json(source_val)

                if parsed is not None:
                    new_obj, n = extract_and_translate_lexical_json(parsed, source_locale, target_locale)
                    translated_value = json.dumps(new_obj, ensure_ascii=False)
                    log.info(
                        "translated rich-json",
                        extra={"table": spec.table, "column": column, "pk": pk, "to": target_locale, "nodes": n},
                    )
                else:
                    translated_value = translate_text_humanlike(source_val, source_locale, target_locale)
                    log.info(
                        "translated text",
                        extra={"table": spec.table, "column": column, "pk": pk, "to": target_locale, "chars": len(source_val)},
                    )

                # Merge into the SAME translations JSONB (preserves fa-IR and adds target locale)
                cur = conn.execute(
                    f"""
                    update {spec.table}
                    set {column} = jsonb_set(
                        coalesce({column}, '{{}}'::jsonb),
                        array[%s::text],
                        to_jsonb(%s::text),
                        true
                    )
                    where {spec.pk} = %s
                    """,
                    (target_locale, translated_value, pk_val),
                )

                # Fail fast if nothing was updated
                if cur.rowcount != 1:
                    raise RuntimeError(
                        f"UPDATE affected {cur.rowcount} rows (expected 1). "
                        f"table={spec.table} pk_col={spec.pk} pk={pk}"
                    )

                upsert_audit(conn, spec.table, column, pk, source_locale, target_locale, source_val, translated_value, "ok", None)
                conn.commit()

            except Exception as e:
                conn.rollback()
                err = str(e)
                log.exception("translation failed", extra={"table": spec.table, "column": column, "pk": pk, "to": target_locale})
                try:
                    upsert_audit(conn, spec.table, column, pk, source_locale, target_locale, source_val, None, "error", err)
                    conn.commit()
                except Exception:
                    conn.rollback()

    return len(rows)


def run_forever():
    db_url = os.environ["DATABASE_URL"]
    log.info("starting worker", extra={"model": MODEL})

    with psycopg.connect(db_url, row_factory=dict_row) as conn:
        # sanity: log where we are connected
        info = conn.execute(
            "select current_database() as db, current_user as usr, current_schema() as sch"
        ).fetchone()
        log.info("connected", extra=dict(info))
        sp = conn.execute("show search_path").fetchone()
        log.info("search_path", extra={"search_path": sp["search_path"]})

        conn.execute("set statement_timeout = '30s'")
        conn.execute("set lock_timeout = '5s'")
        conn.commit()

        while True:
            total = 0
            for spec in TABLES:
                for col in spec.columns:
                    try:
                        conn.execute("begin")
                        n = process_table_column(conn, spec, col, batch_size=25)
                        total += n
                    except Exception:
                        conn.rollback()
                        log.exception("batch failed", extra={"table": spec.table, "column": col})

            if total == 0:
                log.info("no work found, sleeping")
                time.sleep(10)
            else:
                log.info("batch done", extra={"rows": total})


if __name__ == "__main__":
    run_forever()