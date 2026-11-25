# Bir butonda takip seçmek

Bir kez alanı tanımladıktan sonra içerik editörü yalnızca açılır listeden seçim yapar. Örneğin ana sayfadaki elektrik kartında **Elektrik Faturası** seçilir. Ziyaretçi analiz izni vermiş ve bağlantı aynı sitede açılıyorsa GA4 ve Dataroid tıklamayı kaydeder. **Takip yok** seçilirse buton normal çalışır ve bu kod tıklama olayı üretmez.

## 1. Kentico alanını tanımlayın

**Page types → ButtonComponent → Fields → New field** ekranında **Field name** `PartnerClick`, **Field caption** “Tıklama takibi”, **Data type** Text, **Size** 64, **Form control** Drop-down list seçin. **Required** kapalı ve varsayılan değer boş olsun. **Options → List of options** kutusuna aşağıdaki satırları koyun. Noktalı virgülden önce kod, sonra editörün göreceği ad gelir.

```text
;Takip yok
home_personal_loan_apply;İhtiyaç kredisi – Hemen Başvur
home_card_apply;Kredi kartı – Hemen Başvur
all_applications;Tüm Başvuru İşlemleri
all_calculators;Tüm Hesaplama Araçları
all_payments;Tüm Ödemeler
electricity;Elektrik Faturası
water;Su Faturası
natural_gas;Doğal Gaz Faturası
mobile_bill;Cep Telefonu Faturası
telecom;Telekom Faturası
motor_tax;MTV Borcu
customer_acquisition;Yapı Kredili Ol
```

Kentico sürümünüzde boş satır yerine **Allow empty value** seçeneği kullanılıyorsa onu açın ve boş seçeneğin başlığını “Takip yok” yapın. Eski kayıtlara toplu değer vermeyin.

## 2. Alanı sayfaya taşıyın

1. Asıl Application projesindeki `ButtonComponentModel` sınıfına `public string PartnerClick { get; init; } = string.Empty;` satırını ekleyin.
2. [Mapper ve Razor değişiklikleri](ButtonComponent.patch) depodaki ButtonMobileUrlTransfer sürümüne göre hazırlanmıştır. Mapper, alanı `PartnerClick = ComponentFields.String(node, "PartnerClick")` ile okur. Sütunları tek tek seçen component sorgusunda `PartnerClick` alanını da seçin.
3. [Tag Helper dosyasını](../Web/TagHelpers/PartnerClickTagHelper.cs) canlı sitenin `TagHelpers/` klasörüne kopyalayın. `Views/_ViewImports.cshtml` dosyasında Web assembly zaten kayıtlı değilse `@addTagHelper *, YkbYapikredi.Web` ekleyin. Son parça gerçek web projenizin assembly adıdır.
4. Butonun mevcut `<a>` öğesine `ykb-partner-click="@(Model.IsDisabled ? null : Model.PartnerClick)"` ekleyin. Tag Helper boş değerde takip niteliğini HTML'den tamamen çıkarır. Örneğin `electricity` seçildiğinde HTML'de `data-partner-click="electricity"` görünür.
5. Ana sayfadaki ödeme kartı veya kampanya bağlantısı farklı bir **çocuk page type** kullanıyorsa aynı alanı tıklanan kayda ekleyin. O kaydın modeline ve mapper’ına aynı özelliği taşıyıp yalnız ilgili `<a>` üzerine yukarıdaki niteliği koyun. Tüm karta, döngünün dışına veya başlığın üst öğesine koymayın.
6. Menü de bu seçimi kullanacaksa `NavigationMenuNode` sayfa tipine aynı alanı ekleyin ve [masaüstü ve mobil header değişikliklerini](HeaderComponent.patch) uygulayın. Yama projedeki gerçek `NavigationNodeDto`, `LayoutContentProvider.MapNode`, `Header.cshtml` ve `header.js` dosyalarını gösterir. Mevcut `MobileMenuJson` DTO'yu PascalCase ile yazdığı için JS tarafı `node.PartnerClick` okur. Masaüstü ve mobil İnternet Şubesi menülerinde değer yanlışlıkla girilse bile işaret üretilmez. Başka bir iç bağlantı önce yerel yönlendirme yoluna gidip ardından dış siteyi açıyorsa editör o kayıtta **Takip yok** seçmelidir.
7. **Pages** bölümünden ilgili component kaydını açın. Seçimi kaydedip yayınlayın. Aynı yazıyı taşıyan iki farklı “Hemen Başvur” butonunda ilgili ürüne ait farklı seçeneği seçin.

## 3. Eski yayınla eşleşme

İlk 11 satırın kaynağı ana sayfadır. Son satır aynı sitedeki müşteri olma bağlantıları içindir. Eski container bazı hedefleri sondaki eğik çizgi ve parametreler dahil tam URL ile karşılaştırıyordu. Örneğin bugünkü kredi kartı butonunda UTM ekli bir hedef görüldü. Yeni pakette olayı **editörün seçimi** belirler. Gönderilen hedef URL'de query ve fragment atılır.

| Editörün seçimi | Referans hedef path | GA4 olay adı | Dataroid |
| --- | --- | --- | --- |
| İhtiyaç kredisi – Hemen Başvur | `/basvuru-merkezi/bireysel-ihtiyac-kredisi/` | `AnasayfaBIK_HemenBasvur_ButtonClick` | Aninda_Basvuru |
| Kredi kartı – Hemen Başvur | `/basvuru-merkezi/kredi-karti-basvurusu` | `AnasayfaKK_HemenBasvur_ButtonClick` | Aninda_Basvuru |
| Tüm Başvuru İşlemleri | `/basvuru-merkezi/` | `TumBasvuruIslemleri_ButtonClick` | Aninda_Basvuru |
| Tüm Hesaplama Araçları | `/bireysel-bankacilik/hesaplama-araclari/` | `TumHesaplamaAraclari_ButtonClick` | Yalnız GA4 |
| Tüm Ödemeler | `/odeme-merkezi/` | `TumOdemeler_ButtonClick` | Odeme_Merkezi |
| Elektrik Faturası | `/odeme-merkezi/elektrik-faturasi-odeme` | `OdemeMerkezi_ElektrikFaturasi_ButtonClick` | Odeme_Merkezi |
| Su Faturası | `/odeme-merkezi/su-odeme` | `OdemeMerkezi_SuFaturasi_ButtonClick` | Odeme_Merkezi |
| Doğal Gaz Faturası | `/odeme-merkezi/dogalgaz-odeme` | `OdemeMerkezi_DogalgazFaturasi_ButtonClick` | Odeme_Merkezi |
| Cep Telefonu Faturası | `/odeme-merkezi/cep-telefonu-faturasi-odeme` | `OdemeMerkezi_CepTelefonFaturasi_ButtonClick` | Odeme_Merkezi |
| Telekom Faturası | `/odeme-merkezi/telekom-odeme` | `OdemeMerkezi_TelekomFaturasi_ButtonClick` | Odeme_Merkezi |
| MTV Borcu | `/odeme-merkezi/mtv-odeme` | `OdemeMerkezi_MtvBorcu_ButtonClick` | Odeme_Merkezi |
| Yapı Kredili Ol | `/banka-hesabi-ac/ (site içi örnek)` | `Yapi_Kredili_Ol_ButtonClick` | YapıKrediliOl_Butonu |

Ana sayfa grubunda Dataroid olayının adı `Anasayfa_Buttons`. Grup `section` alanına, görünen düğme adı `buttonName` alanına, site içi temiz hedef `buttonDetail` alanına yazılır. Müşteri olma olayında alanlar `buttonName`, `buttonURL`, `pageURL`. GA4'te tüm satırlar `Button_Name` taşır. Müşteri olma satırı ayrıca `Button_URL` ve `Page_URL` taşır. [Yayımlanan GTM sürümü](https://www.googletagmanager.com/gtm.js?id=GTM-M26SV5T)

Masaüstü ve mobil hedef farklıysa mevcut buton kodunun o anda seçtiği hedef okunur. Dış alan adı, mobil uygulama linki, menü açıcı ve modal için bu kod olay üretmez. GA4'ün kendi “giden tıklama” seçeneği açıksa, GA4 → Yönetici → Veri akışları → Web → Gelişmiş ölçüm bölümündeki **Giden tıklamalar** ayarını ayrıca kontrol edin. Dış ekranlara bu paketin layout'u kurulmaz.
