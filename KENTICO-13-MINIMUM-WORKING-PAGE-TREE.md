# Kentico 13 page tree — ayrı desktop ve mobil header

## 1. Oluşturulacak yeni kök

`/Shared/Navigation` altında şu kaydı oluşturun:

| Page path | Page type | `NavigationMenuTitle` | `NavigationMenuKey` |
|---|---|---|---|
| `/Shared/Navigation/DesktopHeader` | `YkbYapikredi.NavigationMenu` | `Masaüstü header` | `DesktopHeader` |

Bu bir `CMS.Folder` değildir. Provider menü köklerini path ile değil `NavigationMenuKey` ile bulur; bu nedenle görünen ad `Desktop Header` da olabilir ama key tam olarak `DesktopHeader` olmalıdır.

## 2. Son page tree

```text
/Shared                                                       (CMS.Folder)
  /Navigation                                                 (CMS.Folder)
    /HeaderTop                                                (NavigationMenu / HeaderTop)
      /Mobil Uygulama İndir                                  (NavigationMenuNode)
      /Şube ve ATM'ler                                       (NavigationMenuNode)
      /Ürün ve Hizmet Ücretleri                              (NavigationMenuNode)
      /EN                                                    (NavigationMenuNode)

    /HeaderMain                                               (NavigationMenu / HeaderMain; MOBİL)
      /Kendim İçin                                           (NavigationMenuNode / Tab)
        /Ana Sayfa                                           (NavigationMenuNode)
        /Bireysel Bankacılık                                 (NavigationMenuNode)
          /Şimdi Yapı Kredili Olun                           (NavigationMenuNode)
          /Krediler                                          (NavigationMenuNode)
            /Bireysel İhtiyaç Kredisi                        (NavigationMenuNode)
              /Alışveriş Kredisi                             (NavigationMenuNode)
                /World PAY Alışveriş Kredisi                 (NavigationMenuNode)
          /Kartlar                                           (NavigationMenuNode)
          /Mevduat Ürünleri                                  (NavigationMenuNode)
          /Yatırım Ürünleri                                  (NavigationMenuNode)
          /Ödemeler ve Hizmetler                             (NavigationMenuNode)
          /Sigorta ve Emeklilik                              (NavigationMenuNode)
          /Hesaplama Araçları                                (NavigationMenuNode)
        /Yapı Kredi Blue Class                               (NavigationMenuNode)
        /Özel Bankacılık                                     (NavigationMenuNode)
        /Fatura Ödeme                                        (NavigationMenuNode)
        /Başvuru Merkezi                                     (NavigationMenuNode)
        /Yatırımcı Köşesi                                    (NavigationMenuNode)
        /Yapı Kredi Hakkında                                 (NavigationMenuNode)
        /Memnuniyetiniz İçin Buradayız                       (NavigationMenuNode)
        /Sınırsız Bankacılık                                 (NavigationMenuNode)
        /English                                             (NavigationMenuNode)

      /İşim İçin                                            (NavigationMenuNode / Tab)
        /KOBİ                                                (NavigationMenuNode)
        /Ticari                                              (NavigationMenuNode)
        /Kurumsal                                            (NavigationMenuNode)
        /Sınırsız Bankacılık                                 (NavigationMenuNode)
        /Ticari Kartlar                                      (NavigationMenuNode)
        /Krediler                                            (NavigationMenuNode)
        /Ticari Hesap Açma                                   (NavigationMenuNode)
        /Maaş Ödemeleri                                      (NavigationMenuNode)
        /İş Birliklerimiz                                    (NavigationMenuNode)

      /Yapı Kredili Ol                                       (NavigationMenuNode / CustomerAcquisition)
        /Bireysel Müşteri                                    (NavigationMenuNode)
        /Tüzel Müşteri                                       (NavigationMenuNode)

      /İnternet Şubesi                                       (NavigationMenuNode / InternetBranch)
        /Bireysel Giriş                                      (NavigationMenuNode)
          /Kart İşlemleri                                    (NavigationMenuNode)
          /Şifre Al - Şifremi Unuttum                        (NavigationMenuNode)
        /Kurumsal Giriş                                      (NavigationMenuNode)
          /Şifre Al - Şifremi Unuttum                        (NavigationMenuNode)

      /Mobil Kısayollar                                      (NavigationMenuNode / MobileQuickLinks)
        /Yapı Kredi Mobil'i İndir                            (NavigationMenuNode; ilk sırada)
        /Ürün ve Hizmet Ücretleri                            (NavigationMenuNode)
        /Şube ve ATM'ler                                     (NavigationMenuNode)
        /Şifre Merkezi                                       (NavigationMenuNode)

    /DesktopHeader                                            (NavigationMenu / DesktopHeader; DESKTOP)
      /Kendim İçin                                           (NavigationMenuNode / Tab)
        /Krediler                                            (NavigationMenuNode)
        /Kartlar                                             (NavigationMenuNode)
        /Mevduat                                             (NavigationMenuNode)
        /Yatırım Ürünleri                                    (NavigationMenuNode)
        /Ödemeler ve Hizmetler                               (NavigationMenuNode)
        /Sigorta ve Emeklilik                                (NavigationMenuNode)
        /Sınırsız Bankacılık                                 (NavigationMenuNode)

      /İşim İçin                                            (NavigationMenuNode / Tab)
        /KOBİ                                                (NavigationMenuNode)
        /Ticari                                              (NavigationMenuNode)
        /Kurumsal                                            (NavigationMenuNode)
        /Sınırsız Bankacılık                                 (NavigationMenuNode)
        /Ticari Kartlar                                      (NavigationMenuNode)
        /Krediler                                            (NavigationMenuNode)
        /Ticari Hesap Açma                                   (NavigationMenuNode)
        /Maaş Ödemeleri                                      (NavigationMenuNode)
        /İş Birliklerimiz                                    (NavigationMenuNode)

      /Yapı Kredili Ol                                       (NavigationMenuNode / CustomerAcquisition)
        /Bireysel Müşteri                                    (NavigationMenuNode)
        /Tüzel Müşteri                                       (NavigationMenuNode)

      /İnternet Şubesi                                       (NavigationMenuNode / InternetBranch)
        /Bireysel Giriş                                      (NavigationMenuNode)
          /Kart İşlemleri                                    (NavigationMenuNode)
          /Şifre Al - Şifremi Unuttum                        (NavigationMenuNode)
        /Kurumsal Giriş                                      (NavigationMenuNode)
          /Şifre Al - Şifremi Unuttum                        (NavigationMenuNode)

    /FooterColumns                                            (NavigationMenu / Footer)
    /FooterLegal                                              (NavigationMenu / FooterLegal)
    /FooterBrands                                             (NavigationMenu / FooterBrands)
    /FooterApps                                               (NavigationMenu / FooterApps)
    /Social                                                   (NavigationMenu / Social)

  /HeaderNotifications                                       (CMS.Folder)
  /Announcements                                             (CMS.Folder)
  /Modals                                                    (CMS.Folder)
```

`DesktopHeader` altındaki tab çocukları, desktop dropdown'da ekranda görülecek linklerdir. Artık araya `Bireysel Bankacılık` koyup “promote children” işaretlemeyin. Sıra doğrudan `NodeOrder` ile yönetilir.

## 3. Desktop node değerleri

Tab ve aksiyon kökleri:

| Path | Role | URL/target | Icon |
|---|---|---|---|
| `DesktopHeader/Kendim İçin` | `Tab` | Boş veya `#` | Boş |
| `DesktopHeader/İşim İçin` | `Tab` | Boş veya `#` | Boş |
| `DesktopHeader/Yapı Kredili Ol` | `CustomerAcquisition` | Boş veya `#` | `icon-user-plus-24` |
| `DesktopHeader/İnternet Şubesi` | `InternetBranch` | Boş veya `#` | `icon-pointer-click-24` |

Normal iç site linklerinde:

- `NavigationTitle`: Desktopta görünmesini istediğiniz kısa ad.
- `NavigationTargetPage`: İlgili gerçek sayfayı Page selector'dan seçin.
- `NavigationUrl`: Boş bırakın.
- `NavigationRole`: `MenuItem`.
- `NavigationAudience`: `All`.
- `NavigationOpenInNewTab`: Kapalı.

Örnek: Mobil tarafta başlık `Mevduat Ürünleri`, desktop tarafta `Mevduat` olabilir. İki node'un `NavigationTargetPage` değeri aynı gerçek mevduat sayfasını gösterir.

İnternet Şubesi gibi harici adreslerde:

- `NavigationTargetPage`: Boş.
- `NavigationUrl`: Tam `https://...` adresi.
- Gerçekten yeni sekme isteniyorsa `NavigationOpenInNewTab`: Açık.

## 4. HeaderMain için önemli temizlik

`HeaderMain` artık mobil ağacın tamamıdır. Kod `NavigationDisplayOnMobile` alanına bakmaz. Eski içerikte yalnız desktop için oluşturulmuş node varsa mobilde görünmeye başlar.

Geçişten önce Kentico Pages listing veya page type export üzerinden
`NavigationDisplayOnMobile=false` kayıtlarının listesini alın. Sonuçlardaki
desktop-only kayıtları `DesktopHeader` altında yeniden oluşturun ve
`HeaderMain` içinden kaldırın. Veriyi doğrudan SQL ile güncellemeyin; Pages
uygulamasını kullanın.

## 5. Footer audience dönüşümü

Eski checkbox değerlerini yeni `NavigationAudience` alanına şu şekilde taşıyın:

| Eski Desktop | Eski Mobile | Yeni `NavigationAudience` |
|---:|---:|---|
| Açık | Açık | `All` |
| Açık | Kapalı | `Desktop` |
| Kapalı | Açık | `Mobile` |
| Kapalı | Kapalı | İçerik kullanılmıyor; silin veya yayın dışına alın |

Header node'larında eski checkbox değerlerini `Audience` alanına taşımayın; bütün header node'larında `All` kullanın.

## 6. Yayın kontrol listesi

- `DesktopHeader` key'i tam yazıldı ve tekil.
- Desktop header'da iki `Tab` kökü var.
- Her iki header kökünde birer `CustomerAcquisition` ve `InternetBranch` var.
- `MobileQuickLinks` yalnız `HeaderMain` altında.
- İç linklerde Page selector hedefi seçili.
- Seçilen target sayfaların ilgili culture varyantı yayınlanmış.
- Dış linklerde `NavigationUrl` dolu.
- `HeaderMain` içinde desktop-only eski node kalmadı.
- Kardeş node sıraları Pages uygulamasında doğru.
