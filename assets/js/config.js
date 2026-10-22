/* Site yapılandırması. Derleme adımı yok; değerleri buradan değiştirin.

   email         İletişim adresi (kopyala düğmesi ve yedek mailto bağlantısı).
   formEndpoint  İletişim formunun gönderileceği adres. FormSubmit hesapsız çalışır:
                 ilk gönderimde bu adrese bir onay e-postası gelir, bir kez
                 onaylandıktan sonra mesajlar doğrudan iletilir. Boş bırakılırsa
                 form, ziyaretçinin e-posta uygulamasını açar (mailto).
   chatEndpoint  Yapay zeka destekli sohbet için Cloudflare Worker adresi
                 (bkz. worker/README.md). Boşsa asistan, sitedeki bilgi tabanıyla
                 tarayıcıda çalışan yerel arama moduna geçer. */

window.SITE_CONFIG = {
    email: 'iremnurgocer99@gmail.com',
    formEndpoint: 'https://formsubmit.co/ajax/iremnurgocer99@gmail.com',
    chatEndpoint: ''
};
