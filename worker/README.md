# Site asistanı - Cloudflare Worker

Sitedeki sohbet asistanı iki modda çalışır:

| Mod | Ne zaman | Nasıl |
| --- | --- | --- |
| **Yerel** (varsayılan) | `assets/js/config.js` içinde `chatEndpoint` boşsa | Tarayıcıda `knowledge.json` üzerinde anahtar kelime eşleştirmesi. Sunucu ve maliyet yok. |
| **Yapay zeka** | `chatEndpoint` bu Worker'ın adresine ayarlanınca | Sorular Worker üzerinden dil modeline gider, yanıt akış olarak gelir. Worker'a ulaşılamazsa site otomatik olarak yerel moda döner. |

Her iki mod da **aynı bilgi tabanını** kullanır: `assets/data/knowledge.json`. İçeriği güncellemek için yalnızca o dosyayı düzenleyin; Worker onu sitenizden okur (10 dk önbellek).

## Kurulum (bir kez, ~10 dakika)

1. [Cloudflare](https://dash.cloudflare.com/sign-up) hesabı açın (ücretsiz plan yeterli).
2. [Anthropic Console](https://console.anthropic.com/)'dan bir API anahtarı oluşturun. Harcama limiti koymanızı öneririm (Console → Limits).
3. Bu klasörde:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

4. Komutun verdiği adresi (ör. `https://iremnurgocer-chat.<hesap>.workers.dev`) `assets/js/config.js` içindeki `chatEndpoint` alanına yazın ve siteyi yayınlayın.

## Güvenlik ve maliyet

- API anahtarı yalnızca Worker'da saklanır, tarayıcıya hiç gitmez.
- `ALLOWED_ORIGINS` dışındaki sitelerden gelen istekler reddedilir.
- IP başına dakikada en fazla 12 istek kabul edilir; tek mesaj 600 karakterle, geçmiş son 12 mesajla sınırlıdır.
- Yanıtlar kısa tutulur (`max_tokens: 2048`, `effort: low`), sistem istemi önbelleğe alınır.
- Model yalnızca bilgi tabanındaki bilgiye dayanır. Maaş ve özel hayat gibi konuları yanıtlamaz, ziyaretçiyi mesaj göndermeye yönlendirir.
- Güvenlik sınıflandırıcısı bir isteği reddederse `fallbacks: "default"` ile istek sunucu tarafında uygun bir modelde yeniden denenir.

Daha düşük maliyet isterseniz `src/index.js` içindeki `MODEL` değerini `claude-haiku-5-5` yapabilirsiniz. Bu durumda `fallbacks` ve `betas` satırlarını kaldırın; Haiku için sunucu tarafında yedek model yoktur.

## Yerelde deneme

```bash
cd worker
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
npx wrangler dev
```

Ardından `config.js` içinde `chatEndpoint: 'http://localhost:8787'` yapıp siteyi `python3 -m http.server 4175` ile açın.
