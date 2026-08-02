#!/usr/bin/env bash
#
# Rebuild public/fonts/Vazirmatn-Variable.woff2 as a subset.
#
# The file committed to this repo is NOT the upstream release — it is a subset,
# so anyone regenerating it from upstream without running this will silently add
# ~25 KB back to every Persian page load. Run this instead.
#
#   Upstream : https://github.com/rastikerdar/vazirmatn  (SIL OFL 1.1)
#   File     : Vazirmatn-Variable.woff2 from the release's `fonts/webfonts`
#   Result   : 111,152 B -> 85,772 B (-22.8%), 1333 -> 940 glyphs
#
# What is kept, and why:
#   - The whole Arabic block plus both Arabic Presentation Forms ranges. The
#     presentation forms are legacy precomposed shapes that modern text does not
#     use (shaping comes from the GSUB init/medi/fina features), but content in
#     this database originates from mixed sources and dropping them risks tofu in
#     Persian strings for a saving of only ~2.4 KB.
#   - ZWNJ (U+200C). Persian word-joining depends on it; without it words like
#     می‌خواهم render joined and wrong.
#   - Persian and Arabic-Indic digits, both inside the Arabic block.
#   - Basic Latin + Latin-1, plus the handful of Latin Ext letters that turn up in
#     destination and brand names on Persian pages (Turkish ğışİ, Romanian șț,
#     Czech čš, Polish łóźż, French œ). Anything outside that falls back to Tahoma,
#     which is the existing second font in the stack.
#   - Every layout feature (`--layout-features='*'`) and the full 100-900 weight
#     axis. The UI uses six distinct weights, so the variable axis has to stay —
#     static instances would mean six files.
#
# What is dropped: Latin Extended-A/B beyond the list above, math and arrow
# symbols, letterlike symbols, and glyph names (`post`).
#
# Requires fonttools + brotli. They are not project dependencies; install them
# into a throwaway virtualenv:
#
#   python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
#   PYFTSUBSET=/tmp/fontenv/bin/pyftsubset ./scripts/subset-font.sh path/to/upstream.woff2
#
set -euo pipefail

SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "usage: $0 <upstream Vazirmatn-Variable.woff2>" >&2
  exit 1
fi

PYFTSUBSET="${PYFTSUBSET:-pyftsubset}"
OUT="$(dirname "$0")/../public/fonts/Vazirmatn-Variable.woff2"

CORE="U+0020-007E,U+00A0-00FF,U+0600-06FF,U+0750-077F,U+08A0-08FF,U+200C-200F,U+2010-2027,U+2030-205E,U+20AC,U+FFFD"
PRESENTATION_FORMS="U+FB50-FDFF,U+FE70-FEFF"
LATIN_NAMES="U+0106-0107,U+010C-010D,U+011E-011F,U+0130-0131,U+0141-0142,U+0152-0153,U+015E-015F,U+0160-0161,U+0179-017E,U+0218-021B,U+02BC"

"$PYFTSUBSET" "$SRC" \
  --output-file="$OUT" \
  --flavor=woff2 \
  --unicodes="${CORE},${PRESENTATION_FORMS},${LATIN_NAMES}" \
  --layout-features='*' \
  --notdef-outline

printf 'in  %s bytes\nout %s bytes\n' "$(wc -c < "$SRC" | tr -d ' ')" "$(wc -c < "$OUT" | tr -d ' ')"
