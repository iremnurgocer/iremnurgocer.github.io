#!/usr/bin/env python3
"""Vaka çalışması sayfalarını üretir: tools/cases.py -> work/<slug>.html

Kullanım (depo kökünden):
    python3 tools/build_cases.py

Simge seti, arama paleti ve sohbet asistanının HTML'i index.html'den alınır;
böylece tek kaynak korunur. Üretilen sayfalar depoya eklenir, GitHub Pages
onları olduğu gibi yayınlar.
"""

import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from cases import CASES  # noqa: E402

SITE = "https://iremnurgocer.github.io/"


def e(s):
    return html.escape(s, quote=True)


def bi(d, tag="span"):
    """İki dilli metin: <span lang="tr">..</span><span lang="en">..</span>"""
    return '<%s lang="tr">%s</%s><%s lang="en">%s</%s>' % (tag, e(d["tr"]), tag, tag, e(d["en"]), tag)


def bi_rich(d, tag="span"):
    """**kalın** işaretini destekleyen iki dilli metin."""
    def fmt(s):
        return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", e(s))
    return '<%s lang="tr">%s</%s><%s lang="en">%s</%s>' % (tag, fmt(d["tr"]), tag, tag, fmt(d["en"]), tag)


def between(src, start, end, include_end=False):
    i = src.index(start)
    j = src.index(end, i)
    return src[i:j + (len(end) if include_end else 0)]


index = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
SPRITE = between(index, "<!-- Simge seti -->", "</svg>", include_end=True)
PALETTE = between(index, "<!-- ============ KOMUT PALETİ ============ -->", "<!-- ============ SOHBET ASİSTANI ============ -->")
CHAT = between(index, "<!-- ============ SOHBET ASİSTANI ============ -->", '<div class="toast"')
CHAT += '<div class="toast" data-toast role="status" aria-live="polite"></div>\n'


def steps_html(steps):
    out = ['<ol class="arch" data-flow-card>']
    for (label, sub, guard) in steps:
        out.append('<li class="arch__node%s"><span class="arch__label">%s</span><small>%s</small></li>'
                   % (" is-guard" if guard else "", bi(label), e(sub)))
    out.append("</ol>")
    return "\n".join(out)


def section(num, title, body):
    return """
        <section class="cs-sec reveal">
            <div class="cs-sec__label"><span class="mono">%s</span><h2>%s</h2></div>
            <div class="cs-sec__body">%s</div>
        </section>""" % (num, bi(title), body)


def page(i, c):
    n = len(CASES)
    prev_c = CASES[(i - 1) % n]
    next_c = CASES[(i + 1) % n]
    num = "%02d" % (i + 1)

    def val(v):
        """Türkçe biçimli sayıyı İngilizceye çevirir: %94 -> 94%, 1.000 -> 1,000, ~5 $ -> ~$5"""
        en = re.sub(r"%([\d\-]+)", r"\1%", v)
        en = re.sub(r"(\d)\.(\d{3})", r"\1,\2", en)
        en = re.sub(r"~?([\d.,]+) \$", lambda m: "~$" + m.group(1), en)
        if en == v:
            return e(v)
        return '<span lang="tr">%s</span><span lang="en">%s</span>' % (e(v), e(en))

    metrics = "\n".join(
        '<div class="cs-metric"><span class="cs-metric__val">%s</span><span class="cs-metric__lbl">%s</span></div>'
        % (val(v), bi(lbl)) for (v, lbl) in c["metrics"])

    arch = steps_html(c["steps"])
    if c.get("steps2"):
        arch += '\n<p class="cs-subhead mono">%s</p>\n%s' % (bi(c["steps2_title"]), steps_html(c["steps2"]))

    decisions = '<ul class="cs-list">%s</ul>' % "".join("<li>%s</li>" % bi(d) for d in c["decisions"])
    tradeoffs = '<div class="cs-trade">%s</div>' % "".join(
        '<div class="cs-trade__item spot"><span class="mono">%02d</span><p>%s</p></div>' % (k + 1, bi(t))
        for k, t in enumerate(c["tradeoffs"]))
    stack = '<div class="tags">%s</div>' % "".join('<span class="tag">%s</span>' % e(s) for s in c["stack"])

    body = "".join([
        section("01", {"tr": "Problem", "en": "Problem"}, "<p class=\"cs-lead\">%s</p>" % bi(c["problem"])),
        section("02", {"tr": "Yaklaşım", "en": "Approach"}, "<p>%s</p>" % bi(c["approach"])),
        section("03", {"tr": "Mimari", "en": "Architecture"},
                '<p class="cs-note">%s</p>%s' % (bi({"tr": "Kesik çizgili adımlar kontrol kapılarıdır: geçemeyen çıktı durdurulur ya da insana yönlendirilir.",
                                                     "en": "Dashed steps are control gates: output that fails them is stopped or routed to a human."}), arch)),
        section("04", {"tr": "Kritik kararlar", "en": "Key decisions"}, decisions),
        section("05", {"tr": "Ödünleşimler", "en": "Trade-offs"}, tradeoffs),
        section("06", {"tr": "Rolüm", "en": "My role"}, "<p>%s</p>" % bi(c["role"])),
        section("07", {"tr": "Teknoloji", "en": "Stack"}, stack),
    ])

    title_tr = "%s | İrem Nur Yılmaz" % c["title"]["tr"]
    desc = c["summary"]["tr"]
    url = SITE + "work/%s.html" % c["slug"]

    return """<!DOCTYPE html>
<html lang="tr" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="author" content="İrem Nur Yılmaz">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{site}assets/img/og.png">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" href="../assets/img/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="../assets/img/apple-touch-icon.png">
    <script>
        (function () {{
            var d = document.documentElement, t = null, l = null;
            try {{ t = localStorage.getItem('ing-theme'); l = localStorage.getItem('ing-lang'); }} catch (e) {{}}
            var q = /[?&]lang=(tr|en)\\b/.exec(location.search);
            if (q) l = q[1];
            if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            if (!l) l = /^tr\\b/i.test(navigator.language || '') ? 'tr' : 'en';
            d.setAttribute('data-theme', t);
            d.setAttribute('lang', l);
            d.classList.add('js');
        }})();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"></noscript>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/case.css">
</head>
<body class="cs-page">

{sprite}

<a class="skip-link" href="#main"><span lang="tr">İçeriğe geç</span><span lang="en">Skip to content</span></a>
<div class="progress" data-progress aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>

<header class="nav is-scrolled" data-nav>
    <div class="nav__bar">
        <a class="brand" href="../" aria-label="İrem Nur Yılmaz">
            <span class="brand__mark" aria-hidden="true">İ</span>
            <span class="brand__name">İrem Nur Yılmaz</span>
        </a>
        <a class="nav__back" href="../#work"><svg class="i"><use href="#i-arrow"/></svg><span lang="tr">Tüm işler</span><span lang="en">All work</span></a>
        <div class="nav__tools">
            <button class="search-btn" type="button" data-palette-open>
                <svg class="i"><use href="#i-search"/></svg>
                <span class="search-btn__label"><span lang="tr">Ara</span><span lang="en">Search</span></span>
                <span class="kbd" data-kbd>⌘K</span>
            </button>
            <div class="lang-switch" role="group" aria-label="Dil / Language">
                <button type="button" data-lang-set="tr" aria-pressed="true">TR</button>
                <button type="button" data-lang-set="en" aria-pressed="false">EN</button>
            </div>
            <button class="icon-btn theme-btn" type="button" data-theme-toggle aria-label="Tema / Theme">
                <svg class="i i-moon"><use href="#i-moon"/></svg>
                <svg class="i i-sun"><use href="#i-sun"/></svg>
            </button>
        </div>
    </div>
</header>

<main id="main" class="cs">
    <header class="cs-hero wrap">
        <span class="eyebrow"><span class="eyebrow__num">{num}</span><span class="eyebrow__line"></span><span lang="tr">Vaka çalışması</span><span lang="en">Case study</span><span class="eyebrow__line"></span>{domain}</span>
        <h1 class="cs-title" style="view-transition-name: case-{slug}">{h1}</h1>
        <p class="cs-summary">{summary}</p>
        <dl class="cs-meta">
            <div><dt><span lang="tr">Rol</span><span lang="en">Role</span></dt><dd><span lang="tr">Uçtan uca tasarım ve geliştirme</span><span lang="en">End-to-end design and build</span></dd></div>
            <div><dt>Stack</dt><dd>{stack_short}</dd></div>
        </dl>
    </header>

    <div class="cs-metrics wrap reveal">
        {metrics}
    </div>

    <div class="wrap cs-body">
        {body}

        <aside class="cs-ask reveal">
            <div>
                <h2><span lang="tr">Bu proje hakkında bir sorunuz mu var?</span><span lang="en">Have a question about this project?</span></h2>
                <p><span lang="tr">Asistana sorabilir ya da doğrudan bana yazabilirsiniz.</span><span lang="en">Ask the assistant or write to me directly.</span></p>
            </div>
            <div class="hero__ctas" style="margin:0">
                <button class="btn btn--primary" type="button" data-chat-ask-tr="{ask_tr}" data-chat-ask-en="{ask_en}">
                    <span class="orb orb--sm" aria-hidden="true" style="width:20px;height:20px"></span>
                    <span lang="tr">Asistana sor</span><span lang="en">Ask the assistant</span>
                </button>
                <button class="btn btn--ghost" type="button" data-chat-mail><span lang="tr">Mesaj gönder</span><span lang="en">Send a message</span></button>
            </div>
        </aside>

        <nav class="cs-next" aria-label="Diğer vakalar / Other cases">
            <a href="{prev_slug}.html" class="cs-next__link">
                <span class="mono">← <span lang="tr">Önceki</span><span lang="en">Previous</span></span>
                {prev_title}
            </a>
            <a href="{next_slug}.html" class="cs-next__link cs-next__link--right">
                <span class="mono"><span lang="tr">Sonraki</span><span lang="en">Next</span> →</span>
                {next_title}
            </a>
        </nav>
    </div>
</main>

<footer class="footer">
    <div class="wrap">
        <div class="footer__inner">
            <span>© <span data-year>2026</span> İrem Nur Yılmaz</span>
            <div class="footer__links">
                <a href="../"><span lang="tr">Ana sayfa</span><span lang="en">Home</span></a>
                <a href="https://github.com/iremnurgocer" target="_blank" rel="noopener">GitHub</a>
                <a href="https://linkedin.com/in/iremnurgocer" target="_blank" rel="noopener">LinkedIn</a>
                <button class="sound-btn" type="button" data-sound-toggle aria-pressed="false"><span lang="tr" data-sound-state>Ses: kapalı</span><span lang="en" data-sound-state>Sound: off</span></button>
            </div>
        </div>
    </div>
</footer>

{palette}
{chat}
<script src="../assets/js/config.js" defer></script>
<script src="../assets/js/main.js" defer></script>
<script src="../assets/js/palette.js" defer></script>
<script src="../assets/js/chat.js" defer></script>
<script src="../assets/js/fx.js" defer></script>
</body>
</html>
""".format(
        title=e(title_tr), desc=e(desc), url=url, site=SITE, sprite=SPRITE,
        num=num, domain=bi(c["domain"]), slug=c["slug"], h1=bi(c["title"]),
        summary=bi(c["summary"]), status=bi(c["status"]),
        stack_short=e(" · ".join(c["stack"][:4])), metrics=metrics, body=body,
        ask_tr=e("%s projesini anlatır mısın?" % c["title"]["tr"]),
        ask_en=e("Tell me about the %s project" % c["title"]["en"].lower()),
        prev_slug=prev_c["slug"], next_slug=next_c["slug"],
        prev_title=bi(prev_c["title"], "strong"), next_title=bi(next_c["title"], "strong"),
        palette=PALETTE, chat=CHAT,
    )


def main():
    out_dir = os.path.join(ROOT, "work")
    os.makedirs(out_dir, exist_ok=True)
    for i, c in enumerate(CASES):
        path = os.path.join(out_dir, c["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(page(i, c))
        print("yazıldı:", os.path.relpath(path, ROOT))


if __name__ == "__main__":
    main()
