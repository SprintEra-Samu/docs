# Sprint 3 retest kaydı

**Retest çalıştırılmadı.** Geliştirici düzeltmesi teslim edilmedi ve düzeltilmiş commit üzerinde tekrar test kanıtı bulunmuyor. İlk QA turu retest sayılmaz.

Son tur: [2026-10-16T08-17-01-734Z](results/sprint3/2026-10-16T08-17-01-734Z.json), kaynak commit `dde1a34c90dc66af9dbc7e547218629fa425077d`.

| Durum | Açıklama |
| --- | --- |
| Düzeltme bekleniyor | Gerçek FAIL kayıtları için yeni Backend commit'i gerekir. |
| Ortam engelleri | BLOCKED testler ancak önkoşullar sağlanınca ilk kez çalıştırılır. |
| Kapatma ölçütü | Aynı senaryo yeni commit üzerinde geçer; ilgili regresyon çalışır; tarihli kanıt eklenir. |

Düzeltme gelince özgün Backend'e dokunmadan ayrı bir çalışma snapshot'ı hazırlanmalı; mevcut snapshot/veri üzerine yazma veya silme öncesinde ayrıca onay alınmalıdır.

## Mevcut hatanın regresyon kontrolü

QA-W2-001, bu gerçek turda PT-06A/B/C ile yeniden kontrol edildi: HTTP 400, alan bazlı hata assertion'ları FAIL. Sorun devam ediyor; hata kapatılmadı. Geliştirici düzeltmesi sonrası retest henüz yoktur.
