/* Blog sayfaları: içindekiler kutusu (mobilde kapalı başlar) ve okunan bölümün vurgulanması. */
(function () {
    'use strict';

    var details = document.querySelector('[data-toc]');
    if (!details) return;

    var narrow = window.matchMedia('(max-width: 900px)');
    function sync() {
        if (narrow.matches) details.removeAttribute('open');
        else details.setAttribute('open', '');
    }
    sync();
    if (narrow.addEventListener) narrow.addEventListener('change', sync);

    // Masaüstünde liste hep açık kalır; mobilde bir başlığa gidince kutu kapanır.
    details.querySelector('summary').addEventListener('click', function (ev) {
        if (!narrow.matches) ev.preventDefault();
    });
    details.addEventListener('click', function (ev) {
        if (ev.target.closest('a') && narrow.matches) details.removeAttribute('open');
    });

    // Okunan bölüm: üst kenarı ekranın üst kısmını geçmiş son başlık.
    var links = {};
    Array.prototype.forEach.call(details.querySelectorAll('a[href^="#"]'), function (a) {
        links[a.getAttribute('href').slice(1)] = a;
    });
    var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id]'));
    var current = null, ticking = false;

    function update() {
        ticking = false;
        var active = null;
        for (var k = 0; k < heads.length; k++) {
            var h = heads[k];
            if (!h.offsetParent) continue;
            if (h.getBoundingClientRect().top < 140) active = h; else break;
        }
        var a = active ? links[active.id] : null;
        if (a === current) return;
        if (current) current.classList.remove('is-active');
        if (a) a.classList.add('is-active');
        current = a;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('lang:change', update);
    update();
})();
