# SprintEra Dokümantasyon & Kalite Güvence (QA) 📚

[![Docs & QA CI](https://github.com/SprintEra-Samu/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/SprintEra-Samu/docs/actions/workflows/ci.yml)

SprintEra Proje Yönetim Sistemi'nin genel proje belgelerini, test planlarını, API test otomasyon senaryolarını, Postman/Newman koleksiyonlarını ve kalite güvence (QA) raporlarını içeren merkezi dokümantasyon deposudur.

---

## 📂 Depo Yapısı

```text
docs/
├── .github/
│   └── workflows/
│       └── ci.yml               # QA güvenlik ve veri doğrulama CI pipeline
├── test/                        # QA test ortamı ve test teslimatları
│   ├── postman/                 # Sprint 2 ve Sprint 3 Postman koleksiyon ve environment dosyaları
│   ├── results/                 # Test çalıştırma çıktıları, JSON sonuçları ve coverage özetleri
│   │   └── sprint3/             # Sprint 3 doğrulanmış API test sonuçları
│   ├── scripts/                 # Otomasyon, QA sunucusu ve Newman test koşum scriptleri
│   │   └── sprint3/             # Sprint 3 izole ortam, provisioning ve raporlama araçları
│   ├── setup/                   # Ortam değişkeni ve test altyapı yardımcıları
│   ├── config/                  # Test bağımlılıkları (Jest, Newman, Supertest vb.)
│   ├── SPRINT3-TEST-PLAN.md     # Sprint 3 test senaryoları ve görev eşlemesi
│   ├── SPRINT3-REPORT.md        # Sprint 3 kapsamlı QA ve API test sonuç raporu
│   ├── SPRINT3-BUGS.md          # Tespit edilen bug'lar ve gereksinim task taslakları
│   └── SPRINT3-README.md        # Sprint 3 izole QA test çalıştırma rehberi
├── .gitignore                   # QA runtime çıktıları ve geçici dosyaların yok sayılması
└── README.md                    # Bu dokümantasyon
```

---

## 🧪 QA Güvenlik & Doğrulama Testlerini Çalıştırma

Depo içerisindeki test araçlarının veri güvenliği ve konfigürasyon doğrulama kurallarını yerel olarak test etmek için:

```powershell
# Güvenlik ve veri gizleme (redaction) testleri
node --test test/scripts/sprint3/safety.test.cjs
```

---

## 🚀 Sprint 3 QA Test Koşumu (İzole Ortam)

Sprint 3 API testlerini izole bir test veritabanında çalıştırmak ve rapor üretmek için:

1. **Bağımlılıkları Yükleyin:**
   ```powershell
   npm.cmd ci --ignore-scripts --no-audit --no-fund --prefix test/config
   ```

2. **İzole Ortamı Başlatın ve Testleri Koşun:**
   ```powershell
   # Ayrı PostgreSQL cluster'ı ve QA kullanıcısını hazırlar
   node test/scripts/sprint3/isolated-postgres.cjs
   node test/scripts/sprint3/provision.cjs --isolated
   node test/scripts/sprint3/serve.cjs
   ```

3. **Test Koşumu ve Raporlama (İkinci Terminal):**
   ```powershell
   node test/scripts/sprint3/run.cjs
   node test/scripts/sprint3/report.cjs
   ```

Detaylı bilgi için [SPRINT3-README.md](file:///c:/Users/korkm/Desktop/son-gi/docs/test/SPRINT3-README.md) ve [SPRINT3-REPORT.md](file:///c:/Users/korkm/Desktop/son-gi/docs/test/SPRINT3-REPORT.md) dosyalarını inceleyebilirsiniz.

---

## 🌿 Git Branch Stratejisi & PR Kuralları

Tüm SprintEra depolarında olduğu gibi bu depoda da dal koruma (Ruleset) uygulanmaktadır:

- **`main` Branch:** Doğrudan push yasaktır. Yalnızca incelenmiş ve doğrulanmış PR'lar kabul edilir.
- **`dev` Branch:** Geliştirme ve doküman güncellemelerinin toplandığı ana dal.
- **Katkı Süreci:** Yeni bir dokümantasyon veya test paketi eklerken `dev` dalından `feature/...` branch'i açıp PR oluşturunuz.
