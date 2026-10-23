# Blog yazılarının künyesi. build_blogs.py bu listeden blogs/<slug>.html sayfalarını üretir.
# Yazı gövdeleri tools/blogs/<slug>.tr.html ve tools/blogs/<slug>.en.html dosyalarındadır.
# Sıra, ana sayfadaki #writing kartlarının sırasıyla aynıdır.

def T(tr, en):
    return {"tr": tr, "en": en}


POSTS = [
    {
        "slug": "rag-production",
        "cover": "rag",
        "topic": T("RAG · Kurumsal AI", "RAG · Enterprise AI"),
        "kind": T("Rehber", "Guide"),
        "title": T("Kurumsal RAG: prototipten üretime", "Enterprise RAG: from prototype to production"),
        "lead": T(
            "Bir RAG demosu bir haftada kurulur. Üretime alınmış, yetkilendirilmiş, ölçülebilir bir RAG sistemi başka bir iştir. Bu yazı ikisinin arasındaki farkı anlatıyor.",
            "A RAG demo takes a week to build. A RAG system that runs in production, respects permissions and can be measured is a different job. This article covers the gap between the two."),
        "desc": T(
            "Kurumsal RAG mimarisinde parçalama, hibrit arama, yeniden sıralama, yetkilendirme, değerlendirme ve üretim pratikleri.",
            "Chunking, hybrid search, reranking, permissions, evaluation and production practice for enterprise RAG."),
    },
    {
        "slug": "agentic-ai",
        "cover": "agentic",
        "topic": T("Agentic AI · Mimari", "Agentic AI · Architecture"),
        "kind": T("Rehber", "Guide"),
        "title": T("Agentic AI: ajan mimarileri ve çok ajanlı sistemler", "Agentic AI: agent architectures and multi-agent systems"),
        "lead": T(
            "Bir ajanı ajan yapan şey modelin zekası değil, etrafına kurduğunuz döngü ve korkuluklardır. Bu yazı üretimde çalışan ajan mimarilerinin neye benzediğini anlatıyor.",
            "What makes an agent is not the model's intelligence but the loop and guardrails you build around it. This article describes what agent architectures look like in production."),
        "desc": T(
            "Ajan döngüsü, araç tasarımı, tek ajan ve çok ajanlı mimariler, durum yönetimi, korkuluklar ve değerlendirme.",
            "The agent loop, tool design, single and multi-agent architectures, state, guardrails and evaluation."),
    },
    {
        "slug": "text-to-sql",
        "cover": "text-to-sql",
        "topic": T("LLM · Veri erişimi", "LLM · Data access"),
        "kind": T("Rehber", "Guide"),
        "title": T("Doğal dilden SQL'e: güvenli Text-to-SQL mimarisi", "Natural language to SQL: a secure Text-to-SQL architecture"),
        "lead": T(
            "İş birimlerinin SQL yazmadan veriye ulaşması güzel bir fikir. Onu güvenli ve doğru hale getiren şey, modelin kendisi değil etrafındaki doğrulama katmanı.",
            "Letting business teams reach their data without writing SQL is a good idea. What makes it safe and correct is not the model itself but the validation layer around it."),
        "desc": T(
            "Şema bağlamı, doğrulama katmanı, satır seviyesi yetki, salt okunur erişim ve Text-to-SQL sistemlerinin değerlendirilmesi.",
            "Schema context, a validation layer, row-level permissions, read-only access and how to evaluate Text-to-SQL systems."),
    },
    {
        "slug": "security-engineer-training",
        "cover": "security",
        "topic": T("Güvenlik", "Security"),
        "kind": T("Eğitim seti", "Curriculum"),
        "title": T("Sızma testi, güvenlik mühendisliği ve savunma operasyonları", "Penetration testing, security engineering and defensive operations"),
        "lead": T(
            "Tehdit modelleme, pentest, SOC, DevSecOps, bulut ve Kubernetes güvenliğini baştan sona ele alan ileri seviye bir eğitim seti.",
            "An advanced curriculum that covers threat modelling, pentesting, SOC work, DevSecOps, and cloud and Kubernetes security from start to finish."),
        "desc": T(
            "Security engineer seviyesi için eğitim seti: tehdit modelleme, pentest, SOC, DevSecOps, bulut ve Kubernetes güvenliği.",
            "A security engineer curriculum: threat modelling, pentesting, SOC, DevSecOps, cloud and Kubernetes security."),
    },
    {
        "slug": "blog1",
        "cover": "microservices",
        "topic": T("Mimari", "Architecture"),
        "kind": T("Rehber", "Guide"),
        "title": T("Mikroservis mimarisi: inceleme ve entegrasyon yöntemleri", "Microservice architecture: an overview and integration methods"),
        "lead": T(
            "Mikroservislerin ne olduğu, monolitik mimariden nasıl ayrıldığı, entegrasyonda kullanılan teknolojiler ve dağıtık yapının getirdiği zorluklar.",
            "What microservices are, how they differ from a monolith, the technologies used to integrate them and the problems a distributed system brings."),
        "desc": T(
            "Mikroservis mimarisi, monolitik mimariyle karşılaştırma, API gateway, mesajlaşma, veri yönetimi, avantajlar ve zorluklar.",
            "Microservice architecture compared with a monolith: API gateways, messaging, data management, benefits and challenges."),
    },
    {
        "slug": "command-guide",
        "cover": "cli",
        "topic": T("Başvuru", "Reference"),
        "kind": T("Başvuru", "Reference"),
        "title": T("Windows, macOS ve Linux için komut rehberi", "A command guide for Windows, macOS and Linux"),
        "lead": T(
            "Windows, macOS ve Linux'ta kullanılan terminal komutlarını parametre açıklamaları ve platform karşılıklarıyla tek yerde toplayan başvuru rehberi.",
            "A reference that brings terminal commands for Windows, macOS and Linux together in one place, with notes on parameters and the equivalent on each platform."),
        "desc": T(
            "Windows, macOS ve Linux komut satırı komutlarını tek kaynakta toplayan kapsamlı rehber.",
            "A single reference for command line commands on Windows, macOS and Linux."),
    },
]
