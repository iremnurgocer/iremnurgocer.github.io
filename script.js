/* İrem Nur Göçer — site etkileşimleri
   Tema anahtarı, mobil menü, aktif bölüm takibi ve kaydırma animasyonu. */

(function () {
    'use strict';

    var root = document.documentElement;

    /* JavaScript çalışıyor: kaydırma animasyonları devreye girebilir. */
    root.classList.add('has-js');

    /* ---- Tema (açık / koyu) ---- */
    var themeBtn = document.querySelector('[data-theme-toggle]');
    var STORAGE_KEY = 'ing-theme';

    function systemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeBtn) {
            var dark = theme === 'dark';
            themeBtn.innerHTML = dark
                ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
                : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
            themeBtn.setAttribute('aria-label', dark ? 'Açık temaya geç' : 'Koyu temaya geç');
        }
    }

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* gizli sekme */ }
    applyTheme(stored || systemTheme());

    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* yoksay */ }
        });
    }

    /* ---- Mobil menü ---- */
    var menuBtn = document.querySelector('[data-menu-toggle]');
    var menu = document.getElementById('nav-links');

    function isMobile() { return window.matchMedia('(max-width: 720px)').matches; }

    function setMenu(open) {
        if (!menu || !menuBtn) return;
        menu.hidden = !open;
        menuBtn.setAttribute('aria-expanded', String(open));
    }

    function syncMenu() {
        if (!menu) return;
        if (isMobile()) { setMenu(false); } else { menu.hidden = false; }
    }

    if (menuBtn && menu) {
        syncMenu();
        window.addEventListener('resize', syncMenu);
        menuBtn.addEventListener('click', function () {
            setMenu(menu.hidden);
        });
        menu.addEventListener('click', function (e) {
            if (e.target.closest('a') && isMobile()) setMenu(false);
        });
        document.addEventListener('click', function (e) {
            if (!isMobile() || menu.hidden) return;
            if (!menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isMobile() && !menu.hidden) {
                setMenu(false);
                menuBtn.focus();
            }
        });
    }

    /* ---- Kaydırınca gezinme çubuğuna kenarlık ---- */
    var nav = document.querySelector('.nav');
    if (nav) {
        var onScroll = function () {
            nav.classList.toggle('is-scrolled', window.scrollY > 8);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ---- Aktif bölüm takibi ---- */
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__link[href^="#"]'));
    var sections = links
        .map(function (a) { return document.querySelector(a.getAttribute('href')); })
        .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                links.forEach(function (a) {
                    a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---- Görünüre girince yumuşak geçiş ---- */
    var revealables = document.querySelectorAll('.reveal');
    if (revealables.length) {
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

            revealables.forEach(function (el) { io.observe(el); });

            /* Gözlemci hiç tetiklenmezse (ör. arka plandaki sekme) içerik
               yine de görünür olsun. */
            window.setTimeout(function () {
                revealables.forEach(function (el) { el.classList.add('is-visible'); });
            }, 1800);
        } else {
            revealables.forEach(function (el) { el.classList.add('is-visible'); });
        }
    }

    /* ---- Alt bilgideki yıl ---- */
    var year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
})();
