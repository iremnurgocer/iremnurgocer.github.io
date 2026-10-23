/* İrem Nur Yılmaz - site etkileşimleri
   Açılış efekti, tema ve dil, gezinme, kaydırma efektleri, vaka pencereleri,
   okuma listesi, iletişim formu. Ortak yardımcılar window.SITE altında. */

(function () {
    'use strict';

    var root = document.documentElement;
    var cfg = window.SITE_CONFIG || {};
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var $ = function (s, c) { return (c || document).querySelector(s); };
    var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

    var SITE = window.SITE = {
        lang: function () { return root.getAttribute('lang') === 'en' ? 'en' : 'tr'; },
        t: function (tr, en) { return SITE.lang() === 'en' ? en : tr; },
        toast: toast,
        lockScroll: function (on) { document.body.classList.toggle('is-locked', !!on); }
    };

    /* ---------------- Tema ---------------- */
    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem('ing-theme', theme); } catch (e) { /* gizli sekme */ }
        var meta = $$('meta[name="theme-color"]');
        meta.forEach(function (m) { m.setAttribute('content', theme === 'light' ? '#f5f4ef' : '#07080b'); m.removeAttribute('media'); });
    }

    SITE.toggleTheme = function () {
        setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    };

    $$('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', SITE.toggleTheme); });

    /* ---------------- Dil ---------------- */
    function setLang(lang, persist) {
        root.setAttribute('lang', lang);
        if (persist !== false) { try { localStorage.setItem('ing-lang', lang); } catch (e) { /* yoksay */ } }
        $$('[data-lang-set]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === lang));
        });
        document.title = root.getAttribute('data-title-' + lang) || 'İrem Nur Yılmaz | Senior AI Engineer';
        fillTopics();
        renderFilters();
        window.dispatchEvent(new CustomEvent('lang:change', { detail: lang }));
    }

    SITE.setLang = setLang;
    SITE.toggleLang = function () { setLang(SITE.lang() === 'en' ? 'tr' : 'en'); };

    $$('[data-lang-set]').forEach(function (b) {
        b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-set')); });
    });

    /* ---------------- Açılış efekti ---------------- */
    var intro = $('[data-intro]');
    var hero = $('[data-hero]');
    var seen = false;
    try { seen = sessionStorage.getItem('ing-intro') === '1'; } catch (e) { seen = true; }

    var heroDone = false;
    function heroIn() {
        if (heroDone) return;
        heroDone = true;
        if (hero) hero.classList.add('is-in');
        window.dispatchEvent(new Event('intro:done'));
    }

    /* Açılış efekti yalnızca geniş ekranlarda; telefonda doğrudan içeriğe gir. */
    var saveData = navigator.connection && navigator.connection.saveData;
    var wide = window.matchMedia('(min-width: 768px)').matches;
    if (intro && !seen && !reduce && !location.hash && wide && !saveData) {
        intro.hidden = false;
        SITE.lockScroll(true);
        var finish = function () {
            if (intro.classList.contains('is-done')) return;
            intro.classList.add('is-done');
            SITE.lockScroll(false);
            try { sessionStorage.setItem('ing-intro', '1'); } catch (e) { /* yoksay */ }
            setTimeout(heroIn, 180);
            setTimeout(function () { intro.hidden = true; }, 1300);
        };
        setTimeout(finish, 1650);
        intro.addEventListener('click', finish);
        window.addEventListener('keydown', finish, { once: true });
    } else {
        requestAnimationFrame(heroIn);
        setTimeout(heroIn, 120); /* arka plandaki sekmede rAF çalışmaz */
    }

    /* ---------------- Döngüsel odak etiketi ---------------- */
    var rot = $('[data-rotator]');
    if (rot && !reduce) {
        var items = $$('span', rot), ri = 0;
        setInterval(function () {
            items[ri].classList.remove('is-on');
            ri = (ri + 1) % items.length;
            items[ri].classList.add('is-on');
        }, 2200);
    }

    /* ---------------- Gezinme ---------------- */
    var nav = $('[data-nav]');
    var progress = $('[data-progress]');
    var lastY = window.scrollY;
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
        if (nav) {
            nav.classList.toggle('is-scrolled', y > 24);
            var down = y > lastY && y > 480;
            nav.classList.toggle('is-hidden', down && !sheetOpen);
        }
        lastY = y;
        updateRails();
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });

    /* Mobil menü */
    var sheet = $('[data-sheet]');
    var menuBtn = $('[data-menu-toggle]');
    var sheetOpen = false;

    function setSheet(open) {
        sheetOpen = open;
        if (!sheet) return;
        sheet.classList.toggle('is-open', open);
        sheet.inert = !open;
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.innerHTML = '<svg class="i"><use href="#i-' + (open ? 'x' : 'menu') + '"/></svg>';
        SITE.lockScroll(open);
        if (open) nav.classList.remove('is-hidden');
    }

    if (sheet && menuBtn) {
        sheet.inert = true;
        menuBtn.addEventListener('click', function () { setSheet(!sheetOpen); });
        sheet.addEventListener('click', function (e) { if (e.target.closest('a, [data-chat-open]')) setSheet(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen) { setSheet(false); menuBtn.focus(); } });
        window.addEventListener('resize', function () { if (window.innerWidth > 1080 && sheetOpen) setSheet(false); });
    }

    /* Aktif bölüm */
    var links = $$('.nav__link');
    var targets = links.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
    if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        targets.forEach(function (t) { spy.observe(t); });
    }

    /* ---------------- Kelime kelime başlıklar ---------------- */
    $$('.split').forEach(function (el) {
        var i = 0;
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (n) {
                if (n.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    n.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                        var s = document.createElement('span');
                        s.className = 'w';
                        s.style.setProperty('--i', i++);
                        s.textContent = part;
                        frag.appendChild(s);
                    });
                    n.parentNode.replaceChild(frag, n);
                } else if (n.nodeType === 1 && !n.classList.contains('grad-text')) {
                    walk(n);
                } else if (n.nodeType === 1) {
                    n.classList.add('w');
                    n.style.setProperty('--i', i++);
                }
            });
        })(el);
    });

    /* ---------------- Görünüre girince ---------------- */
    var revealables = $$('.reveal, .split');
    if ('IntersectionObserver' in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('is-visible');
                io.unobserve(en.target);
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
        revealables.forEach(function (el) { io.observe(el); });
    } else {
        revealables.forEach(function (el) { el.classList.add('is-visible'); });
    }

    /* Dil değişince gizliyken gözlenemeyen öğeleri de görünür yap. */
    window.addEventListener('lang:change', function () {
        requestAnimationFrame(function () {
            $$('.reveal:not(.is-visible), .split:not(.is-visible)').forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-visible');
            });
        });
    });

    /* ---------------- Sayaçlar ---------------- */
    var counters = $$('[data-count]');
    if ('IntersectionObserver' in window && !reduce) {
        var cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target, end = +el.getAttribute('data-count'), t0 = performance.now();
                cio.unobserve(el);
                if (!end) return;
                (function tick(now) {
                    var k = Math.min(1, (now - t0) / 1400);
                    el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
                    if (k < 1) requestAnimationFrame(tick);
                })(t0);
            });
        }, { threshold: .6 });
        counters.forEach(function (c) { c.textContent = '0'; cio.observe(c); });
    }

    /* ---------------- Yöntem çizgisi ve zaman çizelgesi ---------------- */
    var method = $('[data-method]');
    var steps = method ? $$('.step', method) : [];
    var timeline = $('[data-timeline]');
    var jobs = timeline ? $$('.job', timeline) : [];

    function progressOf(el, startAt, endAt) {
        var r = el.getBoundingClientRect(), vh = window.innerHeight;
        var start = vh * startAt, end = vh * endAt;
        return Math.max(0, Math.min(1, (start - r.top) / (r.height + start - end)));
    }

    function updateRails() {
        if (method) {
            var p = progressOf(method, .85, .35);
            method.style.setProperty('--fill', p.toFixed(3));
            $('.method__rail span', method).style.setProperty('--fill', p.toFixed(3));
            steps.forEach(function (s, i) { s.classList.toggle('is-lit', p >= i / steps.length); });
        }
        if (timeline) {
            var q = progressOf(timeline, .6, .4);
            $('.timeline__rail span', timeline).style.setProperty('--fill', q.toFixed(3));
            var mid = window.innerHeight * .6;
            jobs.forEach(function (j) { j.classList.toggle('is-lit', j.getBoundingClientRect().top < mid); });
        }
    }

    onScroll();

    /* ---------------- Kartlarda imleç ışığı ---------------- */
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('pointermove', function (e) {
            var card = e.target.closest && e.target.closest('.spot');
            if (!card) return;
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true });
    }

    /* ---------------- Vaka şemalarında akan veri ---------------- */
    var flowCards = $$('[data-flow-card]');
    if (!reduce && 'IntersectionObserver' in window) {
        flowCards.forEach(function (card) {
            var nodes = $$('.flow li, .arch__node', card), k = -1, timer = 0;
            var tick = function () {
                nodes.forEach(function (n) { n.classList.remove('is-active'); });
                k = (k + 1) % nodes.length;
                nodes[k].classList.add('is-active');
            };
            new IntersectionObserver(function (en) {
                if (en[0].isIntersecting) { if (!timer) { tick(); timer = setInterval(tick, 1100); } }
                else { clearInterval(timer); timer = 0; }
            }, { threshold: .35 }).observe(card);
        });
    }

    /* ---------------- Vaka sayfaları ---------------- */
    /* Kök adres: bu betiğin konumundan hesaplanır, alt sayfalarda da doğru çalışır. */
    var scriptEl = document.querySelector('script[src*="assets/js/main.js"]');
    SITE.root = scriptEl ? new URL('../../', scriptEl.src).href : location.origin + '/';
    var CASE_SLUGS = { 'cs-spec': 'spec-analysis-agent', 'cs-decisions': 'decision-archive-assistant', 'cs-sql': 'analytics-copilot', 'cs-opps': 'tender-intelligence', 'cs-translate': 'document-translation', 'cs-supplier': 'supplier-extraction' };
    SITE.caseUrl = function (id) { return SITE.root + 'work/' + (CASE_SLUGS[id] || id) + '.html'; };
    SITE.openCase = function (id) { location.href = SITE.caseUrl(id); };

    /* Eski #cs-... bağlantılarını yeni sayfalara yönlendir. */
    if (/^#cs-/.test(location.hash) && CASE_SLUGS[location.hash.slice(1)]) location.replace(SITE.caseUrl(location.hash.slice(1)));

    /* ---------------- Okuma listesi ---------------- */
    var listEl = $('[data-reading]');
    var filtersEl = $('[data-filters]');
    var activeCat = 'all';
    var ARROW = '<svg class="i"><use href="#i-arrow-ur"/></svg>';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function renderReading() {
        if (!listEl || !window.READING) return;
        var cats = {};
        (window.READING_CATEGORIES || []).forEach(function (c) { cats[c.id] = c; });
        listEl.innerHTML = window.READING.map(function (p) {
            var c = cats[p.cat] || { tr: p.cat, en: p.cat };
            return '<li class="paper" data-cat="' + p.cat + '" data-search-item data-search-kind="reading">' +
                '<a href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
                '<span class="paper__meta"><span class="cat"><span lang="tr">' + esc(c.tr) + '</span><span lang="en">' + esc(c.en) + '</span></span><span>' + p.year + '</span><span>' + esc(p.type) + '</span></span>' +
                '<h3>' + esc(p.title) + '</h3>' +
                '<span class="paper__go" aria-hidden="true">' + ARROW + '</span>' +
                '<span class="paper__by">' + esc(p.by) + '</span>' +
                '<p class="paper__why"><span lang="tr">' + esc(p.tr) + '</span><span lang="en">' + esc(p.en) + '</span></p>' +
                '</a></li>';
        }).join('');
    }

    function renderFilters() {
        if (!filtersEl || !window.READING_CATEGORIES) return;
        var lang = SITE.lang();
        filtersEl.innerHTML = window.READING_CATEGORIES.map(function (c) {
            var n = c.id === 'all' ? window.READING.length : window.READING.filter(function (p) { return p.cat === c.id; }).length;
            return '<button type="button" class="filter" data-cat="' + c.id + '" aria-pressed="' + (c.id === activeCat) + '">' +
                esc(c[lang]) + '<span class="count">' + n + '</span></button>';
        }).join('');
    }

    function applyFilter(cat) {
        activeCat = cat;
        $$('.filter', filtersEl).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === cat)); });
        $$('.paper', listEl).forEach(function (li) { li.hidden = cat !== 'all' && li.getAttribute('data-cat') !== cat; });
    }

    if (filtersEl) {
        filtersEl.addEventListener('click', function (e) {
            var b = e.target.closest('.filter');
            if (b) applyFilter(b.getAttribute('data-cat'));
        });
    }

    renderReading();
    renderFilters();
    SITE.filterReading = applyFilter;

    /* ---------------- Bildirim ---------------- */
    var toastEl = $('[data-toast]'), toastTimer;
    function toast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2400);
    }

    /* ---------------- E-posta kopyalama ---------------- */
    SITE.copyEmail = function () {
        var email = cfg.email || '';
        var done = function () { toast(SITE.t('E-posta adresi kopyalandı', 'Email address copied')); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(email).then(done, function () { location.href = 'mailto:' + email; });
        } else {
            location.href = 'mailto:' + email;
        }
    };

    $$('[data-copy-email]').forEach(function (b) { b.addEventListener('click', SITE.copyEmail); });

    /* ---------------- İletişim formları ---------------- */
    var TOPICS = [
        { tr: 'Kurumsal yapay zeka projesi', en: 'Enterprise AI project' },
        { tr: 'İş fırsatı / pozisyon', en: 'Job opportunity / role' },
        { tr: 'Teknik iş birliği', en: 'Technical collaboration' },
        { tr: 'Konuşma / etkinlik daveti', en: 'Speaking / event invitation' },
        { tr: 'Diğer', en: 'Other' }
    ];

    function fillTopics() {
        var lang = SITE.lang();
        $$('[data-topic-select]').forEach(function (sel) {
            var cur = sel.selectedIndex;
            sel.innerHTML = TOPICS.map(function (t) { return '<option>' + esc(t[lang]) + '</option>'; }).join('');
            if (cur > 0) sel.selectedIndex = cur;
        });
    }

    fillTopics();

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

    SITE.sendMail = function (data) {
        /* data: { name, email, topic, message, source } → Promise */
        var endpoint = cfg.formEndpoint;
        var subject = '[iremnurgocer.github.io] ' + (data.topic || 'Mesaj') + ' · ' + data.name;
        if (!endpoint) {
            var body = data.message + '\n\n- ' + data.name + ' <' + data.email + '>';
            location.href = 'mailto:' + cfg.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            return Promise.resolve({ mailto: true });
        }
        return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                topic: data.topic,
                message: data.message,
                source: data.source || 'form',
                language: SITE.lang(),
                _subject: subject,
                _replyto: data.email,
                _template: 'table',
                _captcha: 'false'
            })
        }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
                if (!r.ok || j.success === 'false' || j.success === false) throw new Error(j.message || 'send failed');
                return j;
            });
        });
    };

    $$('[data-mail-form]').forEach(function (form) {
        var status = $('.form__status', form);
        var btn = $('button[type="submit"]', form);
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var f = form.elements;
            if (f._honey && f._honey.value) return;
            var data = {
                name: f.name.value.trim(),
                email: f.email.value.trim(),
                topic: f.topic.value,
                message: f.message.value.trim(),
                source: form.closest('.chat') ? 'chat' : 'contact'
            };
            status.className = 'form__status';
            if (!data.name || !validEmail(data.email) || data.message.length < 5) {
                status.classList.add('is-err');
                status.textContent = SITE.t('Lütfen adınızı, geçerli bir e-posta adresini ve mesajınızı yazın.', 'Please add your name, a valid email address and a message.');
                return;
            }
            btn.disabled = true;
            status.textContent = SITE.t('Gönderiliyor...', 'Sending...');
            SITE.sendMail(data).then(function (res) {
                status.classList.add('is-ok');
                status.textContent = res && res.mailto
                    ? SITE.t('E-posta uygulamanız açıldı. Göndermeyi oradan tamamlayabilirsiniz.', 'Your email app has opened. You can finish sending from there.')
                    : SITE.t('Teşekkürler! Mesajınız iletildi; en kısa sürede dönüş yapacağım.', 'Thank you! Your message is on its way, and I\'ll get back to you soon.');
                form.reset();
                fillTopics();
            }).catch(function () {
                status.classList.add('is-err');
                status.innerHTML = SITE.t('Mesaj şu an gönderilemedi. Doğrudan yazabilirsiniz: ', 'The message could not be sent right now. You can write directly: ') +
                    '<a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>';
            }).then(function () { btn.disabled = false; });
        });
    });

    /* ---------------- Alt bilgi yılı ---------------- */
    var year = $('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());

    /* İlk dil durumu (düğmeler ve dinamik içerik). */
    setLang(SITE.lang(), false);
})();
