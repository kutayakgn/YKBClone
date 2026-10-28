# Anlaşmalı projeler: tarayıcı konsolu ve Kentico aktarımı

İki bağımsız dosya kullanılır. Kurulum veya ZIP gerekmez:

- Deponun kökündeki `scripts/download-yapikredi-contracted-projects-browser.js`: Chrome/Edge tarayıcı konsolu içindir.
- `Web/Controllers/ContractedProjectsImportController.cs`: gerçek **Kentico Xperience 13 ASP.NET Core** Web projenize kopyalanır.

Generated `ContractedProjectsItem` sınıfı değiştirilmez. Hedef sınıf **`YkbYapikredi.ContractedProjects`**; alanlar **ProjectName, FirmName, Image, District, City, WebsiteUrl, Branch, Phone** olarak aynen kullanılır. SQL tablo adı yerine class code name kullanılır.

## 1. Tarayıcı konsolunda çalıştırma

1. Masaüstü Chrome/Edge'de [Anlaşmalı Projelerimiz](https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/) sayfasını açın.
2. F12 → Console alanına JS dosyasının **tamamını** yapıştırıp Enter'a basın. Çalışma bağlamı ana sayfa (`top`) olmalı.
3. Sayfaya eklenen **Klasör seç ve indir** düğmesine basın. Bir üst klasör seçip yazma izni verin.
4. Sayfayı açık tutun. İlerleme panelde ve konsolda görünür; gerekirse **Durdur** düğmesini kullanın.

Scriptin konsola yapıştırılması yalnızca paneli kurar. Klasör seçimi/indirme gerçek düğme tıklamasıyla başlar. Dosyalar seçilen üst klasör altında tutulur:

```text
ykb-anlasmali-projeler/
  projects.json          # Controller'a vereceğiniz manifest
  errors.json            # Listeleme/görsel hataları ve uyarılar
  projects.resume.json   # Yardımcı devam önbelleği
  images/                # İndirilen görseller
```

Doğrudan mevcut `ykb-anlasmali-projeler` klasörünü seçmek de desteklenir. `projects.json` ve görseller aynı çalışmanın çıktısından kullanılmalı.

Servis:

```text
POST https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/default.aspx/GetProjectList
```

```json
{
  "cityId": null,
  "districtId": null,
  "projectName": "",
  "companyName": "",
  "pageIndex": 1
}
```

Sayfadaki mevcut filtre seçimi kullanılmaz; bu payload ile tüm iller/ilçeler/firmalar/projeler alınır. `d.Data` içindeki `.item-ap` kartları ve HTML pagination okunur. Sayfa sayısı sabitlenmez. Yinelenen sayfa/kayıt, hatalı yanıt ve sayfa numarası uyuşmazlığı eksiksiz listeleme sayılmaz. Liste sonunda ilk sayfa yeniden kontrol edilir; kaynağın işlem sırasında değişmesi hata raporuna girer.

## Alanların ayrılması

| Kaynak | JSON | Kentico alanı |
|---|---|---|
| Kart başlığı | `projectName` | `ProjectName` |
| Firma Adı | `firmName` | `FirmName` |
| Adres, `/` öncesi | `city` | `City` |
| Adres, `/` sonrası | `district` | `District` |
| Web bağlantısı | `websiteUrl` | `WebsiteUrl` |
| İlgili Şube / Tel, ilk telefon öncesindeki tüm şubeler | `branch` | `Branch` |
| İlk telefondan sonraki tüm telefonlar ve açıklamaları | `phone` | `Phone` |
| Yerel görsel adı | `imageFileName` | Hedef medya URL'si üretilerek `Image` |

**Bir proje kartı bir satırdır.** Birden fazla firma/şube/telefon aynı metinde korunur. Örneğin `Bahçeşehir Şubesi / Hadımköy Şubesi / (0212)... / (0212)...` metninde iki şube de `Branch` alanında kalır. Telefonlar sayı türüne çevrilmez. Kaynaktaki ham `addressText` ve `branchPhoneText` JSON'da da saklanır; tahmin gerektiren ayrımlar uyarılır. Proje/firma/şube/telefon metinleri kısaltılmaz; Kentico alan uzunluğu yetersizse ön kontrol hangi alanın sınırı aştığını gösterir. 50 karakter sınırı yalnızca görsel dosya adları içindir.

## Görseller, hız ve devam

Görselin gerçek `data-src`/`src` adresi kullanılır; şeffaf yer tutucu indirilmez. Uzantı URL'den tahmin edilmez, içerikten belirlenir. Dosya adları ASCII ve **uzantı dahil en fazla 50 karakter** olur. Deterministik hash eki çakışmaları önler. Aynı görsel URL'sini paylaşan projeler aynı yerel dosyaya bağlanır; görsel tek kez indirilir.

Görseller varsayılan olarak dört paralel işçiyle işlenir. İstek zaman aşımı/yeniden deneme ve çevrimdışı bağlantıyı bekleme vardır. Kalıcı HTTP/CORS veya bozuk görsel hataları kaydedilir, diğer kayıtlar işlenir. Hata halinde tarayıcının güvenlik ayarlarını kapatmayın.

Her çalıştırmada proje listesi yeniden taranır ve manifest yeniden oluşturulur. Klasördeki mevcut sağlam görseller kullanılır; yalnızca eksik/bozuk olanlar indirilir. Eski JSON eksik veya bozuk olsa da deterministik isimler üzerinden mevcut görseller bulunabilir. Eski SHA-256 mevcutsa kontrol edilir; eski hash yoksa görselin geçerliliği kontrol edilir ve yerel içerikten yeni hash hesaplanır. Bu, sunucudaki görselin sonradan değişmediğini garanti etmez.

Metadata yazıları sırayla yapılır. Durdur düğmesi aktif istekleri iptal eder, işçilerin tamamlanmasını ve son JSON kaydını bekler. Sekme kapanmadan önce dosya diske yazılıp JSON'a henüz işlenmemişse sonraki çalıştırma dosyayı yine bulabilir. Aynı klasöre farklı sekmelerden aynı anda yazmayın. Durum: `window.ykbContractedProjectsExport`; durdurma: `window.ykbContractedProjectsExport.stop()`.

## 2. Görselleri Kentico'ya taşıma

Seçtiğiniz medya hedefi **YapikrediMedia/AnlasmaliProjeler** olarak ayarlanmıştır:

```text
/YkbYapikredi/media/YapikrediMedia/AnlasmaliProjeler/<gorsel-adi>
```

Bu hedefi CMS'nizde kullanacağınız gerçek klasöre göre ayarlayın. `images/` klasörünün **içindeki dosyaları** bu medya klasörüne taşıyın; araya `images` adlı alt klasör eklemeyin. İsim ve içerikleri değiştirmeyin. JSON'u herkese açık medya klasörüne koymanız gerekmez.

Controller başındaki ayarlar:

```csharp
private const string MediaPhysicalFolder = "";
private const string MediaVirtualFolder = "/YkbYapikredi/media/YapikrediMedia/AnlasmaliProjeler";
```

Fiziksel ayar boşsa `WebRootPath` ve `ContentRootPath` altında URL'ye karşılık gelen klasörler kontrol edilir. Tek bir mevcut aday kullanılır; iki aday mevcutsa veya hiçbiri yoksa rastgele seçim yapılmaz. GET/ön kontroldeki **YolTeshisi** kökleri, PathBase'i, adayları ve seçilen tam disk yolunu gösterir. Ayrı CMS/IIS uygulaması veya paylaşımlı depolama için gerçek tam fiziksel klasörü açıkça yazın; örnek:

```csharp
private const string MediaPhysicalFolder = @"D:\KenticoCMS\YkbYapikredi\media\YapikrediMedia\AnlasmaliProjeler";
```

Bu sabite URL değil, controller'ın çalıştığı makineden erişilen disk/UNC yolu yazılır. Web sunucusunun aynı dosyaları yapılandırılan URL'den sunduğunu örnek görselle kontrol edin.

Dosyaların CMS medya veritabanına kaydedilmesi zorunlu değildir. Controller yerel dosyaları doğrulayıp `Image` alanına doğrudan dosya URL'sini yazar; medya dosyası indirmez/yüklemez ve `getmedia/{guid}` üretmez. `Image` URL tutan Text alanı olmalıdır.

## 3. Controller ile ön kontrol ve aktarım

1. Controller'ı gerçek Kentico 13 **ASP.NET Core** Web projenizin Controllers klasörüne kopyalayın; gerekiyorsa namespace'i uyarlayın.
2. CMS bağlantılı uygulamayı Development ortamında localhost'ta çalıştırın.
3. `/local-tools/contracted-projects-import` adresini açın.
4. Tam çıktıdaki **projects.json** dosyasını seçip **Ön kontrol** yapın.
5. Alanları, örnek görsel URL'lerini ve sayaçları inceleyin. Hata yoksa aynı JSON ile **Veritabanına aktar** düğmesini kullanın.
6. CMS'de bir proje kaydını ve `Image` bağlantısını kontrol edin. İşlem sonunda geçici controller'ı kaldırın.

Standart MVC/antiforgery servisleri ve attribute controller route eşlemesi gerekir. Gerekirse `app.MapControllers()` veya projenizin karşılığını ekleyin. GET ve ön kontrol yazma yapmaz. Yerel Development dışında 404 döner.

Tam listeleme zorunludur. `imageStatus=downloaded` için tam ad, boyut ve SHA-256 doğrulanır; eksik/değişmiş başarılı dosya tüm yazmayı durdurur. Kaynakta zaten görsel bulunmayan `missing` kayıt `Image` boş ve uyarıyla aktarılır. İndirme hatası olan `failed` kayıt varsayılan olarak aktarımı engeller; formda açıkça seçilirse proje korunarak **Image boş** aktarılabilir. `pending` tamamlanmış indirme sayılmaz.

Proje kimliği `ProjectName + FirmName + City + District + Branch + Phone + WebsiteUrl` alanlarıdır; görsel kimliğe dahil değildir. Mevcut aynı proje tekrar eklenmez; farklı görsel varsa uyarılır ve mevcut kayıt değiştirilmez. Aynı kimlikteki çelişkili JSON satırları hatadır. Bu **insert** aracıdır; mevcut veriyi güncellemez/silmez. Önce boş görselle aktardıysanız sonradan bulunan görseli mevcut satırda ayrıca güncellemeniz gerekir. Değişen metin alanları yeni kimlik sayılabilir.

Kayıtlar tek `CMSTransactionScope` içinde eklenir; DB hatasında geri alınır. Kentico event handler'larının harici yan etkileri SQL transaction kapsamında değildir. Aynı anda tek uygulama sürecinden aktarın.

## Doğrulama sınırı

Kaynak liste servisi ve kullanıcı tarafından verilen HTML cevabı incelendi. Tarayıcı scriptinin 15 otomatik kontrolü geçti; bunlar alan ayrımı, gerçek kaydedilmiş sayfa cevapları, görsel hata/tekrar kullanım, ortak görsel, dört paralel indirme, JSON yazma sırası ve durdurmayı kapsar. Testlerde DOM, klasör seçici ve görsel çözme benzetimleri kullanıldı. Görseller indirilmedi, gerçek klasör seçici/aktarım çalıştırılmadı.

Controller ASP.NET Core 8 ve küçük CMS API stub'larıyla derlendi; 33 davranış kontrolü geçti. YKBClone önizleme derlemesi de hatasız geçti. Bu depoda Kentico DLL/veritabanı bulunmadığından gerçek CMS derlemesi ve aktarımı hedef çözümünüzde doğrulanmalıdır.

Kaynaklar: [Anlaşmalı Projelerimiz](https://www.yapikredi.com.tr/kredi/anlasmali-projelerimiz/), [Kentico custom table API](https://docs.kentico.com/13api/content-management/custom-table-data), [Chrome File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).
