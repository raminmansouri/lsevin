"""Build the Persian-digit fonts used for `lang="fa"` pages (src/app/fonts.css).

Each output holds only the ten Persian digit glyphs (U+06F0-06F9) of the source
font, also mapped to the ASCII digits 0-9 (variable axes kept). Listed first in
the Persian font stack with `unicode-range: U+0030-0039`, they make "1402" in
the page's text render as ۱۴۰۲ while the text itself stays as the server sent
it, so hydration never sees a difference (the DOM rewriting PersianDigits
component caused React error #418 and client re-renders; 2026-11-26).

    py -3 -m pip install fonttools brotli
    py -3 scripts/build-fa-digit-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

FONTS = Path(__file__).resolve().parent.parent / "src" / "app" / "fonts"
BUILDS = {
    "estedad-arabic-wght-normal.woff2": "estedad-fa-digits-wght-normal.woff2",
    "jomhuria-arabic-400-normal.woff2": "jomhuria-fa-digits-400-normal.woff2",
}


def build(source: str, target: str) -> None:
    font = TTFont(FONTS / source)
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=list(range(0x06F0, 0x06FA)))
    subsetter.subset(font)
    for table in font["cmap"].tables:
        if table.isUnicode():
            for digit in range(10):
                table.cmap[0x30 + digit] = table.cmap[0x06F0 + digit]
    font.flavor = "woff2"
    font.save(FONTS / target)
    print(f"{target}: {(FONTS / target).stat().st_size} bytes")


if __name__ == "__main__":
    for source, target in BUILDS.items():
        build(source, target)
