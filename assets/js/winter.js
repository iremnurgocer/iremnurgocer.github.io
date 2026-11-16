/* Kış / yılbaşı teması — kar motoru, biriken kar, çam ağacı ve kardan adam.

   Dış bağımlılık yok: tek bir <canvas> ve enjekte edilen iki SVG.
   Katman pointer-events: none olduğu için sayfanın tıklanabilirliğini bozmaz;
   fare etkileşimi window üzerinden dinlenir. Kardan adam ve ağaç, katmandaki
   tek etkileşimli öğelerdir.

   Sezon penceresi: 15 Kasım - 10 Ocak arası varsayılan olarak açık. Dışında
   kapalı; kullanıcı gezinmedeki kar tanesi düğmesiyle her zaman değiştirebilir
   ve tercihi localStorage'da saklanır. */

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

    /* ---------------------------------------------------------------- SVG */

    var TREE_SVG = [
        '<svg class="winter-tree" viewBox="0 0 112 176" aria-hidden="true" focusable="false">',
        '  <rect x="49" y="144" width="14" height="26" rx="3" fill="#4a3524"/>',
        '  <path d="M56 80 L100 150 Q102 156 95 156 H17 Q10 156 12 150 Z" fill="var(--tree-1)"/>',
        '  <path d="M56 80 L100 150 Q102 156 95 156 H56 Z" fill="var(--tree-2)"/>',
        '  <path d="M56 44 L91 112 Q93 118 86 118 H26 Q19 118 21 112 Z" fill="var(--tree-2)"/>',
        '  <path d="M56 44 L91 112 Q93 118 86 118 H56 Z" fill="var(--tree-3)"/>',
        '  <path d="M56 12 L83 76 Q85 82 78 82 H34 Q27 82 29 76 Z" fill="var(--tree-3)"/>',
        '  <path d="M56 12 L83 76 Q85 82 78 82 H56 Z" fill="var(--tree-4)"/>',
        /* dallarda biriken kar */
        '  <path d="M36 80 Q46 72 56 80 Q66 72 78 80 Q66 86 56 82 Q46 86 36 80 Z" fill="var(--snow)" opacity=".92"/>',
        '  <path d="M26 116 Q41 107 56 116 Q71 107 87 116 Q71 123 56 118 Q41 123 26 116 Z" fill="var(--snow)" opacity=".86"/>',
        '  <path d="M14 154 Q35 144 56 154 Q77 144 98 154 Q77 161 56 156 Q35 161 14 154 Z" fill="var(--snow)" opacity=".8"/>',
        /* ışıklar — sitenin aksan renkleri */
        '  <circle class="bulb" cx="47" cy="38" r="3.1" fill="#5ee3c9"/>',
        '  <circle class="bulb" cx="66" cy="58" r="3.1" fill="#ffb37d"/>',
        '  <circle class="bulb" cx="42" cy="64" r="3.1" fill="#9aa8ff"/>',
        '  <circle class="bulb" cx="74" cy="98" r="3.1" fill="#5ee3c9"/>',
        '  <circle class="bulb" cx="37" cy="102" r="3.1" fill="#c9524a"/>',
        '  <circle class="bulb" cx="56" cy="104" r="3.1" fill="#ffb37d"/>',
        '  <circle class="bulb" cx="82" cy="138" r="3.3" fill="#9aa8ff"/>',
        '  <circle class="bulb" cx="30" cy="140" r="3.3" fill="#5ee3c9"/>',
        '  <circle class="bulb" cx="56" cy="138" r="3.3" fill="#c9524a"/>',
        '  <path class="star" d="M56 0 L60.5 11 L72 12 L63 19.5 L65.8 31 L56 24.6 L46.2 31 L49 19.5 L40 12 L51.5 11 Z" fill="var(--accent-3)"/>',
        '</svg>'
    ].join('');

    var SNOWMAN_SVG = [
        '<button class="winter-snowman" type="button" aria-describedby="winter-bubble">',
        '  <span class="sr-only">' + SITE.t('Kardan adamla konuş', 'Talk to the snowman') + '</span>',
        '  <svg viewBox="0 0 104 148" aria-hidden="true" focusable="false">',
        '    <g stroke="#6b4b2e" stroke-width="3.4" stroke-linecap="round" fill="none">',
        '      <path d="M30 80 L8 64 M16 70 L10 58 M14 68 L4 69"/>',
        '      <g class="arm-right"><path d="M74 80 L96 66 M88 70 L94 58 M90 70 L100 70"/></g>',
        '    </g>',
        '    <circle cx="52" cy="112" r="30" fill="var(--snow)"/>',
        '    <ellipse cx="52" cy="124" rx="26" ry="16" fill="var(--snow-2)" opacity=".55"/>',
        '    <circle cx="52" cy="76" r="23" fill="var(--snow)"/>',
        '    <ellipse cx="52" cy="86" rx="19" ry="11" fill="var(--snow-2)" opacity=".45"/>',
        '    <circle cx="52" cy="100" r="2.7" fill="var(--coal)"/>',
        '    <circle cx="52" cy="112" r="2.7" fill="var(--coal)"/>',
        '    <circle cx="52" cy="124" r="2.7" fill="var(--coal)"/>',
        '    <circle cx="52" cy="42" r="18" fill="var(--snow)"/>',
        /* atkı */
        '    <path d="M34 56 Q52 66 70 56 L70 63 Q52 73 34 63 Z" fill="var(--scarf)"/>',
        '    <path d="M64 62 L72 86 L64 88 L58 64 Z" fill="var(--scarf)"/>',
        '    <path d="M64 86 L72 86 L72 92 L64 92 Z" fill="var(--scarf-dark)"/>',
        /* gözler ve kapaklar */
        '    <circle cx="45" cy="38" r="2.5" fill="var(--coal)"/>',
        '    <circle cx="59" cy="38" r="2.5" fill="var(--coal)"/>',
        '    <rect class="eyelid" x="42" y="34" width="6" height="6" rx="2" fill="var(--snow)"/>',
        '    <rect class="eyelid right" x="56" y="34" width="6" height="6" rx="2" fill="var(--snow)"/>',
        '    <path d="M52 43 L68 47 L52 49 Z" fill="var(--carrot)"/>',
        '    <g fill="var(--coal)">',
        '      <circle cx="44" cy="50" r="1.4"/><circle cx="48" cy="52" r="1.4"/>',
        '      <circle cx="52" cy="53" r="1.4"/><circle cx="56" cy="52" r="1.4"/>',
        '      <circle cx="60" cy="50" r="1.4"/>',
        '    </g>',
        /* şapka */
        '    <path d="M33 26 Q52 20 71 26 L69 30.5 Q52 25 35 30.5 Z" fill="#1d2029"/>',
        '    <path d="M39 26 L39 9 Q52 5 65 9 L65 26 Z" fill="#272b36"/>',
        '    <rect x="38" y="17" width="28" height="6" fill="#5ee3c9"/>',
        '  </svg>',
        '</button>'
    ].join('');

    /* ------------------------------------------------- Katmanı oluştur */

    var layer = document.createElement('div');
    layer.className = 'winter-layer';
    layer.innerHTML =
        '<div class="winter-scene">' + TREE_SVG + SNOWMAN_SVG + '</div>' +
        '<canvas class="winter-canvas" aria-hidden="true"></canvas>' +
        '<div class="winter-bubble" id="winter-bubble" role="status" aria-live="polite"></div>';
    document.body.appendChild(layer);

    var canvas = layer.querySelector('.winter-canvas');
    var ctx = canvas.getContext('2d');
    var scene = layer.querySelector('.winter-scene');
    var tree = layer.querySelector('.winter-tree');
    var snowman = layer.querySelector('.winter-snowman');
    var bubble = layer.querySelector('.winter-bubble');

    /* ---------------------------------------------- Gezinmedeki düğme */

    var toggle = null;
    var tools = document.querySelector('.nav__tools');

    if (tools) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'icon-btn winter-toggle';
        toggle.innerHTML =
            '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M12 2v20M12 2v20M3.6 7.2l16.8 9.6M20.4 7.2 3.6 16.8" />' +
            '<path d="M12 6.4 9.4 4.2M12 6.4l2.6-2.2M12 17.6l-2.6 2.2M12 17.6l2.6 2.2" />' +
            '<path d="m6.9 9.1-3.4-.5M6.9 9.1 5.6 5.9M17.1 14.9l3.4.5M17.1 14.9l1.3 3.2" />' +
            '<path d="m6.9 14.9-1.3 3.2M6.9 14.9l-3.4.5M17.1 9.1l1.3-3.2M17.1 9.1l3.4-.5" />' +
            '</svg>';
        var themeBtn = tools.querySelector('[data-theme-toggle]');
        tools.insertBefore(toggle, themeBtn || null);
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

    /* ------------------------------------------------------ Kar motoru */

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var BUCKET = 7;        // biriken kar sütun genişliği (px)
    var MAX_PILE = 42;     // yığının tavan yüksekliği (px)
    var TABAN = 7;         // sayfa açıldığında yerde duran kar
    var BUYUME = 0.016;    // kare başına yığın artışı (px) — gözle görülür ama yavaş

    var W = 0, H = 0;
    var renk = { flake: 'rgba(255,255,255,.95)', pileTop: 'rgba(255,255,255,.97)', pileBottom: 'rgba(214,225,243,.92)' };

    function renkleriOku() {
        var cs = getComputedStyle(root);
        var f = cs.getPropertyValue('--flake').trim();
        var pt = cs.getPropertyValue('--pile-top').trim();
        var pb = cs.getPropertyValue('--pile-bottom').trim();
        if (f) renk.flake = f;
        if (pt) renk.pileTop = pt;
        if (pb) renk.pileBottom = pb;
    }
    var flakes = [];
    var ground = [];
    var gurultu = [];
    var mouse = { x: -999, y: -999, active: false };
    var raf = null;
    var running = false;

    function olcekle() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.floor(W * DPR);
        canvas.height = Math.floor(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        var adet = Math.round(W / BUCKET) + 1;
        var eski = ground, eskiGurultu = gurultu;
        ground = new Array(adet);
        gurultu = new Array(adet);
        for (var i = 0; i < adet; i++) {
            ground[i] = eski.length
                ? (eski[Math.min(i, eski.length - 1)] || 0)
                : TABAN + Math.random() * 4;
            gurultu[i] = eskiGurultu.length
                ? (eskiGurultu[Math.min(i, eskiGurultu.length - 1)] || 1)
                : 0.55 + Math.random() * 0.9;   /* sütunlar farklı hızda birikir */
        }

        var hedef = Math.round(Math.min(140, Math.max(40, (W * H) / 17000)));
        while (flakes.length < hedef) flakes.push(yeniTane(true));
        if (flakes.length > hedef) flakes.length = hedef;
    }

    function yeniTane(rastgeleY) {
        return {
            x: Math.random() * W,
            y: rastgeleY ? Math.random() * H : -8,
            r: 1 + Math.random() * 2.2,
            hiz: 0.32 + Math.random() * 1,
            vx: 0,
            faz: Math.random() * Math.PI * 2,
            salinim: 0.22 + Math.random() * 0.5,
            saydam: 0.5 + Math.random() * 0.5
        };
    }

    function bucketIndex(x) {
        return Math.max(0, Math.min(ground.length - 1, Math.round(x / BUCKET)));
    }

    /* Komşu sütunları yumuşat — dik kar kuleleri oluşmasın */
    function duzlestir() {
        for (var i = 1; i < ground.length - 1; i++) {
            var bu = ground[i];
            if (bu - ground[i - 1] > 3) { ground[i] -= 1.1; ground[i - 1] += 1.1; }
            else if (bu - ground[i + 1] > 3) { ground[i] -= 1.1; ground[i + 1] += 1.1; }
        }
    }

    function adim() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = renk.flake;

        /* Yağış sürdükçe zemin yavaşça yükselir; konan taneler yerel tümsek yapar */
        for (var g = 0; g < ground.length; g++) {
            if (ground[g] < MAX_PILE) ground[g] += BUYUME * gurultu[g];
        }

        for (var i = 0; i < flakes.length; i++) {
            var f = flakes[i];

            f.faz += 0.012;
            f.x += Math.sin(f.faz) * f.salinim + f.vx;
            f.y += f.hiz;
            f.vx *= 0.94;

            /* Fare yakınsa taneyi it */
            if (mouse.active) {
                var dx = f.x - mouse.x, dy = f.y - mouse.y;
                var d2 = dx * dx + dy * dy;
                if (d2 < 13000 && d2 > 0.01) {
                    var d = Math.sqrt(d2);
                    var guc = (1 - d / 114) * 1.9;
                    f.vx += (dx / d) * guc;
                    f.y += (dy / d) * guc * 0.5;
                }
            }

            if (f.x < -10) f.x = W + 10;
            else if (f.x > W + 10) f.x = -10;

            /* Yığına konma */
            var bi = bucketIndex(f.x);
            if (f.y + f.r >= H - ground[bi]) {
                if (ground[bi] < MAX_PILE) ground[bi] += f.r * 0.9;
                flakes[i] = yeniTane(false);
                continue;
            }

            if (f.y > H + 10) { flakes[i] = yeniTane(false); continue; }

            ctx.globalAlpha = f.saydam;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        duzlestir();
        yiginCiz();

        raf = window.requestAnimationFrame(adim);
    }

    function yiginCiz() {
        if (!ground.length) return;

        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, H - ground[0]);

        for (var i = 1; i < ground.length; i++) {
            var oncekiX = (i - 1) * BUCKET;
            var ortaX = oncekiX + BUCKET / 2;
            ctx.quadraticCurveTo(oncekiX, H - ground[i - 1], ortaX, H - (ground[i - 1] + ground[i]) / 2);
        }

        ctx.lineTo(W, H - ground[ground.length - 1]);
        ctx.lineTo(W, H);
        ctx.closePath();

        var gr = ctx.createLinearGradient(0, H - MAX_PILE, 0, H);
        gr.addColorStop(0, renk.pileTop);
        gr.addColorStop(1, renk.pileBottom);
        ctx.fillStyle = gr;
        ctx.fill();
    }

    /* ----------------------------------------- Fare / dokunma etkileşimi */

    function konum(x, y) {
        mouse.x = x;
        mouse.y = y;
        mouse.active = true;

        /* Yığının yakınındaysak karı küreyelim */
        if (H - y < MAX_PILE + 26) {
            var merkez = bucketIndex(x);
            var yaricap = 7;
            for (var i = merkez - yaricap; i <= merkez + yaricap; i++) {
                if (i < 0 || i >= ground.length) continue;
                var uzaklik = Math.abs(i - merkez) / yaricap;
                var azalt = (1 - uzaklik * uzaklik) * 2.6;
                if (H - ground[i] > y - 18) ground[i] = Math.max(0, ground[i] - azalt);
            }
        }
    }

    function onMove(e) { konum(e.clientX, e.clientY); }
    function onLeave() { mouse.active = false; mouse.x = mouse.y = -999; }
    function onTouch(e) {
        if (e.touches && e.touches.length) konum(e.touches[0].clientX, e.touches[0].clientY);
    }

    /* --------------------------------------------- Kardan adam asistanı */

    var BOLUM = {
        hero: [
            ['Kar başladı. Üstteki kar tanesi düğmesinden kapatabilirsin.', 'Snow is on. You can switch it off with the snowflake button above.'],
            ['Fareyi aşağıdaki karın üstünde gezdir — biriken karı küreyebilirsin.', 'Drag your cursor over the snow below — you can sweep the drift away.'],
            ['Merhaba. Ben buranın tek kar sorumlusuyum.', 'Hello. I am the only one here in charge of snow.']
        ],
        about: [
            ['İrem burada ne yaptığını anlatıyor. Ben sadece kardan sorumluyum.', 'İrem explains what she does here. I am only responsible for the snow.'],
            ['Yıllardır süren bir mühendislik geçmişi. Benimki üç gün önce başladı.', 'Years of engineering behind this. Mine started three days ago.']
        ],
        approach: [
            ['Ölçülebilir olmayan şey iyileştirilemez. Ben de her gün biraz eriyorum, ölçtüm.', 'What cannot be measured cannot be improved. I melt a little daily — I measured it.'],
            ['Kanıta dayalı iş. Benim tek kanıtım bu havuç.', 'Evidence-based work. My only evidence is this carrot.']
        ],
        work: [
            ['Üretimde çalışan sistemler. Benim tek üretimim bir kardan adam.', 'Systems running in production. My only production is one snowman.'],
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
            ['Kaynakça uzun. Kışın günler kısa.', 'The bibliography is long. Winter days are short.']
        ],
        contact: [
            ['Yazmak için iyi bir gün. Kar da yağıyor.', 'A good day to write. It is snowing, too.'],
            ['E-postayı tıkla. Ben burada bekler, erimeye devam ederim.', 'Click the email. I will wait here and keep melting.']
        ]
    };

    var GENEL = [
        ['Ağaca tıkla, üstündeki karı silkeler.', 'Click the tree — it shakes the snow off.'],
        ['Kar birikiyor. Fareyle dağıt, yeniden birikir.', 'The snow piles up. Sweep it with your cursor; it comes back.'],
        ['İyi seneler. Şimdiden.', 'Happy new year. Early, I know.']
    ];

    var sonSoz = null;
    var balonZaman = null;

    function aktifBolum() {
        var bolumler = document.querySelectorAll('section[id], header[id], div[id]');
        var orta = window.innerHeight / 2;
        var en = null, enMesafe = Infinity;

        for (var i = 0; i < bolumler.length; i++) {
            if (!BOLUM[bolumler[i].id]) continue;
            var r = bolumler[i].getBoundingClientRect();
            if (r.bottom < 0 || r.top > window.innerHeight) continue;
            var mesafe = Math.abs(r.top + r.height / 2 - orta);
            if (mesafe < enMesafe) { enMesafe = mesafe; en = bolumler[i].id; }
        }
        return en;
    }

    function sozSec() {
        var havuz = BOLUM[aktifBolum()] || GENEL;
        var aday = havuz[0];
        if (havuz.length > 1) {
            var tur = 0;
            do { aday = havuz[Math.floor(Math.random() * havuz.length)]; }
            while (aday === sonSoz && ++tur < 6);
        }
        sonSoz = aday;
        return SITE.t(aday[0], aday[1]);
    }

    function konus() {
        var chatVar = !!(window.ChatUI && window.ChatUI.ask);

        bubble.innerHTML = '';
        var p = document.createElement('p');
        p.style.margin = '0';
        p.textContent = sozSec();
        bubble.appendChild(p);

        if (chatVar) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'winter-bubble__ask';
            btn.innerHTML = '<span class="orb-mini" aria-hidden="true"></span>';
            btn.appendChild(document.createTextNode(
                SITE.t('İrem\'in asistanına sor', 'Ask İrem\'s assistant')));
            btn.addEventListener('click', function () {
                bubble.classList.remove('is-open');
                window.ChatUI.ask(SITE.t(
                    'İrem ne iş yapıyor, kısaca anlatır mısın?',
                    'What does İrem do? Give me the short version.'));
            });
            bubble.appendChild(btn);
        }

        bubble.classList.add('is-open');
        window.clearTimeout(balonZaman);
        balonZaman = window.setTimeout(function () {
            bubble.classList.remove('is-open');
        }, chatVar ? 8000 : 5200);
    }

    snowman.addEventListener('click', function () {
        snowman.classList.remove('is-waving');
        void snowman.offsetWidth;      // animasyonu yeniden tetikle
        snowman.classList.add('is-waving');
        konus();
    });

    snowman.addEventListener('mouseenter', function () {
        if (!bubble.classList.contains('is-open')) konus();
    });

    /* Ağaca tıklayınca silkelensin ve üstünden kar dökülsün */
    tree.addEventListener('click', function () {
        tree.classList.remove('is-shaking');
        void tree.offsetWidth;
        tree.classList.add('is-shaking');

        if (!running) return;
        var kutu = tree.getBoundingClientRect();
        for (var i = 0; i < 26; i++) {
            flakes.push({
                x: kutu.left + Math.random() * kutu.width,
                y: kutu.top + Math.random() * kutu.height * 0.7,
                r: 1.2 + Math.random() * 2.2,
                hiz: 1.1 + Math.random() * 1.5,
                vx: (Math.random() - 0.5) * 1.4,
                faz: Math.random() * Math.PI * 2,
                salinim: 0.3,
                saydam: 0.92
            });
        }
    });

    /* ------------------------------------------------------ Başlat / dur */

    function start() {
        if (running || reduced || !enabled) return;
        running = true;
        renkleriOku();
        olcekle();
        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('mouseout', onLeave, { passive: true });
        window.addEventListener('touchmove', onTouch, { passive: true });
        window.addEventListener('touchend', onLeave, { passive: true });
        adim();   /* ilk kareyi hemen çiz: sekme arka plandayken bile sahne boş kalmasın */
    }

    function stop() {
        running = false;
        if (raf) window.cancelAnimationFrame(raf);
        raf = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseout', onLeave);
        window.removeEventListener('touchmove', onTouch);
        window.removeEventListener('touchend', onLeave);
        if (W && H) ctx.clearRect(0, 0, W, H);
    }

    /* Giriş bölümü ekrandayken süsleri gizle: hero'nun düğmeleri açıkta kalsın.
       Hero'su olmayan sayfalarda (blog, vaka) süsler her zaman görünür. */
    var hero = document.querySelector('[data-hero]');
    if (hero) {
        var sahneTik = false;
        var sahneGuncelle = function () {
            sahneTik = false;
            var r = hero.getBoundingClientRect();
            scene.classList.toggle('is-tucked', r.bottom > window.innerHeight - 56);
        };
        var sahneIste = function () {
            if (sahneTik) return;
            sahneTik = true;
            window.requestAnimationFrame(sahneGuncelle);
        };
        sahneGuncelle();
        window.addEventListener('scroll', sahneIste, { passive: true });
        window.addEventListener('resize', sahneIste);
    }

    var boyutZaman = null;
    window.addEventListener('resize', function () {
        window.clearTimeout(boyutZaman);
        boyutZaman = window.setTimeout(function () { if (running) olcekle(); }, 180);
    });

    /* Sekme arkadayken boşuna çizme */
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stop(); } else { start(); }
    });

    /* Tema değişince tuvalin renkleri de değişsin */
    new MutationObserver(renkleriOku).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    /* Dil değişince kardan adamın etiketleri de değişsin */
    window.addEventListener('lang:change', function () {
        etiketle();
        var sr = snowman.querySelector('.sr-only');
        if (sr) sr.textContent = SITE.t('Kardan adamla konuş', 'Talk to the snowman');
        if (bubble.classList.contains('is-open')) konus();
    });

    /* Hareket azaltma tercihi değişirse uy */
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onMq = function (e) {
        reduced = e.matches;
        if (reduced) { stop(); } else { start(); }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onMq); }
    else if (mq.addListener) { mq.addListener(onMq); }

    setEnabled(enabled, false);
})();
