"""Cut EB Garamond down to what the blog renders: static 400, 500, 600 and 400 italic, Latin plus
basic Greek, and only the OpenType features the CSS asks for (small caps, figure styles, ligatures).

Same recipe as henryvu.io (tools/subset_fonts.py there), with 600 added for bold and Greek added
for inline symbols. Sources are the variable TTFs from github.com/google/fonts/tree/main/ofl/ebgaramond
(the Google Fonts CSS API strips smcp and onum, so it cannot be used). Run from the repo root:
  uv run --with fonttools --with brotli python tools/subset_fonts.py EBGaramond[wght].ttf EBGaramond-Italic[wght].ttf
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

UNICODES = ("U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0391-03A9,U+03B1-03C9,"
            "U+2010-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2190-2193,U+2212,U+2248,"
            "U+2264-2265,U+221E,U+2767,U+1EDF")
FEATURES = ["kern", "liga", "clig", "calt", "ccmp", "locl", "mark", "mkmk", "smcp", "c2sc",
            "onum", "pnum", "lnum", "tnum"]

def build(src, out, weight):
    font = instancer.instantiateVariableFont(TTFont(src), {"wght": weight})
    opts = subset.Options(); opts.flavor = "woff2"; opts.layout_features = FEATURES; opts.name_IDs = ["*"]
    sub = subset.Subsetter(opts); sub.populate(unicodes=subset.parse_unicodes(UNICODES)); sub.subset(font)
    subset.save_font(font, out, opts)

roman, italic = sys.argv[1], sys.argv[2]
for w in (400, 500, 600):
    build(roman, f"assets/fonts/ebgaramond-{w}.woff2", w)
build(italic, "assets/fonts/ebgaramond-400-italic.woff2", 400)
