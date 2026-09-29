# Kentico 13 header içerik modeli

Bu değişiklik yalnız header içindir. Footer page tree'si, footer menü kökleri ve footer görünümü değiştirilmez.

Temel kural:

- `HeaderMain`: mevcut mobil header menüsü.
- `DesktopHeader`: yeni masaüstü header menüsü.
- Görünürlüğü bir field değil, node'un bulunduğu menü kökü belirler.
- `Tab` ayrı bir page type değildir. `Kendim İçin`, `İşim İçin` ve bütün alt kayıtlar aynı `YkbYapikredi.NavigationMenuNode` page type'ındadır.
- Masaüstü ve mobilde aynı hedef gösterilecekse iki menü altında iki ayrı node oluşturulur.

## 1. `YkbYapikredi.NavigationMenu`

Yeni bir page type oluşturulmaz. Var olan `NavigationMenu` şu alanlarla kullanılmaya devam eder:

| Alan | Tip / form control | Zorunlu | Açıklama |
|---|---|---:|---|
| `NavigationMenuTitle` | Text / Text input | Evet | Editörün gördüğü menü adı |
| `NavigationMenuKey` | Text / Drop-down list | Evet | Kodun kullandığı tekil anahtar |

`NavigationMenuKey` seçeneklerine şunu ekleyin:

```text
DesktopHeader;Masaüstü header ana menüsü
```

Mevcut `HeaderMain` değeri mobil menü olarak kalır. `DesktopHeader` ve `HeaderMain` kayıtlarının allowed child page type'ı `YkbYapikredi.NavigationMenuNode` olmalıdır.

## 2. `YkbYapikredi.NavigationMenuNode`

Paylaşılan generated class'a göre kullanılacak son field listesi:

| Alan | Önerilen form control | Zorunlu | Kullanım |
|---|---|---:|---|
| `NavigationNodeID` | Sistem alanı | Evet | Page type primary key |
| `NavigationTitle` | Text input | Evet | Menüde görünen başlık |
| `NavigationUrl` | URL selector | Koşullu | İç sayfa, dış URL, anchor, `mailto:` veya `tel:` hedefi |
| `NavigationIconCssClass` | Text input veya Drop-down list | Hayır | İkon CSS sınıfı |
| `NavigationImage` | Media selector | Hayır | Görsel URL'si |
| `NavigationMobileImage` | Media selector | Hayır | Mobil alternatif görsel URL'si |
| `NavigationImageAlt` | Text input | Hayır | Görsel alternatif metni |
| `NavigationBadgeText` | Text input | Hayır | `YENİ`, `Hemen Öde` gibi rozet |
| `NavigationRole` | Drop-down list | Evet | Node'un header davranışı |
| `NavigationOpenInNewTab` | Check box | Evet | Linki yeni sekmede açar |

`NavigationUrl` alanını URL selector olarak yapılandırın. Editör bu tek alan üzerinden page tree'deki bir sayfayı seçebilmeli veya dış URL girebilmelidir. Ayrı bir `NavigationTargetPage` field'ı oluşturmayın.

Şu field'lar page type'ta bulunmamalıdır:

```text
NavigationTargetPage
NavigationAudience
NavigationDesktopName
NavigationDisplayOnDesktop
NavigationDisplayOnMobile
NavigationPromoteChildrenOnDesktop
```

Provider yalnız yukarıdaki son generated class property'lerine erişir. Bu nedenle kaldırılan field'lar için generated code üretmeye gerek yoktur.

## 3. `NavigationRole` seçenekleri

```text
MenuItem;Standart menü öğesi
Tab;Ana müşteri sekmesi
CustomerAcquisition;Yapı Kredili Ol aksiyonu
InternetBranch;İnternet Şubesi aksiyonu
MobileQuickLinks;Mobil kısayollar bölümü
```

Varsayılan değer `MenuItem` olmalıdır.

Önemli: `Tab`, `CustomerAcquisition`, `InternetBranch` ve `MobileQuickLinks` page type değildir; aynı `NavigationMenuNode` üzerindeki role değerleridir.

## 4. Header ayrımının çalışma şekli

```text
NavigationMenuKey=DesktopHeader
  -> LayoutData.DesktopHeaderItems
  -> Header.cshtml masaüstü alanı

NavigationMenuKey=HeaderMain
  -> LayoutData.MobileHeaderItems
  -> Header.cshtml mobil alanı ve header.js
```

`DisplayOnDesktop`, `DisplayOnMobile` veya `PromoteChildrenOnDesktop` kontrolü yapılmaz. Masaüstünde gösterilecek link, `DesktopHeader` altında ve gösterilmesi istenen seviyede oluşturulur. Mobil ağaç mevcut `HeaderMain` altında yönetilmeye devam eder.

## 5. Validasyon önerileri

- `NavigationTitle` zorunlu olsun.
- `NavigationRole` zorunlu ve varsayılanı `MenuItem` olsun.
- Link node'larında `NavigationUrl` zorunlu olsun; sadece grup/sekme node'larında boş veya `#` kabul edilebilir.
- `NavigationOpenInNewTab` varsayılanı `false` olsun.
- `NavigationImage` girilmişse `NavigationImageAlt` da istenebilir.
- Aynı `NavigationMenuKey` için birden fazla `NavigationMenu` kaydı oluşturmayın.

## 6. Footer kapsamı

Footer için yeni root, yeni role, `NavigationAudience` veya başka bir field eklenmez. Asıl projedeki footer modeli ve page tree'si aynen korunur. Bu repodaki header ayrımı footer içeriğini farklı bir klasöre taşımaz.
