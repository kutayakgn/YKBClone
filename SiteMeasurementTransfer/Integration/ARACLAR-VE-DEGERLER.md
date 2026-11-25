# Hangi araç neyi ölçer?

| Araç | Ziyaretçi örneği | Sayfa ve bileşen | Ayar ve izin |
| --- | --- | --- | --- |
| Google Analytics 4 | Ana sayfanın açılmasını ve “Elektrik Faturası” bağlantısına kaç kez basıldığını sayar. | Sayfa görüntüleme mevcut GA4 kurulumundan gelir. Ek düğme ölçümü ana sayfadaki 11 bağlantı ve sitedeki “Yapı Kredili Ol” bağlantısı için hazırlanmıştır. | Mevcut GA4 kimliği, Analiz izni ve düğmede seçilen takip değeri. |
| Google Tag Manager | Dataroid’in ne zaman yükleneceğini ve hangi tıklamayı alacağını belirler. | Ölçüme dahil ettiğiniz herkese açık MVC sayfalarının ortak layout’u. | Analiz izni ve Dataroid için ayrılan GTM kapsayıcısı. |
| Dataroid | “Su Faturası” kartına basıldığında hangi bölümün kullanıldığını kaydeder. | Açılan public MVC sayfası, 10 ana sayfa başvuru/ödeme bağlantısı ve aynı siteye giden “Yapı Kredili Ol”. | SDK anahtarı, API adresi, GTM etiketleri ve Analiz izni. |

“Tüm Hesaplama Araçları” bağlantısı eski yayında yalnız GA4’e bağlıydı. Düğmenin gerçek mobil veya masaüstü hedefi başka bir alan adıysa paket tıklama göndermez. [Eski GTM yayını](https://www.googletagmanager.com/gtm.js?id=GTM-M26SV5T) · [Her düğmenin olay adı](BUTON-ALANI.md)

Paneldeki alan kodları ve eksik değerleri hangi hesaptan alacağınız [CMS ayarlarında](CMS-AYARLARI.md) yer alır.
