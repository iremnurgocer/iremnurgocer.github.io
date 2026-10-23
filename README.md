# iremnurgocer.github.io

İrem Nur Yılmaz'ın kişisel sitesi: [iremnurgocer.github.io](https://iremnurgocer.github.io/)

Derleme adımı olmayan statik bir site (HTML, CSS ve sade JavaScript). GitHub Pages doğrudan `main` dalından yayınlar.

## Özellikler

- **Türkçe / İngilizce:** Her metin iki dilde yan yana yazılır (`<span lang="tr">` / `<span lang="en">`); etkin olmayan dil CSS ile gizlenir. Tercih `localStorage`'da saklanır, `?lang=en` ile doğrudan bağlantı verilebilir.
- **Koyu / açık tema:** Sistem tercihine uyar, elle değiştirilebilir.
- **Açılış efekti ve 3B "kanıt ağı":** Oturum başına bir kez çalışan açılış animasyonu. Ardından belge sayfaları noktalara ayrılıp akarak bir bilgi ağına dönüşür (saf WebGL, kütüphane yok). Yavaş cihazlarda çözünürlük otomatik düşer, gerekirse hafif 2B ışık akışına geçilir; `prefers-reduced-motion` açıkken animasyon yoktur.
- **Laboratuvar:** Tarayıcıda çalışan iki demo. SQL güvenlik katmanı (salt-okunur, yetkili tablo, satır seviyesi filtre) ve kanıt kontrolü (kaynaksız madde elenir, birebir bulunamayan alıntı incelemeye düşer).
- **Mikro etkileşimler:** Mıknatıslı düğmeler, imleç halkası, isteğe bağlı arayüz sesleri (varsayılan kapalı) ve sayfalar arası geçişler (View Transitions).
- **Kaydırma efektleri:** Kelime kelime açılan başlıklar, dolan yöntem ve zaman çizgileri, sayaçlar, vaka şemalarında akan veri.
- **Vaka çalışmaları:** Her öne çıkan proje için ayrı sayfa (`work/*.html`): problem, yaklaşım, adım adım mimari, kritik kararlar, ödünleşimler, sonuçlar, rol ve teknoloji.
- **Arama (⌘K / Ctrl K / `/`):** Bölümler, projeler, deneyim, yazılar ve okuma listesi içinde arama; tema, dil ve e-posta gibi eylemler; bulunamayan soruyu asistana yönlendirme.
- **Sohbet asistanı:** Deneyim ve projeler hakkında soru-cevap ile "Mesaj gönder" sekmesi. Varsayılan olarak tarayıcıda çalışır; isteğe bağlı olarak bir dil modeline (LLM) bağlanabilir (bkz. [`worker/README.md`](worker/README.md)).
- **İletişim formu:** [FormSubmit](https://formsubmit.co) üzerinden doğrudan e-postaya iletir. İlk gönderimde e-posta adresine bir onay bağlantısı gelir; bir kez onaylamak yeterli.
- **Okuma listesi:** Kategorilere ayrılmış, her biri kısa bir "neden önemli" notu taşıyan makale ve yazılar.
- **SEO:** Open Graph görseli, JSON-LD (`ProfilePage` / `Person`), `hreflang`, `sitemap.xml`, `robots.txt`, özel 404 sayfası.

## Dosya yapısı

| Yol | Açıklama |
| --- | --- |
| `index.html` | Ana sayfa (tüm içerik iki dilde) |
| `assets/css/main.css` | Tasarım sistemi: renk değişkenleri, tipografi, bileşenler, duyarlı düzen |
| `assets/js/config.js` | **Ayarlar:** e-posta, form adresi, sohbet Worker adresi |
| `assets/js/main.js` | Tema, dil, açılış efekti, gezinme, kaydırma efektleri, vaka pencereleri, okuma listesi, formlar |
| `assets/js/hero3d.js` | Hero bölümündeki 3B kanıt ağı (WebGL) |
| `assets/js/flow.js` | WebGL yoksa kullanılan 2B ışık akışı (canvas) |
| `assets/js/lab.js` | Laboratuvar demoları |
| `assets/js/fx.js` | Mıknatıslı düğmeler, imleç halkası, ses |
| `assets/css/case.css` | Vaka sayfası stilleri |
| `tools/cases.py` | **Vaka içerikleri** (iki dilli) |
| `tools/build_cases.py` | `work/*.html` sayfalarını üretir |
| `work/*.html` | Üretilmiş vaka sayfaları (elle düzenlemeyin) |
| `assets/js/palette.js` | ⌘K arama paleti |
| `assets/js/chat.js` | Sohbet asistanı (yerel mod ve Worker modu) |
| `assets/data/knowledge.json` | Asistanın bilgi tabanı (iki dilli). Asistanın bildiklerini buradan düzenleyin. |
| `assets/data/reading.js` | Okuma listesi |
| `assets/img/` | Portre, Open Graph görseli, simgeler |
| `assets/css/blog.css`, `assets/js/blog.js` | Blog sayfası stilleri ve içindekiler |
| `tools/blog_posts.py` | **Blog künyeleri** (başlık, özet, kapak; iki dilli) |
| `tools/blogs/<slug>.tr.html`, `.en.html` | **Blog gövdeleri** (Türkçe ve İngilizce) |
| `tools/build_blogs.py` | `blogs/*.html` sayfalarını üretir |
| `blogs/*.html` | Üretilmiş blog sayfaları (elle düzenlemeyin) |
| `covers/*.svg`, `covers/*.en.svg` | Blog kapak görselleri (Türkçe ve İngilizce) |
| `worker/` | İsteğe bağlı yapay zeka sohbeti için Cloudflare Worker |

## Yerelde çalıştırma

```bash
python3 -m http.server 4175
```

Ardından http://localhost:4175 adresini açın.

## İçerik güncelleme

- **Vaka sayfaları:** `tools/cases.py` dosyasını düzenleyip `python3 tools/build_cases.py` çalıştırın. Yeni bir vaka eklediyseniz `index.html` içindeki `#work` bölümüne kartını, `assets/js/main.js` içindeki `CASE_SLUGS`'a kimliğini, `sitemap.xml`'e adresini ekleyin. Asistanın da bilmesi için `knowledge.json`'a bir kayıt ekleyin.
- **Blog yazıları:** gövdeyi `tools/blogs/<slug>.tr.html` ve `tools/blogs/<slug>.en.html` dosyalarında düzenleyip `python3 tools/build_blogs.py` çalıştırın. Yeni yazı için `tools/blog_posts.py`'a künyesini ekleyin, `#writing` bölümüne kartını koyun, `sitemap.xml`'i ve `knowledge.json`'daki `writing` kaydını güncelleyin.
- **Okuma listesi:** `assets/data/reading.js` dosyasına kayıt ekleyin.
- Gizlilik gereği müşteri, kurum ve iç sistem adları sitede yer almaz.
