/* Komut paleti: ⌘K / Ctrl+K ya da "/" ile açılır.
   Bölümleri, projeleri, deneyimi, yazıları ve okuma listesini sayfanın
   kendisinden indeksler; tema, dil, e-posta gibi eylemleri de çalıştırır.
   Bulunamayan her soru asistana yönlendirilebilir. */

(function () {
    'use strict';

    var SITE = window.SITE;
    var dlg = document.querySelector('[data-palette]');
    if (!dlg || !SITE || !dlg.showModal) return;

    var input = dlg.querySelector('[data-palette-input]');
    var list = dlg.querySelector('[data-palette-list]');
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    var results = [];
    var sel = 0;

    document.querySelectorAll('[data-kbd]').forEach(function (k) { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });

    var KIND = {
        section: { icon: 'hash', tr: 'Bölümler', en: 'Sections' },
        work: { icon: 'layers', tr: 'İşler', en: 'Work' },
        experience: { icon: 'user', tr: 'Deneyim', en: 'Experience' },
        research: { icon: 'book', tr: 'Araştırma', en: 'Research' },
        writing: { icon: 'file', tr: 'Yazılar', en: 'Writing' },
        reading: { icon: 'book', tr: 'Okuma listesi', en: 'Reading list' },
        opensource: { icon: 'github', tr: 'Açık kaynak', en: 'Open source' },
        action: { icon: 'code', tr: 'Eylemler', en: 'Actions' }
    };

    function fold(s) {
        return String(s || '').toLocaleLowerCase('tr')
            .replace(/[ıİ]/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[âà]/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
            .normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    /* Yalnızca etkin dildeki metni toplar. */
    function textIn(el, lang) {
        if (!el) return '';
        var out = '';
        (function walk(n) {
            for (var c = n.firstChild; c; c = c.nextSibling) {
                if (c.nodeType === 3) out += c.textContent;
                else if (c.nodeType === 1) {
                    var l = c.getAttribute('lang');
                    if (l && l !== lang) continue;
                    if (c.tagName === 'svg') continue;
                    walk(c);
                    if (/^(P|H\d|LI|DIV)$/.test(c.tagName)) out += ' ';
                }
            }
        })(el);
        return out.replace(/\s+/g, ' ').trim();
    }

    function buildIndex() {
        var lang = SITE.lang();
        var idx = [];

        document.querySelectorAll('[data-search-section]').forEach(function (sec) {
            var label = sec.querySelector('.eyebrow');
            var title = sec.querySelector('.section-title:not([lang]), .section-title[lang="' + lang + '"], .contact__title[lang="' + lang + '"]');
            var name = textIn(label, lang).replace(/^\d+\s*/, '');
            idx.push({
                kind: 'section', title: name, sub: textIn(title, lang),
                hay: fold(name + ' ' + textIn(title, lang)),
                run: function () { location.hash = '#' + sec.id; }
            });
        });

        document.querySelectorAll('[data-search-item]').forEach(function (el) {
            var kind = el.getAttribute('data-search-kind') || 'work';
            var h = el.querySelector('h3, h4');
            var p = el.querySelector('p, .case__summary');
            var title = textIn(h, lang);
            var full = textIn(el, lang);
            var caseLink = el.querySelector('[data-case-link]');
            idx.push({
                kind: kind, title: title, sub: textIn(p, lang) || full.slice(title.length, title.length + 120),
                hay: fold(full),
                run: function () {
                    if (caseLink) { location.href = caseLink.href; return; }
                    var href = el.getAttribute('href') || (el.querySelector('a') && el.querySelector('a').getAttribute('href'));
                    if (href && el.tagName === 'A' || (href && kind === 'reading')) {
                        if (/^https?:/.test(href)) window.open(href, '_blank', 'noopener'); else location.href = href;
                        return;
                    }
                    if (el.hidden) SITE.filterReading && SITE.filterReading('all');
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.animate && el.animate([{ outline: '2px solid var(--accent)', outlineOffset: '6px' }, { outline: '2px solid transparent', outlineOffset: '6px' }], { duration: 1600 });
                }
            });
        });

        var t = SITE.t;
        [
            { title: t('Asistana sor', 'Ask the assistant'), sub: t('Deneyim ve projeler hakkında soru sorun', 'Ask about experience and projects'), k: 'asistan sohbet chat ask soru bot', run: function () { window.ChatUI && window.ChatUI.open(); } },
            { title: t('Mesaj gönder', 'Send a message'), sub: t('Doğrudan e-postaya iletilir', 'Delivered straight to the inbox'), k: 'mesaj mail eposta email contact iletisim', run: function () { window.ChatUI && window.ChatUI.open('mail'); } },
            { title: t('E-posta adresini kopyala', 'Copy email address'), sub: (window.SITE_CONFIG || {}).email, k: 'kopyala copy email eposta', run: SITE.copyEmail },
            { title: t('Temayı değiştir', 'Toggle theme'), sub: t('Açık / koyu', 'Light / dark'), k: 'tema theme dark light karanlik aydinlik koyu acik mod', run: SITE.toggleTheme },
            { title: SITE.lang() === 'en' ? 'Türkçe\'ye geç' : 'Switch to English', sub: 'TR / EN', k: 'dil language english turkce ingilizce lang', run: SITE.toggleLang },
            { title: 'LinkedIn', sub: 'linkedin.com/in/iremnurgocer', k: 'linkedin profil', run: function () { window.open('https://linkedin.com/in/iremnurgocer', '_blank', 'noopener'); } },
            { title: 'GitHub', sub: 'github.com/iremnurgocer', k: 'github kod code repo', run: function () { window.open('https://github.com/iremnurgocer', '_blank', 'noopener'); } },
            { title: t('Sesi aç / kapat', 'Toggle sound'), sub: t('Arayüz sesleri, varsayılan olarak kapalı', 'Interface sounds, off by default'), k: 'ses sound audio muzik', run: function () { SITE.toggleSound && SITE.toggleSound(); } },
            { title: t('Laboratuvar: canlı demolar', 'Lab: live demos'), sub: t('SQL güvenlik katmanı ve kanıt kontrolü', 'SQL guard and citation guard'), k: 'lab demo dene try playground laboratuvar sql kanit', run: function () { location.href = (SITE.root || '/') + '#lab'; } },
            { title: t('Başa dön', 'Back to top'), sub: '', k: 'basa top yukari', run: function () { window.scrollTo({ top: 0, behavior: 'smooth' }); } }
        ].forEach(function (a) {
            idx.push({ kind: 'action', title: a.title, sub: a.sub || '', hay: fold(a.title + ' ' + a.k + ' ' + (a.sub || '')), run: a.run });
        });

        return idx;
    }

    var INDEX = [];

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }

    function search(q) {
        var terms = fold(q).split(/\s+/).filter(Boolean);
        if (!terms.length) {
            return INDEX.filter(function (r) { return r.kind === 'section' || r.kind === 'action'; });
        }
        var scored = [];
        INDEX.forEach(function (r) {
            var title = fold(r.title), score = 0;
            for (var i = 0; i < terms.length; i++) {
                var term = terms[i];
                if (r.hay.indexOf(term) === -1) return;
                score += title.indexOf(term) === 0 ? 6 : title.indexOf(term) > -1 ? 4 : 1;
            }
            if (r.kind === 'section') score += 1;
            scored.push({ r: r, s: score });
        });
        scored.sort(function (a, b) { return b.s - a.s; });
        return scored.slice(0, 24).map(function (x) { return x.r; });
    }

    function render() {
        var q = input.value.trim();
        var lang = SITE.lang();
        results = search(q);
        if (q) {
            results.push({
                kind: 'ask', title: SITE.t('Asistana sor: ', 'Ask the assistant: ') + '"' + q + '"', sub: SITE.t('Yanıtı sitedeki bilgilerden bulur', 'Finds the answer in this site\'s content'),
                run: function () { window.ChatUI && window.ChatUI.ask(q); }
            });
        }
        sel = Math.min(sel, Math.max(0, results.length - 1));

        if (!results.length) {
            list.innerHTML = '<li class="palette__empty">' + SITE.t('Sonuç yok', 'No results') + '</li>';
            return;
        }

        var html = '', last = '';
        results.forEach(function (r, i) {
            var group = r.kind === 'ask' ? 'ask' : r.kind;
            if (group !== last) {
                var lbl = group === 'ask' ? SITE.t('Asistan', 'Assistant') : KIND[group][lang];
                html += '<li class="palette__group" role="presentation">' + esc(lbl) + '</li>';
                last = group;
            }
            var icon = r.kind === 'ask' ? 'chat' : KIND[r.kind].icon;
            html += '<li class="palette__item" role="option" id="pal-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '">' +
                '<span class="palette__icon"><svg class="i"><use href="#i-' + icon + '"/></svg></span>' +
                '<span><span class="palette__title">' + esc(r.title) + '</span>' + (r.sub ? '<span class="palette__sub">' + esc(r.sub) + '</span>' : '') + '</span>' +
                '<svg class="i" style="width:14px;height:14px;opacity:.4"><use href="#i-arrow"/></svg></li>';
        });
        list.innerHTML = html;
        input.setAttribute('aria-activedescendant', 'pal-' + sel);
    }

    function move(d) {
        if (!results.length) return;
        sel = (sel + d + results.length) % results.length;
        list.querySelectorAll('.palette__item').forEach(function (li) {
            li.setAttribute('aria-selected', String(+li.getAttribute('data-i') === sel));
        });
        var cur = list.querySelector('[aria-selected="true"]');
        if (cur) cur.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', 'pal-' + sel);
    }

    function choose(i) {
        var r = results[i];
        if (!r) return;
        dlg.close();
        setTimeout(r.run, 60);
    }

    function open() {
        INDEX = buildIndex();
        input.placeholder = SITE.t('Proje, teknoloji, yazı ya da soru arayın...', 'Search projects, tech, articles, or ask a question...');
        input.value = '';
        sel = 0;
        render();
        dlg.showModal();
        SITE.lockScroll(true);
        input.focus();
    }

    SITE.openPalette = open;

    dlg.addEventListener('close', function () { SITE.lockScroll(false); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    input.addEventListener('input', function () { sel = 0; render(); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
        else if (e.key === '?' && !input.value) { e.preventDefault(); dlg.close(); window.ChatUI && window.ChatUI.open(); }
    });
    list.addEventListener('click', function (e) {
        var li = e.target.closest('.palette__item');
        if (li) choose(+li.getAttribute('data-i'));
    });
    list.addEventListener('mousemove', function (e) {
        var li = e.target.closest('.palette__item');
        if (li && +li.getAttribute('data-i') !== sel) { sel = +li.getAttribute('data-i'); move(0); }
    });

    document.querySelectorAll('[data-palette-open]').forEach(function (b) { b.addEventListener('click', open); });

    document.addEventListener('keydown', function (e) {
        var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (dlg.open) dlg.close(); else open();
        } else if (e.key === '/' && !typing && !dlg.open) {
            e.preventDefault();
            open();
        }
    });
})();
