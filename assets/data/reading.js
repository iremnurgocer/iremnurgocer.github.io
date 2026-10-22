/* Okuma listesi. Her kayıt: kategori, başlık, yazar/kurum, yıl, tür, bağlantı
   ve iki dilde "neden önemli" notu. Sıralama kategori içinde öneri sırasıdır. */

window.READING_CATEGORIES = [
    { id: 'all', tr: 'Tümü', en: 'All' },
    { id: 'foundations', tr: 'Temeller', en: 'Foundations' },
    { id: 'rag', tr: 'RAG & erişim', en: 'RAG & retrieval' },
    { id: 'agents', tr: 'Ajanlar', en: 'Agents' },
    { id: 'eval', tr: 'Değerlendirme', en: 'Evaluation' },
    { id: 'sql', tr: 'Text-to-SQL', en: 'Text-to-SQL' },
    { id: 'safety', tr: 'Güvenlik', en: 'Security' },
    { id: 'geometry', tr: 'Geometri', en: 'Geometry' }
];

window.READING = [
    {
        cat: 'foundations', year: 2017, type: 'Paper',
        title: 'Attention Is All You Need',
        by: 'Vaswani et al. · Google',
        url: 'https://arxiv.org/abs/1706.03762',
        tr: 'Transformer mimarisinin doğduğu makale. Bugünkü her LLM bu sayfalardaki fikrin üzerine kurulu.',
        en: 'Where the Transformer was born. Every modern LLM is built on the idea in these pages.'
    },
    {
        cat: 'foundations', year: 2022, type: 'Paper',
        title: 'Training language models to follow instructions with human feedback',
        by: 'Ouyang et al. · OpenAI',
        url: 'https://arxiv.org/abs/2203.02155',
        tr: 'Ham bir dil modelini yardımcı bir asistana dönüştüren RLHF sürecini anlamak için temel kaynak.',
        en: 'The core reference for how RLHF turns a raw language model into a helpful assistant.'
    },
    {
        cat: 'foundations', year: 2022, type: 'Paper',
        title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models',
        by: 'Wei et al. · Google',
        url: 'https://arxiv.org/abs/2201.11903',
        tr: 'Modele "adım adım düşün" demenin neden işe yaradığını gösteren, akıl yürütme çalışmalarının başlangıcı.',
        en: 'Showed why asking a model to reason step by step works, and kicked off the reasoning era.'
    },
    {
        cat: 'foundations', year: 2021, type: 'Paper',
        title: 'LoRA: Low-Rank Adaptation of Large Language Models',
        by: 'Hu et al. · Microsoft',
        url: 'https://arxiv.org/abs/2106.09685',
        tr: 'Büyük modelleri düşük maliyetle uyarlamanın standart yolu; ince ayarın ekonomisini değiştirdi.',
        en: 'The standard way to adapt large models cheaply; it changed the economics of fine-tuning.'
    },
    {
        cat: 'rag', year: 2020, type: 'Paper',
        title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks',
        by: 'Lewis et al. · Meta AI',
        url: 'https://arxiv.org/abs/2005.11401',
        tr: 'RAG kavramını tanımlayan makale. Kurumsal yapay zekanın büyük kısmı bu fikrin bir uygulaması.',
        en: 'The paper that named RAG. Most enterprise AI is an application of this idea.'
    },
    {
        cat: 'rag', year: 2023, type: 'Paper',
        title: 'Lost in the Middle: How Language Models Use Long Contexts',
        by: 'Liu et al. · Stanford',
        url: 'https://arxiv.org/abs/2307.03172',
        tr: 'Uzun bağlamın ortasındaki bilginin kaybolduğunu gösterir. "Hepsini bağlama koyalım" demeden önce okunmalı.',
        en: 'Shows that information in the middle of a long context gets lost. Read it before saying "just put it all in the context".'
    },
    {
        cat: 'rag', year: 2024, type: 'Essay',
        title: 'Introducing Contextual Retrieval',
        by: 'Anthropic',
        url: 'https://www.anthropic.com/news/contextual-retrieval',
        tr: 'Parçalara bağlam eklemek ve hibrit arama ile erişim hatalarını ciddi oranda azaltmanın pratik anlatımı.',
        en: 'A practical account of cutting retrieval failures by adding context to chunks and using hybrid search.'
    },
    {
        cat: 'rag', year: 2023, type: 'Paper',
        title: 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection',
        by: 'Asai et al. · University of Washington',
        url: 'https://arxiv.org/abs/2310.11511',
        tr: 'Modelin ne zaman arama yapacağına ve kendi çıktısını eleştirmeye karar verdiği, uyarlanabilir RAG.',
        en: 'Adaptive RAG in which the model decides when to retrieve and critiques its own output.'
    },
    {
        cat: 'rag', year: 2024, type: 'Paper',
        title: 'From Local to Global: A Graph RAG Approach to Query-Focused Summarization',
        by: 'Edge et al. · Microsoft Research',
        url: 'https://arxiv.org/abs/2404.16130',
        tr: 'Tek parçaların yetmediği, tüm külliyata dair "genel" sorular için bilgi grafiği tabanlı RAG.',
        en: 'Knowledge-graph RAG for "global" questions about a whole corpus, where single chunks fall short.'
    },
    {
        cat: 'agents', year: 2024, type: 'Essay',
        title: 'Building Effective Agents',
        by: 'Anthropic',
        url: 'https://www.anthropic.com/research/building-effective-agents',
        tr: 'İş akışı ile ajan arasındaki farkı ve en basit çözümle başlamanın değerini anlatan, bence en iyi pratik rehber.',
        en: 'In my view the best practical guide: workflows versus agents, and why you should start with the simplest thing.'
    },
    {
        cat: 'agents', year: 2022, type: 'Paper',
        title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
        by: 'Yao et al. · Princeton, Google',
        url: 'https://arxiv.org/abs/2210.03629',
        tr: 'Düşün, eyleme geç, gözlemle döngüsü. Bugünkü ajan çerçevelerinin çoğunun atası.',
        en: 'The think, act, observe loop. The ancestor of most agent frameworks today.'
    },
    {
        cat: 'agents', year: 2023, type: 'Paper',
        title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
        by: 'Schick et al. · Meta AI',
        url: 'https://arxiv.org/abs/2302.04761',
        tr: 'Araç kullanımının modelin içinden öğrenilebileceğini gösteren, fonksiyon çağırmanın fikir babası.',
        en: 'Showed tool use can be learned by the model itself; the intellectual root of function calling.'
    },
    {
        cat: 'agents', year: 2023, type: 'Paper',
        title: 'Reflexion: Language Agents with Verbal Reinforcement Learning',
        by: 'Shinn et al.',
        url: 'https://arxiv.org/abs/2303.11366',
        tr: 'Ajanların hatalarından sözel geri bildirimle öğrenmesi; öz-değerlendirme döngülerine iyi bir giriş.',
        en: 'Agents that learn from their mistakes through verbal feedback; a good entry point to self-evaluation loops.'
    },
    {
        cat: 'agents', year: 2023, type: 'Essay',
        title: 'LLM Powered Autonomous Agents',
        by: 'Lilian Weng',
        url: 'https://lilianweng.github.io/posts/2023-06-23-agent/',
        tr: 'Planlama, bellek ve araç kullanımını tek bir haritada toplayan, alanın en çok başvurulan özeti.',
        en: 'The most cited overview of the field, putting planning, memory and tool use on a single map.'
    },
    {
        cat: 'eval', year: 2023, type: 'Paper',
        title: 'Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena',
        by: 'Zheng et al. · LMSYS',
        url: 'https://arxiv.org/abs/2306.05685',
        tr: 'Bir modeli başka bir modelle değerlendirmenin gücü ve önyargıları: konum, uzunluk ve öz-tercih.',
        en: 'The power and the biases of using a model to grade a model: position, verbosity and self-preference.'
    },
    {
        cat: 'eval', year: 2023, type: 'Paper',
        title: 'RAGAS: Automated Evaluation of Retrieval Augmented Generation',
        by: 'Es et al.',
        url: 'https://arxiv.org/abs/2309.15217',
        tr: 'Sadakat, yanıt ilgililiği ve bağlam kesinliği gibi RAG metriklerinin referanssız ölçümü.',
        en: 'Reference-free measurement of RAG metrics such as faithfulness, answer relevance and context precision.'
    },
    {
        cat: 'eval', year: 2023, type: 'Essay',
        title: 'Patterns for Building LLM-based Systems & Products',
        by: 'Eugene Yan',
        url: 'https://eugeneyan.com/writing/llm-patterns/',
        tr: 'Değerlendirme, RAG, önbellek, korkuluk ve geri bildirim desenlerini sahadan bakışla anlatan klasik yazı.',
        en: 'A classic on evals, RAG, caching, guardrails and feedback patterns, written from the field.'
    },
    {
        cat: 'eval', year: 2023, type: 'Paper',
        title: 'DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines',
        by: 'Khattab et al. · Stanford',
        url: 'https://arxiv.org/abs/2310.03714',
        tr: 'Prompt yazmayı, metriğe göre optimize edilen bir programlama problemine dönüştürür.',
        en: 'Turns prompt writing into a programming problem optimised against a metric.'
    },
    {
        cat: 'sql', year: 2023, type: 'Paper',
        title: 'Can LLM Already Serve as A Database Interface? A BIg Bench for Large-Scale Database Grounded Text-to-SQLs (BIRD)',
        by: 'Li et al.',
        url: 'https://arxiv.org/abs/2305.03111',
        tr: 'Kirli, büyük ve gerçekçi veritabanlarında Text-to-SQL ölçümü. Akademik benchmark ile kurumsal gerçeklik arasındaki köprü.',
        en: 'Text-to-SQL measured on large, messy, realistic databases; a bridge between academic benchmarks and enterprise reality.'
    },
    {
        cat: 'sql', year: 2023, type: 'Paper',
        title: 'DIN-SQL: Decomposed In-Context Learning of Text-to-SQL with Self-Correction',
        by: 'Pourreza & Rafiei · University of Alberta',
        url: 'https://arxiv.org/abs/2304.11015',
        tr: 'Sorguyu alt görevlere bölüp kendi kendini düzelten SQL üretimi; onarım döngülerinin temel fikri.',
        en: 'Decomposing a query into sub-tasks with self-correction; the core idea behind repair loops.'
    },
    {
        cat: 'safety', year: 2025, type: 'Guide',
        title: 'OWASP Top 10 for LLM Applications',
        by: 'OWASP GenAI Security Project',
        url: 'https://genai.owasp.org/llm-top-10/',
        tr: 'Prompt injection, aşırı yetki ve veri sızıntısı gibi risklerin kontrol listesi. Mimari incelemelerde sık başvurduğum bir kaynak.',
        en: 'A checklist of risks such as prompt injection, excessive agency and data leakage. I use it often in architecture reviews.'
    },
    {
        cat: 'safety', year: 2023, type: 'Paper',
        title: 'Not What You\'ve Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection',
        by: 'Greshake et al.',
        url: 'https://arxiv.org/abs/2302.12173',
        tr: 'Dış içeriğin neden "güvenilmeyen girdi" olarak çitlenmesi gerektiğini gösteren dolaylı prompt injection çalışması.',
        en: 'The indirect prompt injection paper that explains why external content must be fenced as untrusted input.'
    },
    {
        cat: 'safety', year: 2022, type: 'Paper',
        title: 'Constitutional AI: Harmlessness from AI Feedback',
        by: 'Bai et al. · Anthropic',
        url: 'https://arxiv.org/abs/2212.08073',
        tr: 'İlkelerle yönlendirilen öz-eleştiri ve yapay zeka geri bildirimiyle hizalama.',
        en: 'Alignment through principle-guided self-critique and AI feedback.'
    },
    {
        cat: 'geometry', year: 2000, type: 'Paper',
        title: 'A Global Geometric Framework for Nonlinear Dimensionality Reduction (Isomap)',
        by: 'Tenenbaum, de Silva & Langford · Science',
        url: 'https://doi.org/10.1126/science.290.5500.2319',
        tr: 'Jeodezik uzaklıklarla manifoldu "açan" Isomap. Yüksek lisans çalışmalarımın çıkış noktası.',
        en: 'Isomap, which "unrolls" a manifold using geodesic distances. The starting point of my graduate research.'
    },
    {
        cat: 'geometry', year: 2003, type: 'Paper',
        title: 'Laplacian Eigenmaps for Dimensionality Reduction and Data Representation',
        by: 'Belkin & Niyogi · Neural Computation',
        url: 'https://doi.org/10.1162/089976603321780317',
        tr: 'Laplace-Beltrami operatörünü veriye taşıyan çalışma; spektral yöntemlerin geometrik temeli.',
        en: 'Brings the Laplace-Beltrami operator to data; the geometric foundation of spectral methods.'
    },
    {
        cat: 'geometry', year: 2021, type: 'Book',
        title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges',
        by: 'Bronstein, Bruna, Cohen & Veličković',
        url: 'https://arxiv.org/abs/2104.13478',
        tr: 'CNN\'lerden Transformer\'lara kadar mimarileri simetri ve geometri diliyle tek çatı altında toplar.',
        en: 'Unifies architectures from CNNs to Transformers in the language of symmetry and geometry.'
    }
];
