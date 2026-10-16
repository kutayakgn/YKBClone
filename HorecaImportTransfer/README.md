# Kentico 13 Horeca restoran aktarımı

Bu paket **Kentico Xperience 13 ASP.NET Core canlı site projesi** içindir. Buradaki YKBClone bir net10 önizleme projesidir ve Kentico DLL'leri içermez. Controller önizleme derlemesinden çıkarılmıştır. `Web/Controllers/HorecaImportController.cs` dosyasını gerçek Kentico çözümünün Web projesindeki `Controllers` klasörüne kopyalayın. Ayrı bir servis, Razor view veya generated custom table sınıfı gerekmez.

## CMS'de custom table

Custom tables uygulamasında aşağıdaki sınıfı oluşturun:

- Display name: **Horeca Restaurants**
- Class code name: **`YkbYapikredi.HorecaRestaurants`**
- Hedef siteye atayın. Controller sınıf code name'i kullanır; SQL tablo adını değil.

Alanların **Field name** değerleri İngilizcedir. Caption'ları isterseniz Türkçe verebilirsiniz. Kentico'nun oluşturduğu `ItemID`, `ItemGUID` gibi standart alanları ayrıca oluşturmayın/değiştirmeyin.

| Field name | Caption önerisi | Data type | Size | Form control | Required | JSON kaynağı |
|---|---|---|---|---|---|---|
| `RestaurantName` | Restoran adı | Text | 250 | Text box | Evet | `restoranAdi` |
| `Address` | Açık adres | Long text | — | Text area | Hayır | `acikAdres` |
| `City` | İl | Text | 50 | Drop-down list | Hayır | `il` |
| `PhoneNumber` | Telefon | Text | 250 | Text box | Hayır | `telefonNumarasi` |
| `Website` | Web sitesi | Text | 1000 | Text box | Hayır | `websitesi` |
| `BranchName` | Şube adı | Text | 250 | Text box | Hayır | `subeAdi` |
| `Media` | Görsel | Text | 1000 | **Media selection** | Hayır | Eşleşen CMS medya kaydından üretilir |

JSON'daki `gorselAdi` yalnızca CMS görselini eşleştirmek için kullanılır; dosya adını tutan ayrı bir custom table alanı oluşturulmaz. `Media`, seçicinin beklediği medya bağlantısını tutar. `Media` alanını GUID ya da File veri türünde oluşturmayın. Standart **Media selection**, media GUID'sinden üretilmiş bir bağlantı saklar; controller bu değeri `MediaFileURLProvider.GetMediaFileUrl(file.FileGUID, fileName)` ile üretir. Projede özel bir GUID selector kullanılıyorsa bu paket onu hedeflemez.

Telefon alanını sayı yapmayın: baştaki sıfırlar, `+90` ve birden fazla telefon metin olarak korunmalıdır. Adres, telefon, web sitesi, şube veya görsel bulunmayan kayıtlar için ilgili alanlar boş bırakılır.

## City dropdown: Türkiye'nin 81 ili

`City` alanında:

1. Form control: **Drop-down list**.
2. Data source: **List of options**.
3. Options/Data source metin kutusuna `city-dropdown-options.txt` dosyasının tamamını yapıştırın.
4. Default value: boş; allow empty/ilk seçenek: **Seçiniz**.

Dosya bir boş seçenek ve 81 ilin tamamını içerir. Biçim `değer;görünen metin` şeklindedir. Örneğin `İstanbul;İstanbul`: veritabanına plaka numarası değil JSON ile aynı il adı yazılır. Controller dolu il değerlerini 81 il listesine göre doğrular ve standart yazılışa çevirir. Kaynakta `null` olan il boş kalır ve ön kontrolde uyarılır.

## Görselleri CMS'ye yükleme

1. Doğru sitenin **Media libraries** uygulamasını açın.
2. Kütüphanenin **code name** değerini `YapikrediMedia` olarak ayarlayın/kontrol edin. Display name ya da fiziksel klasör adı tek başına yeterli değildir.
3. Kütüphanenin içinde `Horeca` adlı klasör oluşturun.
4. Yerel `gorseller` klasörünün **içindeki dosyaları doğrudan Horeca içine** yükleyin. Araya `gorseller` adında ek klasör açmayın.
5. Dosyaları CMS medya arayüzünden yükleyin/import edin; yalnızca diske kopyalamak medya veritabanı kaydı oluşturmaz.

Örnek: JSON `ali-ocakbasi.webp` diyorsa CMS'deki dosyanın kütüphane içi `FilePath` değeri `Horeca/ali-ocakbasi.webp` olmalıdır. Eşleştirme dosya uzantısı dahil tam adla yapılır, büyük/küçük harf farkı gözetilmez. Başka bir klasördeki aynı adlı dosya seçilmez. `Horeca` altındaki ek alt klasörler taranmaz.

WebP'ye dönüştürdüyseniz **dönüştürme çıktısındaki güncellenmiş restoranlar.json** dosyasını kullanın. CMS yüklemede dosya adlarını değiştirmeyin; örneğin CMS `logo-1.webp` üretmişken JSON `logo.webp` kalırsa ön kontrol eşleşme hatası verir. Eksik/eşleşmeyen görsel olduğunda hiçbir kayıt eklenmez. JSON'da zaten boş/null olan `gorselAdi` ise hata değildir; `Media` boş bırakılır.

## Controller'ı çalıştırma

Controller'ın başındaki üç sabit:

```csharp
private const string TableClassName = "YkbYapikredi.HorecaRestaurants";
private const string LibraryCodeName = "YapikrediMedia";
private const string Folder = "Horeca";
```

Sizin CMS code name'leriniz farklıysa yalnızca bu sabitleri değiştirin. Namespace varsayılanı `YkbYapikredi.Web.Controllers`; gerekiyorsa gerçek Web projenizin namespace'ine uyarlayın.

1. Gerçek Kentico **ASP.NET Core Web projesini** Development ortamında localhost üzerinde çalıştırın. Normal Kentico servisleri/DB bağlantısı zaten yapılandırılmış olmalı; bu controller ayrı bir Kentico başlatma kodu içermez.
2. Uygulamanızın mevcut origin'i üzerinde `/local-tools/horeca-import` adresini açın. Örnek: `https://localhost:5001/local-tools/horeca-import` (portu kendi projenize göre değiştirin).
3. **Site code name** kutusunu hedef sitenin code name'i ile doldurun; medya kütüphanesi bu site içinde aranır. Varsayılan, mevcut Kentico site context'inden gelir.
4. JSON dosyasını seçin, **Ön kontrol** düğmesine basın.
5. JSON raporunda `hatalar` boş olmalı. `ornekler` içinde restoran, şube, il, dosya adı ve üretilen medya bağlantısı görünür. `uyarilar` kaynakta olmayan adres/il/görselleri listeler.
6. Tarayıcıda geri dönün, gerekiyorsa aynı JSON'u tekrar seçin ve **Aktar** düğmesine basın.
7. Başarılı yanıtta `durum: Tamamlandı`, `eklenen` sayısı ve diğer sayaçlar görünür. CMS Custom table data ekranından bir şubeyi açıp Media alanındaki önizlemeyi kontrol edin.
8. İşlem bitince controller'ı gerçek projeden kaldırın.

Standart ASP.NET Core `AddControllersWithViews()` ve controller endpoint eşlemesi yeterlidir; yeni servis kaydı yoktur. Mevcut uygulamada attribute controller route'ları eşlenmemişse endpoint yapılandırmasına `endpoints.MapControllers()` / `app.MapControllers()` ekleyin. MVC 5/System.Web controller'ı değildir; ASP.NET Core projesine kopyalanmalıdır.

Sayfayı GET ile açmak kayıt eklemez. Yazma yalnızca antiforgery token içeren POST'ta `apply=true` ile yapılır. Controller Development ve loopback istemci adresi koşullarını kontrol eder; başka ortamlarda 404 döner. IIS Express localhost kullanımını destekler. Development olmayan launch profile veya uzak bağlantı 404 alır.

## Tekrar çalıştırma ve hata davranışı

- Her restoran/şube ayrı bir custom table satırıdır. Aynı logoyu kullanan şubeler aynı medya bağlantısını kullanır.
- JSON'daki her geçerli satır yeni kayıt olarak eklenir; kaynak içindeki aynı restoran/şube satırları da korunur.
- Bu tek seferlik bir **insert** aktarımıdır; CMS'deki mevcut içerikler güncellenmez/silinmez. Aynı JSON'u yeniden aktarmak aynı kayıtları yeniden ekler.
- Ön kontrolde tek bir hata bile varsa hiçbir satır yazılmaz (HTTP 422).
- Ekleme işlemleri tek `CMSTransactionScope` içinde yapılır. Eklemede hata çıkarsa veritabanı eklemeleri rollback edilir; parçalı veri bırakılmaz. Projenizde ayrıca kayıt olaylarında çalışan harici servisler varsa onların yan etkileri SQL transaction kapsamında değildir.
- Uygulama içindeki eşzamanlı istekler aynı kilitle sıraya alınır. Bu, tek localhost uygulaması için tasarlanmıştır; çok sunuculu bir toplu aktarım sistemi değildir.

## Doğrulama ve sınırlar

C# sözdizimi parser kontrolü hatasız geçti. Yedi JSON eşleştirmesi, yedi İngilizce CMS alanı, 81 il seçeneği ve 513 kayıtlık kaynak üzerinde alan uzunlukları/il uyumu kontrol edilmiştir. Bu çalışma alanında .NET SDK/Kentico DLL'leri/bağlantılı CMS veritabanı bulunmadığından controller burada derlenip gerçek veritabanına çalıştırılmamıştır. Gerçek Kentico 13 çözümünüzde build ve ön kontrol yapın. Kullanılan eski static provider çağrıları bazı Kentico 13 hotfix sürümlerinde obsolete uyarısı verebilir; bunlar repo içindeki diğer aktarım örnekleriyle aynı API ailesidir.

Hedef projede kontrol edilecek senaryolar: doğru tek kayıt/şube; aynı JSON'u iki kez aktarma; eksik medya dosyası; aynı dosya adının başka kütüphanede olması; geçersiz il; null görsel; insert sırasında hata ve rollback. Aktarım sayacıyla CMS kayıt sayısı farkını karşılaştırın.

Kaynaklar:

- [Kentico 13 custom table ekleme API'si](https://docs.kentico.com/13api/content-management/custom-table-data)
- [Media selection: Text alanında bağlantı saklama](https://docs.kentico.com/13/configuring-xperience/configuring-the-environment-for-content-editors/configuring-media-libraries/allowing-users-to-insert-media-links-in-page-fields)
- [MediaFileURLProvider.GetMediaFileUrl(Guid, String)](https://devnet.kentico.com/docs/13_0/api/html/M_CMS_MediaLibrary_MediaFileURLProvider_GetMediaFileUrl_1.htm)
- [Kentico 13 dropdown options biçimi](https://docs.kentico.com/13/custom-development/extending-the-administration-interface/developing-form-controls/inheriting-from-existing-form-controls)
- [CMSTransactionScope](https://devnet.kentico.com/docs/13_0/api/html/T_CMS_DataEngine_CMSTransactionScope.htm)
