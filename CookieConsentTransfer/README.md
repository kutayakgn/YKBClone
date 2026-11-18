# Kentico Xperience 13 çerez tercihleri

Bu aktarım paketi asıl Xperience 13 **ASP.NET Core canlı site** projesi içindir. Razor ve CSS, gönderdiğiniz banner ve modalın sınıflarını, renklerini, yerleşimini ve responsive eşiklerini kullanır. Ubuntu font aileleri ve `.container` ölçüleri asıl sitenin temasından gelir. `cookie-icon.svg` dosyasını `wwwroot/assets/icons/cookie-icon.svg` yoluna eklediğinizde ilk tercihten sonra sol altta görünür.

## Kentico CMS panelinde yapılacaklar

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

**Short text** düz metin olarak, **Full text** CMS'deki HTML içeriğiyle gösterilir. Ekteki görünümü yakalamak için metinleri aynı paragraf ve bağlantı biçimiyle girin. Bu kayıtları düzenleme yetkisini ilgili içerik rolüyle sınırlandırın. Kurulum sırasında eksik alanlarda bileşenin Türkçe veya İngilizce varsayılan metinleri görünür. Ölçüm kimliğini eklemeden önce yayınlanacak metinleri CMS’de tamamlayın. [Xperience Consents](https://docs.kentico.com/13/configuring-xperience/data-protection/gdpr-compliance/working-with-consents)

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

Bileşen kültürü layout’taki `ViewData["Culture"]` değerinden, yoksa ASP.NET Core istek kültüründen alır. Yeni bir izin gerektiren metin veya kategori değişikliğinde canlı site ayarındaki `CookieConsent:PolicyVersion` değerini artırın. Geçerli sürüme ait tercih bulunana kadar banner yeniden açılır ve GA4 bekler. [Kentico resource strings](https://docs.kentico.com/13/multilingual-websites/setting-up-a-multilingual-user-interface/localizing-builder-components)

### 3. Karar tablosunu oluşturun

**Custom tables → New custom table** üzerinden tabloyu oluşturun. XML/DB alan adlarını aşağıdaki gibi girin.

- Display name **Çerez tercih kararları**
- Namespace **Ykb**, name **CookieConsentDecision**, code name **Ykb.CookieConsentDecision**
- Table name **customtable_YkbCookieConsentDecision**. Varsayılan şema `dbo` kabul edilir.
- **Include ItemGUID field** açık. Sihirbazın sunduğu kullanıcı damgası alanlarını (`ItemCreatedBy`, `ItemModifiedBy`) kapatabilirsiniz.
- Sihirbazdaki site seçimi veya tablonun **Sites** sekmesi üzerinden asıl siteyi atayın.

| Field name | Kentico data type | Boyut |
| --- | --- | --- |
| `SiteCodeName` | Text | 100 |
| `DecisionUtc` | Date and time | |
| `DecisionAction` | Text | 10 |
| `Outcome` | Text | 10 |
| `IsInitial` | Boolean (Yes/No) | |
| `FunctionalAllowed` | Boolean (Yes/No) | |
| `AnalyticsAllowed` | Boolean (Yes/No) | |
| `AdvertisingAllowed` | Boolean (Yes/No) | |
| `PolicyVersion` | Integer number | |

Tablo oluşturulunca [DecisionIndex.sql](Integration/DecisionIndex.sql) dosyasını veritabanı dağıtım adımı olarak bir kez çalıştırın. Aynı kaydetme isteği yeniden gönderilirse benzersiz olay GUID'i çift sayımı önler. Kentico **Custom table data → Çerez tercih kararları** üzerinden satırlar görüntülenebilir. [Custom tables kurulumu](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-custom-tables/creating-custom-tables)

### 4. Raporu ekleyin

1. **Reporting → Custom reports → New report** ile **Çerez tercihleri** raporunu açın.
2. **General → Tables → New** üzerinden **Günlük çerez kararları** tablosunu ekleyin. **Query** alanına [Reporting.sql](Integration/Reporting.sql) içeriğini yapıştırın. **Is stored procedure** kapalı, **Enable paging** açık olsun.
3. Tabloyu kaydedin. **General → Tables** listesinden tabloyu seçip **Insert** ile rapor gövdesine ekleyin ve raporu kaydedin. **View** sekmesinde sayıları kontrol edin.
4. **Permissions → Module → Reporting** üzerinden görüntüleyecek rollere **Read** verin. **Edit SQL queries** yetkisini raporu yöneten rolle sınırlandırın. Birden fazla canlı site aynı DB'yi paylaşıyor ve raporu gören roller farklıysa [Reporting.sql](Integration/Reporting.sql) sorgusuna ilgili site için `WHERE SiteCodeName = N'…'` ekleyip siteye özel rapor oluşturun. [Rapor ekleme](https://docs.kentico.com/13/configuring-xperience/working-with-system-reports/example-creating-a-simple-report), [Rapor yetkileri](https://docs.kentico.com/13/configuring-xperience/working-with-system-reports/reporting-security)

Rapor gün, site ve politika sürümü başına karar sayar. İlk seçim ve sonraki değişiklikler ayrı sütunlardadır. **Özel kaydetme** tıklanan eylemdir. Özel kaydetmede üç seçenek de kapatılırsa sonuç **Yalnızca zorunlu** sütununa girer. Aynı değerlerin tekrar kaydedilmesi yeni karar oluşturmaz. Ölçü birimi kaydedilen karardır. Tabloda IP, e-posta veya contact kimliği tutulmaz. DB kaydı başarısız olursa tercih yine tarayıcıya kaydedilir ve kayıt hatası uygulama loguna yazılır.

## Asıl projeye aktarım

1. Bu paketteki `Application`, `Infrastructure` ve `Web` dosyalarını asıl çözümdeki karşılık gelen projelere taşıyın. Web katmanındaki `Controllers`, `ViewComponents`, `Views` ve `wwwroot` klasörleri canlı siteye gider. Proje isim alanınız farklıysa `YkbYapikredi` isim alanlarını eşleyin. Razor için MVC tag helper’larının `_ViewImports.cshtml` içinde kayıtlı olduğundan emin olun. `CookieConsentModule` ayrı bir class library’deyse o assembly’de `[assembly: CMS.AssemblyDiscoverable]` tanımını kontrol edin. [Kentico modül başlatma](https://docs.kentico.com/13/custom-development/creating-custom-modules/initializing-modules-to-run-custom-code)
2. [ProgramRegistration.cs.example](Integration/ProgramRegistration.cs.example) içindeki servis kaydını uygulayın. Mevcut endpoint bloğu attribute route'ları eşliyorsa ek bir route kaydı gerekmiyor. Daha önce başka bir `POST /cookie/agree` varsa bu endpoint'i yeni controller ile değiştirin. [appsettings.json.example](Integration/appsettings.json.example) bölümünü canlı site yapılandırmasına ekleyin. Ölçümü açmak için GA4 web veri akışının `G-...` kimliğini girin.
3. [_Layout.cshtml örneğindeki Razor bloklarını](Integration/_Layout.cshtml.example) asıl `_Layout.cshtml` dosyasında belirtilen yerlere ekleyin. Diğer layout’lar aynı izni kullanıyorsa aynı blokları oraya da uygulayın. Sayfada zaten bulunan koşulsuz GA4/GTM yükleyicilerini ve üçüncü taraf izleme çağrılarını kontrol edin. Tek GA4 kurulumunun bu izin kontrolü üzerinden çalışmasını sağlayın. GA4'e bağlanan Google Ads hedefleri kullanılıyorsa mevcut tag ayarlarını da kontrol edin. Paketteki GA4 kodu reklam izni sinyallerini kapalı tutar. İşlevsellik ve reklam tercihi yeni entegrasyonlar için `CookieConsentSettings.Read(Context)` sonucundan ayrı ayrı okunabilir.
4. HTML yanıtı tercihe ve antiforgery token’ına bağlıdır. Layout `private, no-store` döndürür. Kentico `[CacheOutput]`, response/output cache, ters proxy ve CDN kurallarında bu HTML yanıtlarının cache dışında kaldığını doğrulayın ve yayın sırasında eski HTML cache’ini temizleyin. Font ve CSS dahil statik dosyalar önbelleğe alınabilir. [Kentico output caching](https://docs.kentico.com/13/developing-websites/developing-xperience-applications-using-asp-net-core/caching-page-output-in-asp-net-core-applications)
5. Canlı siteyi HTTPS üzerinden sunun. TLS ters proxy’de sonlanıyorsa uygulamanın HTTPS şemasını doğru algıladığını doğrulayın. Birden fazla uygulama örneği varsa aynı Data Protection anahtar deposunu ve uygulama adını kullanın. Bu depo yayında korunmalı. Tarayıcı tercihi yalnızca ilgili site ve politika sürümünde, 365 gün geçerlidir.
6. SVG’yi belirtilen yola ekleyin. Görünüm karşılaştırması için ekin kullandığı `ubuntu-regular`, `ubuntu-medium`, `ubuntu-bold` font ailelerinin asıl projede kayıtlı olduğunu doğrulayın.

GA4 **Basic Consent Mode** ile yüklenir. Layout, kaydedilmiş analiz izni varsa yerel GA başlatıcısını ekler. Rette, iznin geri alınmasında ve tercih sona erdiğinde başlatıcı sonraki sayfaya eklenmez. Uygulama, kendi GA4 kurulumuyla yazılan `ykbconsent` önekli çerezleri aynı origin'de temizler. Eski GA kurulumu başka domain/path veya önek kullandıysa onun çerezlerini geçişte eski kapsamlarıyla ayrıca sonlandırın. Kentico editör önizlemesinde bileşen ve GA4 yüklenmez. [Google Basic Consent Mode](https://developers.google.com/tag-platform/security/concepts/consent-mode), [GA4 çerez yapılandırması](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)

## Yayın öncesi doğrulama

- Temiz bir profilde banner görünür. Opsiyonel düğmeler kapalı, zorunlu düğme açık ve değiştirilemez olmalı. Network panelinde Google ölçüm isteği bulunmamalı.
- Tümünü reddedin. Sonraki sayfada ikon görünmeli, tercih modala yansımalı, Google ölçüm isteği olmamalı ve Kentico raporuna bir karar eklenmeli.
- Yalnızca işlevsellik veya reklamı açın. Analytics isteği oluşmamalı. Yalnızca Analytics’i açtığınızda GA4 yüklenmeli, Google Consent Mode’daki reklam sinyalleri kapalı kalmalı.
- İkonu kullanarak Analytics’i kapatın. Bu origin’deki `ykbconsent` önekli GA çerezleri silinmeli, yeniden yüklenen sayfada Google isteği olmamalı. Aynı tercihi tekrar kaydedince rapor artmamalı.
- İkinci bir tarayıcı profili, uzun CMS metni, 1424 px çevresi ve dar mobil ekranla kontrol edin. Eski politika sürümü ve Kentico önizlemesinde GA4'ün etkinleşmediğini doğrulayın.

Yerel JavaScript davranış testleri için `node --test CookieConsentTransfer/Tests/*.test.cjs` çalıştırılabilir.
