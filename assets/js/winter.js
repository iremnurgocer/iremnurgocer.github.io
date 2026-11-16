/* Kış / yılbaşı sahnesi.

   Üç parça:
     1. Kar motoru  — derinlikli tane katmanları, rüzgâr alanı, ekranın altında
                      çok yavaş oluşan ve kenarlara doğru yığılan kar örtüsü.
     2. Çam ağacı   — prosedürel üretilen, tüylü siluetli bir ladin. Arada bir
                      kendi kendine silkelenip dallarındaki karı döker.
     3. Kardan adam — kendi başına dolaşan, kar topu oynayan, bazen kayıp düşen,
                      şapkasını yerden alıp tekrar takan küçük bir karakter.

   Dış kütüphane yok. Katman pointer-events: none; yalnızca ağaç ve kardan adam
   tıklanabilir. Sezon penceresi: 15 Kasım - 10 Ocak (bkz. inSeason).           */

(function () {
    'use strict';

    var SITE = window.SITE || { t: function (tr) { return tr; }, lang: function () { return 'tr'; } };
    var root = document.documentElement;
    var STORAGE_KEY = 'ing-winter';

    function inSeason(d) {
        var ay = d.getMonth() + 1, gun = d.getDate();
        if (ay === 12) return true;
        if (ay === 11 && gun >= 15) return true;
        if (ay === 1 && gun <= 10) return true;
        return false;
    }

    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* gizli sekme */ }

    var enabled = stored === null ? inSeason(new Date()) : stored === 'on';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rnd(a, b) { return a + Math.random() * (b - a); }

    /* ====================================================================
       Çam ağacı — prosedürel siluet.
       Her kat, alt kenarı testere dişli bir çan biçimi; katlar üst üste
       binince iğne yapraklı bir ladin silueti çıkıyor.
       ==================================================================== */

    function agacSVG() {
        var VW = 128, VH = 200;
        var cx = VW / 2;
        var katSayisi = 8;
        var tepe = 20, taban = 168;
        var govde = [], kar = [], isik = [];

        /* Katın alt kenarı: ortada yukarıda, uçlarda aşağıda (dallar sarkar) */
        function altY(y, drop, t) {
            return y + drop * (0.3 + 0.7 * Math.abs(t * 2 - 1));
        }

        for (var i = 0; i < katSayisi; i++) {
            var p = i / (katSayisi - 1);
            var y = tepe + (taban - tepe) * Math.pow(p, 0.92);
            var yari = 7 + 50 * Math.pow(p, 0.78);
            var drop = 16 + 16 * p;
            var dis = 7 + Math.round(p * 7);
            var disDerin = 4 + 4 * p;

            var d = 'M' + (cx - yari).toFixed(1) + ' ' + altY(y, drop, 0).toFixed(1);
            var karNoktalari = [];

            for (var k = 1; k <= dis; k++) {
                var t = k / dis;
                var x = cx - yari + 2 * yari * t;
                var ay = altY(y, drop, t);
                var ortaT = t - 0.5 / dis;
                var ortaX = cx - yari + 2 * yari * ortaT;
                var ortaY = altY(y, drop, ortaT) - disDerin - rnd(0, 2);
                d += 'L' + ortaX.toFixed(1) + ' ' + ortaY.toFixed(1);
                d += 'L' + x.toFixed(1) + ' ' + (ay + rnd(-1, 1)).toFixed(1);
                if (k % 2 === 0) karNoktalari.push([ortaX, ortaY]);
            }

            d += 'L' + cx.toFixed(1) + ' ' + (y - 16 - 6 * (1 - p)).toFixed(1) + 'Z';

            govde.push('<path d="' + d + '" fill="' + (i % 2 === 0 ? 'var(--tree-2)' : 'var(--tree-3)') + '"/>');

            /* Dallarda biriken kar: diş uçlarını birleştiren ince şerit */
            if (karNoktalari.length > 1 && i > 0) {
                var kd = 'M' + karNoktalari[0][0].toFixed(1) + ' ' + (karNoktalari[0][1] + 1).toFixed(1);
                for (var n = 1; n < karNoktalari.length; n++) {
                    var pr = karNoktalari[n - 1], cu = karNoktalari[n];
                    var mx = (pr[0] + cu[0]) / 2, my = Math.min(pr[1], cu[1]) - rnd(1, 3);
                    kd += 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + cu[0].toFixed(1) + ' ' + (cu[1] + 1).toFixed(1);
                }
                kar.push('<path d="' + kd + '" fill="none" stroke="var(--snow)" stroke-width="' +
                    (2.2 + p * 1.6).toFixed(1) + '" stroke-linecap="round" opacity="' + (0.5 + p * 0.35).toFixed(2) + '"/>');
            }

            if (i >= 2) {
                var renkler = ['#ffd27d', '#9aa8ff', '#5ee3c9', '#ff9f8a'];
                var adet = i >= 5 ? 3 : 2;
                for (var l = 0; l < adet; l++) {
                    var lt = rnd(0.12, 0.88);
                    var lx = cx - yari + 2 * yari * lt;
                    var ly = altY(y, drop, lt) - rnd(3, 9);
                    isik.push('<circle class="bulb" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) +
                        '" r="' + rnd(1.9, 2.6).toFixed(1) + '" fill="' + renkler[(i + l) % renkler.length] + '"/>');
                }
            }
        }

        return '<svg class="winter-tree" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' +
            '<defs>' +
            '<linearGradient id="wt-trunk" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#4a3626"/><stop offset=".55" stop-color="#6a4d35"/><stop offset="1" stop-color="#3d2c1f"/>' +
            '</linearGradient>' +
            '<radialGradient id="wt-glow" cx=".5" cy=".5" r=".5">' +
            '<stop offset="0" stop-color="#ffd27d" stop-opacity=".45"/><stop offset="1" stop-color="#ffd27d" stop-opacity="0"/>' +
            '</radialGradient>' +
            '</defs>' +
            '<rect x="' + (cx - 7) + '" y="162" width="14" height="30" rx="3" fill="url(#wt-trunk)"/>' +
            '<ellipse cx="' + cx + '" cy="192" rx="28" ry="7" fill="var(--snow)" opacity=".5"/>' +
            govde.join('') + kar.join('') +
            '<circle cx="' + cx + '" cy="120" r="64" fill="url(#wt-glow)"/>' +
            isik.join('') +
            '<g class="star">' +
            '<path d="M' + cx + ' 0 L' + (cx + 4.6) + ' 10.4 L' + (cx + 15.6) + ' 11.6 L' + (cx + 7.4) + ' 19 L' +
            (cx + 9.8) + ' 30 L' + cx + ' 24 L' + (cx - 9.8) + ' 30 L' + (cx - 7.4) + ' 19 L' +
            (cx - 15.6) + ' 11.6 L' + (cx - 4.6) + ' 10.4 Z" fill="var(--accent-3)"/>' +
            '</g></svg>';
    }

    /* ====================================================================
       Kardan adam
       ==================================================================== */

    var SNOWMAN_SVG =
        '<svg class="sm-svg" viewBox="0 0 72 96" aria-hidden="true" focusable="false">' +
        '<defs>' +
        '<radialGradient id="sm-ball" cx=".36" cy=".3" r=".8">' +
        '<stop offset="0" stop-color="#ffffff"/><stop offset=".62" stop-color="#f2f6fd"/><stop offset="1" stop-color="#ccd9ed"/>' +
        '</radialGradient>' +
        '<linearGradient id="sm-scarf" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#d4584f"/><stop offset="1" stop-color="#a8403a"/>' +
        '</linearGradient>' +
        '</defs>' +
        '<g class="sm-body">' +
        '<g class="sm-arms" stroke="#a87a4c" stroke-width="2.5" stroke-linecap="round" fill="none">' +
        '<path d="M24 55 L4 44 M11 48 L7 39 M9 47 L1 46"/>' +
        '<g class="sm-arm-r"><path d="M48 55 L68 44 M61 48 L65 39 M63 47 L71 46"/></g>' +
        '</g>' +
        '<ellipse cx="36" cy="78" rx="21" ry="18" fill="url(#sm-ball)"/>' +
        '<ellipse cx="36" cy="87" rx="17" ry="7" fill="#c3d0e6" opacity=".4"/>' +
        '<circle cx="36" cy="56" r="15" fill="url(#sm-ball)"/>' +
        '<circle cx="31" cy="54" r="1.8" fill="#2a3040" opacity=".7"/>' +
        '<circle cx="36" cy="61" r="1.8" fill="#2a3040" opacity=".7"/>' +
        '<path d="M24 40 Q36 48 48 40 L48 46 Q36 54 24 46 Z" fill="url(#sm-scarf)"/>' +
        '<g class="sm-tail">' +
        '<path d="M44 45 L51 64 L44 66 L39 47 Z" fill="url(#sm-scarf)"/>' +
        '<path d="M44 64 L51 64 L51 69 L44 69 Z" fill="#8f342f"/>' +
        '</g>' +
        '<circle cx="36" cy="28" r="13" fill="url(#sm-ball)"/>' +
        '<ellipse cx="28.5" cy="31.5" rx="3.2" ry="2.1" fill="#f0a9a2" opacity=".45"/>' +
        '<ellipse cx="43.5" cy="31.5" rx="3.2" ry="2.1" fill="#f0a9a2" opacity=".45"/>' +
        '<circle cx="31" cy="25" r="1.9" fill="#232935"/>' +
        '<circle cx="41" cy="25" r="1.9" fill="#232935"/>' +
        '<circle cx="31.6" cy="24.3" r=".6" fill="#fff" opacity=".9"/>' +
        '<circle cx="41.6" cy="24.3" r=".6" fill="#fff" opacity=".9"/>' +
        '<rect class="sm-lid" x="28.7" y="21.6" width="4.6" height="5" rx="2" fill="#f2f6fd"/>' +
        '<rect class="sm-lid sm-lid--r" x="38.7" y="21.6" width="4.6" height="5" rx="2" fill="#f2f6fd"/>' +
        '<path d="M36 28.5 L48 31.5 L36 33.5 Z" fill="#e0872f"/>' +
        '<path d="M36 28.5 L48 31.5 L36 30.5 Z" fill="#f0a048" opacity=".75"/>' +
        '<path d="M29.5 34.2 Q36 40.4 42.5 34.2" stroke="#2a3040" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
        '<g class="sm-hat-on">' +
        '<path d="M23 17 Q36 10 49 17 L49 20.5 Q36 14 23 20.5 Z" fill="#2f3a52"/>' +
        '<path d="M24.5 17 Q25.5 6 36 5 Q46.5 6 47.5 17 Z" fill="#3d4b69"/>' +
        '<path d="M31 6.4 Q36 5 41 6.4 L41 16 L31 16 Z" fill="#46567a" opacity=".65"/>' +
        '<circle cx="36" cy="3.8" r="3.3" fill="#e8eef8"/>' +
        '</g>' +
        '</g></svg>';

    var HAT_SVG =
        '<svg class="winter-hat" viewBox="0 0 30 21" aria-hidden="true" focusable="false">' +
        '<path d="M1 14 Q15 7 29 14 L29 17.5 Q15 11 1 17.5 Z" fill="#2f3a52"/>' +
        '<path d="M2.5 14 Q3.5 3 15 2 Q26.5 3 27.5 14 Z" fill="#3d4b69"/>' +
        '<path d="M10 3.4 Q15 2 20 3.4 L20 13 L10 13 Z" fill="#46567a" opacity=".65"/>' +
        '<circle cx="15" cy="1.2" r="3.2" fill="#e8eef8"/>' +
        '</svg>';

    /* ====================================================================
       Katman
       ==================================================================== */

    var layer = document.createElement('div');
    layer.className = 'winter-layer';
    layer.innerHTML =
        '<canvas class="winter-canvas" aria-hidden="true"></canvas>' +
        agacSVG() +
        '<button class="winter-snowman" type="button" aria-describedby="winter-bubble">' +
        '<span class="sr-only">' + SITE.t('Kardan adamla konuş', 'Talk to the snowman') + '</span>' +
        SNOWMAN_SVG + '</button>' +
        HAT_SVG +
        '<div class="winter-bubble" id="winter-bubble" role="status" aria-live="polite"></div>';
    document.body.appendChild(layer);

    var canvas = layer.querySelector('.winter-canvas');
    var ctx = canvas.getContext('2d');
    var tree = layer.querySelector('.winter-tree');
    var snowman = layer.querySelector('.winter-snowman');
    var hatEl = layer.querySelector('.winter-hat');
    var bubble = layer.querySelector('.winter-bubble');

    /* Giriş bölümüne buzlanma katmanı */
    var hero = document.querySelector('[data-hero]');
    var frost = null;
    if (hero) {
        frost = document.createElement('div');
        frost.className = 'winter-frost';
        frost.setAttribute('aria-hidden', 'true');
        hero.appendChild(frost);
    }

    /* ---------------------------------------------- Gezinmedeki düğme */

    var toggle = null;
    var tools = document.querySelector('.nav__tools');

    if (tools) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'icon-btn winter-toggle';
        toggle.innerHTML =
            '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 2v20M3.6 7.2l16.8 9.6M20.4 7.2 3.6 16.8"/>' +
            '<path d="M12 6.4 9.4 4.2M12 6.4l2.6-2.2M12 17.6l-2.6 2.2M12 17.6l2.6 2.2"/>' +
            '<path d="m6.9 9.1-3.4-.5M6.9 9.1 5.6 5.9M17.1 14.9l3.4.5M17.1 14.9l1.3 3.2"/>' +
            '<path d="m6.9 14.9-1.3 3.2M6.9 14.9l-3.4.5M17.1 9.1l1.3-3.2M17.1 9.1l3.4-.5"/>' +
            '</svg>';
        tools.insertBefore(toggle, tools.querySelector('[data-theme-toggle]') || null);
        toggle.addEventListener('click', function () { setEnabled(!enabled, true); });
    }

    function etiketle() {
        if (!toggle) return;
        var metin = enabled
            ? SITE.t('Kar efektini kapat', 'Turn snow off')
            : SITE.t('Kar efektini aç', 'Turn snow on');
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.setAttribute('aria-label', metin);
        toggle.title = metin;
    }

    function setEnabled(value, persist) {
        enabled = value;
        root.classList.toggle('winter-off', !enabled);
        etiketle();
        if (persist) {
            try { localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off'); } catch (e) { /* yoksay */ }
        }
        if (enabled) { start(); } else { stop(); }
    }

    /* ====================================================================
       Kar motoru
       ==================================================================== */

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var BUCKET = 9;
    var ORTA_MAX = 12;       /* ekran ortasında örtünün tavanı (px) */
    var KENAR_MAX = 40;      /* kenarlarda rüzgârın yığdığı kar (px) */
    var BUYUME = 0.0022;     /* kare başına birikim — bilerek çok yavaş */

    var W = 0, H = 0;
    var flakes = [];
    var ground = [];
    var tavan = [];
    var puffs = [];
    var ruzgar = 0, ruzgarHedef = 0;
    var mouse = { x: -999, y: -999, px: -999, py: -999, vx: 0, active: false };
    var raf = null, running = false, sonZaman = 0;

    var renk = { flake: 'rgba(255,255,255,.95)', pileTop: '#fff', pileBottom: '#dfe7f5' };

    function renkleriOku() {
        var cs = getComputedStyle(root);
        var f = cs.getPropertyValue('--flake').trim();
        var pt = cs.getPropertyValue('--pile-top').trim();
        var pb = cs.getPropertyValue('--pile-bottom').trim();
        if (f) renk.flake = f;
        if (pt) renk.pileTop = pt;
        if (pb) renk.pileBottom = pb;
    }

    /* Kenarlara doğru artan tavan: kar rüzgârla köşelere yığılır */
    function tavanHesapla() {
        tavan = new Array(ground.length);
        for (var i = 0; i < ground.length; i++) {
            var t = ground.length > 1 ? i / (ground.length - 1) : 0.5;
            var kenar = Math.pow(Math.abs(t * 2 - 1), 2.6);
            tavan[i] = ORTA_MAX + (KENAR_MAX - ORTA_MAX) * kenar;
        }
    }

    function olcekle() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        var adet = Math.round(W / BUCKET) + 1;
        var eski = ground;
        ground = new Array(adet);
        for (var i = 0; i < adet; i++) {
            ground[i] = eski.length ? (eski[Math.min(i, eski.length - 1)] || 0) : 0;
        }
        tavanHesapla();

        var hedef = Math.round(Math.min(150, Math.max(50, (W * H) / 15000)));
        while (flakes.length < hedef) flakes.push(yeniTane(true));
        if (flakes.length > hedef) flakes.length = hedef;

        smYerlestir();
    }

    /* Derinlik: 0 uzak (küçük, yavaş, soluk) — 1 yakın (büyük, hızlı, net) */
    function yeniTane(rastgeleY) {
        var z = Math.random();
        z = z * z;
        return {
            x: Math.random() * W,
            y: rastgeleY ? Math.random() * H : rnd(-40, -6),
            z: z,
            r: 0.7 + z * 2.5,
            hiz: 0.18 + z * 0.7,
            faz: Math.random() * Math.PI * 2,
            salinim: 0.1 + Math.random() * 0.38,
            saydam: 0.26 + z * 0.64
        };
    }

    function bucketIndex(x) {
        return Math.max(0, Math.min(ground.length - 1, Math.round(x / BUCKET)));
    }

    function duzlestir() {
        for (var i = 1; i < ground.length - 1; i++) {
            var bu = ground[i];
            if (bu - ground[i - 1] > 2.2) { ground[i] -= 0.8; ground[i - 1] += 0.8; }
            else if (bu - ground[i + 1] > 2.2) { ground[i] -= 0.8; ground[i + 1] += 0.8; }
        }
    }

    function adim(zaman) {
        var dt = sonZaman ? Math.min(zaman - sonZaman, 48) : 16;
        sonZaman = zaman;
        var k = dt / 16.67;

        ctx.clearRect(0, 0, W, H);

        /* Rüzgâr: yavaş salınım + imlecin yatay hızı */
        ruzgarHedef = Math.sin(zaman / 7400) * 0.5 + Math.sin(zaman / 2600) * 0.2;
        if (mouse.active) ruzgarHedef += Math.max(-1.5, Math.min(1.5, mouse.vx * 0.085));
        ruzgar += (ruzgarHedef - ruzgar) * 0.035 * k;
        mouse.vx *= Math.pow(0.9, k);

        for (var g = 0; g < ground.length; g++) {
            if (ground[g] < tavan[g]) ground[g] = Math.min(tavan[g], ground[g] + BUYUME * k);
        }

        ctx.fillStyle = renk.flake;
        for (var i = 0; i < flakes.length; i++) {
            var f = flakes[i];
            f.faz += 0.013 * k;
            f.x += (Math.sin(f.faz) * f.salinim + ruzgar * (0.3 + f.z * 1.2)) * k;
            f.y += f.hiz * k;

            if (f.x < -14) f.x = W + 14;
            else if (f.x > W + 14) f.x = -14;

            var bi = bucketIndex(f.x);
            if (f.y + f.r >= H - ground[bi]) {
                if (ground[bi] < tavan[bi]) ground[bi] = Math.min(tavan[bi], ground[bi] + f.r * 0.04);
                flakes[i] = yeniTane(false);
                continue;
            }
            if (f.y > H + 14) { flakes[i] = yeniTane(false); continue; }

            ctx.globalAlpha = f.saydam;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }

        for (var p = puffs.length - 1; p >= 0; p--) {
            var q = puffs[p];
            q.vy += 0.045 * k;
            q.x += (q.vx + ruzgar * 0.4) * k;
            q.y += q.vy * k;
            q.omur -= k;
            var qb = bucketIndex(q.x);
            if (q.y >= H - ground[qb] || q.omur <= 0) {
                if (q.y >= H - ground[qb] && ground[qb] < tavan[qb]) ground[qb] += q.r * 0.1;
                puffs.splice(p, 1);
                continue;
            }
            ctx.globalAlpha = Math.min(0.95, q.omur / 60);
            ctx.beginPath();
            ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        duzlestir();
        ortuCiz();
        smGuncelle(dt);

        raf = window.requestAnimationFrame(adim);
    }

    function ortuCiz() {
        if (!ground.length) return;
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, H - ground[0]);
        for (var i = 1; i < ground.length; i++) {
            var x0 = (i - 1) * BUCKET;
            ctx.quadraticCurveTo(x0, H - ground[i - 1], x0 + BUCKET / 2, H - (ground[i - 1] + ground[i]) / 2);
        }
        ctx.lineTo(W, H - ground[ground.length - 1]);
        ctx.lineTo(W, H);
        ctx.closePath();

        var gr = ctx.createLinearGradient(0, H - KENAR_MAX, 0, H);
        gr.addColorStop(0, renk.pileTop);
        gr.addColorStop(1, renk.pileBottom);
        ctx.fillStyle = gr;
        ctx.fill();
    }

    function puffEkle(x, y, adet, guc) {
        for (var i = 0; i < adet; i++) {
            puffs.push({
                x: x + rnd(-6, 6), y: y + rnd(-4, 4),
                vx: rnd(-guc, guc), vy: rnd(-guc * 0.5, 0.2),
                r: rnd(0.9, 2.3), omur: rnd(70, 150)
            });
        }
    }

    /* ====================================================================
       Fare
       ==================================================================== */

    function konum(x, y) {
        if (mouse.px > -900) mouse.vx = x - mouse.px;
        mouse.px = x; mouse.py = y;
        mouse.x = x; mouse.y = y;
        mouse.active = true;

        if (H - y < KENAR_MAX + 24) {
            var merkez = bucketIndex(x);
            for (var i = merkez - 6; i <= merkez + 6; i++) {
                if (i < 0 || i >= ground.length) continue;
                var u = Math.abs(i - merkez) / 6;
                if (H - ground[i] > y - 16) ground[i] = Math.max(0, ground[i] - (1 - u * u) * 1.6);
            }
        }

        if (frost) {
            frost.style.transform = 'translate3d(' +
                ((x / window.innerWidth - 0.5) * 18).toFixed(1) + 'px,' +
                ((y / window.innerHeight - 0.5) * 11).toFixed(1) + 'px,0)';
        }
    }

    function onMove(e) { konum(e.clientX, e.clientY); }
    function onLeave() { mouse.active = false; mouse.vx = 0; mouse.px = mouse.py = -999; }
    function onTouch(e) { if (e.touches && e.touches.length) konum(e.touches[0].clientX, e.touches[0].clientY); }

    /* ====================================================================
       Kardan adam — davranış döngüsü
       ==================================================================== */

    var sm = {
        x: 140, hedef: 140, yon: 1,
        durum: 'bekle', t: 0, sure: 2200,
        sol: 28, sag: 320, atti: false,
        sapka: { dusuk: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, yerde: false }
    };

    function smYerlestir() {
        sm.sol = 24;
        /* Sağ sınır: ağacın ve sohbet düğmesinin alanına girmesin */
        sm.sag = Math.max(sm.sol + 80, W * 0.54);
        sm.x = Math.max(sm.sol, Math.min(sm.sag, sm.x));
    }

    var SM_SINIFLAR = ['is-walking', 'is-playing', 'is-falling', 'is-down', 'is-bending', 'is-rising'];

    function smDurum(d, sure) {
        sm.durum = d;
        sm.t = 0;
        sm.sure = sure || 0;
        SM_SINIFLAR.forEach(function (c) { snowman.classList.remove(c); });
        if (d === 'yuru' || d === 'sapkayaGit') snowman.classList.add('is-walking');
        else if (d === 'oyna') snowman.classList.add('is-playing');
        else if (d === 'dus') snowman.classList.add('is-falling');
        else if (d === 'yerde') snowman.classList.add('is-down');
        else if (d === 'kalk') snowman.classList.add('is-rising');
        else if (d === 'sapkaAl') snowman.classList.add('is-bending');
    }

    function smSec() {
        var r = Math.random();
        if (r < 0.54) {
            sm.hedef = rnd(sm.sol, sm.sag);
            if (Math.abs(sm.hedef - sm.x) < 40) sm.hedef = sm.x + (Math.random() < 0.5 ? -80 : 80);
            sm.hedef = Math.max(sm.sol, Math.min(sm.sag, sm.hedef));
            smDurum('yuru');
        } else if (r < 0.86) {
            smDurum('oyna', 2300);
        } else {
            smDurum('kay', 460);
        }
    }

    function smCiz() {
        snowman.style.transform =
            'translate3d(' + sm.x.toFixed(1) + 'px,0,0) scaleX(' + (sm.yon < 0 ? -1 : 1) + ')';
    }

    function sapkaCiz() {
        hatEl.style.transform =
            'translate3d(' + sm.sapka.x.toFixed(1) + 'px,' + (-sm.sapka.y).toFixed(1) + 'px,0) rotate(' +
            sm.sapka.rot.toFixed(1) + 'deg)';
    }

    function zemin(x) { return ground.length ? ground[bucketIndex(x)] : 0; }

    function smGuncelle(dt) {
        if (reduced) return;
        sm.t += dt;
        var k = dt / 16.67;
        var zy = zemin(sm.x);

        switch (sm.durum) {

            case 'bekle':
                if (sm.t > sm.sure) smSec();
                break;

            case 'yuru': {
                var fark = sm.hedef - sm.x;
                sm.yon = fark < 0 ? -1 : 1;
                sm.x += (fark < 0 ? -1 : 1) * Math.min(Math.abs(fark), 0.75 * k);
                if (Math.abs(fark) < 1.5) smDurum('bekle', rnd(1400, 4200));
                break;
            }

            case 'oyna':
                if (sm.t > 1300 && !sm.atti) {
                    sm.atti = true;
                    var bx = sm.x + sm.yon * 24;
                    puffEkle(bx, H - zy - 14, 10, 1.6);
                    puffs.push({ x: bx, y: H - zy - 22, vx: sm.yon * 2.3, vy: -2.1, r: 3.1, omur: 130 });
                }
                if (sm.t > sm.sure) { sm.atti = false; smDurum('bekle', rnd(1200, 2600)); }
                break;

            case 'kay':
                if (sm.t > sm.sure) {
                    smDurum('dus', 560);
                    sm.sapka.dusuk = true;
                    sm.sapka.yerde = false;
                    sm.sapka.x = sm.x + sm.yon * 6;
                    sm.sapka.y = zy + 52;
                    sm.sapka.vx = sm.yon * rnd(1, 1.9);
                    sm.sapka.vy = rnd(2, 3);
                    sm.sapka.rot = 0;
                    snowman.classList.add('no-hat');
                    hatEl.classList.add('is-loose');
                    puffEkle(sm.x, H - zy - 8, 12, 1.4);
                }
                break;

            case 'dus':
                if (sm.t > sm.sure) smDurum('yerde', rnd(900, 1500));
                break;

            case 'yerde':
                if (sm.t > sm.sure) smDurum('kalk', 640);
                break;

            case 'kalk':
                if (sm.t > sm.sure) {
                    if (sm.sapka.dusuk) {
                        sm.hedef = Math.max(sm.sol, Math.min(sm.sag, sm.sapka.x));
                        smDurum('sapkayaGit');
                    } else {
                        smDurum('bekle', rnd(1500, 3000));
                    }
                }
                break;

            case 'sapkayaGit': {
                var d2 = sm.hedef - sm.x;
                sm.yon = d2 < 0 ? -1 : 1;
                sm.x += (d2 < 0 ? -1 : 1) * Math.min(Math.abs(d2), 0.75 * k);
                if (Math.abs(d2) < 3) smDurum('sapkaAl', 700);
                break;
            }

            case 'sapkaAl':
                if (sm.t > sm.sure) {
                    sm.sapka.dusuk = false;
                    snowman.classList.remove('no-hat');
                    hatEl.classList.remove('is-loose');
                    puffEkle(sm.x, H - zy - 40, 7, 0.9);
                    smDurum('silkele', 720);
                }
                break;

            case 'silkele':
                if (!snowman.classList.contains('is-shaking')) snowman.classList.add('is-shaking');
                if (sm.t > sm.sure) {
                    snowman.classList.remove('is-shaking');
                    smDurum('bekle', rnd(1600, 3200));
                }
                break;

            case 'selam':
                if (sm.t > sm.sure) {
                    snowman.classList.remove('is-waving');
                    smDurum('bekle', rnd(1200, 2400));
                }
                break;
        }

        /* Düşen şapkanın fiziği */
        if (sm.sapka.dusuk) {
            if (!sm.sapka.yerde) {
                sm.sapka.vy -= 0.16 * k;
                sm.sapka.x += sm.sapka.vx * k;
                sm.sapka.y += sm.sapka.vy * k;
                sm.sapka.rot += sm.sapka.vx * 3 * k;
                var hz = zemin(sm.sapka.x);
                if (sm.sapka.y <= hz + 2) {
                    sm.sapka.y = hz + 2;
                    sm.sapka.yerde = true;
                    sm.sapka.rot = sm.sapka.vx > 0 ? 14 : -14;
                    puffEkle(sm.sapka.x, H - hz - 5, 6, 0.8);
                }
            } else {
                sm.sapka.y = zemin(sm.sapka.x) + 2;
            }
            sapkaCiz();
        }

        snowman.style.bottom = Math.round(zy * 0.7) + 'px';
        smCiz();
    }

    /* ====================================================================
       Ağaç
       ==================================================================== */

    function agacSilkele() {
        tree.classList.remove('is-shaking');
        void tree.offsetWidth;
        tree.classList.add('is-shaking');
        if (!running) return;
        var r = tree.getBoundingClientRect();
        for (var i = 0; i < 24; i++) {
            puffs.push({
                x: r.left + rnd(r.width * 0.12, r.width * 0.88),
                y: r.top + rnd(r.height * 0.18, r.height * 0.78),
                vx: rnd(-0.5, 0.5), vy: rnd(0.2, 1),
                r: rnd(1, 2.5), omur: rnd(90, 190)
            });
        }
    }

    tree.addEventListener('click', agacSilkele);

    var agacZaman = null;
    function agacZamanla() {
        window.clearTimeout(agacZaman);
        agacZaman = window.setTimeout(function () {
            if (running && !document.hidden) agacSilkele();
            agacZamanla();
        }, rnd(15000, 32000));
    }

    /* ====================================================================
       Konuşma balonu
       ==================================================================== */

    var BOLUM = {
        hero: [
            ['Kar başladı. Üstteki kar tanesi düğmesinden kapatabilirsin.', 'Snow is on. You can switch it off with the snowflake button above.'],
            ['Fareyi hızlı oynat, rüzgâr çıksın.', 'Move your cursor fast — you will stir up some wind.'],
            ['Aşağıdaki karı fareyle dağıtabilirsin.', 'You can sweep the snow at the bottom with your cursor.']
        ],
        about: [
            ['İrem burada ne yaptığını anlatıyor. Ben sadece kardan sorumluyum.', 'İrem explains what she does here. I am only responsible for the snow.'],
            ['Yıllardır süren bir mühendislik geçmişi. Benimki üç gün önce başladı.', 'Years of engineering behind this. Mine started three days ago.']
        ],
        approach: [
            ['Ölçülemeyen şey iyileştirilemez. Ben her gün biraz eriyorum, ölçtüm.', 'What cannot be measured cannot be improved. I melt a little daily — I measured it.'],
            ['Kanıta dayalı iş. Benim tek kanıtım bu havuç.', 'Evidence-based work. My only evidence is this carrot.']
        ],
        work: [
            ['Üretimde çalışan sistemler. Benim tek üretimim bir kar topu.', 'Systems running in production. My only production is one snowball.'],
            ['Vaka çalışmalarını aç, gerçekten okunmaya değer.', 'Open the case studies — they are genuinely worth reading.']
        ],
        lab: [
            ['Burası deney alanı. Ben de bir deneyim sayılırım.', 'This is the lab. I count as an experiment too.'],
            ['Dene, kır, düzelt. Ben kırılınca eriyorum ama olsun.', 'Try it, break it, fix it. When I break I just melt, but fine.']
        ],
        experience: [
            ['Düzgün bir kronoloji. Benimki üç top kar, hepsi bu.', 'A proper timeline. Mine is three balls of snow, that is all.'],
            ['Her satırın altında bir sürü gece var.', 'There are a lot of long nights under each line.']
        ],
        writing: [
            ['Uzun yazılar var. Sıcak bir şey al — ben zaten üşümüyorum.', 'Long reads ahead. Grab something warm — I never get cold.'],
            ['RAG yazısı iyidir. Okudum, eridim, yeniden donup tekrar okudum.', 'The RAG piece is good. I read it, melted, refroze and read it again.']
        ],
        reading: [
            ['Okuma listesi. Ben resimlere bakıyorum.', 'A reading list. I just look at the pictures.'],
            ['Kaynakça uzun, kış günleri kısa.', 'The bibliography is long, winter days are short.']
        ],
        contact: [
            ['Yazmak için iyi bir gün. Kar da yağıyor.', 'A good day to write. It is snowing, too.'],
            ['E-postayı tıkla. Ben burada bekler, erimeye devam ederim.', 'Click the email. I will wait here and keep melting.']
        ]
    };

    var GENEL = [
        ['Ağaca tıkla, dallarındaki karı döksün.', 'Click the tree — it will shed the snow on its branches.'],
        ['Kar yavaş yavaş kenarlara yığılıyor.', 'The snow slowly drifts toward the edges.'],
        ['Birazdan yine düşeceğim, biliyorum.', 'I am going to fall over again soon. I know.']
    ];

    var sonSoz = null, balonZaman = null;

    function aktifBolum() {
        var orta = window.innerHeight / 2, en = null, enMesafe = Infinity;
        for (var id in BOLUM) {
            if (!Object.prototype.hasOwnProperty.call(BOLUM, id)) continue;
            var el = document.getElementById(id);
            if (!el) continue;
            var r = el.getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) continue;
            var m = Math.abs(r.top + r.height / 2 - orta);
            if (m < enMesafe) { enMesafe = m; en = id; }
        }
        return en;
    }

    function sozSec() {
        var havuz = BOLUM[aktifBolum()] || GENEL;
        var aday = havuz[0], tur = 0;
        if (havuz.length > 1) {
            do { aday = havuz[Math.floor(Math.random() * havuz.length)]; }
            while (aday === sonSoz && ++tur < 6);
        }
        sonSoz = aday;
        return SITE.t(aday[0], aday[1]);
    }

    function balonYerlestir() {
        if (!bubble.classList.contains('is-open')) return;
        var gen = bubble.offsetWidth || 240;
        bubble.style.left = Math.max(12, Math.min(W - gen - 12, sm.x - gen * 0.22)).toFixed(0) + 'px';
        bubble.style.bottom = Math.round(74 + zemin(sm.x) * 0.7) + 'px';
    }

    function konus() {
        var chatVar = !!(window.ChatUI && window.ChatUI.ask);
        bubble.innerHTML = '';

        var p = document.createElement('p');
        p.className = 'winter-bubble__text';
        p.textContent = sozSec();
        bubble.appendChild(p);

        if (chatVar) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'winter-bubble__ask';
            btn.innerHTML = '<span class="orb-mini" aria-hidden="true"></span>';
            btn.appendChild(document.createTextNode(SITE.t('İrem\'in asistanına sor', 'Ask İrem\'s assistant')));
            btn.addEventListener('click', function () {
                bubble.classList.remove('is-open');
                window.ChatUI.ask(SITE.t(
                    'İrem ne iş yapıyor, kısaca anlatır mısın?',
                    'What does İrem do? Give me the short version.'));
            });
            bubble.appendChild(btn);
        }

        bubble.classList.add('is-open');
        balonYerlestir();
        window.clearTimeout(balonZaman);
        balonZaman = window.setTimeout(function () { bubble.classList.remove('is-open'); }, chatVar ? 8000 : 5400);
    }

    snowman.addEventListener('click', function () {
        if (sm.durum !== 'dus' && sm.durum !== 'yerde' && sm.durum !== 'kalk') {
            snowman.classList.add('is-waving');
            smDurum('selam', 1100);
        }
        konus();
    });

    /* ====================================================================
       Başlat / dur
       ==================================================================== */

    function start() {
        if (running || !enabled) return;
        running = true;
        renkleriOku();
        olcekle();
        if (reduced) { ortuCiz(); smCiz(); return; }
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseout', onLeave, { passive: true });
        window.addEventListener('touchmove', onTouch, { passive: true });
        window.addEventListener('touchend', onLeave, { passive: true });
        sonZaman = 0;
        agacZamanla();
        adim(performance.now());
    }

    function stop() {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
        raf = null;
        window.clearTimeout(agacZaman);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseout', onLeave);
        window.removeEventListener('touchmove', onTouch);
        window.removeEventListener('touchend', onLeave);
        if (W && H) ctx.clearRect(0, 0, W, H);
    }

    var boyutZaman = null;
    window.addEventListener('resize', function () {
        window.clearTimeout(boyutZaman);
        boyutZaman = window.setTimeout(function () { if (running) { olcekle(); balonYerlestir(); } }, 180);
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stop(); } else { start(); }
    });

    new MutationObserver(renkleriOku).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    window.addEventListener('lang:change', function () {
        etiketle();
        var sr = snowman.querySelector('.sr-only');
        if (sr) sr.textContent = SITE.t('Kardan adamla konuş', 'Talk to the snowman');
        if (bubble.classList.contains('is-open')) konus();
    });

    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onMq = function (e) { reduced = e.matches; stop(); start(); };
    if (mq.addEventListener) { mq.addEventListener('change', onMq); }
    else if (mq.addListener) { mq.addListener(onMq); }

    setEnabled(enabled, false);
})();
