/* Mikro etkileşimler: mıknatıslı düğmeler, imleç halkası ve isteğe bağlı ses.
   Yalnızca fareyle kullanılan cihazlarda ve hareket azaltma tercihi kapalıyken
   çalışır. Ses varsayılan olarak kapalıdır. */

(function () {
    'use strict';

    var SITE = window.SITE || {};
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------------- Ses (Web Audio ile üretilir, dosya yok) ---------------- */
    var SOUND_KEY = 'ing-sound';
    var soundOn = false;
    try { soundOn = localStorage.getItem(SOUND_KEY) === '1'; } catch (e) { /* yoksay */ }
    var ctx = null;

    function tone(freq, dur, vol) {
        if (!soundOn) return;
        try {
            ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
            var o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime;
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now);
            o.frequency.exponentialRampToValueAtTime(freq * 0.82, now + dur);
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            o.connect(g); g.connect(ctx.destination);
            o.start(now); o.stop(now + dur + 0.02);
        } catch (e) { /* ses desteklenmiyor */ }
    }

    function syncSoundButtons() {
        document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
            b.setAttribute('aria-pressed', String(soundOn));
            b.querySelectorAll('[data-sound-state]').forEach(function (s) {
                var lang = s.getAttribute('lang');
                s.textContent = lang === 'en' ? (soundOn ? 'Sound: on' : 'Sound: off') : (soundOn ? 'Ses: açık' : 'Ses: kapalı');
            });
        });
    }

    SITE.toggleSound = function () {
        soundOn = !soundOn;
        try { localStorage.setItem(SOUND_KEY, soundOn ? '1' : '0'); } catch (e) { /* yoksay */ }
        syncSoundButtons();
        if (soundOn) tone(880, 0.12, 0.05);
    };

    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) { b.addEventListener('click', SITE.toggleSound); });
    syncSoundButtons();

    var SEL = 'a, button, [role="tab"], .filter, .chip';
    var lastHover = null;
    document.addEventListener('pointerover', function (e) {
        var t = e.target.closest && e.target.closest(SEL);
        if (t && t !== lastHover) { lastHover = t; tone(1320, 0.05, 0.012); }
        if (!t) lastHover = null;
    });
    document.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest(SEL)) tone(660, 0.09, 0.03);
    });

    if (reduce || !fine) return;

    /* ---------------- Mıknatıslı düğmeler ---------------- */
    var MAG = '.btn, .chat-launch, .icon-btn, .search-btn';
    document.addEventListener('pointermove', function (e) {
        var el = e.target.closest && e.target.closest(MAG);
        if (!el) return;
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        el.style.translate = (dx * 4).toFixed(2) + 'px ' + (dy * 3).toFixed(2) + 'px';
    }, { passive: true });
    document.addEventListener('pointerout', function (e) {
        var el = e.target.closest && e.target.closest(MAG);
        if (el && !el.contains(e.relatedTarget)) el.style.translate = '';
    });

    /* ---------------- İmleç halkası ---------------- */
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);

    var x = -100, y = -100, tx = -100, ty = -100, raf = 0, shown = false;
    function loop() {
        x += (tx - x) * 0.22;
        y += (ty - y) * 0.22;
        ring.style.transform = 'translate3d(' + (x - 16).toFixed(1) + 'px,' + (y - 16).toFixed(1) + 'px,0)';
        if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(loop);
        else raf = 0;
    }

    document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        if (!shown) { shown = true; x = tx; y = ty; ring.classList.add('is-on'); }
        var t = e.target;
        ring.classList.toggle('is-link', !!(t.closest && t.closest(SEL)));
        ring.classList.toggle('is-text', !!(t.closest && t.closest('input, textarea, select, [contenteditable]')));
        if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    document.addEventListener('pointerleave', function () { ring.classList.remove('is-on'); shown = false; });
    document.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    document.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
})();
