/* Giriş bölümündeki 3B "kanıt ağı".
   Dağınık belge sayfaları noktalara ayrılır, kavisli yollarla akarak
   yapılandırılmış bir bilgi ağına dönüşür; ağdaki bazı düğümler erişim
   sinyali gibi yanıp söner. Kütüphanesiz, saf WebGL.
   WebGL yoksa ya da hareket azaltma tercihi açıksa flow.js devreye girer. */

(function () {
    'use strict';

    var root = document.documentElement;
    var canvas = document.querySelector('[data-gl]');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!window.WebGLRenderingContext) return;

    /* flow.js'in başlamaması için işareti hemen koy; ağır kurulum ilk çizimden sonra. */
    root.setAttribute('data-scene', 'gl');

    function fallback() {
        root.removeAttribute('data-scene');
        canvas.hidden = true;
        var s = document.createElement('script');
        s.src = (document.querySelector('script[src*="hero3d.js"]') || {}).src.replace('hero3d.js', 'flow.js');
        document.body.appendChild(s);
    }

    function boot() {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) { fallback(); return; }

    /* ---------------- Küçük matris yardımcıları ---------------- */
    function perspective(fov, aspect, near, far) {
        var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
        return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
    }
    function mul(a, b) {
        var o = new Array(16);
        for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
            o[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
        }
        return o;
    }
    function translate(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
    function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
    function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
    function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
    function apply(m, v) {
        return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]];
    }

    /* ---------------- Geometri ---------------- */
    var small = window.innerWidth < 900;
    var N = small ? 1300 : 2600;
    var rand = (function (seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; })(42);

    /* A: üç belge sayfası; noktalar metin satırları gibi dizilir. */
    var pages = [
        mul(translate(-0.55, 0.18, -0.2), mul(rotY(0.55), rotZ(-0.06))),
        mul(translate(0.0, -0.02, 0.15), mul(rotY(0.42), rotZ(0.03))),
        mul(translate(0.55, -0.22, 0.5), mul(rotY(0.3), rotZ(-0.02)))
    ];
    var slots = [];
    pages.forEach(function (m, pi) {
        var W = 0.95, H = 1.25, rows = 18;
        for (var r = 0; r < rows; r++) {
            var y = H / 2 - 0.12 - r * (H - 0.24) / (rows - 1);
            var len = r === 0 ? 0.55 : (r % 6 === 5 ? 0.35 + rand() * 0.3 : 0.7 + rand() * 0.3);
            var count = Math.round(34 * len);
            for (var c = 0; c < count; c++) {
                var x = -W / 2 + 0.1 + (c / 34) * (W - 0.2);
                slots.push({ p: apply(m, [x, y, 0]), page: pi });
            }
        }
        /* sayfa kenarları */
        for (var e = 0; e < 60; e++) {
            var t = e / 60, side = e % 4;
            var px = side < 2 ? -W / 2 + t * W : (side === 2 ? -W / 2 : W / 2);
            var py = side < 2 ? (side === 0 ? H / 2 : -H / 2) : -H / 2 + t * H;
            slots.push({ p: apply(m, [px, py, 0]), page: pi });
        }
    });

    /* B: kümelere ayrılmış küresel bilgi ağı. */
    var centers = [];
    for (var k = 0; k < 7; k++) {
        var cy = 1 - (k + 0.5) / 7 * 2, cr = Math.sqrt(1 - cy * cy), ca = k * 2.39996;
        centers.push([Math.cos(ca) * cr, cy, Math.sin(ca) * cr]);
    }

    var A = new Float32Array(N * 3), B = new Float32Array(N * 3), R = new Float32Array(N * 3);
    var D = new Float32Array(N), C = new Float32Array(N), Hh = new Float32Array(N);
    var RAD = 1.15;
    for (var i = 0; i < N; i++) {
        var s = slots[i % slots.length];
        var jit = i >= slots.length ? 0.02 : 0.004;
        A[i * 3] = s.p[0] + (rand() - 0.5) * jit;
        A[i * 3 + 1] = s.p[1] + (rand() - 0.5) * jit;
        A[i * 3 + 2] = s.p[2] + (rand() - 0.5) * jit;

        var fy = 1 - (i + 0.5) / N * 2, fr = Math.sqrt(1 - fy * fy), fa = i * 2.39996;
        var v = [Math.cos(fa) * fr, fy, Math.sin(fa) * fr];
        if (rand() < 0.42) {
            var cc = centers[(rand() * centers.length) | 0], pull = 0.55 + rand() * 0.3;
            v = [v[0] + (cc[0] - v[0]) * pull, v[1] + (cc[1] - v[1]) * pull, v[2] + (cc[2] - v[2]) * pull];
            var l = Math.hypot(v[0], v[1], v[2]) || 1;
            v = [v[0] / l, v[1] / l, v[2] / l];
        }
        var rr = RAD * (0.92 + rand() * 0.14);
        B[i * 3] = v[0] * rr; B[i * 3 + 1] = v[1] * rr; B[i * 3 + 2] = v[2] * rr;

        R[i * 3] = rand() * 2 - 1; R[i * 3 + 1] = rand() * 2 - 1; R[i * 3 + 2] = rand() * 2 - 1;
        D[i] = (s.page * 0.33) + rand() * 0.25 + (s.p[1] + 0.8) * 0.12;
        C[i] = (rand() * 4) | 0;
        Hh[i] = rand() < 0.05 ? 1 : 0;
    }

    /* Ağ kenarları: ilk M nokta için B uzayında en yakın iki komşu. */
    var M = Math.min(N, small ? 520 : 900);
    var edges = [];
    for (var a = 0; a < M; a++) {
        var best = [-1, -1], bd = [1e9, 1e9];
        for (var b = 0; b < M; b++) {
            if (a === b) continue;
            var dx = B[a * 3] - B[b * 3], dy = B[a * 3 + 1] - B[b * 3 + 1], dz = B[a * 3 + 2] - B[b * 3 + 2];
            var d = dx * dx + dy * dy + dz * dz;
            if (d < bd[0]) { bd[1] = bd[0]; best[1] = best[0]; bd[0] = d; best[0] = b; }
            else if (d < bd[1]) { bd[1] = d; best[1] = b; }
        }
        if (best[0] > a) edges.push(a, best[0]);
        if (best[1] > a && bd[1] < 0.09) edges.push(a, best[1]);
    }

    /* ---------------- Gölgelendiriciler ---------------- */
    var common =
        'attribute vec3 aA; attribute vec3 aB; attribute vec3 aR; attribute float aD; attribute float aC; attribute float aH;' +
        'uniform mat4 uMVP; uniform float uP; uniform float uTime; uniform vec3 uCols[4];' +
        'varying vec3 vCol; varying float vA;' +
        'vec3 pos(out float e){' +
        '  e = clamp(uP * 1.55 - aD * 0.55, 0.0, 1.0); e = e * e * (3.0 - 2.0 * e);' +
        '  vec3 p = mix(aA, aB, e) + aR * sin(e * 3.14159) * 0.55;' +
        '  p += aR * 0.018 * sin(uTime * 0.7 + aD * 23.0);' +
        '  return p; }' +
        'vec3 col(){ int i = int(aC + 0.5); vec3 c = uCols[0];' +
        '  if (i == 1) c = uCols[1]; else if (i == 2) c = uCols[2]; else if (i == 3) c = uCols[3]; return c; }';

    var vsPoints = common +
        'uniform float uSize;' +
        'void main(){ float e; vec3 p = pos(e); vec4 cp = uMVP * vec4(p, 1.0); gl_Position = cp;' +
        '  float pulse = aH * pow(max(0.0, sin(uTime * 1.1 + aD * 31.0)), 10.0) * e;' +
        '  gl_PointSize = uSize * (1.0 + pulse * 2.2) * 4.2 / cp.w;' +
        '  vCol = mix(col(), vec3(1.0), pulse * 0.5); vA = 0.8 + pulse * 0.2; }';

    var fsPoints =
        'precision mediump float; varying vec3 vCol; varying float vA; uniform float uAlpha;' +
        'void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d);' +
        '  gl_FragColor = vec4(vCol, a * vA * uAlpha); }';

    var vsLines = common +
        'void main(){ float e; vec3 p = pos(e); gl_Position = uMVP * vec4(p, 1.0);' +
        '  vCol = col(); vA = smoothstep(0.82, 1.0, e); }';

    var fsLines =
        'precision mediump float; varying vec3 vCol; varying float vA; uniform float uAlpha; uniform float uLine;' +
        'void main(){ gl_FragColor = vec4(vCol, vA * uLine * uAlpha); }';

    function shader(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    }

    function program(vs, fs) {
        var p = gl.createProgram();
        gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    }

    var progPts, progLines;
    try {
        progPts = program(vsPoints, fsPoints);
        progLines = program(vsLines, fsLines);
    } catch (err) {
        fallback();
        return;
    }

    function buffer(data) {
        var b = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, b);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return b;
    }

    var attrs = { aA: [A, 3], aB: [B, 3], aR: [R, 3], aD: [D, 1], aC: [C, 1], aH: [Hh, 1] };
    var bufs = {};
    Object.keys(attrs).forEach(function (k) { bufs[k] = buffer(attrs[k][0]); });

    var idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(edges), gl.STATIC_DRAW);

    function bind(prog) {
        gl.useProgram(prog);
        Object.keys(attrs).forEach(function (k) {
            var loc = gl.getAttribLocation(prog, k);
            if (loc < 0) return;
            gl.bindBuffer(gl.ARRAY_BUFFER, bufs[k]);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, attrs[k][1], gl.FLOAT, false, 0, 0);
        });
    }

    function uni(prog, name) { return gl.getUniformLocation(prog, name); }

    /* ---------------- Tema renkleri ---------------- */
    var THEMES = {
        dark: { cols: [[0.60, 0.66, 1.0], [0.37, 0.89, 0.79], [1.0, 0.70, 0.49], [0.85, 0.87, 1.0]], alpha: 1.0, line: 0.42, additive: true },
        light: { cols: [[0.26, 0.32, 0.91], [0.04, 0.60, 0.51], [0.83, 0.41, 0.17], [0.30, 0.33, 0.45]], alpha: 0.85, line: 0.32, additive: false }
    };
    function theme() { return root.getAttribute('data-theme') === 'light' ? THEMES.light : THEMES.dark; }

    /* ---------------- Boyut ---------------- */
    var W = 0, H = 0, DPR = 1;
    var quality = { dpr: 1.5, samples: [], level: 0 };
    function resize() {
        var r = canvas.getBoundingClientRect();
        DPR = Math.min(window.devicePixelRatio || 1, quality.dpr);
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        gl.viewport(0, 0, canvas.width, canvas.height);
        small = W < 900;
    }
    resize();
    window.addEventListener('resize', function () { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });

    /* ---------------- Etkileşim ---------------- */
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var hero = canvas.parentElement;
    hero.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.tx = (e.clientX - r.left) / r.width * 2 - 1;
        mouse.ty = (e.clientY - r.top) / r.height * 2 - 1;
    });
    hero.addEventListener('pointerleave', function () { mouse.tx = 0; mouse.ty = 0; });

    /* Hikaye döngüsü: belgeler → ağ (tut) → belgeler (tut) → ... */
    var phase = { p: 0, from: 0, to: 0, t0: 0, dur: 1, hold: 0, started: false };
    function go(to, dur, hold) { phase.from = phase.p; phase.to = to; phase.t0 = performance.now(); phase.dur = dur; phase.hold = hold; }
    function startStory() {
        if (phase.started) return;
        phase.started = true;
        go(1, 3400, 7000);
    }

    function stepStory(now) {
        if (!phase.started) return;
        var k = Math.min(1, (now - phase.t0) / phase.dur);
        phase.p = phase.from + (phase.to - phase.from) * k;
        if (now - phase.t0 > phase.dur + phase.hold) {
            if (phase.to === 1) go(0, 2800, 2200); else go(1, 3400, 7000);
        }
    }

    /* ---------------- Çizim ---------------- */
    var running = false, visible = true, raf = 0, t0 = performance.now();
    var scrollK = 0;

    /* Uyarlanabilir kalite: yavaş cihazda önce çözünürlüğü düşür,
       yine yetişemezse sahneyi kapatıp hafif yedek efekte dön. */
    var lastNow = 0;
    function watch(now) {
        if (lastNow) quality.samples.push(now - lastNow);
        lastNow = now;
        if (quality.samples.length < 40) return true;
        var avg = quality.samples.reduce(function (a, b) { return a + b; }, 0) / quality.samples.length;
        quality.samples = [];
        if (avg < 34) return true;
        if (quality.level === 0) { quality.level = 1; quality.dpr = 1; resize(); return true; }
        bail();
        return false;
    }

    function bail() {
        stop();
        fallback();
    }

    function frame(now) {
        if (!running) return;
        if (!watch(now)) return;
        stepStory(now);
        var time = (now - t0) / 1000;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        scrollK = Math.min(1, Math.max(0, window.scrollY / (H || 1)));

        var th = theme();
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        if (th.additive) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        var aspect = W / H;
        var proj = perspective(0.72, aspect, 0.1, 50);
        var ox = small ? 0 : Math.min(1.75, 0.74 * aspect);
        var oy = small ? 0.55 : 0.05;
        var view = translate(ox, oy + scrollK * 0.6, -4.3 - scrollK * 1.2);
        var model = mul(rotX(-0.12 + mouse.y * 0.22), rotY(time * 0.07 + mouse.x * 0.45 + scrollK * 0.8));
        var mvp = mul(proj, mul(view, model));
        var alpha = (small ? 0.55 : 1) * th.alpha * (1 - scrollK * 0.7);
        var flat = [].concat.apply([], th.cols);

        bind(progLines);
        gl.uniformMatrix4fv(uni(progLines, 'uMVP'), false, mvp);
        gl.uniform1f(uni(progLines, 'uP'), phase.p);
        gl.uniform1f(uni(progLines, 'uTime'), time);
        gl.uniform3fv(uni(progLines, 'uCols'), flat);
        gl.uniform1f(uni(progLines, 'uAlpha'), alpha);
        gl.uniform1f(uni(progLines, 'uLine'), th.line);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
        gl.drawElements(gl.LINES, edges.length, gl.UNSIGNED_SHORT, 0);

        bind(progPts);
        gl.uniformMatrix4fv(uni(progPts, 'uMVP'), false, mvp);
        gl.uniform1f(uni(progPts, 'uP'), phase.p);
        gl.uniform1f(uni(progPts, 'uTime'), time);
        gl.uniform3fv(uni(progPts, 'uCols'), flat);
        gl.uniform1f(uni(progPts, 'uAlpha'), alpha);
        gl.uniform1f(uni(progPts, 'uSize'), (small ? 4.2 : 5.2) * DPR);
        gl.drawArrays(gl.POINTS, 0, N);

        raf = requestAnimationFrame(frame);
    }

    var ready = false;
    function start() { if (!ready || running || !visible || document.hidden) return; running = true; lastNow = 0; quality.samples = []; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); stop(); fallback(); });

    /* Başlık animasyonu akıcı çalışsın diye sahneyi biraz sonra başlat. */
    function arm() { if (ready) return; ready = true; start(); setTimeout(startStory, 1400); }
    window.addEventListener('intro:done', function () { setTimeout(arm, 900); });
    setTimeout(arm, 1500);
    }

    /* Sayfa yüklenip tarayıcı boşa çıkınca kur. */
    function schedule() {
        /* İki kare bekle: ilk çizim kesinlikle ekrana çıksın, sonra boşta kur. */
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                setTimeout(function () {
                    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1500 });
                    else boot();
                }, 300);
            });
        });
    }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
})();
