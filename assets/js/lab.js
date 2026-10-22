/* Laboratuvar: tarayıcıda çalışan iki küçük demo.
   1) SQL güvenlik katmanı: model çıktısı olan SQL'i yürütmeden önce denetler,
      satır seviyesi filtre ve satır sınırı ekler.
   2) Kanıt kontrolü: modelin çıkardığı maddeleri kaynak metne karşı doğrular.
   Gerçek sistemlerde AST tabanlı doğrulama ve daha zengin kurallar kullanılır;
   buradaki kurallar aynı fikrin sadeleştirilmiş, şeffaf bir uygulamasıdır. */

(function () {
    'use strict';

    var SITE = window.SITE;
    var lab = document.querySelector('[data-lab]');
    if (!lab || !SITE) return;

    function $(s, c) { return (c || lab).querySelector(s); }
    function $$(s, c) { return Array.prototype.slice.call((c || lab).querySelectorAll(s)); }
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function t(tr, en) { return SITE.lang() === 'en' ? en : tr; }

    /* ---------------- Sekmeler ---------------- */
    $$('[data-lab-tab]').forEach(function (b) {
        b.addEventListener('click', function () {
            var id = b.getAttribute('data-lab-tab');
            $$('[data-lab-tab]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
            $$('[data-lab-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-lab-panel') !== id; });
        });
    });

    /* =====================================================================
       1) SQL güvenlik katmanı
       ===================================================================== */
    var ROLES = {
        finance: {
            tr: 'Finans analisti', en: 'Finance analyst',
            tables: ['invoices', 'payments', 'companies'],
            rls: function (table) { return table + '.company_id IN (:yetkili_sirketler)'; }
        },
        sales: {
            tr: 'Satış temsilcisi', en: 'Sales representative',
            tables: ['orders', 'customers', 'products'],
            rls: function (table) { return table + '.region = :kullanici_bolgesi'; }
        }
    };

    var SAMPLES = [
        { role: 'finance', tr: 'Geçen ay şirket bazında toplam tahsilat', en: 'Total collections per company last month',
          sql: "SELECT c.name, SUM(p.amount) AS total\nFROM payments p\nJOIN companies c ON c.id = p.company_id\nWHERE p.paid_at >= date_trunc('month', now()) - interval '1 month'\n  AND p.paid_at < date_trunc('month', now())\nGROUP BY c.name\nORDER BY total DESC" },
        { role: 'sales', tr: 'Bölge bazında sipariş adedi', en: 'Order count by region',
          sql: 'SELECT region, COUNT(*) AS order_count\nFROM orders\nGROUP BY region' },
        { role: 'finance', tr: 'Tüm çalışanların maaşlarını göster', en: 'Show every employee salary',
          sql: 'SELECT full_name, salary\nFROM salaries\nORDER BY salary DESC' },
        { role: 'sales', tr: 'Eski müşteri kayıtlarını temizle', en: 'Clean up old customer records',
          sql: "DELETE FROM customers\nWHERE last_order_at < '2020-01-01'" },
        { role: 'finance', tr: 'Faturaları listele (araya gizlenmiş komut)', en: 'List invoices (with a smuggled command)',
          sql: 'SELECT * FROM invoices; DROP TABLE invoices' }
    ];

    var roleSel = $('[data-sql-role]');
    var sampleSel = $('[data-sql-sample]');
    var editor = $('[data-sql-editor]');
    var checksEl = $('[data-sql-checks]');
    var outEl = $('[data-sql-out]');
    var verdictEl = $('[data-sql-verdict]');

    function fillSelects() {
        var r = roleSel.value || 'finance', s = sampleSel.value || '0';
        roleSel.innerHTML = Object.keys(ROLES).map(function (k) {
            return '<option value="' + k + '">' + esc(t(ROLES[k].tr, ROLES[k].en)) + '</option>';
        }).join('');
        sampleSel.innerHTML = SAMPLES.map(function (x, i) {
            return '<option value="' + i + '">' + esc(t(x.tr, x.en)) + '</option>';
        }).join('');
        roleSel.value = r;
        sampleSel.value = s;
    }

    /* Yorumları ve metin değişmezlerini temizle; kalan metin analiz edilir. */
    function strip(sql) {
        return sql
            .replace(/--[^\n]*/g, ' ')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/'(?:[^']|'')*'/g, "''");
    }

    function analyze(sql, roleKey) {
        var role = ROLES[roleKey];
        var clean = strip(sql).trim().replace(/;\s*$/, '');
        var lower = clean.toLowerCase();
        var checks = [];

        var statements = clean.split(';').filter(function (x) { return x.trim(); });
        var single = statements.length === 1;
        checks.push({ ok: single, tr: 'Tek ifade', en: 'Single statement',
            why: single ? '' : t('Birden fazla ifade var; araya gizlenmiş komutlar engellenir.', 'More than one statement; smuggled commands are blocked.') });

        var isSelect = /^\s*(select|with)\b/i.test(clean);
        checks.push({ ok: isSelect, tr: 'Yalnızca okuma (SELECT)', en: 'Read-only (SELECT)',
            why: isSelect ? '' : t('Sorgu veri değiştirmeye çalışıyor.', 'The query tries to modify data.') });

        var banned = (lower.match(/\b(insert|update|delete|drop|alter|truncate|grant|revoke|create|merge|exec|execute|call|copy|into)\b/g) || []);
        var noBanned = banned.length === 0;
        checks.push({ ok: noBanned, tr: 'Yasaklı anahtar kelime yok', en: 'No forbidden keywords',
            why: noBanned ? '' : t('Bulunan: ', 'Found: ') + banned.map(function (b) { return b.toUpperCase(); }).join(', ') });

        var tables = [];
        var re = /\b(?:from|join)\s+([a-z_][a-z0-9_.]*)/gi, m;
        while ((m = re.exec(clean))) {
            var name = m[1].toLowerCase().split('.').pop();
            if (tables.indexOf(name) === -1) tables.push(name);
        }
        var denied = tables.filter(function (x) { return role.tables.indexOf(x) === -1; });
        var authorised = tables.length > 0 && denied.length === 0;
        checks.push({ ok: authorised, tr: 'Yalnızca yetkili tablolar', en: 'Authorised tables only',
            why: authorised ? '' : (denied.length
                ? t('Bu rol için yetkisiz: ', 'Not authorised for this role: ') + denied.join(', ')
                : t('Tablo bulunamadı.', 'No table found.')) });

        var passed = checks.every(function (c) { return c.ok; });
        return { checks: checks, passed: passed, tables: tables, clean: clean };
    }

    /* Satır seviyesi filtreyi WHERE'e ekle, yoksa uygun yere yeni WHERE koy;
       LIMIT yoksa ekle. Alias varsa onu kullan. */
    function rewrite(sql, roleKey, tables) {
        var role = ROLES[roleKey];
        var body = sql.trim().replace(/;\s*$/, '');
        var preds = tables.map(function (tb) {
            var aliasRe = new RegExp('\\b(?:from|join)\\s+' + tb + '(?:\\s+(?:as\\s+)?([a-z_][a-z0-9_]*))?', 'i');
            var am = aliasRe.exec(body);
            var alias = am && am[1] && !/^(where|join|on|group|order|limit|inner|left|right|full|cross)$/i.test(am[1]) ? am[1] : tb;
            return role.rls(alias);
        });
        var rls = preds.join(' AND ');
        var out;
        var whereIdx = body.search(/\bwhere\b/i);
        if (whereIdx > -1) {
            var after = body.slice(whereIdx + 5);
            var tail = after.search(/\b(group\s+by|order\s+by|limit|having)\b/i);
            var cond = tail > -1 ? after.slice(0, tail) : after;
            var rest = tail > -1 ? after.slice(tail) : '';
            out = body.slice(0, whereIdx) + 'WHERE (' + rls + ')\n  AND (' + cond.trim() + ')' + (rest ? '\n' + rest : '');
        } else {
            var cut = body.search(/\b(group\s+by|order\s+by|limit|having)\b/i);
            out = cut > -1
                ? body.slice(0, cut).replace(/\s+$/, '') + '\nWHERE ' + rls + '\n' + body.slice(cut)
                : body + '\nWHERE ' + rls;
        }
        var limited = /\blimit\s+\d+/i.test(out);
        if (!limited) out += '\nLIMIT 1000';
        return { sql: out, rls: rls, limitAdded: !limited };
    }

    function highlight(sql, marks) {
        var html = esc(sql);
        marks.forEach(function (mk) { html = html.split(esc(mk)).join('<mark>' + esc(mk) + '</mark>'); });
        return html.replace(/\b(SELECT|FROM|WHERE|AND|OR|JOIN|ON|GROUP BY|ORDER BY|LIMIT|AS|SUM|COUNT|DESC|ASC|IN|WITH)\b/g, '<b>$1</b>');
    }

    function runSql() {
        var roleKey = roleSel.value;
        var res = analyze(editor.value, roleKey);
        checksEl.innerHTML = res.checks.map(function (c) {
            return '<li class="' + (c.ok ? 'ok' : 'bad') + '"><span class="dot" aria-hidden="true">' + (c.ok ? '✓' : '✕') + '</span><span><strong>' +
                esc(t(c.tr, c.en)) + '</strong>' + (c.why ? '<small>' + esc(c.why) + '</small>' : '') + '</span></li>';
        }).join('');

        if (res.passed) {
            var rw = rewrite(editor.value.replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''), roleKey, res.tables);
            checksEl.innerHTML +=
                '<li class="ok"><span class="dot" aria-hidden="true">+</span><span><strong>' + esc(t('Satır seviyesi filtre eklendi', 'Row-level filter injected')) + '</strong><small>' + esc(rw.rls) + '</small></span></li>' +
                (rw.limitAdded ? '<li class="ok"><span class="dot" aria-hidden="true">+</span><span><strong>' + esc(t('Satır sınırı eklendi', 'Row limit added')) + '</strong><small>LIMIT 1000</small></span></li>' : '');
            outEl.innerHTML = highlight(rw.sql, [rw.rls, 'LIMIT 1000']);
            verdictEl.className = 'lab__verdict ok';
            verdictEl.textContent = t('Onaylandı: salt-okunur bağlantıyla, EXPLAIN kontrolünden sonra çalıştırılır.', 'Approved: runs on a read-only connection after an EXPLAIN check.');
        } else {
            outEl.innerHTML = '<span class="muted">' + esc(t('Sorgu çalıştırılmaz. Ret nedeni modele geri gönderilir ve onarım döngüsü yeni bir sorgu dener.', 'The query is not executed. The rejection reason goes back to the model and a repair loop tries again.')) + '</span>';
            verdictEl.className = 'lab__verdict bad';
            verdictEl.textContent = t('Reddedildi', 'Rejected');
        }
    }

    function loadSample() {
        var s = SAMPLES[+sampleSel.value];
        roleSel.value = s.role;
        editor.value = s.sql;
        runSql();
    }

    if (roleSel && editor) {
        fillSelects();
        roleSel.addEventListener('change', runSql);
        sampleSel.addEventListener('change', loadSample);
        var deb;
        editor.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(runSql, 120); });
        loadSample();
    }

    /* =====================================================================
       2) Kanıt kontrolü
       ===================================================================== */
    var DOC = {
        tr: [
            { id: 'c1', text: 'Madde 4.1: İstekli, son on yıl içinde tamamlanmış ve tek sözleşme bedeli en az 25 milyon avro olan en az iki benzer altyapı işi sunmalıdır.' },
            { id: 'c2', text: 'Madde 4.2: İsteklinin son üç yıla ait ortalama yıllık cirosu 60 milyon avrodan az olmamalıdır.' },
            { id: 'c3', text: 'Madde 4.3: Ortak girişimlerde pilot ortağın payı yüzde elliden az olamaz.' },
            { id: 'c4', text: 'Madde 5.2: Teknik teklif 100 puan üzerinden değerlendirilir; metodoloji 40 puan, ekip 35 puan, iş programı 25 puan ağırlığa sahiptir.' },
            { id: 'c5', text: 'Madde 6.1: Teklifler 14 Mart 2027 saat 12:00\'ye kadar elektronik ortamda sunulmalıdır.' }
        ],
        en: [
            { id: 'c1', text: 'Clause 4.1: The bidder shall submit at least two similar infrastructure works completed within the last ten years, each with a single contract value of at least EUR 25 million.' },
            { id: 'c2', text: 'Clause 4.2: The bidder\'s average annual turnover over the last three years shall not be less than EUR 60 million.' },
            { id: 'c3', text: 'Clause 4.3: In joint ventures, the lead partner\'s share may not be less than fifty percent.' },
            { id: 'c4', text: 'Clause 5.2: The technical proposal is scored out of 100 points; methodology weighs 40 points, team 35 points and work plan 25 points.' },
            { id: 'c5', text: 'Clause 6.1: Bids shall be submitted electronically by 14 March 2027 at 12:00.' }
        ]
    };

    var ITEMS = {
        tr: [
            { kind: 'Geçti/kaldı', claim: 'En az iki benzer altyapı işi (her biri ≥ 25 M avro)', cite: 'c1', quote: 'en az iki benzer altyapı işi' },
            { kind: 'Geçti/kaldı', claim: 'Ortalama yıllık ciro ≥ 60 M avro', cite: 'c2', quote: '60 milyon avrodan az olmamalıdır' },
            { kind: 'Geçti/kaldı', claim: 'Pilot ortak payı ≥ %50', cite: 'c3', quote: 'pilot ortağın payı yüzde elliden az olamaz' },
            { kind: 'Geçti/kaldı', claim: 'ISO 9001 kalite belgesi zorunlu', cite: 'c7', quote: 'ISO 9001 belgesi sunulmalıdır' },
            { kind: 'Puanlama', claim: 'Metodoloji 40 puan', cite: 'c4', quote: 'metodoloji 40 puan' },
            { kind: 'Takvim', claim: 'Son teslim: 14 Mart 2027, 17:00', cite: 'c5', quote: '14 Mart 2027 saat 17:00' }
        ],
        en: [
            { kind: 'Pass/fail', claim: 'At least two similar infrastructure works (each ≥ EUR 25M)', cite: 'c1', quote: 'at least two similar infrastructure works' },
            { kind: 'Pass/fail', claim: 'Average annual turnover ≥ EUR 60M', cite: 'c2', quote: 'shall not be less than EUR 60 million' },
            { kind: 'Pass/fail', claim: 'Lead partner share ≥ 50%', cite: 'c3', quote: 'lead partner\'s share may not be less than fifty percent' },
            { kind: 'Pass/fail', claim: 'ISO 9001 quality certificate required', cite: 'c7', quote: 'shall submit an ISO 9001 certificate' },
            { kind: 'Scoring', claim: 'Methodology: 40 points', cite: 'c4', quote: 'methodology weighs 40 points' },
            { kind: 'Deadline', claim: 'Deadline: 14 March 2027, 17:00', cite: 'c5', quote: '14 March 2027 at 17:00' }
        ]
    };

    var docEl = $('[data-cite-doc]');
    var itemsEl = $('[data-cite-items]');
    var runBtn = $('[data-cite-run]');
    var resetBtn = $('[data-cite-reset]');
    var sumEl = $('[data-cite-summary]');
    var edited = {};

    function norm(s) {
        return String(s).toLocaleLowerCase(SITE.lang() === 'en' ? 'en' : 'tr').replace(/\s+/g, ' ').replace(/[’']/g, "'").trim();
    }

    function renderDoc(highlightId, quote) {
        var lang = SITE.lang();
        docEl.innerHTML = DOC[lang].map(function (c) {
            var text = esc(c.text);
            if (c.id === highlightId && quote) {
                var i = norm(c.text).indexOf(norm(quote));
                if (i > -1) text = esc(c.text.slice(0, i)) + '<mark>' + esc(c.text.slice(i, i + quote.length)) + '</mark>' + esc(c.text.slice(i + quote.length));
            }
            return '<p class="chunk' + (c.id === highlightId ? ' is-hot' : '') + '" data-chunk="' + c.id + '"><span class="chunk__id">' + c.id + '</span>' + text + '</p>';
        }).join('');
    }

    function renderItems() {
        var lang = SITE.lang();
        itemsEl.innerHTML = ITEMS[lang].map(function (it, i) {
            var q = edited[lang + i] != null ? edited[lang + i] : it.quote;
            return '<li class="cite" data-i="' + i + '">' +
                '<div class="cite__top"><span class="cite__kind">' + esc(it.kind) + '</span><span class="cite__ref">[' + it.cite + ']</span><span class="cite__state" data-state></span></div>' +
                '<p class="cite__claim">' + esc(it.claim) + '</p>' +
                '<label class="cite__quote"><span class="sr-only">' + esc(t('Alıntı', 'Quote')) + '</span>' +
                '<input type="text" value="' + esc(q) + '" data-quote spellcheck="false"></label>' +
                '<small class="cite__why" data-why></small></li>';
        }).join('');
        sumEl.textContent = '';
    }

    function verify(animate) {
        var lang = SITE.lang();
        var ids = DOC[lang].map(function (c) { return c.id; });
        var counts = { ok: 0, drop: 0, review: 0 };
        var lis = $$('.cite', itemsEl);
        lis.forEach(function (li, i) {
            li.className = 'cite';
            var it = ITEMS[lang][i];
            var q = $('[data-quote]', li).value;
            var state, why;
            if (ids.indexOf(it.cite) === -1) {
                state = 'drop'; why = t('Kaynak parça yok: [' + it.cite + '] belgede bulunmuyor. Madde uydurma kabul edilip elenir.', 'Source chunk missing: [' + it.cite + '] is not in the document. The item is treated as invented and dropped.');
            } else {
                var chunk = DOC[lang].filter(function (c) { return c.id === it.cite; })[0];
                if (q.trim() && norm(chunk.text).indexOf(norm(q)) > -1) {
                    state = 'ok'; why = t('Alıntı kaynakta birebir bulundu.', 'Quote found verbatim in the source.');
                } else {
                    state = 'review'; why = t('Alıntı kaynakta birebir yok. Madde insan incelemesine düşer.', 'Quote not found verbatim in the source. The item goes to human review.');
                }
            }
            counts[state]++;
            var apply = function () {
                li.classList.add('is-' + state);
                $('[data-state]', li).textContent = { ok: t('Kabul', 'Accepted'), drop: t('Elendi', 'Dropped'), review: t('İnceleme', 'Review') }[state];
                $('[data-why]', li).textContent = why;
            };
            if (animate) setTimeout(apply, 220 * i + 150); else apply();
        });
        var total = lis.length;
        var show = function () {
            sumEl.innerHTML = '<strong>' + total + '</strong> ' + t('madde', 'items') + ' → <span class="ok">' + counts.ok + ' ' + t('kabul', 'accepted') + '</span> · <span class="review">' + counts.review + ' ' + t('incelemeye', 'to review') + '</span> · <span class="drop">' + counts.drop + ' ' + t('elendi', 'dropped') + '</span>';
        };
        if (animate) setTimeout(show, 220 * total + 200); else show();
    }

    if (docEl && itemsEl) {
        renderDoc();
        renderItems();
        var verified = false;
        runBtn.addEventListener('click', function () { verified = true; verify(true); });
        resetBtn.addEventListener('click', function () { edited = {}; verified = false; renderItems(); renderDoc(); });
        itemsEl.addEventListener('input', function (e) {
            var inp = e.target.closest('[data-quote]');
            if (!inp) return;
            var i = +inp.closest('.cite').getAttribute('data-i');
            edited[SITE.lang() + i] = inp.value;
            if (verified) verify(false);
            renderDoc(ITEMS[SITE.lang()][i].cite, inp.value);
        });
        itemsEl.addEventListener('focusin', function (e) {
            var li = e.target.closest('.cite');
            if (!li) return;
            var i = +li.getAttribute('data-i');
            renderDoc(ITEMS[SITE.lang()][i].cite, $('[data-quote]', li).value);
        });
        itemsEl.addEventListener('mouseover', function (e) {
            var li = e.target.closest('.cite');
            if (!li || li.contains(document.activeElement)) return;
            var i = +li.getAttribute('data-i');
            renderDoc(ITEMS[SITE.lang()][i].cite, $('[data-quote]', li).value);
        });
    }

    window.addEventListener('lang:change', function () {
        if (roleSel) { fillSelects(); loadSample(); }
        if (docEl) { renderDoc(); renderItems(); }
    });
})();
