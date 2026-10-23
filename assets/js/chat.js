/* Sohbet asistanı.
   İki çalışma modu var:
   1) Yerel: assets/data/knowledge.json üzerinde tarayıcıda çalışan, Türkçe/İngilizce
      anahtar kelime eşleştirmesi. Sunucu gerektirmez, uydurmaz; bilmediğinde söyler.
   2) LLM: SITE_CONFIG.chatEndpoint tanımlıysa sorular Cloudflare Worker üzerinden
      bir dil modeline gider (bkz. worker/). Worker erişilemezse yerel moda düşer.
   "Mesaj gönder" sekmesi SITE.sendMail ile doğrudan e-postaya iletir. */

(function () {
    'use strict';

    var SITE = window.SITE;
    var cfg = window.SITE_CONFIG || {};
    var panel = document.querySelector('[data-chat]');
    if (!panel || !SITE) return;

    var launch = document.querySelector('[data-chat-launch]');
    var log = panel.querySelector('[data-chat-log]');
    var form = panel.querySelector('[data-chat-form]');
    var input = panel.querySelector('[data-chat-input]');
    var send = panel.querySelector('[data-chat-send]');
    var suggestEl = panel.querySelector('[data-chat-suggest]');
    var tabs = panel.querySelectorAll('[data-chat-tab]');
    var KB = null;
    var history = [];       // { role: 'user' | 'assistant', content }
    var lastEntry = null;
    var busy = false;
    var isOpen = false;
    var lastFocus = null;
    var STORE = 'ing-chat';

    /* ---------------- Bilgi tabanı ---------------- */
    var ROOT = SITE.root || (location.origin + '/');
    var kbReady = fetch(ROOT + 'assets/data/knowledge.json', { cache: 'no-cache' })
        .then(function (r) { return r.json(); })
        .then(function (j) { KB = j; prepare(j); return j; })
        .catch(function () { KB = null; });

    function fold(s) {
        return String(s || '').toLocaleLowerCase('tr')
            .replace(/[ıİ]/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[âà]/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .replace(/[^a-z0-9.+#\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function prepare(kb) {
        kb.entries.forEach(function (e) {
            e._keys = e.keys.map(function (k) { return { raw: fold(k), multi: /\s/.test(fold(k)) }; });
        });
    }

    function scoreEntry(e, q, tokens) {
        var s = 0;
        e._keys.forEach(function (k) {
            if (k.multi) {
                if (q.indexOf(k.raw) > -1) s += 3 + k.raw.length / 10;
                return;
            }
            for (var i = 0; i < tokens.length; i++) {
                var t = tokens[i];
                if (t === k.raw) { s += 3; return; }
                /* Türkçe ekler: "ingilizcesi" → "ingilizce", "iletişime" → "iletişim". */
                if (k.raw.length >= 3 && t.indexOf(k.raw) === 0) { s += 2.6; return; }
                if (t.length >= 5 && k.raw.indexOf(t) === 0 && k.raw.length - t.length <= 3) { s += 2; return; }
            }
        });
        return s * (e.weight || 1);
    }

    function localAnswer(question) {
        var lang = SITE.lang();
        if (!KB) return { text: lang === 'en' ? 'The knowledge base could not be loaded. Please try again, or send a message instead.' : 'Bilgi tabanı yüklenemedi. Lütfen tekrar deneyin ya da mesaj gönderin.', links: ['mail'] };

        var q = fold(question);
        var tokens = q.split(' ').filter(function (t) { return t.length > 1; });

        /* Kısa takip soruları: önceki konunun vaka çalışmasına yönlendir. */
        if (lastEntry && /^(daha fazla|detay|detaylar|devam|baska|more|details|tell me more|go on|anlat)\b/.test(q)) {
            var caseLink = (lastEntry.links || []).filter(function (l) { return l.indexOf('case:') === 0; });
            if (caseLink.length) {
                return { text: SITE.t('Tüm detaylar vaka çalışmasında: problem, yaklaşım, kritik kararlar, sonuçlar ve İrem\'in rolü.', 'The full detail is in the case study: problem, approach, key decisions, outcomes and İrem\'s role.'), links: caseLink };
            }
        }

        var ranked = KB.entries.map(function (e) { return { e: e, s: scoreEntry(e, q, tokens) }; })
            .filter(function (x) { return x.s > 0; })
            .sort(function (a, b) { return b.s - a.s; });

        if (!ranked.length || ranked[0].s < 2.5) {
            lastEntry = null;
            return { text: KB.fallback[lang], links: ['mail'], fallback: true };
        }

        var best = ranked[0].e;
        lastEntry = best;
        return { text: best[lang], links: best.links || [] };
    }

    /* ---------------- Uzak (LLM) mod ---------------- */
    function remoteAnswer(onDelta) {
        var body = JSON.stringify({ lang: SITE.lang(), messages: history.slice(-12) });
        return fetch(cfg.chatEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
            body: body
        }).then(function (res) {
            if (!res.ok || !res.body) throw new Error('HTTP ' + res.status);
            var reader = res.body.getReader();
            var dec = new TextDecoder();
            var buf = '', full = '';
            function pump() {
                return reader.read().then(function (r) {
                    if (r.done) return full;
                    buf += dec.decode(r.value, { stream: true });
                    var lines = buf.split('\n');
                    buf = lines.pop();
                    lines.forEach(function (line) {
                        if (line.indexOf('data:') !== 0) return;
                        var data = line.slice(5).trim();
                        if (!data || data === '[DONE]') return;
                        try {
                            var j = JSON.parse(data);
                            if (j.t) { full += j.t; onDelta(full); }
                            if (j.error) throw new Error(j.error);
                        } catch (e) { if (e.message && e.message !== 'Unexpected end of JSON input') throw e; }
                    });
                    return pump();
                });
            }
            return pump();
        });
    }

    /* ---------------- Biçimlendirme ---------------- */
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function inline(s) {
        return esc(s)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
            .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, href) {
                var safe = /^(https?:|#|blogs\/|mailto:)/.test(href) ? fixHref(href) : '#';
                var ext = /^https?:/.test(safe) ? ' target="_blank" rel="noopener"' : '';
                return '<a href="' + safe + '"' + ext + '>' + text + '</a>';
            });
    }

    function md(text) {
        var out = '', list = false;
        String(text).split('\n').forEach(function (line) {
            var m = /^\s*[-•]\s+(.*)$/.exec(line);
            if (m) {
                if (!list) { out += '<ul>'; list = true; }
                out += '<li>' + inline(m[1]) + '</li>';
                return;
            }
            if (list) { out += '</ul>'; list = false; }
            if (line.trim()) out += '<p>' + inline(line) + '</p>';
        });
        if (list) out += '</ul>';
        return out;
    }

    /* Alt sayfalarda bölüm ve blog bağlantılarını ana sayfaya yönelt. */
    function fixHref(href) {
        if (href.charAt(0) === '#') return document.getElementById(href.slice(1)) ? href : ROOT + href;
        if (/^blogs\//.test(href)) return ROOT + href;
        return href;
    }

    function sectionLabel(hash) {
        var a = document.querySelector('.nav__link[href="' + hash + '"]');
        var lang = SITE.lang();
        if (a) {
            var s = a.querySelector('[lang="' + lang + '"]');
            if (s) return s.textContent;
        }
        var map = {
            '#capabilities': ['Yetkinlikler', 'Capabilities'],
            '#research': ['Eğitim & araştırma', 'Education & research'],
            '#opensource': ['Açık kaynak', 'Open source']
        };
        return map[hash] ? SITE.t(map[hash][0], map[hash][1]) : hash.slice(1);
    }

    function sourcesHtml(links) {
        var parts = [];
        (links || []).forEach(function (l) {
            if (l === 'mail') {
                parts.push('<button type="button" data-act="mail">' + esc(SITE.t('Mesaj gönder', 'Send a message')) + '</button>');
            } else if (l.indexOf('case:') === 0) {
                parts.push('<a href="' + esc(SITE.caseUrl ? SITE.caseUrl(l.slice(5)) : '#') + '">' + esc(SITE.t('Vaka çalışmasını aç', 'Open case study')) + '</a>');
            } else if (l.charAt(0) === '#') {
                parts.push('<a href="' + esc(fixHref(l)) + '" data-act="jump">§ ' + esc(sectionLabel(l)) + '</a>');
            } else if (/^blogs\//.test(l)) {
                parts.push('<a href="' + esc(fixHref(l)) + '">' + esc(SITE.t('Yazıyı oku', 'Read the article')) + '</a>');
            }
        });
        return parts.length ? '<div class="msg__src">' + parts.join('') + '</div>' : '';
    }

    /* ---------------- Mesaj balonları ---------------- */
    function bubble(role, html) {
        var el = document.createElement('div');
        el.className = 'msg msg--' + (role === 'user' ? 'user' : 'bot');
        el.innerHTML = html;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
        return el;
    }

    function typing() {
        return bubble('bot', '<span class="typing" aria-label="..."><span></span><span></span><span></span></span>');
    }

    function persist() {
        try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-30))); } catch (e) { /* yoksay */ }
    }

    function restore() {
        try {
            var h = JSON.parse(sessionStorage.getItem(STORE) || '[]');
            if (Array.isArray(h) && h.length) {
                history = h;
                h.forEach(function (m) { bubble(m.role, m.role === 'user' ? '<p>' + esc(m.content) + '</p>' : md(m.content)); });
                return true;
            }
        } catch (e) { /* yoksay */ }
        return false;
    }

    function welcome() {
        bubble('bot', md(SITE.t(
            'Merhaba, ben İrem\'in asistanıyım. **Deneyimleri, projeleri, teknik yaklaşımı ya da eğitimi** hakkında sorabilirsiniz. Yanıtlarım yalnızca bu sitedeki bilgilere dayanır.\n\nİrem\'e doğrudan yazmak isterseniz **Mesaj gönder** sekmesini kullanın.',
            'Hi, I\'m İrem\'s assistant. Ask me about her **experience, projects, technical approach or education**. My answers are grounded only in this site\'s content.\n\nTo write to İrem directly, use the **Send a message** tab.'
        )));
    }

    function renderSuggestions() {
        var lang = SITE.lang();
        var list = (KB && KB.suggestions && KB.suggestions[lang]) || [];
        suggestEl.innerHTML = list.map(function (s) {
            return '<button type="button" data-q="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('');
    }

    /* ---------------- Akış ---------------- */
    function ask(question) {
        question = String(question || '').trim();
        if (!question || busy) return;
        busy = true;
        send.disabled = true;
        bubble('user', '<p>' + esc(question) + '</p>');
        history.push({ role: 'user', content: question });
        var dots = typing();

        var finish = function (text, links) {
            dots.innerHTML = md(text) + sourcesHtml(links);
            history.push({ role: 'assistant', content: text });
            persist();
            log.scrollTop = log.scrollHeight;
            busy = false;
            send.disabled = !input.value.trim();
        };

        var useLocal = function () {
            kbReady.then(function () {
                var a = localAnswer(question);
                setTimeout(function () { finish(a.text, a.links); }, 380 + Math.min(900, a.text.length * 2));
            });
        };

        if (cfg.chatEndpoint) {
            var first = true;
            remoteAnswer(function (partial) {
                if (first) { first = false; }
                dots.innerHTML = md(partial);
                log.scrollTop = log.scrollHeight;
            }).then(function (full) {
                if (!full) throw new Error('empty');
                kbReady.then(function () {
                    var local = localAnswer(question);
                    finish(full, local.fallback ? ['mail'] : (local.links || []).slice(0, 2));
                });
            }).catch(useLocal);
        } else {
            useLocal();
        }
    }

    /* ---------------- Aç / kapat ---------------- */
    function setTab(name) {
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-chat-tab') === name;
            t.setAttribute('aria-selected', String(on));
            document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
        if (name === 'ask') setTimeout(function () { input.focus(); }, 50);
        else setTimeout(function () { var f = panel.querySelector('#chat-mail input'); if (f) f.focus(); }, 50);
    }

    function open(tab) {
        if (!isOpen) {
            lastFocus = document.activeElement;
            isOpen = true;
            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            panel.inert = false;
            if (launch) launch.classList.add('is-hidden');
            if (window.innerWidth <= 640) SITE.lockScroll(true);
        }
        setTab(tab === 'mail' ? 'mail' : 'ask');
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        panel.inert = true;
        if (launch) launch.classList.remove('is-hidden');
        SITE.lockScroll(false);
        /* Safari tıklanan düğmeye odak vermez; o durumda başlatma düğmesine dön. */
        var back = lastFocus && lastFocus !== document.body ? lastFocus : launch;
        if (back && back.focus) back.focus();
    }

    function reset() {
        history = [];
        lastEntry = null;
        persist();
        log.innerHTML = '';
        welcome();
        input.focus();
    }

    window.ChatUI = {
        open: open,
        close: close,
        ask: function (q) { open('ask'); setTimeout(function () { ask(q); }, 120); }
    };

    panel.inert = true;

    document.querySelectorAll('[data-chat-open]').forEach(function (b) {
        b.addEventListener('click', function () { open('ask'); });
    });
    document.querySelectorAll('[data-chat-mail]').forEach(function (b) {
        b.addEventListener('click', function () { open('mail'); });
    });
    document.querySelectorAll('[data-chat-ask-tr]').forEach(function (b) {
        b.addEventListener('click', function () {
            window.ChatUI.ask(b.getAttribute('data-chat-ask-' + SITE.lang()));
        });
    });
    panel.querySelector('[data-chat-close]').addEventListener('click', close);
    panel.querySelector('[data-chat-reset]').addEventListener('click', reset);
    tabs.forEach(function (t) { t.addEventListener('click', function () { setTab(t.getAttribute('data-chat-tab')); }); });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen && !document.querySelector('dialog[open]')) close();
    });

    /* Telefonda panel tüm ekranı kaplar; Tab arkadaki sayfaya kaçmasın. */
    panel.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || window.innerWidth > 640) return;
        var items = Array.prototype.filter.call(panel.querySelectorAll('a[href], button, input, select, textarea'), function (el) {
            return !el.disabled && el.tabIndex > -1 && el.getClientRects().length;
        });
        if (!items.length) return;
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = input.value;
        input.value = '';
        autosize();
        ask(q);
    });

    function autosize() {
        input.style.height = 'auto';
        input.style.height = Math.min(120, input.scrollHeight) + 'px';
        send.disabled = busy || !input.value.trim();
    }

    input.addEventListener('input', autosize);
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            if (input.value.trim()) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit'));
        }
    });

    suggestEl.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-q]');
        if (b) ask(b.getAttribute('data-q'));
    });

    log.addEventListener('click', function (e) {
        var b = e.target.closest('[data-act]');
        if (!b) return;
        var act = b.getAttribute('data-act');
        if (act === 'mail') { setTab('mail'); }
        else if (act === 'case') { SITE.openCase(b.getAttribute('data-id')); }
        else if (act === 'ask') { ask(b.getAttribute('data-q')); }
        else if (act === 'jump' && window.innerWidth <= 640) { close(); }
    });

    function setPlaceholder() {
        input.placeholder = SITE.t('Bir soru yazın...', 'Type a question...');
    }

    window.addEventListener('lang:change', function () {
        setPlaceholder();
        kbReady.then(renderSuggestions);
    });

    /* Başlangıç */
    setPlaceholder();
    kbReady.then(function () {
        renderSuggestions();
        if (!restore()) welcome();
    });

    if (cfg.chatEndpoint) {
        var label = panel.querySelector('[data-chat-mode-label]');
        if (label) label.innerHTML = '<span lang="tr">Yapay zeka destekli · yalnızca sitedeki bilgilere dayanır</span><span lang="en">AI-powered · grounded in this site only</span>';
    }
})();
