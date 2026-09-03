# Kentico 13 header içerik modeli

Bu uygulamadaki mock içerik, daha sonra Kentico 13 repository katmanından gelecek `LayoutContent` ile aynı şekildedir. `_Layout.cshtml` veriyi özellikle şu satırla alır:

```csharp
var layoutData = ViewData["LayoutData"] as YkbClone.LayoutData;
```

## Önerilen içerik ağacı

```text
/Shared
  /HeaderNotifications                         (CMS.Folder)
    100.000 TL'ye varan ...                    (YKB.HeaderNotification)
    Ekstreni 20.000 TL ...                     (YKB.HeaderNotification)
    Gümüş Hesap ...                            (YKB.HeaderNotification)
  /Announcements                               (mevcut yapı; header kapsamında değil)
  /Menu                                        (CMS.Folder)
    /Header Top                                (CMS.Folder)
      Mobil Uygulama İndir                     (YKB.NavigationNode)
      Şube ve ATM'ler                          (YKB.NavigationNode)
      Ürün ve Hizmet Ücretleri                 (YKB.NavigationNode)
      EN                                       (YKB.NavigationNode)
    /Header Main                               (CMS.Folder)
      Kendim İçin                              (YKB.NavigationNode / Role=Tab)
        Ana Sayfa                              (YKB.NavigationNode)
        Bireysel Bankacılık                    (YKB.NavigationNode)
          Krediler                             (YKB.NavigationNode)
            Bireysel İhtiyaç Kredisi           (YKB.NavigationNode)
              Alışveriş Kredisi                (YKB.NavigationNode)
                World PAY Alışveriş Kredisi    (YKB.NavigationNode)
                  Arçelik Alışveriş Kredisi    (YKB.NavigationNode)
        Yapı Kredi Blue Class                  (YKB.NavigationNode)
        Özel Bankacılık                        (YKB.NavigationNode)
      İşim İçin                                (YKB.NavigationNode / Role=Tab)
      Yapı Kredili Ol                          (YKB.NavigationNode / Role=CustomerAcquisition)
        Bireysel Müşteri                       (YKB.NavigationNode)
        Tüzel Müşteri                          (YKB.NavigationNode)
      İnternet Şubesi                          (YKB.NavigationNode / Role=InternetBranch)
        Bireysel Giriş                         (YKB.NavigationNode)
          Kart İşlemlerim                      (YKB.NavigationNode)
          Şifre Al / Şifremi Unuttum           (YKB.NavigationNode)
        Kurumsal Giriş                         (YKB.NavigationNode)
          Şifre Al / Şifremi Unuttum           (YKB.NavigationNode)
      Mobil Kısayollar                         (YKB.NavigationNode / Role=MobileQuickLinks)
        Yapı Kredi Mobil'i İndir               (YKB.NavigationNode)
        Ürün ve Hizmet Ücretleri               (YKB.NavigationNode)
        Şube ve ATM'ler                        (YKB.NavigationNode)
        Şifre Merkezi                          (YKB.NavigationNode)
```

Menü seviyesi için sabit bir üst sınır yoktur. Repository her düğümün doğrudan çocuklarını `NodeOrder` sırasıyla `Children` alanına yazar; mobil arayüz aynı ağacı istenen derinliğe kadar dolaşır.

## Mevcut tipler ve alanlar

### `CMS.Folder` — mevcut sistem page type

Header Top, Header Main, Menu ve HeaderNotifications yalnızca gruplama amacıyla bu tipi kullanabilir. Özel alan gerekmez. Yerleşik `NodeAliasPath`, `NodeOrder`, yayınlama ve yetki alanları kullanılmaya devam eder.

### Mevcut menü öğesi page type'ı varsa

Projede hâlihazırda menü öğelerini temsil eden bir page type varsa yeni bir kopya üretmek yerine aşağıdaki `YKB.NavigationNode` alanları o tipe eklenmelidir. Kentico class name farklı olabilir; repository yalnızca alan adlarını DTO'ya eşler.

### Announcements — mevcut yapı

`Announcements` header kapsamına alınmaz. Mevcut page type ve alanları değiştirilmez; `LayoutData.Announcements` eşlemesi korunur.

## Yeni/standartlaştırılacak page type'lar

### `YKB.NavigationNode`

| Alan | Kentico tipi | Zorunlu | Varsayılan / kural | DTO |
|---|---|---:|---|---|
| `NavigationTitle` | Text (200) | Evet | Sayfada görünen metin | `Title` |
| `NavigationUrl` | Text (500) | Hayır | Boşsa seçili sayfanın URL'si | `Url` |
| `NavigationIconCssClass` | Text (100) | Hayır | Yalnızca mevcut Yapı Kredi ikon sınıfları | `IconCssClass` |
| `NavigationBadgeText` | Text (40) | Hayır | Örn. `YENİ`, `Hemen Başvur` | `BadgeText` |
| `NavigationRole` | Dropdown | Evet | `MenuItem` | `Role` |
| `NavigationOpenInNewTab` | Boolean | Evet | `false` | `OpenInNewTab` |
| `NavigationDisplayOnDesktop` | Boolean | Evet | `true` | `DisplayOnDesktop` |
| `NavigationDisplayOnMobile` | Boolean | Evet | `true` | `DisplayOnMobile` |
| `NavigationPromoteChildrenOnDesktop` | Boolean | Evet | `false` | `PromoteChildrenOnDesktop` |

`NavigationRole` seçenekleri: `MenuItem`, `Tab`, `CustomerAcquisition`, `InternetBranch`, `MobileQuickLinks`.

`NavigationPromoteChildrenOnDesktop`, mobilde görünen `Bireysel Bankacılık` ara seviyesini masaüstü alt menüsünde atlayıp Krediler/Kartlar gibi çocukları yatay satıra taşımak içindir.

### `YKB.HeaderNotification`

| Alan | Kentico tipi | Zorunlu | Kural | DTO |
|---|---|---:|---|---|
| `HeaderNotificationTitle` | Text (250) | Evet | Sağdaki bildirim metni | `Title` |
| `HeaderNotificationUrl` | Text (500) | Evet | Bildirimin hedefi | `Url` |
| `HeaderNotificationImage` | Media selection | Evet | Soldaki görsel | `ImageUrl` |
| `HeaderNotificationImageAlt` | Text (160) | Evet | Erişilebilir görsel açıklaması | `ImageAlt` |
| `HeaderNotificationOpenInNewTab` | Boolean | Evet | `false` | `OpenInNewTab` |

Yayın başlangıç/bitiş tarihi için Kentico'nun yerleşik `DocumentPublishFrom` ve `DocumentPublishTo` alanları yeterlidir. Listeleme `NodeOrder` sırasını kullanır.

## Allowed child types

- `Menu`, `Header Top`, `Header Main`, `HeaderNotifications`: `CMS.Folder` altında tutulur.
- `Header Top`: yalnızca `YKB.NavigationNode`; çocuk düğüm kabul etmez.
- `Header Main`: `YKB.NavigationNode` kabul eder.
- `YKB.NavigationNode`: yine `YKB.NavigationNode` kabul eder; nested yapı böyle sürer.
- `HeaderNotifications`: yalnızca `YKB.HeaderNotification` kabul eder.

## Repository eşlemesi

Kentico tarafında `Header Top` düz okunur. `Header Main` recursive okunur. `HeaderNotifications` yalnızca yayınlanmış çocuklardan ve `NodeOrder` ile okunur. Sonuçlar mevcut `LayoutData.Create(LayoutContent content)` metoduna verilir; Razor tarafında Kentico API bağımlılığı bulunmaz.

Mock kaynağı kaldırılırken controller içindeki `MockLayoutContent.Create()` çağrısı, Kentico repository'nin döndürdüğü `LayoutContent` ile değiştirilmelidir. Header, `_Layout.cshtml` veya `Header.cshtml` içinde ayrıca sorgu yapmamalıdır.
