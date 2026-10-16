"""Turn straight quotes into curly ones in the prose of a post, in place.

Only text between tags changes. Attributes, comments, <script>, <style>, <code>, <pre>, <kbd>, <samp>
and KaTeX spans ($...$, $$...$$) are left alone. Run:
  python3 tools/smart_quotes.py series/ai-engineering/part1.html
"""
import re
import sys

SKIP = {"script", "style", "code", "pre", "kbd", "samp", "textarea"}
BLOCK = {"p", "li", "div", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6", "br", "section",
         "figcaption", "blockquote", "header", "footer", "ul", "ol", "table", "tr", "body", "main", "article"}
TAG = re.compile(r"<!--.*?-->|<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>", re.S)
OPENERS = set(" \t\n\r([{—–-/")


def curl(text, prev):
    out = []
    for i, ch in enumerate(text):
        before = out[-1] if out else prev
        if ch == '"':
            out.append("“" if before in OPENERS else "”")
        elif ch == "'":
            after = text[i + 1] if i + 1 < len(text) else ""
            opening = before in OPENERS and after.isalpha()
            out.append("‘" if opening else "’")
        else:
            out.append(ch)
    return "".join(out), (out[-1] if out else prev)


def convert(html):
    out, i, prev = [], 0, " "
    while i < len(html):
        lt = html.find("<", i)
        text = html[i:] if lt < 0 else html[i:lt]
        if text:
            # keep math untouched: curl only the text between $$...$$ and $...$ spans
            pieces = re.split(r"(\$\$.*?\$\$|\$[^$\n]+?\$)", text, flags=re.S)
            for j in range(0, len(pieces), 2):
                pieces[j], prev = curl(pieces[j], prev)
                if j + 1 < len(pieces):
                    prev = pieces[j + 1][-1]
            out.append("".join(pieces))
        if lt < 0:
            break
        m = TAG.match(html, lt)
        if not m:  # a bare "<" in text
            out.append("<"); prev = "<"; i = lt + 1
            continue
        tag, name = m.group(0), (m.group(2) or "").lower()
        out.append(tag); i = m.end()
        if name in SKIP and not m.group(1) and not tag.endswith("/>"):
            # raw content: copy through the matching close tag untouched
            close = re.compile(r"</%s\s*>" % name, re.I).search(html, i)
            stop = close.end() if close else len(html)
            out.append(html[i:stop]); i = stop
            prev = "x"  # text right after inline code closes a quote ("`foo`'s")
        elif name in BLOCK:
            prev = " "
    return "".join(out)


if __name__ == "__main__":
    for path in sys.argv[1:]:
        src = open(path, encoding="utf-8").read()
        dst = convert(src)
        open(path, "w", encoding="utf-8").write(dst)
        changed = sum(1 for a, b in zip(src, dst) if a != b)
        print(f"{path}: {changed} quotes curled")
