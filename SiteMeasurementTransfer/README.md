# Kentico 13’te GA4, GTM ve Dataroid

Ziyaretçi Analiz izni verdiğinde mevcut GA4 kurulumu açılan sayfayı sayar. Bu paket, editörün seçtiği site içi düğmelerin tıklamalarını aynı GA4 hesabına gönderir. GTM, Dataroid’i yükler. Dataroid ölçüme açılan sayfanın yolunu ve seçili düğmenin hangi bölümde olduğunu kaydeder. Örneğin elektrik kartına tıklama Dataroid’de “Ödeme Merkezi” bölümüne yazılır. [Araç, sayfa ve bileşen tablosu](Integration/ARACLAR-VE-DEGERLER.md)

## Kurulum sırası

1. **Panelde üç alan açın.** Mevcut **Çerez tercihleri** kategorisinde GTM kimliği, Dataroid Web SDK anahtarı ve Dataroid API adresi için üç metin alanı oluşturun. GA4 kimliğiniz mevcut çerez kurulumundan okunur. Canlı ve test ortamlarının değerleri yerel çalışma kopyasındaki `Integration/CANLI-DEGERLER.local.md` dosyasındadır. [Alan kodları ve eksik değerleri bulma](Integration/CMS-AYARLARI.md)
2. **Dört dosyayı kopyalayın.** Hedef, asıl Kentico 13 ASP.NET Core çözümünün ziyaretçiye açık web sitesidir.

   | Paket dosyası | Kentico çözümündeki hedef |
   | --- | --- |
   | [PartnerSettings.cs](Infrastructure/CookieConsent/PartnerSettings.cs) | Infrastructure projesi → CookieConsent |
   | [_PartnerTracking.cshtml](Web/Views/Shared/_PartnerTracking.cshtml) | Web projesi → Views/Shared |
   | [partner-tracking.js](Web/wwwroot/js/components/partner-tracking.js) | Web projesi → wwwroot/js/components |
   | [PartnerClickTagHelper.cs](Web/TagHelpers/PartnerClickTagHelper.cs) | Web projesi → TagHelpers |

3. **Layout ve sayfaları bağlayın.** Mevcut GA4 yükleyicisinden hemen sonra ortak layout’a [Razor çağrısını](Integration/_Layout.cshtml.example) ekleyin. Önceki geniş paket için ayrı bir layout bloğu kopyaladıysanız o bloğu bu örnekle değiştirin. Ölçülecek sayfanın view’ında `PartnerTrackingPath` değerini verin. Örneğin ana sayfa için değer `/` olur. [Sayfa örneği](Integration/SAYFA-VE-BILESENLER.md)
4. **Butona isteğe bağlı seçim ekleyin.** Kentico’da `ButtonComponent` altına `PartnerClick` alanını açın. Model, mapper, Razor ve gerekiyorsa header değişikliklerini uygulayın. “Takip yok” seçilmiş bir buton mevcut işlevini sürdürür. [Buton kurulumu ve 12 seçim](Integration/BUTON-ALANI.md)
5. **GTM’de Dataroid’i kurun.** Dataroid için ayrılmış Web kapsayıcısında izin şablonunu, başlatıcıyı, bir sayfa görüntüleme ve iki düğme etiketi oluşturun. Düğmelerden gelen GA4 olayını sitedeki kod gönderir. [GTM panelinde adım adım kurulum](Gtm/KURULUM.md) · [Tetikleyici ve parametre listesi](Gtm/OLAYLAR.csv)

## Test sitesinde kontrol

- Kendi test sitenizin tam HTTPS sunucu adını `PartnerSettings.IsPublicSiteHost` listesine ekleyin. Test için ayrı GA4 veri akışını ve test Dataroid anahtarını kullanın.
- Temiz bir oturumda Analiz izni vermeden sayfayı açın. Tarayıcının **Network** bölümünde GA4, GTM veya Dataroid ölçüm isteği görülmemeli.
- Analiz izni verip ana sayfayı yeniden açın. GA4’te bir sayfa görüntüleme, GTM Preview’da bir `k13.dataroid_page_view` ve Dataroid test uygulamasında ilgili sayfa görünmeli.
- “Elektrik Faturası” seçilmiş bir düğmeye basın. GA4’te `OdemeMerkezi_ElektrikFaturasi_ButtonClick`, Dataroid’de `Anasayfa_Buttons` ve `section=Odeme_Merkezi` görünmeli. “Takip yok” seçilmiş düğme özel tıklama olayı üretmemeli.
- İçerik sekmesi değiştirildiğinde ek sayfa görüntülemesi görülmemeli. GA4 hesabındaki otomatik geçmiş ölçümü açıksa [sayfa kurulumundaki ayarı](Integration/SAYFA-VE-BILESENLER.md) uygulayın. İnternet Şubesi kayıtlarını “Takip yok” olarak bırakın.

Yerel test komutu `node --test CookieConsentTransfer/Tests/*.test.cjs SiteMeasurementTransfer/Tests/*.test.cjs`.
