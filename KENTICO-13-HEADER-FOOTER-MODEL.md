# Kentico 13 header/footer içerik modeli

Bu belge yeni sözleşmenin ana kaynağıdır. Temel kural şudur:

- `HeaderMain`: yalnız mobil header içeriği.
- `DesktopHeader`: yalnız masaüstü header içeriği.
- Bir öğenin hangi header'da görüneceğini checkbox değil, bulunduğu menü kökü belirler.
- Aynı içerik sayfası iki menüde de gösterilecekse iki ayrı `NavigationMenuNode` oluşturulur ve ikisinde de aynı hedef sayfa seçilir.

Bu ayrım sayesinde masaüstü etiketi, masaüstü görünürlük bayrağı ve çocuk yükseltme davranışı node modelinden çıkarılmıştır. Masaüstünde gösterilecek doğrudan linkler `DesktopHeader` altına istenen sırada doğrudan eklenir.

## 1. Page type: `YkbYapikredi.NavigationMenu`

| Alan | Tip / form control | Zorunlu | Açıklama |
|---|---|---:|---|
| `NavigationMenuTitle` | Text / Text input, 100 | Evet | Editörün gördüğü menü adı |
| `NavigationMenuKey` | Text / Drop-down list, 50 | Evet | Kodun kullandığı tekil anahtar |

`NavigationMenuKey` dropdown değerleri:

```text
HeaderTop;Header üst bağlantıları
HeaderMain;Mobil header ana menüsü
DesktopHeader;Masaüstü header ana menüsü
Footer;Footer kolonları
FooterLegal;Footer yasal bağlantıları
FooterBrands;Footer marka görselleri
FooterApps;Footer uygulama mağazaları
Social;Sosyal medya
```

Her anahtar site ve culture içinde tek kayıt olmalıdır. Provider duplicate kayıtları error, eksik kayıtları warning olarak loglar.

Allowed child page type yalnız `YkbYapikredi.NavigationMenuNode` olmalıdır.

## 2. Page type: `YkbYapikredi.NavigationMenuNode`

### Son alan listesi

| Alan | Tip / form control | Zorunlu | Varsayılan | Kullanım |
|---|---|---:|---|---|
| `NavigationTitle` | Text / Text input, 200 | Evet | — | Menüde görünen etiket ve page tree adı |
| `NavigationTargetPage` | Unique identifier (GUID) / Page selector | Hayır | `Guid.Empty` | Kentico page tree içindeki herhangi bir iç sayfa |
| `NavigationUrl` | Text / URL selector, 500 | Hayır | Boş | Dış URL, `mailto:`, `tel:`, `#anchor` veya hedef sayfa bulunamazsa fallback |
| `NavigationRole` | Text / Drop-down list, 40 | Evet | `MenuItem` | Header'daki teknik davranış |
| `NavigationIconCssClass` | Text / Drop-down list, 100 | Hayır | Boş | Tasarımda gerekiyorsa ikon |
| `NavigationBadgeText` | Text / Text input, 40 | Hayır | Boş | `YENİ`, `Hemen Öde` gibi kısa rozet |
| `NavigationImage` | Text / Media selector, 500 | Hayır | Boş | Görsel footer öğeleri |
| `NavigationMobileImage` | Text / Media selector, 500 | Hayır | Boş | Aynı görselin mobil alternatifi |
| `NavigationImageAlt` | Text / Text input, 160 | Koşullu | Boş | `NavigationImage` doluysa zorunlu |
| `NavigationAudience` | Text / Drop-down list, 20 | Evet | `All` | Yalnız ortak footer ağaçları için cihaz seçimi |
| `NavigationOpenInNewTab` | Boolean / Check box | Evet | `false` | Yeni sekmede açma |

`NavigationTargetPage` Page selector için başlangıç path'i vermeyin veya `/` kullanın. Böylece page type'ından ve hiyerarşideki yerinden bağımsız olarak herhangi bir sayfa seçilebilir. Seçim limiti bir olmalıdır.

`NavigationAudience` dropdown:

```text
All;Tüm cihazlar
Desktop;Yalnız masaüstü
Mobile;Yalnız mobil
```

Header ağaçlarında `NavigationAudience=All` bırakılır. Header görünürlüğünü bu alanla yönetmeyin; doğru köke yerleştirin. Alan yalnız mevcut desktop/mobile footer varyasyonlarını iki ayrı checkbox yerine tek ve geçerli bir seçimle korur.

### Silinecek alanlar

Kod yeni sürüme alındıktan sonra şu alanları page type'tan silin:

```text
NavigationDesktopName
NavigationDisplayOnDesktop
NavigationDisplayOnMobile
NavigationPromoteChildrenOnDesktop
```

Karşılıkları:

- `NavigationDesktopName`: Gerekli değil. Desktop node'un `NavigationTitle` değeri bağımsızdır. Örneğin mobil node `Mevduat Ürünleri`, desktop node `Mevduat` olabilir.
- `NavigationDisplayOnDesktop`: Gerekli değil. Desktop görünürlük `DesktopHeader` ağacında bulunmakla belirlenir.
- `NavigationDisplayOnMobile`: Header için gerekli değil. Footer'daki ihtiyaç tek `NavigationAudience` alanına taşınmıştır.
- `NavigationPromoteChildrenOnDesktop`: Gerekli değil. Gösterilecek çocuklar doğrudan `DesktopHeader/<Tab>` altına eklenir.

### Hedef ve URL önceliği

Provider aşağıdaki sırayı uygular:

1. `NavigationTargetPage` seçilmiş ve yayınlanmışsa hedef sayfanın güncel relative URL'si kullanılır.
2. Seçilen sayfa bulunamazsa warning loglanır ve `NavigationUrl` kullanılır.
3. Target seçilmemişse doğrudan `NavigationUrl` kullanılır.

İç linklerde Page selector kullanın. Böylece sayfanın URL'si veya content-tree konumu değiştiğinde menüde elle URL güncellemek gerekmez. Dış bağlantı, anchor ve teknik `#` grupları için `NavigationUrl` kullanın.

Tıklanabilir bir node için hedef sayfa veya URL'den en az biri dolu olmalıdır. Salt grup/sekme node'unda ikisi de boş olabilir; mevcut view ile uyumluluk için `#` da kullanılabilir. `javascript:` URL kabul edilmemelidir.

## 3. Role değerleri

```text
MenuItem;Standart menü öğesi
Tab;Ana müşteri sekmesi
CustomerAcquisition;Yapı Kredili Ol aksiyonu
InternetBranch;İnternet Şubesi aksiyonu
MobileQuickLinks;Mobil kısayol grubu
```

Kurallar:

- `DesktopHeader` doğrudan çocuklarında `Tab`, `CustomerAcquisition` ve `InternetBranch` kullanılabilir.
- `HeaderMain` doğrudan çocuklarında bunlara ek olarak `MobileQuickLinks` kullanılabilir.
- `MobileQuickLinks`, `DesktopHeader` altında oluşturulmaz.
- Role teknik köklerin çocuklarında `MenuItem` olmalıdır.
- Her iki header kökünde `CustomerAcquisition` ve `InternetBranch` en fazla birer kez bulunmalıdır.

## 4. Parent page type ve scope ayarları

- `CMS.Folder` altında `YkbYapikredi.NavigationMenu` oluşturulabilsin.
- `YkbYapikredi.NavigationMenu` altında yalnız `YkbYapikredi.NavigationMenuNode` oluşturulabilsin.
- `YkbYapikredi.NavigationMenuNode` kendi altında yine `YkbYapikredi.NavigationMenuNode` kabul etsin.
- Navigation içerik tiplerinde URL/routing veya Page Builder özelliği açmayın; bunlar içerik-only kayıtlarıdır.
- `NavigationTitle`, Page name source field olarak seçilebilir.

## 5. Güvenli geçiş sırası

1. Kentico page type ve mevcut navigation verisinin export/backup'ını alın.
2. `NavigationMenuKey` dropdown'una `DesktopHeader` ekleyin.
3. `NavigationTargetPage` ve `NavigationAudience` alanlarını ekleyin. Eski görünürlük alanlarını henüz silmeyin.
4. Mevcut footer node'larında eski iki checkbox değerini `NavigationAudience` alanına aktarın; dönüşüm tablosu minimum page-tree belgesindedir.
5. `/Shared/Navigation/DesktopHeader` kökünü ve aşağıdaki page tree'yi oluşturun.
6. Eski `HeaderMain` ağacında `NavigationDisplayOnDesktop=true` olan yapıyı referans alarak desktop node'larını yeni köke ekleyin. `PromoteChildrenOnDesktop=true` olan kapsayıcıyı değil, ekranda görünen çocuklarını doğrudan tab altına ekleyin.
7. Eski `HeaderMain` içinde `NavigationDisplayOnMobile=false` olan desktop-only node'ları belirleyin; bunları yeni köke taşıdıktan/yeniden oluşturduktan sonra `HeaderMain` içinden kaldırın. Aksi halde yeni kod bunları mobilde gösterir.
8. Bu repodaki model/provider/view/JS değişikliklerini deploy edin.
9. Desktop, mobil ve footer görünürlüğünü ayrı ayrı doğrulayın.
10. Dört eski alanı silin ve `NavigationMenu` ile `NavigationMenuNode` generated class'larını yeniden üretin.

Eski alanları deploy öncesi silmeyin; eski provider generated property'lere eriştiği için geçiş sırasında uygulama açılmaz.

## 6. Teknik notlar

- `NavigationTargetPage` bilinçli olarak generated property üzerinden değil `GetGuidValue` ile okunur. Bu, schema ve generated wrapper deploy'larının kısa süreli farklı sırada ilerlemesini tolere eder; generated class yine de son aşamada yenilenmelidir.
- Seçilen hedefler tüm menüler için toplu alınır ve URL path verileri `WithPageUrlPaths()` ile birlikte yüklenir.
- Masaüstü ve mobil action içerikleri iki kökte ayrı node'lardır. Bu duplication, cihazlara göre bağımsız sıra, başlık ve hedef yönetebilmenin bilinçli bedelidir.

Kentico'nun resmi önerisi de ikincil menülerde sayfaları seçilebilir referanslar olarak modellemek ve URL'leri `IPageUrlRetriever` ile üretmektir:

- https://docs.kentico.com/13/developing-websites/building-website-navigation
- https://docs.kentico.com/13/developing-websites/retrieving-content/displaying-page-content
