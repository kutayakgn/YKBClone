# Kentico 13 page tree — desktop header

## Oluşturulacak yeni menü kökü

`/Shared/Navigation` altında aşağıdaki kaydı oluşturun:

| Page path | Page type | `NavigationMenuTitle` | `NavigationMenuKey` |
|---|---|---|---|
| `/Shared/Navigation/DesktopHeader` | `YkbYapikredi.NavigationMenu` | `Masaüstü header` | `DesktopHeader` |

Bu kayıt teknik olarak `CMS.Folder` değil, `NavigationMenu` page type'ında bir menü köküdür. Provider path'e değil `NavigationMenuKey` değerine göre bulduğu için key tam olarak `DesktopHeader` olmalıdır.

Mevcut `/Shared/Navigation/HeaderMain` kaydını silmeyin veya taşımayın. Mobil header buradan beslenmeye devam eder.

## DesktopHeader altında oluşturulacak page tree

Aşağıdaki kayıtların tamamı `YkbYapikredi.NavigationMenuNode` page type'ında oluşturulur. Parantez içindeki değer ayrı bir page type değil, `NavigationRole` alanının değeridir.

```text
/Shared/Navigation/DesktopHeader                         (NavigationMenu; key=DesktopHeader)
  /Kendim İçin                                          (NavigationMenuNode; role=Tab)
    /Krediler                                           (NavigationMenuNode; role=MenuItem)
    /Kartlar                                            (NavigationMenuNode; role=MenuItem)
    /Mevduat                                            (NavigationMenuNode; role=MenuItem)
    /Yatırım Ürünleri                                   (NavigationMenuNode; role=MenuItem)
    /Ödemeler ve Hizmetler                              (NavigationMenuNode; role=MenuItem)
    /Sigorta ve Emeklilik                               (NavigationMenuNode; role=MenuItem)
    /Sınırsız Bankacılık                                (NavigationMenuNode; role=MenuItem)

  /İşim İçin                                           (NavigationMenuNode; role=Tab)
    /KOBİ                                               (NavigationMenuNode; role=MenuItem)
    /Ticari                                             (NavigationMenuNode; role=MenuItem)
    /Kurumsal                                           (NavigationMenuNode; role=MenuItem)
    /Sınırsız Bankacılık                                (NavigationMenuNode; role=MenuItem)
    /Ticari Kartlar                                     (NavigationMenuNode; role=MenuItem)
    /Krediler                                           (NavigationMenuNode; role=MenuItem)
    /Ticari Hesap Açma                                  (NavigationMenuNode; role=MenuItem)
    /Maaş Ödemeleri                                     (NavigationMenuNode; role=MenuItem)
    /İş Birliklerimiz                                   (NavigationMenuNode; role=MenuItem)

  /Yapı Kredili Ol                                      (NavigationMenuNode; role=CustomerAcquisition)
    /Bireysel Müşteri                                   (NavigationMenuNode; role=MenuItem)
    /Tüzel Müşteri                                      (NavigationMenuNode; role=MenuItem)

  /İnternet Şubesi                                      (NavigationMenuNode; role=InternetBranch)
    /Bireysel Giriş                                     (NavigationMenuNode; role=MenuItem)
      /Kart İşlemleri                                   (NavigationMenuNode; role=MenuItem)
      /Şifre Al - Şifremi Unuttum                       (NavigationMenuNode; role=MenuItem)
    /Kurumsal Giriş                                     (NavigationMenuNode; role=MenuItem)
      /Şifre Al - Şifremi Unuttum                       (NavigationMenuNode; role=MenuItem)
```

İlk iki root node'un (`Kendim İçin`, `İşim İçin`) `NavigationRole` değeri `Tab` olmalıdır. View masaüstü sekmelerini bu role göre seçer ve sekmenin doğrudan çocuklarını yatay alt menüde gösterir.

`Yapı Kredili Ol` ve `İnternet Şubesi` mevcut masaüstü aksiyonları kullanılacaksa aynı root altında gösterildiği gibi oluşturulmalıdır. Bunlar da `NavigationMenuNode` page type'ındadır.

## Her node için doldurulacak alanlar

| Alan | Değer |
|---|---|
| `NavigationTitle` | Ekranda görünecek metin |
| `NavigationRole` | Yukarıdaki role; normal linklerde `MenuItem` |
| `NavigationUrl` | URL selector ile seçilen iç sayfa veya dış URL |
| `NavigationOpenInNewTab` | Gerekiyorsa işaretli |
| `NavigationIconCssClass` | Yalnız ikon kullanılan aksiyonlarda |

`NavigationUrl` URL selector'ında page tree'nin herhangi bir yerindeki sayfa seçilebilir. Böylece `DesktopHeader` içindeki node, menünün dışında bulunan herhangi bir içerik sayfasını gösterebilir. Dış bağlantılar da aynı alana yazılır. `NavigationTargetPage` kullanılmaz.

## Mevcut mobil menü

Mobil page tree aynı kalır:

```text
/Shared/Navigation/HeaderMain                            (NavigationMenu; key=HeaderMain)
  /Kendim İçin                                          (NavigationMenuNode; role=Tab)
    /... mevcut mobil çocuklar ...                      (NavigationMenuNode)
  /İşim İçin                                           (NavigationMenuNode; role=Tab)
    /... mevcut mobil çocuklar ...                      (NavigationMenuNode)
  /Yapı Kredili Ol                                      (NavigationMenuNode; role=CustomerAcquisition)
  /İnternet Şubesi                                      (NavigationMenuNode; role=InternetBranch)
  /Mobil Kısayollar                                     (NavigationMenuNode; role=MobileQuickLinks)
```

`HeaderMain` altında girilmiş mevcut kayıtlar mobilde kullanılmaya devam eder. Desktop görünürlüğünü değiştirmek için bu kayıtların field'ları değiştirilmez; karşılığı `DesktopHeader` altında ayrıca oluşturulur.

## Footer

Footer root'larına ve footer altındaki mevcut page'lere dokunmayın. Bu değişiklik için footer migration'ı yoktur.

## Yayına alma kontrolü

1. `DesktopHeader` menü kökünü ve altındaki node'ları publish edin.
2. `NavigationMenuKey` değerinin tam olarak `DesktopHeader` olduğunu doğrulayın.
3. `Kendim İçin` ve `İşim İçin` kayıtlarında `NavigationRole=Tab` olduğunu doğrulayın.
4. Çocukların sırasını page tree sırasıyla düzenleyin; provider `NodeOrder` kullanır.
5. Masaüstünde `DesktopHeader`, mobilde mevcut `HeaderMain` içeriğinin geldiğini kontrol edin.
