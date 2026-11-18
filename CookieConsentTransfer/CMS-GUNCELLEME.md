# Mevcut Kentico 13 çerez bileşenini güncelleme

## 1. Politika sürümü ve GA4 ayarlarını panele ekleyin

Bu ayarları kodu yayınlamadan önce oluşturun. İlk geçişte mevcut `CookieConsent:PolicyVersion` değerini ve kullanılıyorsa mevcut GA4 kimliğini aynen girin. Böylece geçerli tarayıcı tercihleri aynı sürümde okunabilir.

1. Global administrator ile **Modules → New module** açın. **Display name** için **Çerez yönetimi**, **Code name** için `YkbCookieConsentConfiguration` girin ve kaydedin. Modülün **Sites** sekmesinden canlı siteyi atayın.
2. Modülün **Settings** sekmesinde **New category** ile **Çerez tercihleri** adında, `YkbCookieConsentCategory` kod adlı bir kategori oluşturun.
3. Kategorinin **Settings → New settings group** bölümünde **Politika ve ölçüm** adında, `YkbCookieConsentGeneral` kod adlı bir grup açın.
4. Grupta **New settings key** ile aşağıdaki iki anahtarı oluşturun. Her iki anahtar için **Key is only global** ve **Key is hidden** kutularını boş bırakın. [Kentico özel ayarları oluşturma](https://docs.kentico.com/13/custom-development/creating-custom-modules/adding-custom-website-settings)
5. **Settings → Çerez tercihleri → Politika ve ölçüm** ekranında **Site** listesinden canlı siteyi seçin. Her iki alan için **Inherit from global settings** kutusunu kaldırın, değerleri girin ve **Save** ile kaydedin. Ayar ekranına sonraki girişlerde aynı siteyi seçin. [Kentico site bazlı ayarları](https://docs.kentico.com/13/configuring-xperience/managing-sites/configuring-settings-for-sites)

| Display name | Code name | Type | Default value | Validation regex |
| --- | --- | --- | --- | --- |
| Çerez politikası sürümü | `YkbCookieConsentPolicyVersion` | Integer number | `1` | `^[1-9][0-9]*$` |
| GA4 ölçüm kimliği | `YkbCookieConsentMeasurementId` | Text | Boş | `^(G-[A-Z0-9]+)?$` |

- Yeni izin gerektiren bir politika veya kategori değişikliğinde sürümü artırın. Örneğin `1` yerine `2` kaydedin. Sonraki sayfa isteğinde önceki sürümün tercihi geçersiz olur ve yeni bir tercih alınana kadar GA4 bekler. Eski sayaç satırları kendi sürümleriyle panelde kalır. Önceden kullanılmış sürüm numaralarını tekrar kullanmayın.
- GA4’ü durdurmak için ölçüm kimliğini boş kaydedin. Sonraki sayfa isteğinde GA4 yüklenmez ve bileşenin yazdığı GA çerezleri silinir. Geçerli bir kimlik girildiğinde, o sürümde analiz izni olan tarayıcılarda ölçüm başlar.
- Sonraki ayar değişiklikleri panelden yapılır. Yönetim uygulamasından kaydedilen değer canlı siteye yansımıyorsa **Web farm → Servers** ekranında canlı site uygulamasının kayıtlı ve eşitlemenin çalışır olduğunu kontrol edin. [Kentico ayar eşitlemesi](https://docs.kentico.com/13/configuring-xperience/setting-up-web-farms)

## 2. Mevcut CMS metinlerini tamamlayın

**Data protection → Consents** altında mevcut altı kaydı düzenleyin. Yeni kayıt oluşturmak yerine aşağıdaki kod adlarını kullanın. Asıl sitede yayındaki her dil için karşılık gelen metinleri girin. **Full text** alanına paragraf ve bağlantıları zengin metin editörüyle ekleyin. Banner ve modal girişinde **Çerez Aydınlatma Metni** bağlantısını kendi sitenizdeki sayfaya bağlayın.

| Code name | Örnek Short text | Örnek Full text |
| --- | --- | --- |
| `YkbCookieBanner` | Çerez bildirimi | Sitemizin çalışması ve tercihlerinizi hatırlaması için çerezler kullanıyoruz. Ayrıntıları Çerez Aydınlatma Metni’nde bulabilirsiniz. İsteğe bağlı çerezlerin tamamına izin verebilir, tümünü reddedebilir veya Tercihler üzerinden tek tek seçim yapabilirsiniz. |
| `YkbCookieDialog` | Sitemizde kullanılan çerezler | Aşağıdaki seçeneklerden hangi çerezlere izin vereceğinizi seçebilirsiniz. Çerezlerin kullanım amaçları hakkında daha fazla bilgi için Çerez Aydınlatma Metni’ni inceleyebilirsiniz. |
| `YkbCookieRequired` | Zorunlu çerezler | Sitenin çalışması, temel işlevlerin sürdürülmesi ve çerez seçiminizin hatırlanması için gerekir. |
| `YkbCookieFunctional` | İşlevsellik ve tercih çerezleri | Kullanıma alındığında bu çerezler, dil gibi site tercihlerinizi hatırlayarak sonraki ziyaretlerinizi kişiselleştirmeye yardımcı olur. |
| `YkbCookieAnalytics` | Performans ve analiz çerezleri | İzin verdiğinizde Google Analytics, sayfaların kullanımını ve site performansını ölçmemize yardımcı olur. |
| `YkbCookieAdvertising` | Hedefleme ve reklam çerezleri | Bu kategori, etkinleştirildiğinde reklamların gösterimi, kişiselleştirilmesi veya reklam performansının ölçülmesi için kullanılan çerezleri kapsar. |

Banner’ın **Short text** değeri panelde ayırt etmek içindir. Modal başlığı ve kategori adları ilgili kayıtların **Short text** alanından gelir. Örnek açıklamaları canlı sitede gerçekten kullanılan araçlara göre düzenleyin. [Kentico Consents](https://docs.kentico.com/13/configuring-xperience/data-protection/gdpr-compliance/working-with-consents)

**Localization → Resource strings** altında aşağıdaki iki yeni anahtarı ekleyin. Mevcut buton ve hata anahtarlarının çevirilerini de kontrol edin.

| Resource key | Örnek Türkçe değer | İşlem |
| --- | --- | --- |
| `Ykb.CookieConsent.Close` | Çerez tercihlerini kapat | Yeni. Kapatma düğmesinin erişilebilir adı. |
| `Ykb.CookieConsent.AlwaysActive` | Her zaman açık | Yeni. Zorunlu kategori durumu. |
| `Ykb.CookieConsent.Edit` | Tercihler | Mevcut anahtarı güncelleyin. |
| `Ykb.CookieConsent.RejectAll` | Tümünü Reddet | Mevcut anahtarı güncelleyin. |
| `Ykb.CookieConsent.AcceptAll` | Tümünü Kabul Et | Mevcut anahtarı güncelleyin. |
| `Ykb.CookieConsent.Save` | Kaydet | Mevcut anahtarı güncelleyin. |
| `Ykb.CookieConsent.Settings` | Çerez ayarları | Tercih ikonunun mevcut erişilebilir adı. |
| `Ykb.CookieConsent.SaveError` | Çerez tercihleriniz kaydedilemedi. Lütfen tekrar deneyin. | Mevcut hata mesajı. |
| `Ykb.CookieConsent.PolicyChanged` | Çerez politikası güncellendi. Sayfayı yenileyip tekrar deneyin. | Mevcut sürüm uyuşmazlığı mesajı. |

Kentico gerekli bir metni veya etiketi çözemediğinde çerez arayüzü ve GA4 o sayfa isteğinde devre dışı kalır. Yayına almadan önce canlı sitede kullanılan kültürleri kontrol edin. [Kentico kaynak metinleri](https://docs.kentico.com/13/multilingual-websites/setting-up-a-multilingual-user-interface/localizing-builder-components)

## 3. Asıl projeye yalnızca değişen kodu aktarın

- `Infrastructure/CookieConsentSettings.cs` içindeki ayar okuması Kentico `ISettingsService` kullanır. Yeni `CookieConsentCopyProvider.cs` dosyasını aynı projeye ekleyin. `CookieConsentRegistration.cs` ve canlı sitenin servis çağrısını `builder.Services.AddYkbCookieConsent();` biçiminde güncelleyin.
- `CookieConsentController.cs` içindeki politika sürümü kontrolünü güncelleyin. `CookieConsentViewComponent.cs` ve ilgili `Default.cshtml` dosyasını yamadaki sürümle eşleyin.
- Asıl `_Layout.cshtml` dosyanıza [layout örneğindeki](Integration/_Layout.cshtml.example) çerez bloklarını uygulayın. Başlık bölümündeki `@using` ve `@inject` satırlarını da ekleyin. Ana sayfa layout’unuzun diğer bloklarını koruyun.
- `wwwroot/css/components/cookie-consent.css` ve `wwwroot/js/components/cookie-consent.js` değişikliklerini aktarın. Razor, geçerli tercihi olmayan ziyaretçiye banner’ı ilk çizimde açık gönderir. Banner için font yüklemesi beklenmez. Önce CMS’den ayarları ve metinleri tamamlayın, ardından canlı site kodunu yayınlayın. Mevcut sunucu `appsettings` dosyasına erişim bu aktarım için gerekmez.

## 4. Panelde istatistikleri okuyun

### Günlük sayaçlar

1. Uygulama menüsünden **Custom table data** açın. Üstte site seçimi varsa canlı siteyi seçin.
2. **Çerez tercih istatistikleri** satırındaki **Edit** simgesini kullanın. Global administrator için diğer yol **Custom tables → Çerez tercih istatistikleri → Data** ekranıdır.
3. **Select displayed fields** ile en az **Gün (UTC)**, **Site**, **Politika sürümü**, **Toplam karar**, **Tümüne izin**, **Yalnızca zorunlu**, **Kısmi izin** ve **Özel kaydetme** alanlarını seçin. **Save & Close** ile listeye dönün. Analiz, ilk karar veya değişiklik takibi için ilgili sütunları da açın. [Kentico custom table data ekranı](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/managing-custom-table-data)

| Sütun | Ne sayar |
| --- | --- |
| Toplam karar | O site, UTC günü ve politika sürümünde kaydedilen ilk tercihler ve değişiklikler. |
| Tümüne izin | İsteğe bağlı üç kategorinin de açık olduğu kayıtlar. |
| Yalnızca zorunlu | İsteğe bağlı üç kategorinin de kapalı olduğu kayıtlar. |
| Kısmi izin | İsteğe bağlı kategorilerin bazılarının açık olduğu kayıtlar. |
| Özel kaydetme | Modalda Kaydet ile gönderilen kararlar. Bu kararlar sonuç sütunlarından birine de yazılır. |
| İlk karar / Tercih değişikliği | İstek sırasında geçerli sürüm için kayıtlı seçim yoksa ilk karar sayılır. Geçerli tercih değiştirildiyse değişiklik sayılır. |
| İşlevsellik / Analytics / Reklam izni | İlgili kategorinin açık olduğu kayıtlar. Bir karar bu sütunların birden fazlasına yansıyabilir. |

Üç sonuç sütununun toplamı **Toplam karar** ile eşleşir. Sürüm artırıldığında yeni kararlar yeni sürüm satırına yazılır. Sayaçlar kaydedilmiş kararları ölçer. İlk ziyaret, modalı açma, kapatma ve aynı tercihi yeniden kaydetme sayaç üretmez.

### Karar ayrıntıları ve erişim

- **Custom table data → Çerez tercih kararları** ekranında tek tek kayıtları açın. **Karar zamanı (UTC)**, **Kaydetme eylemi**, **Tercih sonucu**, kategori izinleri ve **Politika sürümü** alanlarını görünür yapın. Eylem alanındaki `accept`, `reject` ve `custom` değerleri kullanılan düğmeyi, `accepted`, `rejected` ve `partial` sonuçları ise kaydedilen seçimi gösterir.
- İlgili rol için **Permissions → Custom table** bölümünden tabloyu seçip **Read** yetkisini verin. Tablo listede görünmüyorsa doğru siteye atandığını kontrol edin. [Kentico tablo izinleri](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/setting-custom-table-permissions)
- Panelde süzmek isterseniz tablonun **Alternative forms** sekmesinde kod adı `filter` olan bir form tanımlayabilirsiniz. Gün veya site için **Text filter**, politika sürümü için **Number filter** seçin. Kentico liste filtrelerini varsayılan olarak 25 ve üzeri kayıt olduğunda gösterir. [Kentico liste filtreleri](https://docs.kentico.com/13/custom-development/extending-the-administration-interface/creating-alternative-forms/displaying-filters-using-alternative-forms)

İlk kontrolde temiz bir tarayıcı oturumunda **Tümünü Reddet** seçin. Panelde **Yalnızca zorunlu** sayacının bir arttığını kontrol edin. Ardından ayar ikonundan yalnızca **Performans ve analiz çerezleri** seçeneğini açıp **Kaydet** deyin. Aynı günlük satırda **Kısmi izin**, **Özel kaydetme**, **Tercih değişikliği** ve **Analytics izni** sayaçları birer artmalı.
