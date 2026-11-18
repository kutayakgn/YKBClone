# Kentico Xperience 13 çerez tercihleri

Bu aktarım paketi asıl Xperience 13 **ASP.NET Core canlı site** projesi içindir. Banner, metni ve üç eylemi geniş ekranda yan yana yerleştirir. Modal, kategori kontrolleri ve ortalanmış kaydetme düğmesi içerir. Bileşen kendi CSS ölçülerini ve sitenin Ubuntu fontlarını kullanır. `cookie-icon.svg` dosyasını `wwwroot/assets/icons/cookie-icon.svg` yoluna eklediğinizde ilk tercihten sonra sol altta görünür.

Mevcut kurulumu güncelliyorsanız [CMS güncelleme kılavuzundaki](CMS-GUNCELLEME.md) adımları uygulayın.

## Kentico CMS panelinde yapılacaklar

Kurulum için Kentico panelinde site ayarını, metinleri ve iki custom table tanımını oluşturun. Uygulama kararları ve sayaçları kendisi yazar. Günlük özet **Custom table data** ekranında görüntülenir.

### 1. Site çerez seviyesini ayarlayın

**Settings → System → Cookies → Default cookie level** alanında üstten asıl siteyi seçin. Gerekirse global değeri devralmayı kapatıp **Essential** seçin ve kaydedin.

Bu ayar Xperience'ın kendi çerezlerini yönetir. Üç isteğe bağlı izin tarayıcıda ayrı alanlar olarak saklanır. Bir kategoriyi açmak Xperience'ın bir grup özelliğine otomatik izin vermez. Paketin ölçümü GA4 üzerinden yapılır. Canlı projede Xperience Web Analytics ayrıca açıksa **Settings → On-line marketing → Web analytics → Enable web analytics** ayarını ve layout’taki ilgili scripti kontrol edin. Bu paketin GA4 ölçümünü tek ölçüm akışı olarak kullanacaksanız yinelemeyi burada kapatın. Mevcut `UseActivityTracking`, `ActivityLoggingScript` ve contact tracking entegrasyonlarını da kontrol edin. Paket, mevcut diğer Kentico özellikleri için tercih kontrolünü kendiliğinden eklemez. [Xperience çerez seviyeleri](https://docs.kentico.com/13/developing-websites/working-with-cookies), [Xperience Web Analytics](https://docs.kentico.com/13/on-line-marketing-features/configuring-and-customizing-your-on-line-marketing-features/configuring-web-analytics/enabling-web-analytics)

### 2. Banner ve modal metinlerini girin

**Data protection → Consents** uygulamasında aşağıdaki altı kaydı açın. Yeni kaydı oluştururken **Code name** değerini tabloda verilen biçimde kaydedin. Sitede sunulan her dil için **Consent text** altında **Short text** ve **Full text** alanlarını girin.

| Code name | Short text | Full text |
| --- | --- | --- |
| `YkbCookieBanner` | Yönetim için başlık, örneğin Çerez bildirimi | Banner açıklaması ve çerez politikası bağlantısı |
| `YkbCookieDialog` | Çerez tercihleri | Modalın giriş açıklaması |
| `YkbCookieRequired` | Zorunlu çerezler | Zorunlu çerezlerin kullanım amacı |
| `YkbCookieFunctional` | İşlevsellik ve tercih çerezleri | Kullanılan işlevsellik çerezlerine ilişkin açıklama |
| `YkbCookieAnalytics` | Performans ve analiz çerezleri | GA4 dahil ölçüm araçlarının açıklaması |
| `YkbCookieAdvertising` | Hedefleme ve reklam çerezleri | Sitedeki reklam kategorisinin açıklaması |

**Short text** düz metin olarak, **Full text** CMS'deki HTML içeriğiyle gösterilir. Ekteki görünümü yakalamak için metinleri aynı paragraf ve bağlantı biçimiyle girin. Bu kayıtları düzenleme yetkisini ilgili içerik rolüyle sınırlandırın. Bütün metin ve etiketleri yayın dillerinde CMS’de tamamlayın. Kentico gerekli metinlerden birini çözemediğinde arayüz ve GA4 ilgili sayfa isteğinde devre dışı kalır. [Xperience Consents](https://docs.kentico.com/13/configuring-xperience/data-protection/gdpr-compliance/working-with-consents)

**Localization → Resource strings** altında şu anahtarları oluşturun ve sayfa dillerine göre çevirilerini kaydedin.

| Resource key | Türkçe başlangıç değeri |
| --- | --- |
| `Ykb.CookieConsent.AcceptAll` | Tümünü kabul et |
| `Ykb.CookieConsent.RejectAll` | Tümünü reddet |
| `Ykb.CookieConsent.Edit` | Tercihleri düzenle |
| `Ykb.CookieConsent.Save` | Tercihleri kaydet |
| `Ykb.CookieConsent.Settings` | Çerez ayarları |
| `Ykb.CookieConsent.SaveError` | Çerez tercihleriniz kaydedilemedi. Lütfen tekrar deneyin. |
| `Ykb.CookieConsent.PolicyChanged` | Çerez bilgileri güncellendi. Sayfayı yenileyip tekrar deneyin. |
| `Ykb.CookieConsent.Close` | Çerez tercihlerini kapat |
| `Ykb.CookieConsent.AlwaysActive` | Her zaman açık |

Bileşen kültürü layout’taki `ViewData["Culture"]` değerinden, yoksa ASP.NET Core istek kültüründen alır. Yeni bir izin gerektiren metin veya kategori değişikliğinde **Settings → Çerez tercihleri** altındaki politika sürümünü artırın. Geçerli sürüme ait tercih bulunana kadar banner yeniden açılır ve GA4 bekler. [Kentico resource strings](https://docs.kentico.com/13/multilingual-websites/setting-up-a-multilingual-user-interface/localizing-builder-components)

Politika sürümü ve GA4 ölçüm kimliği için [CMS ayarlarını](CMS-GUNCELLEME.md#1-politika-sürümü-ve-ga4-ayarlarını-panele-ekleyin) oluşturun.

### 3. İki custom table oluşturun

Global administrator ile **Custom tables → New custom table** sihirbazını kullanın. Her iki tablo için **Create a new database table** seçin, Kentico’nun önerdiği tablo adını ve **Primary key name** olarak `ItemID` değerini bırakın. Her alanı **New field** ile oluşturun. Kodun kullandığı **Field name** değerini aşağıdaki adlarla aynen girin. **Field caption** panelde görünen başlıktır. Alanları tamamlayıp **Add sites** ile asıl siteyi seçin ve sihirbazı bitirin. Tabloların ilk satırlarını canlı site oluşturur. [Custom tables sihirbazı](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/creating-custom-tables)

#### Çerez tercih kararları

**Display name** alanına **Çerez tercih kararları**, **Namespace** alanına `Ykb`, **Name** alanına `CookieConsentDecision` girin. Tam code name `Ykb.CookieConsentDecision` olur. **Include ItemGUID field** seçili olmalı. Bu alan, aynı kaydetme isteği tekrar gelirse tek karar sayılmasını sağlar. Önceden bu code name ile açtığınız tabloyu kullanabilirsiniz.

| Field name | Data type | Size | Field caption |
| --- | --- | --- | --- |
| `SiteCodeName` | Text | 100 | Site |
| `DecisionUtc` | Date & time | | Karar zamanı (UTC) |
| `DecisionAction` | Text | 10 | Kaydetme eylemi |
| `Outcome` | Text | 10 | Tercih sonucu |
| `IsInitial` | Boolean (Yes/No) | | İlk karar |
| `FunctionalAllowed` | Boolean (Yes/No) | | İşlevselliğe izin |
| `AnalyticsAllowed` | Boolean (Yes/No) | | Analytics’e izin |
| `AdvertisingAllowed` | Boolean (Yes/No) | | Reklama izin |
| `PolicyVersion` | Integer number | | Politika sürümü |

#### Çerez tercih istatistikleri

**Display name** alanına **Çerez tercih istatistikleri**, **Namespace** alanına `Ykb`, **Name** alanına `CookieConsentDaily` girin. Tam code name `Ykb.CookieConsentDaily` olur. Uygulama her site, UTC günü ve politika sürümü için bir satır oluşturur. Sayaç alanlarında **Data type** olarak **Long integer number** seçin. [Kentico alan tipleri](https://docs.kentico.com/13/custom-development/managing-field-data-types)

| Field name | Data type | Size | Field caption |
| --- | --- | --- | --- |
| `DayUtc` | Text | 10 | Gün (UTC) |
| `SiteCodeName` | Text | 100 | Site |
| `PolicyVersion` | Integer number | | Politika sürümü |
| `TotalCount` | Long integer number | | Toplam karar |
| `AcceptedCount` | Long integer number | | Tümüne izin |
| `RejectedCount` | Long integer number | | Yalnızca zorunlu |
| `PartialCount` | Long integer number | | Kısmi izin |
| `CustomCount` | Long integer number | | Özel kaydetme |
| `InitialCount` | Long integer number | | İlk karar |
| `ChangedCount` | Long integer number | | Tercih değişikliği |
| `FunctionalCount` | Long integer number | | İşlevsellik izni |
| `AnalyticsCount` | Long integer number | | Analytics izni |
| `AdvertisingCount` | Long integer number | | Reklam izni |

### 4. Sayaçları panelde açın

1. **Custom table data** uygulamasını açın ve **Çerez tercih istatistikleri** satırının **Edit** simgesine tıklayın.
2. **Select displayed fields** ile tabloda görmek istediğiniz alanları seçip **Save & Close** deyin. İlk test kararından sonra günlük satır görünür. Karar ayrıntıları için aynı uygulamada **Çerez tercih kararları** tablosunu açın. [Custom table data ekranı](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/managing-custom-table-data)
3. Görüntüleyecek rol için **Permissions → Custom table → Çerez tercih istatistikleri** altında **Read** verin. Karar tablosu için de erişim gerekiyorsa aynı işlemi o tabloya uygulayın. [Custom table yetkileri](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/setting-custom-table-permissions)

**Tümüne izin**, **Yalnızca zorunlu** ve **Kısmi izin** sonuç sayaçlarıdır. **Özel kaydetme** modalda kullanılan eylemi sayar ve aynı karar bir sonuç sütununda da yer alır. Aynı tercihi tekrar kaydetmek sayaçları artırmaz. Ölçü birimi karardır. Tercih tablosunda IP, e-posta veya contact kimliği tutulmaz. Sayaçlar bu sürümle kaydedilen kararlardan başlar. Daha önce yazılan satırlar karar tablosundan görüntülenebilir. Veri yazma hatasında tarayıcı tercihi kaydedilir ve istatistik hatası uygulama loguna yazılır.

## Asıl projeye aktarım

1. Bu paketteki `Application`, `Infrastructure` ve `Web` dosyalarını asıl çözümdeki karşılık gelen projelere taşıyın. Web katmanındaki `Controllers`, `ViewComponents`, `Views` ve `wwwroot` klasörleri canlı siteye gider. Proje isim alanınız farklıysa `YkbYapikredi` isim alanlarını eşleyin. Razor için MVC tag helper’larının `_ViewImports.cshtml` içinde kayıtlı olduğundan emin olun. `CookieConsentModule` ayrı bir class library’deyse o assembly’de `[assembly: CMS.AssemblyDiscoverable]` tanımını kontrol edin. [Kentico modül başlatma](https://docs.kentico.com/13/custom-development/creating-custom-modules/initializing-modules-to-run-custom-code)
2. [ProgramRegistration.cs.example](Integration/ProgramRegistration.cs.example) içindeki servis kaydını uygulayın. Mevcut endpoint bloğu attribute route'ları eşliyorsa ek bir route kaydı gerekmiyor. Daha önce başka bir `POST /cookie/agree` varsa bu endpoint'i yeni controller ile değiştirin. Ölçümü açmak için Kentico’daki site ayarında GA4 web veri akışının `G-...` kimliğini girin.
3. [_Layout.cshtml örneğindeki Razor bloklarını](Integration/_Layout.cshtml.example) asıl `_Layout.cshtml` dosyasında belirtilen yerlere ekleyin. Diğer layout’lar aynı izni kullanıyorsa aynı blokları oraya da uygulayın. Sayfada zaten bulunan koşulsuz GA4/GTM yükleyicilerini ve üçüncü taraf izleme çağrılarını kontrol edin. Tek GA4 kurulumunun bu izin kontrolü üzerinden çalışmasını sağlayın. GA4'e bağlanan Google Ads hedefleri kullanılıyorsa mevcut tag ayarlarını da kontrol edin. Paketteki GA4 kodu reklam izni sinyallerini kapalı tutar. İşlevsellik ve reklam tercihi yeni entegrasyonlar için `CookieConsentSettings.Read(Context)` sonucundan ayrı ayrı okunabilir.
4. HTML yanıtı tercihe ve antiforgery token’ına bağlıdır. Layout `private, no-store` döndürür. Kentico `[CacheOutput]`, response/output cache, ters proxy ve CDN kurallarında bu HTML yanıtlarının cache dışında kaldığını doğrulayın ve yayın sırasında eski HTML cache’ini temizleyin. Font ve CSS dahil statik dosyalar önbelleğe alınabilir. [Kentico output caching](https://docs.kentico.com/13/developing-websites/developing-xperience-applications-using-asp-net-core/caching-page-output-in-asp-net-core-applications)
5. Canlı siteyi HTTPS üzerinden sunun. TLS ters proxy’de sonlanıyorsa uygulamanın HTTPS şemasını doğru algıladığını doğrulayın. Birden fazla uygulama örneği varsa aynı Data Protection anahtar deposunu ve uygulama adını kullanın. Bu depo yayında korunmalı. Tarayıcı tercihi yalnızca ilgili site ve politika sürümünde, 365 gün geçerlidir.
6. SVG’yi belirtilen yola ekleyin. Görünüm karşılaştırması için ekin kullandığı `ubuntu-regular`, `ubuntu-medium`, `ubuntu-bold` font ailelerinin asıl projede kayıtlı olduğunu doğrulayın.

GA4 **Basic Consent Mode** ile yüklenir. Layout, kaydedilmiş analiz izni varsa yerel GA başlatıcısını ekler. Rette, iznin geri alınmasında ve tercih sona erdiğinde başlatıcı sonraki sayfaya eklenmez. Uygulama, kendi GA4 kurulumuyla yazılan `ykbconsent` önekli çerezleri aynı origin'de temizler. Eski GA kurulumu başka domain/path veya önek kullandıysa onun çerezlerini geçişte eski kapsamlarıyla ayrıca sonlandırın. Kentico editör önizlemesinde bileşen ve GA4 yüklenmez. [Google Basic Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [GA4 çerez yapılandırması](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)

## Yayın öncesi doğrulama

- Temiz bir profilde banner görünür. Opsiyonel düğmeler kapalı, zorunlu düğme açık ve değiştirilemez olmalı. Network panelinde Google ölçüm isteği bulunmamalı.
- Tümünü reddedin. Sonraki sayfada ikon görünmeli, tercih modala yansımalı, Google ölçüm isteği olmamalı ve panelde günlük ret sayacı bir artmalı.
- Yalnızca işlevsellik veya reklamı açın. Analytics isteği oluşmamalı. Yalnızca Analytics’i açtığınızda GA4 yüklenmeli, Google Consent Mode’daki reklam sinyalleri kapalı kalmalı.
- İkonu kullanarak Analytics’i kapatın. Bu origin’deki `ykbconsent` önekli GA çerezleri silinmeli, yeniden yüklenen sayfada Google isteği olmamalı. Aynı tercihi tekrar kaydedince sayaç artmamalı.
- İkinci bir tarayıcı profili, uzun CMS metni, 1024 px çevresi ve dar mobil ekranla kontrol edin. Eski politika sürümü ve Kentico önizlemesinde GA4'ün etkinleşmediğini doğrulayın.

Yerel JavaScript davranış testleri için `node --test CookieConsentTransfer/Tests/*.test.cjs` çalıştırılabilir.
