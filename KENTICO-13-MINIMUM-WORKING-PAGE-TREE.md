# Kentico 13 minimum çalışan header + footer page tree

Bu liste, header ve footer ekranlarının bütün farklı bileşenlerini çalıştıracak en küçük örnek içerik ağacıdır. Her içerik grubunda en fazla 2–3 örnek bırakılmış, recursive mobil menüyü test edebilmek için `Kendim İçin` ağacındaki en derin zincir korunmuştur.

`Header Main` altında beş doğrudan çocuk bulunması istisnadır. Bunlar normal içerik listesi değil, view'ın `NavigationRole` ile bulduğu beş teknik giriş noktasıdır: iki sekme, müşteri edinim menüsü, internet şubesi menüsü ve mobil kısayol grubu. Bunlardan biri silinirse ilgili header bileşeni ekranda oluşmaz.

## 1. Minimum page tree

```text
/Shared                                                        (CMS.Folder)
  /Navigation                                                  (CMS.Folder)
    /Header Top                                                (YKB.NavigationMenu / HeaderTop)
      /Mobil Uygulama İndir                                   (YKB.NavigationNode)
      /Şube ve ATM'ler                                        (YKB.NavigationNode)
      /EN                                                     (YKB.NavigationNode)

    /Header Main                                               (YKB.NavigationMenu / HeaderMain)
      /Kendim İçin                                            (YKB.NavigationNode / Tab)
        /Ana Sayfa                                            (YKB.NavigationNode)
        /Bireysel Bankacılık                                  (YKB.NavigationNode / promote=true)
          /Krediler                                           (YKB.NavigationNode)
            /Bireysel İhtiyaç Kredisi                         (YKB.NavigationNode)
              /Alışveriş Kredisi                              (YKB.NavigationNode)
                /World PAY Alışveriş Kredisi                  (YKB.NavigationNode)
                  /Arçelik Alışveriş Kredisi                  (YKB.NavigationNode)
                  /Setur Alışveriş Kredisi                    (YKB.NavigationNode)
            /Hazır Limitim                                    (YKB.NavigationNode / badge=YENİ)
          /Kartlar                                            (YKB.NavigationNode)
            /Kredi Kartları                                   (YKB.NavigationNode)
          /Mevduat Ürünleri                                   (YKB.NavigationNode / NavigationDesktopName=Mevduat)
        /Fatura Ödeme                                         (YKB.NavigationNode / mobile-only)
          /Tüm Faturalar                                      (YKB.NavigationNode)

      /İşim İçin                                             (YKB.NavigationNode / Tab)
        /KOBİ                                                 (YKB.NavigationNode)
          /Krediler                                           (YKB.NavigationNode)
        /Ticari                                               (YKB.NavigationNode)
          /Nakit Yönetimi                                     (YKB.NavigationNode)
        /Kurumsal                                             (YKB.NavigationNode)
          /Nakit Yönetimi                                     (YKB.NavigationNode)

      /Yapı Kredili Ol                                        (YKB.NavigationNode / CustomerAcquisition)
        /Bireysel Müşteri                                     (YKB.NavigationNode)
        /Tüzel Müşteri                                        (YKB.NavigationNode)

      /İnternet Şubesi                                        (YKB.NavigationNode / InternetBranch)
        /Bireysel Giriş                                       (YKB.NavigationNode)
          /Kart İşlemleri                                     (YKB.NavigationNode)
          /Şifre Al / Şifremi Unuttum                         (YKB.NavigationNode)
        /Kurumsal Giriş                                       (YKB.NavigationNode)
          /Şifre Al / Şifremi Unuttum                         (YKB.NavigationNode)

      /Mobil Kısayollar                                       (YKB.NavigationNode / MobileQuickLinks)
        /Yapı Kredi Mobil'i İndir                             (YKB.NavigationNode / 1. sıra)
        /Ürün ve Hizmet Ücretleri                             (YKB.NavigationNode)
        /Şube ve ATM'ler                                      (YKB.NavigationNode)

    /Footer Columns                                            (YKB.NavigationMenu / Footer)
      /Bize Ulaşın                                            (YKB.NavigationNode / mobile=false)
        /Memnuniyetiniz İçin                                  (YKB.NavigationNode)
        /İletişim                                             (YKB.NavigationNode)
      /İlginizi Çekebilir                                     (YKB.NavigationNode)
        /Emekli Promosyon                                     (YKB.NavigationNode)
        /Haberler                                             (YKB.NavigationNode)
      /Faydalı Sayfalar                                       (YKB.NavigationNode)
        /Kredi Hesaplama                                      (YKB.NavigationNode)
        /Site Haritası                                        (YKB.NavigationNode)

    /Footer Legal                                              (YKB.NavigationMenu / FooterLegal)
      /TMSF ve YTM Zaman Aşımı Listesi                        (YKB.NavigationNode)
      /Gizlilik Politikası                                    (YKB.NavigationNode)
      /English                                                (YKB.NavigationNode / mobile-only)

    /Footer Brands                                             (YKB.NavigationMenu / FooterBrands)
      /Blog                                                   (YKB.NavigationNode / image)
      /FRWRD                                                  (YKB.NavigationNode / image)
      /Koç 100. Yıl                                           (YKB.NavigationNode / desktop+mobile image)

    /Footer Apps                                               (YKB.NavigationMenu / FooterApps)
      /App Store                                              (YKB.NavigationNode / mobile-only image)
      /Google Play                                            (YKB.NavigationNode / mobile-only image)
      /AppGallery                                             (YKB.NavigationNode / mobile-only image)

    /Social                                                    (YKB.NavigationMenu / Social)
      /Facebook                                               (YKB.NavigationNode)
      /Instagram                                              (YKB.NavigationNode)
      /YouTube                                                (YKB.NavigationNode)

  /Header Notifications                                        (CMS.Folder)
    /Bildirim 1                                               (YKB.HeaderNotification)
    /Bildirim 2                                               (YKB.HeaderNotification)

  /Announcements                                               (CMS.Folder; boş bırakılabilir)
    /Duyuru 1                                                 (YKB.Announcement; opsiyonel test kaydı)
    /Duyuru 2                                                 (YKB.Announcement; opsiyonel test kaydı)
```

Kardeş node'ları yukarıdaki sırayla oluşturun veya Kentico Pages uygulamasında aynı sıraya taşıyın. Repository sıralamayı `NodeOrder` üzerinden alır.

## 2. Menü köklerine girilecek değerler

| Page path | Page type | `NavigationMenuTitle` | `NavigationMenuKey` dropdown |
|---|---|---|---|
| `/Shared/Navigation/Header Top` | `YKB.NavigationMenu` | `Header üst bağlantıları` | `HeaderTop` |
| `/Shared/Navigation/Header Main` | `YKB.NavigationMenu` | `Header ana menü` | `HeaderMain` |
| `/Shared/Navigation/Footer Columns` | `YKB.NavigationMenu` | `Footer kolonları` | `Footer` |
| `/Shared/Navigation/Footer Legal` | `YKB.NavigationMenu` | `Footer yasal bağlantıları` | `FooterLegal` |
| `/Shared/Navigation/Footer Brands` | `YKB.NavigationMenu` | `Footer marka görselleri` | `FooterBrands` |
| `/Shared/Navigation/Footer Apps` | `YKB.NavigationMenu` | `Footer uygulama mağazaları` | `FooterApps` |
| `/Shared/Navigation/Social` | `YKB.NavigationMenu` | `Bizi Takip Edin` | `Social` |

`NavigationMenuKey` değerleri site ve culture içinde tekil olmalıdır. `/Shared`, `/Shared/Navigation`, `/Shared/Header Notifications` ve `/Shared/Announcements` için herhangi bir custom field girilmez; bunların page type'ı `CMS.Folder` seçilir.

## 3. NavigationNode tablolarını okuma

Her `YKB.NavigationNode` için aşağıdaki alanların tamamı doldurulur veya tabloda belirtildiği gibi boş bırakılır:

- `Title`: `NavigationTitle`
- `Desktop Name`: `NavigationDesktopName`; boşsa desktopta `NavigationTitle` kullanılır
- `URL`: `NavigationUrl`
- `Role`: `NavigationRole` dropdown seçimi
- `Icon`: `NavigationIconCssClass` dropdown seçimi; `İkon yok` seçimi veritabanına boş değer yazar
- `Badge`: `NavigationBadgeText`; `—` ise boş bırakılır
- `D`: `NavigationDisplayOnDesktop` checkbox
- `M`: `NavigationDisplayOnMobile` checkbox
- `P`: `NavigationPromoteChildrenOnDesktop` checkbox
- `N`: `NavigationOpenInNewTab` checkbox

`✓` işaretli, `—` işaretsiz checkbox demektir. Aşağıdaki bütün satırlarda `NavigationImage`, `NavigationMobileImage` ve `NavigationImageAlt` boş bırakılır; yalnız “Görsel kullanan footer node'ları” tablosundaki altı kayıt bunun dışındadır.

`NavigationDesktopName` bütün satırlarda varsayılan olarak boş bırakılır. Tek örnek istisna: `Kendim İçin/Bireysel Bankacılık/Mevduat Ürünleri` için `NavigationDesktopName=Mevduat`. Böylece mobilde “Mevduat Ürünleri”, desktop headerda “Mevduat” görünür.

## 4. Header Top node değerleri

| Page path / `NavigationTitle` | `NavigationUrl` | Role dropdown | Icon dropdown | Badge | D | M | P | N |
|---|---|---|---|---|---:|---:|---:|---:|
| `Mobil Uygulama İndir` | `#mobil-uygulama` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Şube ve ATM'ler` | `https://www.yapikredi.com.tr/sinirsiz-bankacilik/atm/sube-ve-atm-arama` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `EN` | `https://www.yapikredi.com.tr/en/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |

## 5. Header Main node değerleri

Path'ler `/Shared/Navigation/Header Main/` altına göredir.

### Kendim İçin

| Relative path / `NavigationTitle` | `NavigationUrl` | Role dropdown | Icon dropdown | Badge | D | M | P | N |
|---|---|---|---|---|---:|---:|---:|---:|
| `Kendim İçin` | `#` | `Tab` | `icon-mobile-nav-bireysel-bankaclk` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Ana Sayfa` | `/` | `MenuItem` | `icon-mobile-nav-ana-sayfa` | — | — | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık` | `#` | `MenuItem` | `icon-mobile-nav-bireysel-bankaclk` | — | ✓ | ✓ | ✓ | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler` | `https://www.yapikredi.com.tr/bireysel-bankacilik/krediler/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Bireysel İhtiyaç Kredisi` | `https://www.yapikredi.com.tr/kredi/ihtiyac-kredisi/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Bireysel İhtiyaç Kredisi/Alışveriş Kredisi` | `https://www.yapikredi.com.tr/kredi/alisveris-kredisi/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Bireysel İhtiyaç Kredisi/Alışveriş Kredisi/World PAY Alışveriş Kredisi` | `https://www.yapikredi.com.tr/kredi/alisveris-kredisi/world-pay-alisveris-kredisi/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Bireysel İhtiyaç Kredisi/Alışveriş Kredisi/World PAY Alışveriş Kredisi/Arçelik Alışveriş Kredisi` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Bireysel İhtiyaç Kredisi/Alışveriş Kredisi/World PAY Alışveriş Kredisi/Setur Alışveriş Kredisi` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Hazır Limitim` | `#` | `MenuItem` | `İkon yok` | `YENİ` | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Kartlar` | `https://www.yapikredi.com.tr/bireysel-bankacilik/kartlar/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Kartlar/Kredi Kartları` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Bireysel Bankacılık/Mevduat Ürünleri` | `https://www.yapikredi.com.tr/bireysel-bankacilik/mevduat-urunleri/` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Kendim İçin/Fatura Ödeme` | `#` | `MenuItem` | `icon-mobile-nav-fatura-odeme` | `Hemen Öde` | — | ✓ | — | — |
| `Kendim İçin/Fatura Ödeme/Tüm Faturalar` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |

`Bireysel Bankacılık` üzerindeki `P=✓`, desktop'ta bu node'un kendisini göstermek yerine doğrudan çocukları olan `Krediler` ve `Kartlar` linklerini alt menüye taşır. Mobile menüde recursive zincir aynen korunur.

### İşim İçin

| Relative path / `NavigationTitle` | `NavigationUrl` | Role dropdown | Icon dropdown | Badge | D | M | P | N |
|---|---|---|---|---|---:|---:|---:|---:|
| `İşim İçin` | `#` | `Tab` | `icon-mobile-nav-kurumsal` | — | ✓ | ✓ | — | — |
| `İşim İçin/KOBİ` | `https://www.yapikredi.com.tr/kobi/` | `MenuItem` | `icon-mobile-nav-kobi` | — | ✓ | ✓ | — | — |
| `İşim İçin/KOBİ/Krediler` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `İşim İçin/Ticari` | `https://www.yapikredi.com.tr/ticari/` | `MenuItem` | `icon-mobile-nav-ticari` | — | ✓ | ✓ | — | — |
| `İşim İçin/Ticari/Nakit Yönetimi` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `İşim İçin/Kurumsal` | `https://www.yapikredi.com.tr/kurumsal/` | `MenuItem` | `icon-mobile-nav-kurumsal` | — | ✓ | ✓ | — | — |
| `İşim İçin/Kurumsal/Nakit Yönetimi` | `#` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |

### Yapı Kredili Ol, İnternet Şubesi ve Mobil Kısayollar

| Relative path / `NavigationTitle` | `NavigationUrl` | Role dropdown | Icon dropdown | Badge | D | M | P | N |
|---|---|---|---|---|---:|---:|---:|---:|
| `Yapı Kredili Ol` | `#` | `CustomerAcquisition` | `icon-user-plus-24` | — | — | ✓ | — | — |
| `Yapı Kredili Ol/Bireysel Müşteri` | `https://www.yapikredi.com.tr/banka-hesabi-ac` | `MenuItem` | `icon-user-plus-40` | — | ✓ | ✓ | — | — |
| `Yapı Kredili Ol/Tüzel Müşteri` | `https://www.yapikredi.com.tr/ticari-hesap-acma` | `MenuItem` | `icon-business-plus-40` | — | ✓ | ✓ | — | — |
| `İnternet Şubesi` | `#` | `InternetBranch` | `icon-pointer-click-24` | — | — | ✓ | — | — |
| `İnternet Şubesi/Bireysel Giriş` | `https://internetsube.yapikredi.com.tr/ngi/index.do` | `MenuItem` | `icon-user-24` | — | ✓ | ✓ | — | — |
| `İnternet Şubesi/Bireysel Giriş/Kart İşlemleri` | `https://internetsube.yapikredi.com.tr/ngi/index.do?type=W` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `İnternet Şubesi/Bireysel Giriş/Şifre Al / Şifremi Unuttum` | `https://internetsube.yapikredi.com.tr/ngi/huoRetailWeb.do` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `İnternet Şubesi/Kurumsal Giriş` | `https://ticari.yapikredi.com.tr/ngc/indexNgc.do` | `MenuItem` | `icon-user-business-24` | — | ✓ | ✓ | — | — |
| `İnternet Şubesi/Kurumsal Giriş/Şifre Al / Şifremi Unuttum` | `https://ticari.yapikredi.com.tr/ngc/huoCorporate.do` | `MenuItem` | `İkon yok` | — | ✓ | ✓ | — | — |
| `Mobil Kısayollar` | `#` | `MobileQuickLinks` | `İkon yok` | — | — | ✓ | — | — |
| `Mobil Kısayollar/Yapı Kredi Mobil'i İndir` | `#mobil-uygulama` | `MenuItem` | `icon-mobile-nav-mobil-indir` | — | ✓ | ✓ | — | — |
| `Mobil Kısayollar/Ürün ve Hizmet Ücretleri` | `https://www.yapikredi.com.tr/bireysel-bankacilik/hesaplama-araclari/bireysel-urun-ve-hizmet-ucretleri` | `MenuItem` | `icon-mobile-nav-paper-search` | — | ✓ | ✓ | — | — |
| `Mobil Kısayollar/Şube ve ATM'ler` | `https://www.yapikredi.com.tr/sinirsiz-bankacilik/atm/sube-ve-atm-arama` | `MenuItem` | `icon-mobile-nav-pin` | — | ✓ | ✓ | — | — |

`Yapı Kredili Ol`, `İnternet Şubesi` ve `Mobil Kısayollar` teknik köklerinde `D=—` seçilmesi bilinçlidir. İlk ikisinin desktop butonları role göre ayrıca render edilir; `Mobil Kısayollar` yalnız mobil panelin parçasıdır.

## 6. Footer Columns node değerleri

Path'ler `/Shared/Navigation/Footer Columns/` altına göredir. Tüm satırlarda Role=`MenuItem`, Icon=`İkon yok`, Badge boş ve P=`—` seçilir.

| Relative path / `NavigationTitle` | `NavigationUrl` | D | M | N |
|---|---|---:|---:|---:|
| `Bize Ulaşın` | `#` | ✓ | — | — |
| `Bize Ulaşın/Memnuniyetiniz İçin` | `https://www.yapikredi.com.tr/memnuniyetiniz-icin-buradayiz/` | ✓ | ✓ | — |
| `Bize Ulaşın/İletişim` | `https://www.yapikredi.com.tr/yapi-kredi-hakkinda/iletisim` | ✓ | ✓ | — |
| `İlginizi Çekebilir` | `#` | ✓ | ✓ | — |
| `İlginizi Çekebilir/Emekli Promosyon` | `https://www.yapikredi.com.tr/bireysel-bankacilik/odemeler-ve-hizmetler/sgk-emekli-maas-promosyonu` | ✓ | ✓ | — |
| `İlginizi Çekebilir/Haberler` | `https://www.yapikredi.com.tr/yapi-kredi-hakkinda/haberler` | ✓ | ✓ | ✓ |
| `Faydalı Sayfalar` | `#` | ✓ | ✓ | — |
| `Faydalı Sayfalar/Kredi Hesaplama` | `https://www.yapikredi.com.tr/bireysel-bankacilik/hesaplama-araclari/kredi-hesaplama` | ✓ | ✓ | — |
| `Faydalı Sayfalar/Site Haritası` | `https://www.yapikredi.com.tr/site-haritasi` | ✓ | ✓ | — |

Footer desktop görünümünde sosyal/marka alanı ilk footer kolonunun altına yerleştirildiği için `Bize Ulaşın` ilk sırada kalmalıdır. Bu kolonun `M=—` olması da mevcut mobil tasarımla aynıdır; mobil footer yalnız diğer iki içerik kolonunu gösterir ve sosyal alanı ayrıca render eder.

## 7. Footer Legal node değerleri

Tüm satırlarda Role=`MenuItem`, Icon=`İkon yok`, Badge boş ve P=`—` seçilir.

| `NavigationTitle` | `NavigationUrl` | D | M | N |
|---|---|---:|---:|---:|
| `TMSF ve YTM Zaman Aşımı Listesi` | `https://www.yapikredi.com.tr/zaman-asimi-listeleri` | ✓ | ✓ | — |
| `Gizlilik Politikası` | `https://www.yapikredi.com.tr/memnuniyetiniz-icin-buradayiz/gizlilik` | ✓ | ✓ | — |
| `English` | `https://www.yapikredi.com.tr/en` | — | ✓ | — |

## 8. Görsel kullanan footer node'ları

Bu altı kayıtta Role=`MenuItem`, Icon=`İkon yok`, Badge boş ve P=`—` seçilir. `NavigationMobileImage` yalnız Koç kaydında doludur.

| Menü / `NavigationTitle` | `NavigationUrl` | `NavigationImage` | `NavigationMobileImage` | `NavigationImageAlt` | D | M | N |
|---|---|---|---|---|---:|---:|---:|
| `Footer Brands/Blog` | `https://www.yapikredi.com.tr/blog/` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/blog-logo.svg` | Boş | `Blog` | ✓ | ✓ | ✓ |
| `Footer Brands/FRWRD` | `https://www.yapikredifrwrd.com/` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/frwrd-logo.svg` | Boş | `FRWRD` | ✓ | ✓ | ✓ |
| `Footer Brands/Koç 100. Yıl` | Boş | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/100_yil_koc.svg` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/100_yil_koc_mobile.svg` | `Koç 100. Yıl` | ✓ | ✓ | — |
| `Footer Apps/App Store` | `https://itunes.apple.com/tr/app/yap-kredi-mobil-bankac-l-k/id458627086?mt=8` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/app-store-f.png` | Boş | `App Store'dan indirin` | — | ✓ | ✓ |
| `Footer Apps/Google Play` | `https://play.google.com/store/apps/details?id=com.ykb.android&hl=tr&gl=US` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/google-play-f.png` | Boş | `Google Play'den alın` | — | ✓ | ✓ |
| `Footer Apps/AppGallery` | `https://appgallery.huawei.com/#/app/C101430581` | `https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/app-gallery-f.png` | Boş | `AppGallery'den indirin` | — | ✓ | ✓ |

Media selector harici URL kabul etmiyorsa aynı dosyaları Kentico Media Library'ye yükleyip tabloda verilen URL yerine oluşan media path'ini seçin.

## 9. Social node değerleri

Tüm satırlarda Role=`MenuItem`, Badge boş, D=`✓`, M=`✓`, P=`—`, N=`✓`; üç görsel alanı da boştur.

| `NavigationTitle` | `NavigationUrl` | Icon dropdown |
|---|---|---|
| `Facebook` | `https://www.facebook.com/YapiKredi/` | `icon-facebook1` |
| `Instagram` | `https://www.instagram.com/yapikredi/` | `icon-instagram1` |
| `YouTube` | `https://www.youtube.com/channel/UCnAFL68slzVjJkOiNHweojQ` | `icon-youtube1` |

## 10. Header Notification kayıtları

Bu kayıtlar `YKB.NavigationNode` değildir. `/Shared/Header Notifications` altında `YKB.HeaderNotification` page type'ı ile oluşturulur.

| Page name | `HeaderNotificationTitle` | `HeaderNotificationUrl` | `HeaderNotificationImage` | `HeaderNotificationImageAlt` | `HeaderNotificationOpenInNewTab` |
|---|---|---|---|---|---:|
| `Bildirim 1` | `100.000 TL'ye varan fırsatlar Yapı Kredi Mobil'de!` | `https://www.yapikredi.com.tr` | `/assets/notification-credit.png` | `Yapı Kredi kampanyası` | İşaretsiz |
| `Bildirim 2` | `Ekstreni 20.000 TL hafifleten kart!` | `https://www.yapikredi.com.tr/bireysel-bankacilik/kartlar/` | `/assets/notification-mobile.png` | `Kart kampanyası` | İşaretsiz |

Bildirim klasörü boş da olabilir; bu durumda çan ikonu görünür, sayaç görünmez ve açılan panel boş durum mesajını gösterir.

## 11. Opsiyonel Announcement test kayıtları

`/Shared/Announcements` klasörünü boş bırakırsanız duyuru şeridi hiç render edilmemelidir. Slider ve önceki/sonraki butonlarını test etmek için aşağıdaki iki `YKB.Announcement` kaydını oluşturabilirsiniz:

| Page name | `AnnouncementTitle` | `AnnouncementUrl` | `AnnouncementOpenInNewTab` |
|---|---|---|---:|
| `Duyuru 1` | `Bankamız Tahsili Gecikmiş Alacak Satışına İlişkin Bilgilendirme` | `/yapi-kredi-hakkinda/haberler` | İşaretsiz |
| `Duyuru 2` | `Planlı Bakım Bilgilendirmesi` | `/yapi-kredi-hakkinda/haberler` | İşaretsiz |

Tek yayınlanmış kayıt varsa duyuru metni görünür fakat yön okları oluşmaz. İki veya daha fazla yayınlanmış kayıt varsa geçiş ve yön butonları çalışır. Yayın başlangıç/bitiş tarihleri için Kentico'nun `DocumentPublishFrom` ve `DocumentPublishTo` alanlarını kullanın.

## 12. Dropdown kaynakları

### `NavigationMenuKey`

```text
HeaderTop;Header üst bağlantıları
HeaderMain;Header ana menü
Footer;Footer kolonları
FooterLegal;Footer yasal bağlantıları
FooterBrands;Footer marka görselleri
FooterApps;Footer uygulama mağazaları
Social;Sosyal medya
```

### `NavigationRole`

```text
MenuItem;Standart menü öğesi
Tab;Ana müşteri sekmesi
CustomerAcquisition;Yapı Kredili Ol aksiyonu
InternetBranch;İnternet Şubesi aksiyonu
MobileQuickLinks;Mobil kısayol grubu
```

### `NavigationIconCssClass`

Minimum ağaç için gereken dropdown seçenekleri:

```text
;İkon yok
icon-user-plus-24;Yapı Kredili Ol — 24 px
icon-pointer-click-24;İnternet Şubesi — 24 px
icon-user-24;Bireysel giriş — 24 px
icon-user-business-24;Kurumsal giriş — 24 px
icon-user-plus-40;Bireysel müşteri — 40 px
icon-business-plus-40;Tüzel müşteri — 40 px
icon-mobile-nav-ana-sayfa;Ana Sayfa
icon-mobile-nav-bireysel-bankaclk;Bireysel Bankacılık
icon-mobile-nav-kobi;KOBİ
icon-mobile-nav-kurumsal;Kurumsal
icon-mobile-nav-ticari;Ticari
icon-mobile-nav-fatura-odeme;Fatura Ödeme
icon-mobile-nav-paper-search;Ürün ve Hizmet Ücretleri
icon-mobile-nav-pin;Şube ve ATM
icon-mobile-nav-mobil-indir;Mobil Uygulama
icon-facebook1;Facebook
icon-instagram1;Instagram
icon-youtube1;YouTube
```

## 13. Checkbox varsayılanları

Page type üzerinde aşağıdaki varsayılanları tanımlayın; tablolardaki farklı seçimleri içerik girerken uygulayın:

| Field | Form control | Varsayılan |
|---|---|---:|
| `NavigationOpenInNewTab` | Check box | İşaretsiz / `false` |
| `NavigationDisplayOnDesktop` | Check box | İşaretli / `true` |
| `NavigationDisplayOnMobile` | Check box | İşaretli / `true` |
| `NavigationPromoteChildrenOnDesktop` | Check box | İşaretsiz / `false` |
| `HeaderNotificationOpenInNewTab` | Check box | İşaretsiz / `false` |
| `AnnouncementOpenInNewTab` | Check box | İşaretsiz / `false` |

Checkbox anlamları ve seçim zamanı:

- `NavigationDisplayOnDesktop`: Node desktop header/footer içinde görünmeli ise işaretleyin. Yalnız mobil öğede kaldırın.
- `NavigationDisplayOnMobile`: Node mobil menü/footer içinde görünmeli ise işaretleyin. Yalnız desktop öğede kaldırın.
- `NavigationPromoteChildrenOnDesktop`: Desktopta bu ara node yerine doğrudan çocukları gösterilecekse işaretleyin. Normal linklerde, leaf node'larda ve yalnız mobil gezinme için işaretlemeyin.
- `NavigationOpenInNewTab`: Hedef özellikle yeni sekmede açılacaksa işaretleyin. Aynı site içi standart linklerde kaldırın.
- `HeaderNotificationOpenInNewTab`: Bildirimin hedefi yeni sekme gerektiriyorsa işaretleyin; normalde kaldırın.
- `AnnouncementOpenInNewTab`: Duyuru hedefi harici/yeni sekme gerektiriyorsa işaretleyin; normalde kaldırın.

`NavigationDisplayOnDesktop` alanında **Has depending fields** seçeneğini açın. `NavigationDesktopName` alanını Text/Text input, 200 karakter, zorunlu değil olarak ekleyin ve visibility condition değerini `NavigationDisplayOnDesktop = true` yapın.

Tam page type alan tanımları, karakter sınırları, validasyonlar ve allowed-child-type kuralları `KENTICO-13-HEADER-FOOTER-MODEL.md` belgesindeki page type bölümlerinde korunmaktadır.
