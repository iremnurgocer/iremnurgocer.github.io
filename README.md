# iremnurgocer.github.io

İrem Nur Yılmaz'ın kişisel web sitesi — [iremnurgocer.github.io](https://iremnurgocer.github.io/)

Statik bir site; derleme adımı yok, GitHub Pages doğrudan `main` dalından yayınlar.

## Dosya yapısı

| Dosya | Açıklama |
| --- | --- |
| `index.html` | Ana sayfa: hakkımda, yetkinlikler, deneyim, projeler, akademik, blog, iletişim |
| `styles.css` | Tasarım sistemi: renk değişkenleri, tipografi ve bileşenler (açık/koyu tema) |
| `script.js` | Tema anahtarı, mobil menü, aktif bölüm takibi ve kaydırma animasyonu |
| `blogs/*.html` | Blog yazıları |
| `blogs/blog.css` | Blog sayfalarına özel stiller |
| `covers/*.svg` | Blog yazılarının kapak görselleri (elle çizilmiş SVG şemalar) |

## Yerelde çalıştırma

```bash
python3 -m http.server 4173
```

Ardından http://localhost:4173 adresini aç.

## Düzenleme notları

- Renkler `styles.css` içindeki CSS değişkenlerinden gelir; tek yerden değiştirmek
  hem ana sayfayı hem blogları etkiler.
- Koyu tema `:root[data-theme="dark"]` bloğuyla tanımlıdır; ziyaretçinin tercihi
  `localStorage` içinde saklanır.
- Alt bilgideki yıl `script.js` tarafından otomatik güncellenir.
- Sitede indirilebilir CV yok; iletişim tek kanaldan, e-posta üzerinden ilerliyor.
- Kapak görselleri dış servislerden değil, `covers/` altındaki SVG dosyalarından gelir;
  renkleri koyu zeminli ve her iki temada da aynı görünür.
- Depo adı, alan adı ve sosyal hesaplar `iremnurgocer` olarak kalmaya devam ediyor;
  sayfada görünen ad `İrem Nur Yılmaz`.
