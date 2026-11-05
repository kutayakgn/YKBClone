# En yeni piyasa bültenine yönlendirme

`LatestDailyBulletinMiddleware.cs` dosyasını gerçek Kentico Xperience 13 ASP.NET Core web projenizin `Middleware` klasörüne kopyalayın. Dosya middleware sınıfını ve kayıt için gereken extension metodunu birlikte içerir.

Program.cs veya Startup.cs dosyasının başına ekleyin:

```csharp
using YkbYapikredi.Web.Middleware;
```

Mevcut Kentico başlangıç sırasını koruyarak, `UseKentico()` çağrısından sonra ve endpoint'ler çalıştırılmadan önce şu satırı ekleyin:

```csharp
app.UseLatestDailyBulletin();
```

Örneğin mevcut Kentico pipeline'ınızda:

```csharp
app.InitKentico();
app.UseStaticFiles();
app.UseKentico();

app.UseLatestDailyBulletin(); // Yeni satır

// Mevcut cookie/authentication/authorization ve endpoint ayarlarınız devam eder.
```

Kentico'nun `InitKentico → UseStaticFiles → UseKentico` bloğunun arasına middleware eklemeyin. Mevcut `UseResponseCaching`, `UseOutputCache` veya özel yönlendirme/terminal middleware'i varsa bu kısayol middleware'ini onlardan önce yerleştirin. `UsePathBase` kullanıyorsanız mevcut uygulama kökü ayarınız middleware'den önce uygulanmış olmalıdır.

Ek servis kaydı veya NuGet paketi gerekmez. Kentico hizmetleri/bağlantısı mevcut uygulamanız tarafından kurulmuş olmalıdır. Bu dosya temizleme veya import işlemi yapmaz; tek bir son kayıt okur.

## Davranış

- Yol: `/yapi-kredi-blue-class/gunluk-bulten`. Sondaki `/` ve büyük/küçük harf farklılıkları desteklenir. Diğer yollar sonraki middleware'e bırakılır.
- Tablo: `YkbYapikredi.DailyAllMarketBullettins`.
- Tarihi ve `Pdf` alanı dolu kayıtlardan `Date DESC, ItemID DESC` sırasındaki ilk kayıt seçilir. Bülten tipine göre filtre uygulanmaz. Aynı tarihte iki kayıt varsa büyük `ItemID` seçilir.
- Yeni kayıt her istekte yeniden sorgulanır. Yeni PDF kaydı eklendiğinde uygulamayı yeniden başlatmak gerekmez.
- Yanıt `302` ve `Cache-Control: no-store, no-cache, max-age=0, must-revalidate` başlıklarıyla döner. Tarayıcı kısayolu kalıcı olarak eski PDF'e bağlamaz.
- `Location` yalnız yerel yol içerir; isteğin geldiği domain, protokol ve port tarayıcı tarafından korunur. `Pdf` alanında production'a ait tam bir `https://...` URL'si varsa domain kısmı kaldırılır. Dosyanın aynı yolunun ilgili ortamda sunulması gerekir.
- `/...` biçimi domain köküne, `~/...` ve `media/...` biçimleri varsa `Request.PathBase` dahil uygulama köküne göre çözülür. Örneğin `PathBase=/preprod` iken `~/media/a.pdf` değeri `/preprod/media/a.pdf` olur; `/media/a.pdf` domain kökünde kalır.
- GET ve HEAD desteklenir; diğer metotlar `405` alır. İstek üzerindeki query parametreleri PDF'e eklenmez; `Pdf` alanının kendi query/fragment bilgisi korunur.
- Kayıt yoksa `404`; en yeni kaydın belge adresi geçersizse `404`; veritabanı okunamazsa `503` döner. Ayrıntı uygulama loguna yazılır.

Örnek:

```text
https://test.example/yapi-kredi-blue-class/gunluk-bulten
    → /YkbYapikredi/media/YapikrediMedia/GunlukTumPiyasaBultenleri/2026-11-03-....pdf
```

Yönlendirme sonrasında tarayıcı PDF adresine gider. PDF'in tarayıcıda açılması veya indirilmesi, dosyayı sunan web sunucusunun `Content-Type`/`Content-Disposition` başlıklarına bağlıdır.

ASP.NET Core 8 üzerinde CMS sorguları benzetilerek 39 kontrol geçti. Yeni kaydın sonraki istekte görünmesi, tarih/ItemID sıralaması, test/preprod domainleri, PathBase, HEAD, diğer yolların etkilenmemesi, boş tablo ve veritabanı hataları kapsandı. Gerçek Kentico veritabanına erişilmedi; hedef uygulamadaki CMS DLL/bağlantısı bu çalışma ortamında bulunmuyor.

Başvurular: [ASP.NET Core middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/write?view=aspnetcore-8.0), [Kentico pipeline sırası](https://docs.kentico.com/13/developing-websites/developing-xperience-applications-using-asp-net-core/starting-with-asp-net-core-development/hosting-asp-net-core-applications-using-minimal-apis), [Kentico ObjectQuery API](https://devnet.kentico.com/docs/13_0/api/html/Methods_T_CMS_DataEngine_ObjectQuery.htm).
