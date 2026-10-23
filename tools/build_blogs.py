#!/usr/bin/env python3
"""Blog sayfalarını üretir: tools/blog_posts.py + tools/blogs/<slug>.{tr,en}.html -> blogs/<slug>.html

Kullanım (depo kökünden):
    python3 tools/build_blogs.py

Simge seti, arama paleti ve sohbet asistanı build_cases.py ile aynı şekilde index.html'den
alınır. Yazı gövdeleri iki dilde ayrı dosyalarda durur; sayfada <div lang="tr"> ve
<div lang="en"> olarak yan yana basılır, etkin olmayan dil main.css ile gizlenir.
"""

import html
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from blog_posts import POSTS  # noqa: E402
from build_cases import SPRITE, PALETTE, CHAT, SITE, e, bi  # noqa: E402

SRC = os.path.join(ROOT, "tools", "blogs")


def read_body(slug, lang):
    return open(os.path.join(SRC, "%s.%s.html" % (slug, lang)), encoding="utf-8").read()


def prepare(body, lang):
    """İngilizce gövdedeki kimliklere 'en-' öneki ekler, tabloları kaydırılabilir kaba sarar."""
    if lang == "en":
        body = re.sub(r'\bid="([^"]+)"', r'id="en-\1"', body)
        body = re.sub(r'href="#([^"]+)"', r'href="#en-\1"', body)
    body = re.sub(r"<table>", '<div class="table-wrap"><table>', body)
    body = body.replace("</table>", "</table></div>")
    return body


def toc(body):
    items = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body, re.S)
    return "\n".join('<li><a href="#%s">%s</a></li>' % (i, t) for i, t in items)


def minutes(body):
    words = len(re.sub(r"<[^>]+>", " ", body).split())
    return max(1, int(math.ceil(words / 200.0)))


def page(i, p):
    n = len(POSTS)
    prev_p = POSTS[(i - 1) % n]
    next_p = POSTS[(i + 1) % n]
    tr = prepare(read_body(p["slug"], "tr"), "tr")
    en = prepare(read_body(p["slug"], "en"), "en")
    mins = max(minutes(tr), minutes(en))
    url = SITE + "blogs/%s.html" % p["slug"]
    title_tr = "%s | İrem Nur Yılmaz" % p["title"]["tr"]
    title_en = "%s | İrem Nur Yılmaz" % p["title"]["en"]

    return """<!DOCTYPE html>
<html lang="tr" data-theme="dark" data-title-tr="{title_tr}" data-title-en="{title_en}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{title_tr}</title>
    <meta name="description" content="{desc}">
    <meta name="author" content="İrem Nur Yılmaz">
    <link rel="canonical" href="{url}">
    <link rel="alternate" hreflang="tr" href="{url}?lang=tr">
    <link rel="alternate" hreflang="en" href="{url}?lang=en">
    <meta property="og:type" content="article">
    <meta property="og:title" content="{title_tr}">
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
            document.title = d.getAttribute('data-title-' + l) || document.title;
        }})();
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"></noscript>
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/case.css">
    <link rel="stylesheet" href="../assets/css/blog.css">
</head>
<body class="cs-page bl-page">

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
        <a class="nav__back" href="../#writing"><svg class="i"><use href="#i-arrow"/></svg><span lang="tr">Tüm yazılar</span><span lang="en">All writing</span></a>
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

<main id="main" class="bl">
    <header class="bl-hero wrap">
        <span class="eyebrow"><span class="eyebrow__num">{num}</span><span class="eyebrow__line"></span><span lang="tr">Yazı</span><span lang="en">Writing</span><span class="eyebrow__line"></span>{topic}</span>
        <h1 class="bl-title">{h1}</h1>
        <p class="bl-lead">{lead}</p>
        <dl class="cs-meta bl-meta">
            <div><dt><span lang="tr">Yazar</span><span lang="en">Author</span></dt><dd>İrem Nur Yılmaz</dd></div>
            <div><dt><span lang="tr">Tür</span><span lang="en">Type</span></dt><dd>{kind}</dd></div>
            <div><dt><span lang="tr">Okuma</span><span lang="en">Reading</span></dt><dd><span lang="tr">~{mins} dk</span><span lang="en">~{mins} min</span></dd></div>
        </dl>
        <figure class="bl-cover">
            <img lang="tr" src="../covers/{cover}.svg" alt="" width="800" height="420">
            <img lang="en" src="../covers/{cover}.en.svg" alt="" width="800" height="420">
        </figure>
    </header>

    <div class="wrap bl-layout">
        <aside class="bl-toc" aria-label="İçindekiler / Contents">
            <details open data-toc>
                <summary class="mono"><span lang="tr">İçindekiler</span><span lang="en">Contents</span></summary>
                <ol lang="tr">
{toc_tr}
                </ol>
                <ol lang="en">
{toc_en}
                </ol>
            </details>
        </aside>

        <article class="prose">
<div lang="tr">
{body_tr}
</div>
<div lang="en">
{body_en}
</div>
        </article>
    </div>

    <div class="wrap bl-end">
        <aside class="cs-ask">
            <div>
                <h2><span lang="tr">Bu konu hakkında bir sorunuz mu var?</span><span lang="en">Have a question about this topic?</span></h2>
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

        <nav class="cs-next" aria-label="Diğer yazılar / Other articles">
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
<script src="../assets/js/blog.js" defer></script>
</body>
</html>
""".format(
        title_tr=e(title_tr), title_en=e(title_en), desc=e(p["desc"]["tr"]), url=url, site=SITE,
        sprite=SPRITE, num="%02d" % (i + 1), topic=bi(p["topic"]), h1=bi(p["title"]),
        lead=bi(p["lead"]), kind=bi(p["kind"]), mins=mins, cover=p["cover"],
        toc_tr=toc(tr), toc_en=toc(en), body_tr=tr.strip(), body_en=en.strip(),
        ask_tr=e("\"%s\" yazısını özetler misin?" % p["title"]["tr"]),
        ask_en=e("Can you summarise the article \"%s\"?" % p["title"]["en"]),
        prev_slug=prev_p["slug"], next_slug=next_p["slug"],
        prev_title=bi(prev_p["title"], "strong"), next_title=bi(next_p["title"], "strong"),
        palette=PALETTE, chat=CHAT,
    )


def main():
    out_dir = os.path.join(ROOT, "blogs")
    for i, p in enumerate(POSTS):
        path = os.path.join(out_dir, p["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(page(i, p))
        print("yazıldı:", os.path.relpath(path, ROOT))


if __name__ == "__main__":
    main()
