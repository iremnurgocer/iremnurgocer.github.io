/* Giriş bölümündeki akan ışık alanı.
   Parçacıklar soldan sağa, yumuşak bir akış alanını izleyerek iz bırakır;
   imleç yakınındaki parçacıklar girdap gibi döner. Ekran dışında ya da
   sekme arka plandayken çizim durur. */

(function () {
    'use strict';

    var canvas = document.querySelector('[data-flow]');
    if (!canvas || !canvas.getContext) return;
    /* 3B sahne çalışıyorsa bu yedek efekte gerek yok. */
    if (document.documentElement.getAttribute('data-scene') === 'gl') { canvas.hidden = true; return; }
    canvas.hidden = false;

    var ctx = canvas.getContext('2d');
    var root = document.documentElement;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, DPR = 1;
    var particles = [];
    var t = 0;
    var running = false;
    var visible = true;
    var raf = 0;
    var mouse = { x: -9999, y: -9999, active: false };
    var burst = 0;

    var PALETTES = {
        dark: { bg: '7,8,11', colors: ['154,168,255', '94,227,201', '255,179,125', '196,204,255'], blend: 'lighter', fade: .085, alpha: .55 },
        light: { bg: '245,244,239', colors: ['67,81,232', '11,154,130', '212,105,44', '120,130,240'], blend: 'source-over', fade: .1, alpha: .32 }
    };

    function theme() {
        return root.getAttribute('data-theme') === 'light' ? PALETTES.light : PALETTES.dark;
    }

    function field(x, y, time) {
        /* Ucuz, yumuşak bir yön alanı: birkaç sinüs dalgasının toplamı. */
        var s = 0.0016;
        var a = Math.sin(x * s + time * .35) * 1.1
              + Math.cos(y * s * 1.7 - time * .25) * .9
              + Math.sin((x + y) * s * .6 + time * .15) * .7;
        return a * .55;
    }

    function spawn(p, initial) {
        p.x = initial ? Math.random() * W : -20 - Math.random() * W * .15;
        p.y = H * (.08 + Math.random() * .84);
        p.v = .7 + Math.random() * 1.4;
        p.life = 0;
        p.max = 220 + Math.random() * 420;
        p.c = (Math.random() * PALETTES.dark.colors.length) | 0;
        p.w = Math.random() < .08 ? 1.6 : .7 + Math.random() * .6;
        p.px = p.x; p.py = p.y;
    }

    function resize() {
        var rect = canvas.getBoundingClientRect();
        DPR = Math.min(window.devicePixelRatio || 1, 1.5);
        W = Math.max(1, rect.width);
        H = Math.max(1, rect.height);
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        var target = Math.round(Math.min(900, Math.max(260, (W * H) / 1500)));
        if (W < 640) target = Math.round(target * .7);
        while (particles.length < target) { var p = {}; spawn(p, true); particles.push(p); }
        particles.length = target;
        paintBg(1);
    }

    function paintBg(a) {
        var th = theme();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(' + th.bg + ',' + a + ')';
        ctx.fillRect(0, 0, W, H);
    }

    function step() {
        var th = theme();
        t += .006;
        paintBg(th.fade);
        ctx.globalCompositeOperation = th.blend;
        ctx.lineCap = 'round';

        var boost = 1 + burst * 2.4;
        burst *= .965;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var ang = field(p.x, p.y, t);
            var vx = Math.cos(ang) * .9 + 1.05;
            var vy = Math.sin(ang) * 1.1;

            if (mouse.active) {
                var dx = p.x - mouse.x, dy = p.y - mouse.y;
                var d2 = dx * dx + dy * dy;
                if (d2 < 32000) {
                    var f = (1 - d2 / 32000) * 2.4;
                    vx += (-dy / 120) * f;
                    vy += (dx / 120) * f;
                }
            }

            p.px = p.x; p.py = p.y;
            p.x += vx * p.v * boost;
            p.y += vy * p.v * boost;
            p.life++;

            var lifeK = Math.min(1, p.life / 40) * Math.min(1, (p.max - p.life) / 60);
            if (lifeK > 0) {
                ctx.strokeStyle = 'rgba(' + th.colors[p.c] + ',' + (th.alpha * lifeK).toFixed(3) + ')';
                ctx.lineWidth = p.w;
                ctx.beginPath();
                ctx.moveTo(p.px, p.py);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }

            if (p.life > p.max || p.x > W + 30 || p.y < -30 || p.y > H + 30) spawn(p, false);
        }
    }

    function loop() {
        if (!running) return;
        step();
        raf = requestAnimationFrame(loop);
    }

    function start() {
        if (running || reduce || !visible || document.hidden) return;
        running = true;
        raf = requestAnimationFrame(loop);
    }

    function stop() {
        running = false;
        cancelAnimationFrame(raf);
    }

    resize();

    if (reduce) {
        /* Hareket istemeyenler için tek bir durağan kare. */
        for (var k = 0; k < 160; k++) step();
    } else {
        start();
    }

    var rt;
    window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(resize, 120);
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            if (visible) start(); else stop();
        }).observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
    });

    var hero = canvas.parentElement;
    hero.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        mouse.active = true;
    });
    hero.addEventListener('pointerleave', function () { mouse.active = false; });

    /* Tema değişince arka planı hemen yeni renge boya. */
    new MutationObserver(function () { paintBg(1); if (reduce) for (var k = 0; k < 160; k++) step(); })
        .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    /* Açılış efekti bitince kısa bir hızlanma. */
    window.addEventListener('intro:done', function () { burst = 1; });
})();
