# Vaka çalışması içerikleri. build_cases.py bu dosyadan work/*.html sayfalarını üretir.
# Gizlilik: müşteri, kurum, kişi ve iç sistem adları yazılmaz.
# Her metin iki dilde: {"tr": ..., "en": ...}. "guard": True olan adım bir kontrol kapısıdır.

def T(tr, en):
    return {"tr": tr, "en": en}


CASES = [
    {
        "slug": "spec-analysis-agent",
        "id": "cs-spec",
        "domain": T("İhale · Doküman zekası", "Bids · Document AI"),
        "title": T("Şartname & ön yeterlilik analiz ajanı", "Prequalification spec analysis agent"),
        "summary": T(
            "Uzun şartnameleri yönetici özetine, geçti/kaldı kriterlerine ve puanlama tablosuna dönüştüren; her maddeyi kaynağındaki hükme bağlayan çok ajanlı çıkarım sistemi.",
            "A multi-agent extraction system that turns long specifications into an executive brief, pass/fail criteria and a scoring table, tying every item to the clause it came from."),
        "status": T("Geliştirme ortamında, tüketen sisteme entegre", "In development, integrated with the consuming system"),
        "metrics": [
            ("%94-100", T("Recall, ekibin manuel özetlerine karşı", "Recall against the team's manual summaries")),
            ("%94-100", T("Kesinlik (hakem değerlendirmeli)", "Adjudicated precision")),
            ("%100", T("Kaynak ve madde doğruluğu", "Source and clause accuracy")),
            ("0", T("Tüm koşularda uydurma madde", "Invented items across every run")),
        ],
        "problem": T(
            "Uzun ön yeterlilik şartnameleri elle okunup yönetici özetine, geçti/kaldı kriterlerine ve puanlama tablolarına dönüştürülüyordu. Süreç yavaştı; üstelik her maddenin hangi hükümden geldiği izlenebilir olmak zorundaydı. Gözden kaçan tek bir kriter, teklifin elenmesine yol açabilir.",
            "Long prequalification specifications were being read by hand and turned into briefs, pass/fail criteria and scoring tables. It was slow, and every item had to be traceable to a specific clause. A single missed criterion can get a bid disqualified."),
        "approach": T(
            "Belgeler tablo, sayfa ve madde yapısı korunarak ayrıştırılıyor; her parça konum bilgisini taşıyan kısa bir kimlik alıyor. Üç uzman ajan (yönetici özeti, geçti/kaldı kriterleri, puanlama kriterleri) aynı belge üzerinde paralel çalışıyor ve yalnızca parça kimliğiyle atıf yapıyor. Bir doğrulama katmanı her maddenin kaynağını ayrıştırıcının meta verisinden yeniden hesaplıyor. İstek asenkron: belge yüklenir, sonuç hazır olunca tüketen sistem alır.",
            "Documents are parsed with tables, pages and clauses preserved, and every chunk gets a short ID that carries its location. Three specialist agents (executive brief, pass/fail criteria, scoring criteria) work on the same document in parallel and cite chunk IDs only. A validation layer recomputes each item's source reference from parser metadata. The flow is asynchronous: the document is uploaded and the consuming system collects the result when it is ready."),
        "steps": [
            (T("Yükleme ve kuyruk", "Upload and queue"), "Blob · HTTP 202", False),
            (T("Yapı koruyan ayrıştırma", "Structure-preserving parsing"), "PDF · DOCX · XLSX", False),
            (T("Kaynak kimlikli parçalama", "Source-addressed chunking"), "chunk-id", False),
            (T("Üç uzman ajan", "Three specialist agents"), "brief · pass/fail · scoring", False),
            (T("Atıf doğrulama", "Citation guard"), "guard", True),
            (T("Kaynak referansını hesaplama", "Compute source reference"), "parser metadata", False),
            (T("Tüketen sisteme API", "API to consuming system"), "polling", False),
        ],
        "decisions": [
            T("Modele sayfa numarası hiç sorulmuyor; yalnızca parça kimliğiyle atıf yapıyor.", "The model is never asked for page numbers; it cites chunk IDs only."),
            T("Var olmayan bir parçaya atıf yapan madde uydurma kabul edilip eleniyor.", "Any item citing a chunk that does not exist is treated as invented and dropped."),
            T("Promptlar versiyonlu; golden set değerlendirmesi prompt regresyonlarını yayından önce yakaladı.", "Prompts are versioned; the golden-set harness caught prompt regressions before release."),
            T("Dokümanlar bir yaşam döngüsü politikasıyla otomatik siliniyor.", "Documents are deleted automatically by a lifecycle policy."),
        ],
        "tradeoffs": [
            T("Tek büyük prompt yerine üç uzman ajan: daha fazla model çağrısı, ama her çıktı kendi şemasıyla doğrulanıyor ve bir ajanın hatası diğerlerini bozmuyor.",
              "Three specialist agents instead of one big prompt: more model calls, but every output is validated against its own schema and one agent's mistake doesn't spoil the others."),
            T("Sayfa numarasını modelden istemek daha kolaydı. Ancak model sayfa numarası uydurabiliyor; konumu ayrıştırıcıdan hesaplamak kaynak doğruluğunu %100'e taşıdı.",
              "Asking the model for page numbers would have been easier, but models can invent them. Computing the location from the parser took source accuracy to 100%."),
        ],
        "role": T("Uçtan uca: problem tanımı, mimari, ajan ve doğrulama tasarımı, golden set değerlendirme düzeneği, Azure altyapısı (Bicep) ve tüketen sistemle entegrasyon.",
                  "End to end: problem framing, architecture, agent and validation design, the golden-set evaluation harness, Azure infrastructure (Bicep) and integration with the consuming system."),
        "stack": ["Python 3.11", "Azure Functions", "Storage Queue / Table / Blob", "Key Vault", "Managed Identity", "Azure OpenAI", "pdfplumber", "python-docx", "openpyxl", "Bicep"],
    },
    {
        "slug": "decision-archive-assistant",
        "id": "cs-decisions",
        "domain": T("Enterprise RAG", "Enterprise RAG"),
        "title": T("Karar arşivi asistanı", "Decision archive assistant"),
        "summary": T(
            "Geniş bir karar arşivi üzerinde doğal dille soru sorulduğunda ilgili tüm kararları kaynaklarıyla getiren asistan. Burada en pahalı hata eksik getirmek; sistem bu yüzden recall odaklı tasarlandı.",
            "An assistant that answers natural-language questions over a large decision archive and returns every relevant decision with its source. Missing a decision is the costliest error here, so the system is built for recall."),
        "status": T("Teams uygulamasıyla pilot kullanımda", "In pilot use through a Teams app"),
        "metrics": [
                        ("%99", T("UAT başarı oranı", "UAT pass rate")),
            ("5", T("Birleştirilen erişim stratejisi", "Retrieval strategies combined")),
        ],
        "problem": T(
            "Kullanıcılar geniş bir karar arşivi üzerinde doğal dille soru sorup ilgili tüm kararları kaynaklarıyla görmek istiyordu. Klasik bir sohbet botu birkaç benzer parçayı bulup akıcı bir cevap yazar; ama bu alanda bir kararı atlamak, yanlış bir şey söylemekten daha maliyetli.",
            "Users wanted to ask natural-language questions over a large decision archive and see every relevant decision with its source. A typical chatbot finds a few similar chunks and writes a fluent answer, but in this domain missing a decision costs more than saying something wrong."),
        "approach": T(
            "İstek yolunda LLM kullanmayan deterministik bir sorgu anlama katmanı, sorudaki tarih, konu ve tür gibi kısıtları çıkarıyor. Ardından filtreler, tam eşleşme, Türkçe BM25, vektör kNN ve eş anlamlı genişletmeyi birleştiren çok stratejili erişim geliyor. Sonuçlar birleştirilip tekilleştiriliyor ve bir ilgililik kapısından geçiyor. LLM yalnızca bulunan kararlar üzerinden, kaynak göstererek yanıt yazıyor.",
            "A deterministic query-understanding layer, with no LLM on the request path, extracts constraints such as date, topic and type. Then multi-strategy retrieval combines filters, exact match, Turkish BM25, vector kNN and alias expansion. Results are merged, deduplicated and passed through a relevance gate. The LLM writes the answer only over the retrieved set, with citations."),
        "steps": [
            (T("İçerik adresli içe alma", "Content-addressed ingestion"), "OCR fallback", False),
            (T("Deterministik sorgu anlama", "Deterministic query understanding"), "no LLM", False),
            (T("Yetki filtresi", "Authorisation filter"), "fail-closed", True),
            (T("Çok stratejili erişim", "Multi-strategy retrieval"), "BM25 · kNN · filter · alias", False),
            (T("Birleştirme ve tekilleştirme", "Merge and dedup"), "fusion", False),
            (T("İlgililik kapısı", "Relevance gate"), "gate", True),
            (T("Kaynaklı yanıt", "Grounded answer"), "Teams", False),
        ],
        "decisions": [
            T("Yetki promptta değil, arama katmanında güvenlik filtresi olarak uygulanıyor; varsayılan davranış kapalı.", "Authorisation is enforced as a security filter in search, not in the prompt, and fails closed."),
            T("Kısaltılan her yanıt kaç sonucun dışarıda kaldığını açıkça söylüyor.", "Any truncated answer states how many results were left out."),
            T("Çağıranın kimliği Entra ile doğrulanıyor.", "The caller's identity is verified with Entra."),
            T("Kabul kriterleri recall tabanları ve kesinlik tavanlarıyla tanımlı.", "Acceptance is defined by recall floors and precision ceilings."),
        ],
        "tradeoffs": [
            T("İstek yolunda LLM kullanmamak sorgu anlamayı daha az esnek yapıyor; karşılığında her sorgu tekrarlanabilir, hızlı ve test edilebilir.",
              "Keeping the LLM off the request path makes query understanding less flexible; in return every query is repeatable, fast and testable."),
            T("Kesinlik yerine recall: bu alanda fazladan bir karar göstermek, birini kaçırmaktan ucuz. Kabul testi bu önceliğe göre yazıldı.",
              "Recall over precision: showing one extra decision is cheaper than missing one, and the acceptance tests were written around that priority."),
            T("Yetkiyi prompt yerine arama filtresine yazmak: kullanıcının görmemesi gereken belge modele hiç ulaşmıyor.",
              "Authorisation in the search filter instead of the prompt: a document the user must not see never reaches the model."),
        ],
        "role": T("Erişim stratejisinin tasarımı, değerlendirme ve UAT setlerinin kurulması, güvenlik modeli, mimari karar kayıtları ve Teams entegrasyonu dahil uçtan uca geliştirme.",
                  "End-to-end development, including retrieval strategy design, evaluation and UAT sets, the security model, architecture decision records and the Teams integration."),
        "stack": ["Python 3.12", "Azure Functions", "Azure AI Search", "Azure OpenAI", "Azure SQL", "Blob · Event Grid", "Microsoft Graph", "M365 Agents SDK", "OpenTelemetry", "App Insights"],
    },
    {
        "slug": "analytics-copilot",
        "id": "cs-sql",
        "domain": T("Analitik · Text-to-SQL", "Analytics · Text-to-SQL"),
        "title": T("Kurumsal analitik copilot'u", "Enterprise analytics copilot"),
        "summary": T(
            "İş kullanıcılarının operasyonel veritabanlarını Türkçe doğal dille, yalnızca kendi rollerinin izin verdiği kadarıyla sorgulamasını sağlayan güvenli Text-to-SQL platformu.",
            "A secure Text-to-SQL platform that lets business users query operational databases in Turkish natural language, strictly within what their role allows."),
        "status": T("", "Deployed to a development environment on Azure"),
        "metrics": [
            ("%100", T("Satır seviyesi izolasyonlu tablo oranı", "Tables covered by row-level isolation")),
                        ("2", T("Birbirinden bağımsız katman: üretici ve doğrulayıcı", "Independent layers: generator and validator")),
            ("1", T("Komutla yeni veri alanı ekleme", "Command to onboard a new data domain")),
        ],
        "problem": T(
            "İş kullanıcıları operasyonel veritabanlarından Türkçe doğal dille yanıt almak istiyordu. Zorluk sorguyu üretmek değil; üretilen sorgunun yalnızca okuma yapmasını, yalnızca yetkili tablolara dokunmasını ve kullanıcının göremeyeceği satırları asla döndürmemesini garanti etmek.",
            "Business users wanted answers from operational databases in Turkish natural language. The hard part isn't generating the query; it's guaranteeing that the query only reads, only touches authorised tables and never returns rows the user may not see."),
        "approach": T(
            "Model sorguyu yazıyor, ama son sözü bağımsız bir doğrulama hattı söylüyor. Girdi korkuluğu ve rol politikasından sonra şema bağlamı yalnızca kullanıcının yetkili olduğu tablolardan getiriliyor. Üretilen SQL sözdizimi ağacı üzerinde doğrulanıyor, iş kuralları kontrol ediliyor, satır seviyesi filtre enjekte ediliyor ve EXPLAIN ile kuru çalıştırma yapıldıktan sonra salt-okunur bağlantıda çalıştırılıyor. Her adım denetim kaydına yazılıyor.",
            "The model writes the query, but an independent validation pipeline has the final say. After an input guardrail and the role policy, schema context is retrieved only from tables the user may access. The generated SQL is validated on its syntax tree, business rules are checked, a row-level filter is injected, and after an EXPLAIN dry run it executes on a read-only connection. Every step is written to an audit log."),
        "steps": [
            (T("Girdi korkuluğu", "Input guardrail"), "guard", True),
            (T("Rol politikası", "Role policy"), "fail-closed", True),
            (T("Yetkiye göre şema RAG", "Permission-aware schema RAG"), "embed · keyword", False),
            (T("SQL üretimi", "SQL generation"), "LLM", False),
            (T("AST doğrulama", "AST validation"), "single SELECT · allowed tables", True),
            (T("Satır seviyesi filtre", "Row-level filter"), "RLS", True),
            (T("EXPLAIN ve salt-okunur yürütme", "EXPLAIN and read-only execution"), "audit", False),
            (T("Tablo, grafik ve özet", "Table, chart and summary"), "React", False),
        ],
        "decisions": [
            T("Üretici ve doğrulayıcı birbirinden bağımsız; reddedilen her sorgu nedeniyle birlikte onarım döngüsüne gidiyor.", "Generator and validator are independent; every rejection goes back to a repair loop with its reason."),
            T("\"Domain pack\"ler şemaya özgü her şeyi koddan ayırıyor; yeni bir veri alanı tek komutla ekleniyor.", "\"Domain packs\" keep schema-specific configuration out of code; a new data domain onboards with one command."),
            T("Beğenilen yanıtlar aday oluyor; insan onayıyla few-shot örneğe dönüşüyor.", "Thumbs-up answers become candidates and are promoted to few-shot examples by a human."),
            T("Golden konuşma değerlendirmesi ile çok turlu senaryolar test ediliyor.", "Golden-conversation evaluation covers multi-turn scenarios."),
            T("Model seçimi maliyet ve kalite dengesine göre yapıldı.", "Model choice was traded off on cost versus quality."),
        ],
        "tradeoffs": [
            T("Modelden \"güvenli SQL yaz\" istemek yerine bağımsız doğrulayıcı: üretici ne yazarsa yazsın, yetkisiz bir sorgu çalışmıyor.",
              "An independent validator rather than asking the model to \"write safe SQL\": whatever the generator writes, an unauthorised query does not run."),
            T("Few-shot örnekleri otomatik değil, insan onayıyla eklemek: sistem daha yavaş büyüyor ama kötü bir örnek sisteme sızmıyor.",
              "Adding few-shot examples only with human approval: the system grows more slowly, but bad examples don't leak in."),
        ],
        "role": T("Güvenlik mimarisi, doğrulama hattı, şema RAG ve değerlendirme düzeneği; Python servisleri, .NET BFF ve React arayüzüyle birlikte Azure'a dağıtım.",
                  "Security architecture, validation pipeline, schema RAG and evaluation harness, plus Python services, a .NET BFF and the React UI, deployed on Azure."),
        "stack": ["Python 3.12", "FastAPI", "sqlglot", "PostgreSQL", "ASP.NET Core 8", "React 19", "Vite · Recharts", "Azure Functions", "Azure OpenAI", "App Insights", "Docker"],
    },
    {
        "slug": "tender-intelligence",
        "id": "cs-opps",
        "domain": T("Agentic AI", "Agentic AI"),
        "title": T("Çok kaynaklı ihale fırsat istihbaratı", "Multi-source tender opportunity intelligence"),
        "summary": T(
            "Uluslararası ihale portallarını her gün tarayıp ilanları toplayan, normalize eden, değerlendiren ve Türkçeleştiren platform. Yeni kaynakları kendi kendine ekleyebiliyor.",
            "A platform that scans international tender portals every day and collects, normalises, evaluates and localises the notices. It can onboard new sources on its own."),
        "status": T("Geliştirme ortamında; canlı akış kullanımda", "In development; the live feed is in use"),
        "metrics": [
            ("1", T("Tüm kaynaklar için tek ortak veri modeli", "Shared data model for every source")),
            ("0", T("Saklanan gizli anahtar (her yerde managed identity)", "Stored secrets (managed identity throughout)")),
            ("2", T("Değerlendirme katmanı: önce kurallar, sonra model", "Evaluation layers: rules first, then the model")),
        ],
        "problem": T(
            "İhaleler onlarca portala, farklı formatlara ve çoğunlukla İngilizce metinlere dağılmış durumda. Bunları elle takip etmek yavaş ve hataya açık; her yeni kaynak da yeni bir mühendislik işi demek.",
            "Tenders are scattered across dozens of portals, in different formats and mostly in English. Tracking them by hand is slow and error-prone, and every new source means new engineering work."),
        "approach": T(
            "Kaynak adaptörleri her ilanı tek bir ortak modele eşliyor. Deterministik kimlik ve içerik hash'i tekilleştirmeyi ve versiyonlamayı sağlıyor. Değerlendirme iki katmanlı: önce sıralı bir kural seti, yalnızca kalanlar için LLM. Sonuçlar çeviri önbelleğiyle Türkçeleştirilip salt-okunur bir akışla sunuluyor. Ayrı bir hat, yeni kaynakları keşfedip alanlarını eşliyor, pilot çalıştırıyor ve onay kapısından sonra devreye alıyor.",
            "Source adapters map every notice onto one shared model. Deterministic identity and content hashing handle dedup and versioning. Evaluation has two layers: an ordered ruleset first, then an LLM only for what remains. Results are localised to Turkish with a translation cache and served as a read-only feed. A separate pipeline discovers new sources, maps their fields, runs a pilot and activates them after an approval gate."),
        "steps": [
            (T("Kaynak adaptörleri", "Source adapters"), "timer · HTTP", False),
            (T("Ortak model ve kimlik", "Shared model and identity"), "content hash · version", False),
            (T("Sıralı kural seti", "Ordered ruleset"), "first", False),
            (T("LLM değerlendirme", "LLM evaluation"), "remaining only", False),
            (T("Birebir alıntı doğrulama", "Verbatim quote check"), "guard", True),
            (T("Türkçe yerelleştirme", "Turkish localisation"), "translation cache", False),
            (T("Salt-okunur akış", "Read-only feed"), "no AI on read", False),
        ],
        "steps2_title": T("Otonom kaynak ekleme", "Autonomous source onboarding"),
        "steps2": [
            (T("Keşif", "Discovery"), "strategy graph", False),
            (T("Alan eşleme", "Field mapping"), "bounded sample", False),
            (T("Profil doğrulama", "Profile validation"), "guard", True),
            (T("Pilot çalıştırma", "Pilot run"), "budget", False),
            (T("Onay kapısı", "Approval gate"), "human", True),
            (T("Devreye alma ve kayma tespiti", "Activation and drift detection"), "self-repair", False),
        ],
        "decisions": [
            T("LLM kaynağı birebir alıntılamak zorunda; bulunamayan alıntı atılıyor, alıntısız \"fırsat\" kararı \"inceleme gerekli\"ye düşüyor.", "The LLM must quote the source verbatim; quotes that can't be found are discarded and an \"opportunity\" verdict without one is downgraded to \"needs review\"."),
            T("İlan metni güvenilmeyen girdi olarak çitleniyor (prompt injection'a karşı).", "Notice text is fenced as untrusted input against prompt injection."),
            T("Kaynak ekleme bütçelerle (istek, model çağrısı, sayfa, süre), devre kesicilerle ve SSRF korumasıyla sınırlı.", "Onboarding is bounded by budgets (requests, model calls, pages, time), circuit breakers and an SSRF guard."),
            T("Özellik bayrakları varsayılan olarak kapalı; hatalar kaynak bazında izole.", "Feature flags fail closed; errors are isolated per source."),
            T("Alan eşleme sonuçları girdi hash'iyle önbellekleniyor; aynı iş iki kez ödenmiyor.", "Mapping results are cached by input hash so the same work is never paid for twice."),
        ],
        "tradeoffs": [
            T("Her ilanı modele göndermek yerine önce kurallar: maliyet ve gecikme düşüyor, yalnızca kurallarla çözülemeyen kayıtlar modele kalıyor.",
              "Rules before the model: cost and latency drop, and only records the rules can't settle reach the model."),
            T("Otonom kaynak ekleme tahmin yürütmüyor; başaramadığında \"özel adaptör gerekli\" gibi dürüst bir son durumla duruyor.",
              "Autonomous onboarding doesn't guess; when it can't succeed it stops with an honest end state such as \"custom adapter required\"."),
            T("Akış uç noktası asla model çağırmıyor: tüketen sistem modelin hızına ve maliyetine bağımlı kalmıyor.",
              "The feed endpoint never calls a model, so the consuming system doesn't depend on model latency or cost."),
        ],
        "role": T("Adaptör mimarisi, değerlendirme katmanları, otonom kaynak ekleme hattı, inceleme kuyruğu ve işletim süreçleri dahil uçtan uca tasarım ve geliştirme.",
                  "End-to-end design and build, including the adapter architecture, evaluation layers, autonomous onboarding pipeline, review queue and operations."),
        "stack": ["Python 3.12", "Azure Functions (Flex)", "Azure SQL", "Blob", "Key Vault", "Azure OpenAI", "Azure Translator", "Playwright", "Alembic"],
    },
    {
        "slug": "document-translation",
        "id": "cs-translate",
        "domain": T("Hukuk & teknik · Çeviri", "Legal & technical · Translation"),
        "title": T("Terminoloji duyarlı doküman çeviri platformu", "Terminology-aware document translation"),
        "summary": T(
            "Sözleşme ve teknik dokümanları kurumsal terminolojiye sadık kalarak çeviren ve özgün biçimini koruyarak düzenlenebilir Word çıktısı olarak yeniden kuran platform.",
            "A platform that translates contracts and technical documents using the company's approved terminology and rebuilds them as editable Word files with the original layout."),
        "status": T("Dağıtıldı; eski süreçle paralel çalışıyor", "Deployed; running in parallel with the legacy flow"),
        "metrics": [
            ("0", T("Terminoloji indeksleme hatası", "Terminology indexing failures")),
                                    ("1", T("Doküman boyunca terim başına karar", "Decision per term across a document")),
        ],
        "problem": T(
            "Sözleşme ve teknik dokümanların, kurumsal terminolojiye tutarlı biçimde sadık kalınarak ve orijinal biçim korunarak çevrilmesi gerekiyordu. Genel çeviri araçları bu iki şartı birlikte sağlayamıyordu: ya terimler tutarsızdı ya da biçim bozuluyordu.",
            "Contracts and technical documents had to be translated with consistent corporate terminology while keeping the original format. Generic tools couldn't do both: either terms drifted or the layout broke."),
        "approach": T(
            "Durable orkestrasyonda yerleşim analizi, doküman sınıflandırma ve doküman başına terminoloji haritası çıkarılıyor. Terim eşlemede tam, sözcüksel ve vektör erişimi kullanılıyor; LLM hakem yalnızca bulunan adaylardan birini seçebiliyor. Ardından bağlayıcı sözlükle çeviri, deterministik ön elemeden sonra seçici LLM kalite kontrolü ve OOXML'i koruyan DOCX yeniden inşası geliyor. Teslimden önce bir doğrulama kapısı var.",
            "Durable orchestration runs layout analysis, document classification and a per-document terminology map. Term mapping uses exact, lexical and vector retrieval, and an LLM adjudicator may only pick one of the retrieved candidates. Then comes translation with a binding glossary, selective LLM QA after deterministic triage, and an OOXML-preserving DOCX rebuild, with a validation gate before delivery."),
        "steps": [
            (T("Yükleme ve kuyruk", "Upload and queue"), "Service Bus", False),
            (T("Yerleşim analizi", "Layout analysis"), "Document Intelligence", False),
            (T("Sınıflandırma", "Classification"), "document type", False),
            (T("Terminoloji haritası", "Terminology map"), "exact · lexical · vector", False),
            (T("LLM hakem", "LLM adjudicator"), "candidates only", True),
            (T("Sözlük bağlı çeviri", "Glossary-bound translation"), "Translator", False),
            (T("Seçici kalite kontrolü", "Selective QA"), "triage → LLM", False),
            (T("Biçim koruyan DOCX", "Layout-preserving DOCX"), "OOXML", False),
            (T("Doğrulama kapısı", "Validation gate"), "guard", True),
        ],
        "decisions": [
            T("Doküman boyunca her terim için tek bir karar.", "One terminology decision per term for the whole document."),
            T("Bilinmeyen kısaltmalar asla açılmıyor; sözlük çatışmaları insana gidiyor.", "Unknown abbreviations are never expanded; glossary conflicts go to a human."),
            T("\"Kapsam\" (onaylı terim var) ile \"uyum\" (terim kullanıldı) ayrı ölçülüyor.", "\"Coverage\" (approved terms exist) is measured separately from \"compliance\" (they were used)."),
            T("Doğrulamadan geçemeyen doküman asla \"başarılı\" diye teslim edilmiyor.", "A document that fails validation is never delivered as a success."),
        ],
        "tradeoffs": [
            T("LLM'e terim uydurma özgürlüğü yok; yalnızca bulunan adaylardan seçebiliyor. Bu, yaratıcılık yerine tutarlılığı seçmek demek.",
              "The LLM has no freedom to invent terms; it can only choose from retrieved candidates. That means choosing consistency over creativity."),
            T("Her paragrafa LLM kalite kontrolü yerine önce deterministik ön eleme: maliyet düşük, düzeltmeler hedefli.",
              "Deterministic triage before LLM QA instead of checking every paragraph: lower cost, targeted corrections."),
            T("Belgeyi OOXML düzeyinde yeniden kurmak metin çıkarmaktan çok daha zor; ama kullanıcı çeviriden sonra biçim düzeltmekle uğraşmıyor.",
              "Rebuilding at the OOXML level is much harder than extracting text, but users don't spend time fixing layout after translation."),
        ],
        "role": T("Orkestrasyon mimarisi, terminoloji erişimi ve hakem tasarımı, kalite kapıları, DOCX yeniden inşası ve Teams botu dahil uçtan uca geliştirme.",
                  "End-to-end development, including the orchestration architecture, terminology retrieval and adjudication, quality gates, DOCX rebuild and the Teams bot."),
        "stack": ["Python", "Azure Durable Functions", "Service Bus", "Azure AI Search", "Document Intelligence", "Azure Translator", "Azure OpenAI", "PyMuPDF · lxml", "Bicep", "Teams bot"],
    },
    {
        "slug": "supplier-extraction",
        "id": "cs-supplier",
        "domain": T("Belge çıkarımı", "Document extraction"),
        "title": T("Tedarikçi belge çıkarım servisi", "Supplier document extraction service"),
        "summary": T(
            "Elle yeniden yazılan tedarikçi vergi levhalarını yapılandırılmış ve doğrulanmış veriye dönüştüren mikroservis. Model yalnızca etiketliyor; kontroller ve güven skoru kodda.",
            "A microservice that turns hand-keyed supplier tax certificates into structured, validated data. The model only labels; checks and confidence live in code."),
        "status": T("Üretime devir aşamasında", "Being handed over to production"),
        "metrics": [
            ("%100", T("Test setindeki dijital PDF'lerde alan doğruluğu", "Field accuracy on digital PDFs in the test set")),
                                    ("0", T("Saklanan API anahtarı (Entra ID ile yetkilendirme)", "Stored API keys (Entra ID authorisation)")),
        ],
        "problem": T(
            "Tedarikçi vergi levhaları sisteme elle, yavaş ve tutarsız biçimde giriliyordu. Hatalı bir vergi numarası, sonraki tüm süreçleri etkiliyor.",
            "Supplier tax certificates were being re-keyed by hand, slowly and inconsistently, and a wrong tax ID affects every downstream process."),
        "approach": T(
            "Yüklenen dosya magic-byte ve SHA-256 ile doğrulanıyor. Ardından yerleşim OCR'ı ve sıcaklık 0'da katı JSON şemasıyla çıkarım geliyor. Her değer OCR metninde yeniden bulunuyor; Türkçe normalizasyon ve vergi numarası checksum doğrulaması yapılıyor. Alan bazlı ve genel güven seviyesi hesaplanıyor; düşük güven manuel incelemeye gidiyor.",
            "Uploads are checked by magic bytes and SHA-256, then go through layout OCR and strict JSON-schema extraction at temperature 0. Every value is located again in the OCR text, followed by Turkish normalisation and a tax-ID checksum. Per-field and overall confidence are computed, and low confidence goes to manual review."),
        "steps": [
            (T("Güvenli yükleme", "Safe upload"), "magic-byte · sha256", True),
            (T("Yerleşim OCR", "Layout OCR"), "words + scores", False),
            (T("Katı şema çıkarımı", "Strict-schema extraction"), "temperature 0", False),
            (T("OCR'da yeniden bulma", "Re-locate in OCR"), "guard", True),
            (T("Normalizasyon ve checksum", "Normalisation and checksum"), "tax ID", True),
            (T("Alan bazlı güven", "Per-field confidence"), "from OCR", False),
            (T("İnceleme yönlendirme", "Review routing"), "low confidence → human", False),
        ],
        "decisions": [
            T("Ayrı bir mikroservis; ana sistemden bağımsız ölçekleniyor ve test ediliyor.", "A separate microservice, scaled and tested independently of the main system."),
            T("LLM yalnızca etiket atıyor; aritmetik ve kontroller Python'da.", "The LLM only assigns labels; arithmetic and checks run in Python."),
            T("Yanıt, OCR hatalarını anlamsal hatalardan ayrı raporluyor.", "The response reports OCR faults separately from semantic faults."),
            T("Entra ID uygulama rolü ile yetkilendirme; hiç anahtar yok.", "Entra ID app-role authorisation; no keys."),
            T("Doğru cevap verisi depoda tutulmuyor.", "Ground-truth data is kept out of the repository."),
        ],
        "tradeoffs": [
            T("Modelin kendi güven beyanına güvenmemek: OCR kelime skorları ölçülebilir, modelin \"eminim\" demesi değil.",
              "Not trusting the model's own confidence: OCR word scores are measurable, a model saying \"I'm sure\" is not."),
            T("Her şeyi tek prompta yüklemek yerine küçük ve denetlenebilir adımlar: daha fazla kod, ama her hata nerede oluştuğunu söylüyor.",
              "Small, auditable steps instead of one big prompt: more code, but every failure tells you where it happened."),
        ],
        "role": T("Mikroservis tasarımı, çıkarım ve doğrulama hattı, Entra ID tabanlı yetkilendirme, maliyet ve kapasite ölçümü ve devir.",
                  "Microservice design, the extraction and validation pipeline, Entra ID authorisation, cost and capacity measurement, and handover."),
        "stack": ["Python 3.11", "Azure Functions (Flex)", "Document Intelligence", "Azure OpenAI", "App Insights", "PyJWT", "pypdf"],
    },
]
