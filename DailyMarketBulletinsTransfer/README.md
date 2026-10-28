# Tarayıcı konsolundan indirme

İndirme kodu, deponun kökündeki **scripts/download-yapikredi-bulletins-browser.js** dosyasıdır. Kurulum veya terminal komutu gerekmez.

1. Masaüstü Chrome/Edge'de [rapor sayfasını](https://www.yapikredi.com.tr/yapi-kredi-blue-class/baska-turlu-bir-yatirim-mumkun-mu) açın.
2. F12 → Console bölümünde JS dosyasının tamamını yapıştırıp Enter'a basın. Konsol bağlamı ana sayfa (`top`) olmalı.
3. Sayfaya eklenen **Klasör seç ve indir** düğmesine tıklayın. Bir üst klasör seçip yazma izni verin.
4. Sayfayı açık tutun. İlerleme panelde/konsolda görünür. Gerekirse **Durdur** düğmesini kullanın.

Klasör seçicinin açılması gerçek tıklama gerektirdiği için script önce düğme ekler. [Chrome File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)

Seçtiğiniz klasörde `ykb-piyasa-bultenleri` oluşturulur:

- `reports.json`: Controller'a vereceğiniz manifest.
- `errors.json`: Listeleme ve dosya indirme hataları.
- `reports.resume.json`: Devam için önceki başarılı kayıtların önbelleği.
- `reports/`: PDF/DOCX dosyaları.

Filtre **01.01.1964–31.12.2028**, iki gün dahil. Getir düğmesinin `baska-turlu-bir-yatirim-mumkun-mu.aspx/LoadPlatinumMarketReleases` servisi kullanılır. Payload: `pageIndex`, `dateFrom=1964-01-01T00:00:00+03:00`, `dateTo=2029-01-01T00:00:00+03:00`, `type=Any`. Üst sınır ertesi günün başlangıcıdır; kayıt tarihleri ayrıca doğrulanır.

Sayfa/kayıt sayısı sabitlenmez. HTML pagination'ın son sayfasına kadar taranır. Tekrar dönen sayfa, eksik satır, pagination değişimi ve servis hataları raporlanır. Tarama sonunda ilk sayfa tekrar kontrol edilir; kaynakta eşzamanlı bütün değişikliklerin tespit edilmesi garanti edilmez.

Dosyalar içerikten PDF/DOCX olarak tanınır. Dosya adı ASCII karakterli, **uzantı dahil en fazla 50 karakterli** olur. Tarih ve deterministik hash eki farklı kayıtların çakışmasını önler. Bülten tipinin özgün Türkçe metni JSON'da korunur. Ağ hataları/429/geçici sunucu hataları yeniden denenir. Tek dosyanın hatası diğer indirmeleri durdurmaz. İlerleme düzenli aralıklarla JSON'a kaydedilir.

Her çalıştırmada kaynak liste **1. sayfadan başlayarak yeniden taranır** ve `reports.json` güncel kayıtlardan baştan oluşturulur. Eski JSON'un indirme durumu dosyanın var olduğuna dair kanıt sayılmaz. Diskteki PDF/DOCX dosyaları mevcut, deterministik adlarıyla bulunur; geçerli dosyaların boyutu, içerik türü ve SHA-256 değeri yeni JSON'a yazılır. Yalnızca eksik veya bozuk belgeler indirilir. Dosya adı algoritması önceki sürümle aynıdır.

**Eski JSON eksik, yarım veya bozuk olsa da mevcut sağlam belgeler tekrar indirilmez.** Geçerli eski hash bilgisi varsa içerik değişikliği de kontrol edilir. Eski hash bilgisi yoksa PDF/DOCX yapısı kontrol edilir ve yerel dosyadan yeni hash hesaplanır; bu, kaynak dosyanın sunucuda değişmediğini kanıtlamaz. Bozuk JSON için uyarı verilir ve veri kaynaktan yeniden kurulur. `reports.resume.json` yardımcı önbellektir; devam etmek için zorunlu değildir.

Devam etmek için **aynı üst klasörü** seçin. Doğrudan mevcut `ykb-piyasa-bultenleri` klasörünü seçmek de desteklenir; içine ikinci kez aynı klasör açılmaz. Önceki sürüm çalışıyorsa Durdur'u kullanın veya sayfayı yenileyip yeni scripti yapıştırın. Aynı klasöre birden fazla sekmeden aynı anda yazmayın.

Belgeler varsayılan olarak **4 paralel işçiyle** kontrol edilir/indirilir. İndirmeler sürerken JSON yazıları sırayla ve aralıklı yapılır; bitişte ve durdurmada son durum mutlaka beklenir. Bu, her dosyada büyük JSON'u tekrar yazma yükünü de azaltır. Sayfa/sekme kapanmasından önce dosya kaydedilmiş ama JSON'a henüz işlenmemişse, sonraki çalıştırma bu dosyayı da klasörden bulur. Gerekirse scriptin başındaki `DOWNLOAD_CONCURRENCY` değeri değiştirilebilir; varsayılan 4 ile başlayın. Paneldeki “mevcut dosya” sayısı yeniden indirilmeden kullanılan belgeleri gösterir.

Çevrimdışı bağlantı algılandığında beklenir ve bağlantı yeniden denenir; diğer geçici ağ hataları için yeniden deneme yapılır. Tarayıcının çevrimiçi bilgisi sunucu erişimini garanti etmediğinden gerçek istekler de kontrol edilir. [Navigator.onLine davranışı](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)

Sayfayı açık tutun; gerekirse Durdur'u kullanın. Konsoldan durum `window.ykbBulletinExport`, durdurma `window.ykbBulletinExport.stop()` ile erişilebilir. Kalıcı HTTP/CORS veya dosya yazma hataları ayrıca raporlanır. Kentico controller'ına yalnızca listelemesi tamamlanmış ve dosya kontrolleri başarılı son `reports.json` dosyasını verin.

# Kentico hedefi: YapikrediMedia/GunlukTumPiyasaBultenleri

`reports/` içindeki dosyaları **YapikrediMedia/GunlukTumPiyasaBultenleri** medya klasörüne taşıyın. Dosya adlarını ve içeriklerini değiştirmeyin. `reports` klasörünü araya eklemeyin; dosyalar doğrudan `GunlukTumPiyasaBultenleri` içinde olmalı.

`Web/Controllers/DailyMarketBulletinsImportController.cs` dosyasını gerçek **Kentico Xperience 13 ASP.NET Core** web projenizin Controllers klasörüne kopyalayın. Generated custom table sınıfını değiştirmeyin. MVC 5/System.Web controller'ı değildir.

Controller'ın varsayılan URL klasörü, paylaştığınız gerçek dosya yoluna göre ayarlanmıştır:

```csharp
private const string MediaPhysicalFolder = "";
private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri";
```

Örnek dosya URL'si:

```text
/YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri/2014-11-13-gunluk-13112014-18179-7e6c19263c09.pdf
```

Custom table adı **YkbYapikredi.DailyAllMarketBullettins** olarak kalır. Custom table adı ile medya alt klasörünün aynı olması gerekmez. Önceki örnekteki `Yapikredi` öneki ve `DailyAllMarketBullettins` medya klasörü sizin gerçek URL'nizle uyuşmuyordu; varsayılan değer düzeltildi.

**URL, diskteki tam klasör yolu değildir.** `MediaPhysicalFolder` boşsa controller, URL'nin uygulamaya göre kalan yolunu `WebRootPath` (genellikle wwwroot) ve `ContentRootPath` altında kontrol eder. Aynı fiziksel adaylar tekilleştirilir. Tek bir mevcut aday varsa kullanılır; hiçbiri yoksa veya iki farklı aday da mevcutsa klasör tahmin edilmez. GET ekranındaki ve ön kontrol yanıtındaki **YolTeshisi** bölümünde uygulama kökleri, `PathBase`, denenen klasörler, varlık durumları ve seçilen klasör gösterilir. Bu kök ayrımı için [Microsoft statik dosya belgeleri](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files?view=aspnetcore-8.0) incelenebilir.

Dosyalar ayrı Kentico yönetim uygulamasında, paylaşımlı klasörde veya özel statik dosya eşlemesindeyse `MediaPhysicalFolder` değerini **controller'ın çalıştığı makinedeki gerçek tam disk yoluna** ayarlayın. Örnek (kendi yolunuzla değiştirin):

```csharp
private const string MediaPhysicalFolder = @"D:\KenticoCMS\YkbYapikredi\media\YapikrediMedia\GunlukTumPiyasaBultenleri";
```

Bu sabite `/YkbYapikredi/media/...` URL'sini yazmayın; Windows üzerinde `D:\...` veya erişilebilen paylaşım yolu gibi gerçek fiziksel yol gerekir. PDF'nin başka sunucuda tarayıcıdan açılması, controller'ın o dosyayı yerel diskinde okuyabildiği anlamına gelmez. Yeni varsayılan URL `/` ile başladığından uygulamanın PathBase'i ikinci kez URL'ye eklenmez. Uygulama altında kalan root-relative URL'nin PathBase kısmı fiziksel köklere eklenirken çıkarılır; başka uygulamaya ait URL'lerde açık fiziksel yol gerekir. İsterseniz `~/...` uygulama-relative URL biçimi de desteklenir.

Controller fiziksel dosyaları eşleştirir; CMS medya veritabanı kaydı şart değildir. Dosya yüklemez/indirmez/medya kaydı açmaz. `Pdf` alanına doğrudan dosya URL'si yazar. Web sunucunuzun o URL'den hem PDF hem DOCX sunduğunu örnek bağlantıyla kontrol edin. JSON herkese açık medya klasörüne konulmaz; formdan seçilir.

Tablo: **YkbYapikredi.DailyAllMarketBullettins**. Alanlar: **Date**, **BulletinType**, **Pdf**. Paylaştığınız generated sınıf esas alınır; eski feed örneğindeki BultenTipi kullanılmaz. Pdf, bağlantı tutan Text alanıdır; DOCX bağlantısı da saklanabilir.

1. Gerçek Kentico uygulamasını CMS bağlantısıyla Development ortamında localhost'ta çalıştırın.
2. `/local-tools/daily-market-bulletins-import` adresini açın.
3. Tam indirme çıktısının **reports.json** dosyasını seçip **Ön kontrol** yapın.
4. Eşleşmeler doğruysa aynı JSON ile **Veritabanına aktar** düğmesini kullanın.
5. CMS kayıtlarını ve bağlantıları kontrol edin. İşlem sonunda geçici controller'ı kaldırın.

Standart AddControllersWithViews ve controller route eşlemesi yeterlidir; attribute route'lar eşlenmiyorsa app.MapControllers() veya projenizin karşılığını ekleyin. GET/ön kontrol yazmaz. Development ve localhost dışındaki erişim 404 alır; POST antiforgery kullanır.

JSON eşleştirmesi: `records[].date → Date`, `bulletinType → BulletinType`, `fileName → hedef klasörde dosya adı → Pdf`. `sha256`/`byteLength` dosya doğrulaması; `sourceUrl`/`sourcePage` kaynak takibi; `status`/`error` indirme sonucu; `listingComplete`/`listingErrors` listeleme sonucudur.

Tam listeleme zorunludur. Başarısız indirmeler varsayılan olarak aktarımı durdurur; formda **İndirilemeyen kayıtları açıkça atla** seçilirse yalnızca `status=failed` olanlar atlanabilir. Bildirdiğiniz 11 başarısız indirmeyi dışarıda bırakmak isterseniz bu seçeneği işaretleyin. `reports.json` dosyasını kullanın; `errors.json` veya `reports.resume.json` aktarım manifesti değildir. Başarılı görünen dosya eksik/hash/boyut hatalıysa atlama seçeneği bunları gizlemez; hiçbir satır yazılmaz. Dosya adları birebir eşleşir. Mevcut **Date + BulletinType + Pdf** tekrar eklenmez; aynı gün/tipte farklı dosyalar korunur. Mevcut satırlar güncellenmez/silinmez. Ekleme tek CMSTransactionScope içindedir; DB hatasında geri alınır. Event handler'larının harici yan etkileri SQL transaction kapsamı dışındadır. Aynı anda tek uygulama sürecinden aktarın.

Tarayıcı scripti için JSON'suz kurtarma, bozuk JSON, eksik/bozuk dosya, paralel indirme sınırı, JSON yazma sırası, çevrimdışı bekleme ve durdurma dahil 23 otomatik kontrol geçti. Bu testlerde DOM ve dosya seçici benzetimleri kullanıldı; gerçek klasör seçici açılmadı ve tüm arşiv bu bilgisayara indirilmedi.

Controller ASP.NET Core 8 ve küçük CMS API stub'larıyla derlendi; önceki 16 aktarım kontrolüne ek olarak fiziksel kökler, PathBase, ayrı CMS klasörü, paylaştığınız PDF yolu, 11 başarısız indirme ve eksik dosya teşhisi dahil 19 yeni kontrol geçti (toplam 35). Gerçek Kentico DLL/veritabanı bulunmadığından hedef CMS entegrasyonu kendi çözümünüzde doğrulanmalıdır.

Kaynaklar: [Kentico custom table API](https://docs.kentico.com/13api/content-management/custom-table-data), [CMSTransactionScope](https://devnet.kentico.com/docs/13_0/api/html/T_CMS_DataEngine_CMSTransactionScope.htm).
