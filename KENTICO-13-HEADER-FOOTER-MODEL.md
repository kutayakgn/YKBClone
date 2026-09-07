# Kentico 13 header + footer içerik modeli

Bu belge son ve birleştirilmiş modeldir. `YKB.HeaderSettings` veya `YKB.FooterSettings` oluşturulmaz. Logo yolları, arama URL'si, “Duyurular”, “Tüm Duyurular”, dönüş süresi ve copyright gibi sabitler koddan yönetilir.

Kentico'ya yalnız ekranları çalıştıracak 2–3 örnek içerikle başlangıç verisi girmek için `KENTICO-13-MINIMUM-WORKING-PAGE-TREE.md` belgesini kullanın. Bu belge ise genişletilmiş üretim ağacını ve tam page type sözleşmesini korur.

Menüler ağaç yoluyla aranmaz. Her menü kökü `YKB.NavigationMenu.MenuKey` ile bulunur; node başka klasöre taşınsa bile repository aynı anahtarla içeriği bulur.

## Tam page tree

```text
/Shared                                                        (CMS.Folder)
  /Navigation                                                  (CMS.Folder)
    /Header Top                                                 (YKB.NavigationMenu / HeaderTop)
      /Mobil Uygulama İndir                                    (YKB.NavigationNode)
      /Şube ve ATM'ler                                         (YKB.NavigationNode)
      /Ürün ve Hizmet Ücretleri                                (YKB.NavigationNode)
      /EN                                                      (YKB.NavigationNode)

    /Header Main                                                (YKB.NavigationMenu / HeaderMain)
      /Kendim İçin                                             (YKB.NavigationNode / Tab)
        /Ana Sayfa                                             (YKB.NavigationNode / desktop=false)
        /Bireysel Bankacılık                                   (YKB.NavigationNode / promote=true)
          /Şimdi Yapı Kredili Olun                             (YKB.NavigationNode / desktop=false)
          /Krediler                                            (YKB.NavigationNode)
            /Bireysel İhtiyaç Kredisi                          (YKB.NavigationNode)
              /Maaş Müşterilerine Özel İhtiyaç Kredisi         (YKB.NavigationNode)
              /Mobilden ve İnternetten Anında Online Kredi     (YKB.NavigationNode)
              /Borç Transfer Kredisi                           (YKB.NavigationNode)
              /Kredi Kapama Koşullu Kredi                      (YKB.NavigationNode)
              /3 Ay Ertelemeli Bireysel İhtiyaç Kredisi        (YKB.NavigationNode)
              /Hepsipay İhtiyaç Kredisi                        (YKB.NavigationNode)
              /Alışveriş Kredisi                               (YKB.NavigationNode)
                /World PAY Alışveriş Kredisi                   (YKB.NavigationNode)
                  /Arçelik Alışveriş Kredisi                   (YKB.NavigationNode)
                  /Setur Alışveriş Kredisi                     (YKB.NavigationNode)
                  /MediaMarkt Alışveriş Kredisi                (YKB.NavigationNode)
                  /Vatan Bilgisayar Alışveriş Kredisi          (YKB.NavigationNode)
                  /Koçtaş Alışveriş Kredisi                    (YKB.NavigationNode)
                  /Troy Alışveriş Kredisi                      (YKB.NavigationNode)
              /İhtiyaç Kredisi İçin İpuçları                   (YKB.NavigationNode)
              /Emekliye Özel İhtiyaç Kredisi                   (YKB.NavigationNode)
              /SGK Prim Borcunuza Özel İhtiyaç Kredisi         (YKB.NavigationNode)
            /Esnek Hesap (KMH)                                 (YKB.NavigationNode)
            /Taksitli Esnek Hesap                              (YKB.NavigationNode)
            /Ev Kredisi - Konut Kredi Faizleri                 (YKB.NavigationNode)
              /Doğa Dostu Mortgage                             (YKB.NavigationNode)
            /Taşıt Kredisi                                     (YKB.NavigationNode)
              /Motosiklet Kredisi                              (YKB.NavigationNode)
            /Tekne Kredisi                                     (YKB.NavigationNode)
            /Esnek Geri Ödeme Modeli                           (YKB.NavigationNode)
            /Hazır Limitim                                     (YKB.NavigationNode / badge=YENİ)
            /Findeks Paketleri                                 (YKB.NavigationNode)
          /Kartlar                                             (YKB.NavigationNode)
            /Kredi Kartları                                    (YKB.NavigationNode)
          /Mevduat Ürünleri                                    (YKB.NavigationNode)
            /Altın Bankacılığı                                 (YKB.NavigationNode)
          /Yapı Kredi Yatırım Ürünleri                         (YKB.NavigationNode)
            /Yatırım Fonları                                   (YKB.NavigationNode)
          /Ödemeler ve Hizmetler                               (YKB.NavigationNode)
            /Fatura Ödemeleri                                  (YKB.NavigationNode)
          /Merkezi Hizmet                                      (YKB.NavigationNode / desktop=false)
          /Çocuk Bankacılığı                                   (YKB.NavigationNode / desktop=false)
          /Gençlik Bankacılığı                                 (YKB.NavigationNode / desktop=false)
          /Sigorta ve Emeklilik                                (YKB.NavigationNode)
            /Bireysel Emeklilik Sistemi                        (YKB.NavigationNode)
          /Hesaplama Araçları                                  (YKB.NavigationNode / desktop=false)
            /Kredi Hesaplama Aracı                             (YKB.NavigationNode)
          /Sözleşmeler ve Formlar                              (YKB.NavigationNode / desktop=false)
          /Sınırsız Bankacılık                                 (YKB.NavigationNode / mobile=false)
        /Yapı Kredi Blue Class                                 (YKB.NavigationNode)
        /Özel Bankacılık                                       (YKB.NavigationNode)
        /Fatura Ödeme                                          (YKB.NavigationNode / desktop=false)
          /Tüm Faturalar                                       (YKB.NavigationNode)
        /Başvuru Merkezi                                       (YKB.NavigationNode / desktop=false)
          /Yapı Kredi Müşterisi Ol                             (YKB.NavigationNode)
        /Yatırımcı Köşesi: Piyasa Analizleri                   (YKB.NavigationNode / desktop=false)
          /Borsa                                               (YKB.NavigationNode)
        /Yapı Kredi Hakkında                                   (YKB.NavigationNode / desktop=false)
          /Haberler                                            (YKB.NavigationNode)
        /Memnuniyetiniz İçin Buradayız                         (YKB.NavigationNode / desktop=false)
          /İletişim                                            (YKB.NavigationNode)
        /Sınırsız Bankacılık                                   (YKB.NavigationNode / desktop=false)
          /Mobil Şube                                          (YKB.NavigationNode)
        /English                                               (YKB.NavigationNode / desktop=false)

      /İşim İçin                                              (YKB.NavigationNode / Tab)
        /KOBİ                                                  (YKB.NavigationNode)
          /Krediler                                            (YKB.NavigationNode)
        /Ticari                                                (YKB.NavigationNode)
          /Nakit Yönetimi                                      (YKB.NavigationNode)
        /Kurumsal                                              (YKB.NavigationNode)
          /Nakit Yönetimi                                      (YKB.NavigationNode)
        /Sınırsız Bankacılık                                   (YKB.NavigationNode)
        /Ticari Kartlar                                        (YKB.NavigationNode)
        /Krediler                                              (YKB.NavigationNode)
        /Ticari Hesap Açma                                     (YKB.NavigationNode)
        /Maaş Ödemeleri                                        (YKB.NavigationNode)
        /İş Birliklerimiz                                      (YKB.NavigationNode)

      /Yapı Kredili Ol                                         (YKB.NavigationNode / CustomerAcquisition)
        /Bireysel Müşteri                                      (YKB.NavigationNode)
        /Tüzel Müşteri                                         (YKB.NavigationNode)

      /İnternet Şubesi                                         (YKB.NavigationNode / InternetBranch)
        /Bireysel Giriş                                        (YKB.NavigationNode)
          /Kart İşlemleri                                      (YKB.NavigationNode)
          /Şifre Al / Şifremi Unuttum                          (YKB.NavigationNode)
        /Kurumsal Giriş                                        (YKB.NavigationNode)
          /Şifre Al / Şifremi Unuttum                          (YKB.NavigationNode)

      /Mobil Kısayollar                                        (YKB.NavigationNode / MobileQuickLinks)
        /Yapı Kredi Mobil'i İndir                              (YKB.NavigationNode / 1. sıra)
        /Ürün ve Hizmet Ücretleri                              (YKB.NavigationNode)
        /Şube ve ATM'ler                                       (YKB.NavigationNode)
        /Şifre Merkezi                                         (YKB.NavigationNode)

    /Footer Columns                                             (YKB.NavigationMenu / Footer)
      /Bize Ulaşın                                             (YKB.NavigationNode / mobile=false)
        /Memnuniyetiniz İçin                                   (YKB.NavigationNode)
        /İletişim                                              (YKB.NavigationNode)
      /İlginizi Çekebilir                                      (YKB.NavigationNode)
        /Emekli Promosyon                                      (YKB.NavigationNode)
        /Uygulama Marketi                                      (YKB.NavigationNode)
        /Vadesiz Mevduat                                       (YKB.NavigationNode)
        /Vadeli Mevduat                                        (YKB.NavigationNode)
        /Yapı Kredi Hakkında                                   (YKB.NavigationNode)
        /Sürdürülebilirlik                                     (YKB.NavigationNode)
        /Haberler                                              (YKB.NavigationNode)
        /Basın Bültenleri                                      (YKB.NavigationNode)
        /İnsan Kaynakları                                      (YKB.NavigationNode)
        /EYT                                                   (YKB.NavigationNode)
      /Yatırım & Finans                                        (YKB.NavigationNode)
        /Canlı Döviz                                           (YKB.NavigationNode)
        /Yatırım Fonları                                       (YKB.NavigationNode)
        /Altın Mevduat                                         (YKB.NavigationNode)
        /Altın                                                 (YKB.NavigationNode)
        /Halka Arz                                             (YKB.NavigationNode)
        /Hisse Senedi                                          (YKB.NavigationNode)
        /Vadeli Mevduat Oranları                               (YKB.NavigationNode)
        /Yurt Dışı Piyasaları                                  (YKB.NavigationNode)
        /Yatırımcı Köşesi                                      (YKB.NavigationNode)
        /Dolar Kaç TL                                          (YKB.NavigationNode)
      /Kartlar & Başvurular                                    (YKB.NavigationNode)
        /Banka Hesabı Aç                                       (YKB.NavigationNode)
        /Ticari Hesap Aç                                       (YKB.NavigationNode)
        /Kredi Kartı Başvuru                                   (YKB.NavigationNode)
        /Banka Kartı                                           (YKB.NavigationNode)
        /Kredi Kartı                                           (YKB.NavigationNode)
        /Worldcard                                             (YKB.NavigationNode)
        /Ticari Kartlar                                        (YKB.NavigationNode)
        /Kredi Kartı Asgari Hesaplama                          (YKB.NavigationNode)
        /Güvenli Araç Alım Satım                               (YKB.NavigationNode)
        /Kiram Hesabımda                                       (YKB.NavigationNode)
      /Krediler                                                (YKB.NavigationNode)
        /Konut Kredisi                                         (YKB.NavigationNode)
        /İhtiyaç Kredisi                                       (YKB.NavigationNode)
        /Kredi                                                 (YKB.NavigationNode)
        /Taşıt Kredisi                                         (YKB.NavigationNode)
        /Kredi Başvurusu                                       (YKB.NavigationNode)
        /3 Ay Ertelemeli Kredi                                 (YKB.NavigationNode)
        /Esnek Hesap/Kredili Mevduat Hesabı                    (YKB.NavigationNode)
        /EYT Kredisi                                           (YKB.NavigationNode)
        /Alışveriş Kredisi                                     (YKB.NavigationNode)
        /2. El Araç Kredisi                                    (YKB.NavigationNode)
      /Faydalı Sayfalar                                        (YKB.NavigationNode)
        /Yatırımcı İlişkileri                                  (YKB.NavigationNode)
        /Kredi Hesaplama                                       (YKB.NavigationNode)
        /Döviz Hesaplama                                       (YKB.NavigationNode)
        /Mevduat Hesaplama                                     (YKB.NavigationNode)
        /Fatura Ödeme                                          (YKB.NavigationNode)
        /HGS                                                   (YKB.NavigationNode)
        /MTV Ödeme                                             (YKB.NavigationNode)
        /Trafik Sigortası                                      (YKB.NavigationNode)
        /Kasko                                                 (YKB.NavigationNode)
        /Sıkça Sorulan Sorular                                 (YKB.NavigationNode)
        /Site Haritası                                         (YKB.NavigationNode)

    /Footer Legal                                               (YKB.NavigationMenu / FooterLegal)
      /TMSF ve YTM Zaman Aşımı Listesi                         (YKB.NavigationNode)
      /Bilgi Toplumu Hizmetleri                                (YKB.NavigationNode)
      /Kişisel Verilerin Korunması                             (YKB.NavigationNode)
      /Gizlilik Politikası                                     (YKB.NavigationNode)
      /Çerez Aydınlatma Metni                                  (YKB.NavigationNode)
      /İletişim                                                (YKB.NavigationNode / desktop=false)
      /English                                                 (YKB.NavigationNode / desktop=false)

    /Footer Brands                                              (YKB.NavigationMenu / FooterBrands)
      /Blog                                                    (YKB.NavigationNode / image)
      /FRWRD                                                   (YKB.NavigationNode / image)
      /Koç 100. Yıl                                            (YKB.NavigationNode / desktop+mobile image)

    /Footer Apps                                                (YKB.NavigationMenu / FooterApps)
      /App Store                                               (YKB.NavigationNode / image / desktop=false)
      /Google Play                                             (YKB.NavigationNode / image / desktop=false)
      /AppGallery                                              (YKB.NavigationNode / image / desktop=false)

    /Social                                                     (YKB.NavigationMenu / Social)
      /Facebook                                                (YKB.NavigationNode)
      /X                                                       (YKB.NavigationNode)
      /Instagram                                               (YKB.NavigationNode)
      /LinkedIn                                                (YKB.NavigationNode)
      /YouTube                                                 (YKB.NavigationNode)

  /Header Notifications                                         (CMS.Folder)
    /Bildirim 1                                                (YKB.HeaderNotification)
    /Bildirim 2                                                (YKB.HeaderNotification)

  /Announcements                                                (CMS.Folder)
    /Duyuru 1                                                  (YKB.Announcement)
    /Duyuru 2                                                  (YKB.Announcement)
```

`Header Notifications` ve `Announcements` klasörleri boş kalabilir. Duyuru klasörü boşsa duyuru şeridi HTML'e hiç render edilmez; footer doğrudan kolonlarla başlar.

## Page tree oluştururken seçilecek kesin değerler

Bu bölüm yukarıdaki tam ağacın kurulum reçetesidir. Tablolarda `Açık` checkbox'ın işaretli, `Kapalı` işaretsiz olduğunu ifade eder. Aşağıdaki istisna tablolarında bulunmayan **bütün** `YKB.NavigationNode` sayfalarında şu değerler seçilir:

| Alan | Seçilecek değer |
|---|---|
| `NavigationRole` | `MenuItem` |
| `NavigationIconCssClass` | `İkon yok` (kaydedilen değer boş string) |
| `NavigationOpenInNewTab` | Kapalı |
| `NavigationDisplayOnDesktop` | Açık |
| `NavigationDisplayOnMobile` | Açık |
| `NavigationPromoteChildrenOnDesktop` | Kapalı |
| `NavigationBadgeText` | Boş |
| `NavigationImage`, `NavigationMobileImage`, `NavigationImageAlt` | Boş |

Bu varsayılan kural sayesinde üstteki ağaçta yer alan her yaprak için aynı yedi seçimi tekrar etmeye gerek yoktur. Aşağıdaki tablolar varsayılandan ayrılan **tüm** düğümleri eksiksiz listeler.

### Menü kökleri

`/Shared` ve `/Shared/Navigation` için page type `CMS.Folder` seçilir. Menü kökleri için değerler şöyledir:

| Tam path | Page type | `NavigationMenuTitle` | `NavigationMenuKey` dropdown |
|---|---|---|---|
| `/Shared/Navigation/Header Top` | `YKB.NavigationMenu` | `Header üst bağlantıları` | `HeaderTop` |
| `/Shared/Navigation/Header Main` | `YKB.NavigationMenu` | `Header ana menü` | `HeaderMain` |
| `/Shared/Navigation/Footer Columns` | `YKB.NavigationMenu` | `Footer kolonları` | `Footer` |
| `/Shared/Navigation/Footer Legal` | `YKB.NavigationMenu` | `Footer yasal bağlantıları` | `FooterLegal` |
| `/Shared/Navigation/Footer Brands` | `YKB.NavigationMenu` | `Footer marka görselleri` | `FooterBrands` |
| `/Shared/Navigation/Footer Apps` | `YKB.NavigationMenu` | `Footer uygulama mağazaları` | `FooterApps` |
| `/Shared/Navigation/Social` | `YKB.NavigationMenu` | `Bizi Takip Edin` | `Social` |

`NavigationMenuKey` site ve kültür içinde tekil olmalıdır. Özellikle `Social` menüsünün başlığı ekranda kullanıldığı için `NavigationMenuTitle=Bizi Takip Edin` girilmelidir.

### Header Main — varsayılandan farklı düğümler

| `Header Main` altındaki path | `NavigationRole` | `NavigationIconCssClass` dropdown | Desktop | Mobile | Promote children | New tab | Badge |
|---|---|---|---:|---:|---:|---:|---|
| `Kendim İçin` | `Tab` | `icon-mobile-nav-bireysel-bankaclk` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Ana Sayfa` | `MenuItem` | `icon-mobile-nav-ana-sayfa` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık` | `MenuItem` | `icon-mobile-nav-bireysel-bankaclk` | Açık | Açık | Açık | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Şimdi Yapı Kredili Olun` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Merkezi Hizmet` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Çocuk Bankacılığı` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Gençlik Bankacılığı` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Hesaplama Araçları` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Sözleşmeler ve Formlar` | `MenuItem` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Sınırsız Bankacılık` | `MenuItem` | `İkon yok` | Açık | Kapalı | Kapalı | Kapalı | Boş |
| `Kendim İçin/Bireysel Bankacılık/Krediler/Hazır Limitim` | `MenuItem` | `İkon yok` | Açık | Açık | Kapalı | Kapalı | `YENİ` |
| `Kendim İçin/Yapı Kredi Blue Class` | `MenuItem` | `icon-mobile-nav-blue-class` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Özel Bankacılık` | `MenuItem` | `icon-mobile-nav-ozel-bankacilik` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Fatura Ödeme` | `MenuItem` | `icon-mobile-nav-fatura-odeme` | Kapalı | Açık | Kapalı | Kapalı | `Hemen Öde` |
| `Kendim İçin/Başvuru Merkezi` | `MenuItem` | `icon-mobile-nav-basvuru-merkezi` | Kapalı | Açık | Kapalı | Kapalı | `Hemen Başvur` |
| `Kendim İçin/Yatırımcı Köşesi: Piyasa Analizleri` | `MenuItem` | `icon-mobile-nav-yatirimci-kosesi` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Yapı Kredi Hakkında` | `MenuItem` | `icon-mobile-nav-yk-hakkinda` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Memnuniyetiniz İçin Buradayız` | `MenuItem` | `icon-mobile-nav-memnuniyet` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/Sınırsız Bankacılık` | `MenuItem` | `icon-mobile-nav-sinirsiz-bankacilik` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Kendim İçin/English` | `MenuItem` | `icon-mobile-nav-english` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `İşim İçin` | `Tab` | `icon-mobile-nav-kurumsal` | Açık | Açık | Kapalı | Kapalı | Boş |
| `İşim İçin/KOBİ` | `MenuItem` | `icon-mobile-nav-kobi` | Açık | Açık | Kapalı | Kapalı | Boş |
| `İşim İçin/Ticari` | `MenuItem` | `icon-mobile-nav-ticari` | Açık | Açık | Kapalı | Kapalı | Boş |
| `İşim İçin/Kurumsal` | `MenuItem` | `icon-mobile-nav-kurumsal` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Yapı Kredili Ol` | `CustomerAcquisition` | `icon-user-plus-24` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Yapı Kredili Ol/Bireysel Müşteri` | `MenuItem` | `icon-user-plus-40` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Yapı Kredili Ol/Tüzel Müşteri` | `MenuItem` | `icon-business-plus-40` | Açık | Açık | Kapalı | Kapalı | Boş |
| `İnternet Şubesi` | `InternetBranch` | `icon-pointer-click-24` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `İnternet Şubesi/Bireysel Giriş` | `MenuItem` | `icon-user-24` | Açık | Açık | Kapalı | Kapalı | Boş |
| `İnternet Şubesi/Kurumsal Giriş` | `MenuItem` | `icon-user-business-24` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Mobil Kısayollar` | `MobileQuickLinks` | `İkon yok` | Kapalı | Açık | Kapalı | Kapalı | Boş |
| `Mobil Kısayollar/Yapı Kredi Mobil'i İndir` | `MenuItem` | `icon-mobile-nav-mobil-indir` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Mobil Kısayollar/Ürün ve Hizmet Ücretleri` | `MenuItem` | `icon-mobile-nav-paper-search` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Mobil Kısayollar/Şube ve ATM'ler` | `MenuItem` | `icon-mobile-nav-pin` | Açık | Açık | Kapalı | Kapalı | Boş |
| `Mobil Kısayollar/Şifre Merkezi` | `MenuItem` | `icon-mobile-nav-sifre-merkezi` | Açık | Açık | Kapalı | Kapalı | Boş |

İki ayrı `Sınırsız Bankacılık` düğümü bilinçlidir: `Bireysel Bankacılık` altındaki sürüm sadece desktop, `Kendim İçin` altındaki doğrudan çocuk ise sadece mobil görünür.

### Header Top

`Header Top` altındaki dört düğümün tamamında varsayılan değerler seçilir: `Role=MenuItem`, ikon yok, Desktop ve Mobile açık; Promote children ve New tab kapalıdır. `EN` dahil mevcut tasarımda yeni sekme kapalıdır.

### Footer — varsayılandan farklı düğümler

| Menü / düğüm path'i | `NavigationRole` | İkon | Desktop | Mobile | Promote children | New tab |
|---|---|---|---:|---:|---:|---:|
| `Footer Columns/Bize Ulaşın` | `MenuItem` | İkon yok | Açık | Kapalı | Kapalı | Kapalı |
| `Footer Columns/İlginizi Çekebilir/Haberler` | `MenuItem` | İkon yok | Açık | Açık | Kapalı | Açık |
| `Footer Legal/Bilgi Toplumu Hizmetleri` | `MenuItem` | İkon yok | Açık | Açık | Kapalı | Açık |
| `Footer Legal/İletişim` | `MenuItem` | İkon yok | Kapalı | Açık | Kapalı | Kapalı |
| `Footer Legal/English` | `MenuItem` | İkon yok | Kapalı | Açık | Kapalı | Kapalı |
| `Footer Brands/Blog` | `MenuItem` | İkon yok | Açık | Açık | Kapalı | Açık |
| `Footer Brands/FRWRD` | `MenuItem` | İkon yok | Açık | Açık | Kapalı | Açık |
| `Footer Brands/Koç 100. Yıl` | `MenuItem` | İkon yok | Açık | Açık | Kapalı | Kapalı |
| `Footer Apps/App Store` | `MenuItem` | İkon yok | Kapalı | Açık | Kapalı | Açık |
| `Footer Apps/Google Play` | `MenuItem` | İkon yok | Kapalı | Açık | Kapalı | Açık |
| `Footer Apps/AppGallery` | `MenuItem` | İkon yok | Kapalı | Açık | Kapalı | Açık |
| `Social/Facebook` | `MenuItem` | `icon-facebook1` | Açık | Açık | Kapalı | Açık |
| `Social/X` | `MenuItem` | `icon-icon-twitter-new` | Açık | Açık | Kapalı | Açık |
| `Social/Instagram` | `MenuItem` | `icon-instagram1` | Açık | Açık | Kapalı | Açık |
| `Social/LinkedIn` | `MenuItem` | `icon-linkedin1` | Açık | Açık | Kapalı | Açık |
| `Social/YouTube` | `MenuItem` | `icon-youtube1` | Açık | Açık | Kapalı | Açık |

Footer'ın diğer bütün kolon, grup ve link düğümlerinde genel varsayılanlar kullanılır.

### Görsel alanları zorunlu olan footer düğümleri

| Düğüm | `NavigationImage` | `NavigationMobileImage` | `NavigationImageAlt` |
|---|---|---|---|
| `Footer Brands/Blog` | Blog logo SVG/medya dosyası | Boş | `Blog` |
| `Footer Brands/FRWRD` | FRWRD logo SVG/medya dosyası | Boş | `FRWRD` |
| `Footer Brands/Koç 100. Yıl` | Koç 100. yıl desktop SVG/medya dosyası | Koç 100. yıl mobile SVG/medya dosyası | `Koç 100. Yıl` |
| `Footer Apps/App Store` | App Store badge PNG/medya dosyası | Boş | `App Store'dan indirin` |
| `Footer Apps/Google Play` | Google Play badge PNG/medya dosyası | Boş | `Google Play'den alın` |
| `Footer Apps/AppGallery` | AppGallery badge PNG/medya dosyası | Boş | `AppGallery'den indirin` |

Footer Brands ve Footer Apps içindeki bu altı düğüm dışında görsel alanları boş bırakılır.

### Header Notifications ve Announcements seçimleri

| Klasör / page type | Checkbox | Seçim |
|---|---|---|
| `Header Notifications/YKB.HeaderNotification` | `HeaderNotificationOpenInNewTab` | Mevcut bildirimlerde Kapalı; yalnız hedef özellikle yeni sekmede açılacaksa Açık |
| `Announcements/YKB.Announcement` | `AnnouncementOpenInNewTab` | İç sayfa duyurularında Kapalı; yalnız harici hedef özellikle yeni sekmede açılacaksa Açık |

Bu iki klasör `CMS.Folder` tipindedir. `Announcements` altında yayınlanmış `YKB.Announcement` yoksa duyuru bandı render edilmez. Klasöre örnek olması için görünen `Duyuru 1` ve `Duyuru 2` düğümleri zorunlu değildir; gerçek duyuru yoksa oluşturmayın veya yayınlamayın.

## Page type 1 — `YKB.NavigationMenu`

Menü köklerini path'ten bağımsız bulmak için kullanılır. Mevcut projede eşdeğer bir menu container tipi varsa yeni tip açmak yerine iki alanı ona ekleyin.

| Field name | Data type / form control | Boyut | Zorunlu | Varsayılan / doğrulama | DTO karşılığı |
|---|---|---:|---:|---|---|
| `NavigationMenuTitle` | Text / Text input | 100 | Evet | Trim; HTML kabul etmez | `MenuContent.Title` |
| `NavigationMenuKey` | Text / Drop-down list | 50 | Evet | Aşağıdaki sabit listeden; site+kültür içinde tekil | Dictionary key |

`NavigationMenuKey` dropdown data source:

```text
HeaderTop;Header üst bağlantıları
HeaderMain;Header ana menü
Footer;Footer kolonları
FooterLegal;Footer yasal bağlantıları
FooterBrands;Footer marka görselleri
FooterApps;Footer uygulama mağazaları
Social;Sosyal medya
```

Kurallar:

- Alan serbest metin olmamalıdır.
- Aynı site ve culture altında aynı key ikinci kez kaydedilmemelidir. Kentico save event handler ile engelleyin; repository yine de duplicate bulursa loglayıp hata vermelidir.
- `NodeAliasPath` repository anahtarı değildir. Node taşımak menüyü bozmamalıdır.
- Allowed child type yalnızca `YKB.NavigationNode` olmalıdır.

## Page type 2 — `YKB.NavigationNode`

Header sekmeleri, nested mobil menü, aksiyonlar, footer kolonları, footer linkleri, sosyal bağlantılar ve görsel bağlantılar aynı recursive tip ile yönetilir.

| Field name | Data type / form control | Boyut | Zorunlu | Varsayılan / doğrulama | DTO |
|---|---|---:|---:|---|---|
| `NavigationTitle` | Text / Text input | 200 | Evet | Trim; HTML yok; en az 1 karakter | `Title` |
| `NavigationUrl` | Text / URL selector | 500 | Koşullu | Boş, `/...`, `#...`, `https://`, `http://`, `mailto:` veya `tel:`; `javascript:` yasak | `Url` |
| `NavigationIconCssClass` | Text / Drop-down list | 100 | Hayır | Aşağıdaki whitelist | `IconCssClass` |
| `NavigationImage` | Text / Media selector | 500 | Koşullu | SVG, PNG veya WebP; görsel öğelerde zorunlu | `ImageUrl` |
| `NavigationMobileImage` | Text / Media selector | 500 | Hayır | SVG, PNG veya WebP | `MobileImageUrl` |
| `NavigationImageAlt` | Text / Text input | 160 | Koşullu | Image doluysa boş olamaz; HTML yok | `ImageAlt` |
| `NavigationBadgeText` | Text / Text input | 40 | Hayır | HTML yok; kısa etiket | `BadgeText` |
| `NavigationRole` | Text / Drop-down list | 40 | Evet | `MenuItem` | `Role` |
| `NavigationOpenInNewTab` | Boolean / Check box | — | Evet | `false` | `OpenInNewTab` |
| `NavigationDisplayOnDesktop` | Boolean / Check box | — | Evet | `true` | `DisplayOnDesktop` |
| `NavigationDisplayOnMobile` | Boolean / Check box | — | Evet | `true` | `DisplayOnMobile` |
| `NavigationPromoteChildrenOnDesktop` | Boolean / Check box | — | Evet | `false` | `PromoteChildrenOnDesktop` |

`NavigationRole` dropdown data source:

```text
MenuItem;Standart menü öğesi
Tab;Ana müşteri sekmesi
CustomerAcquisition;Yapı Kredili Ol aksiyonu
InternetBranch;İnternet Şubesi aksiyonu
MobileQuickLinks;Mobil kısayol grubu
```

`NavigationIconCssClass` dropdown whitelist:

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
icon-mobile-nav-blue-class;Blue Class
icon-mobile-nav-ozel-bankacilik;Özel Bankacılık
icon-mobile-nav-kobi;KOBİ
icon-mobile-nav-kurumsal;Kurumsal
icon-mobile-nav-ticari;Ticari
icon-mobile-nav-fatura-odeme;Fatura Ödeme
icon-mobile-nav-basvuru-merkezi;Başvuru Merkezi
icon-mobile-nav-sinirsiz-bankacilik;Sınırsız Bankacılık
icon-mobile-nav-yatirimci-kosesi;Yatırımcı Köşesi
icon-mobile-nav-yk-hakkinda;Yapı Kredi Hakkında
icon-mobile-nav-memnuniyet;Memnuniyet
icon-mobile-nav-english;English
icon-mobile-nav-paper-search;Ürün ve Hizmet Ücretleri
icon-mobile-nav-pin;Şube ve ATM
icon-mobile-nav-sifre-merkezi;Şifre Merkezi
icon-mobile-nav-mobil-indir;Mobil Uygulama
icon-facebook1;Facebook
icon-icon-twitter-new;X
icon-instagram1;Instagram
icon-linkedin1;LinkedIn
icon-youtube1;YouTube
```

Ek doğrulamalar:

- `NavigationUrl`, yalnızca kolon başlığı veya çocukları olan ve tıklanmayan grup node'unda boş kalabilir. Tıklanabilir leaf node'da zorunludur.
- `NavigationImage` doluysa `NavigationImageAlt` zorunludur.
- Image dosya boyutu önerilen üst sınır 512 KB'dır. SVG yüklemeleri güvenli media library ve SVG sanitizasyonundan geçirilmelidir.
- `NavigationIconCssClass` için dropdown dışı değer kabul edilmemelidir. Kod tarafında da `^$|^icon-[a-z0-9-]+$` kontrolü uygulanabilir.
- `NavigationRole=Tab` yalnızca `HeaderMain` menüsünün doğrudan çocuğunda kullanılabilir.
- `CustomerAcquisition`, `InternetBranch` ve `MobileQuickLinks` rolleri `HeaderMain` altında en fazla birer kez bulunmalıdır.
- `NavigationPromoteChildrenOnDesktop=true` yalnızca standart menü öğelerinde kullanılmalıdır. Bu seçenek node'un kendisini masaüstü satırında gizler, doğrudan çocuklarını üst seviyeye taşır.
- `MobileQuickLinks` altındaki ilk node geniş “Mobil'i İndir” butonudur; kalan node'lar üçlü gridde gösterilir.
- `FooterBrands` içindeki ilk iki görsel yan yana, sonraki görsel alt satırda gösterilir. Önerilen sayı 3'tür.
- Footer kolonlarının mobil iki sütun bölünmesi `NodeOrder` listesinin ortasından otomatik yapılır.

DTO'daki `Id` için ayrıca field açılmaz. Repository bunu stabil olması için `NodeGUID.ToString("N")` değerinden üretir. `Children` da CMS field'ı değildir; doğrudan çocuk node'ların `NodeOrder` sırasıyla recursive eşlenmesidir.

## Page type 3 — `YKB.HeaderNotification`

| Field name | Data type / form control | Boyut | Zorunlu | Varsayılan / doğrulama | DTO |
|---|---|---:|---:|---|---|
| `HeaderNotificationTitle` | Text / Text input | 250 | Evet | Trim; HTML yok | `Title` |
| `HeaderNotificationUrl` | Text / URL selector | 500 | Evet | NavigationUrl ile aynı güvenli protokol kuralı | `Url` |
| `HeaderNotificationImage` | Text / Media selector | 500 | Hayır | PNG, JPEG veya WebP; önerilen kare görsel | `ImageUrl` |
| `HeaderNotificationImageAlt` | Text / Text input | 160 | Koşullu | Image doluysa zorunlu | `ImageAlt` |
| `HeaderNotificationOpenInNewTab` | Boolean / Check box | — | Evet | `false` | `OpenInNewTab` |

Önerilen medya sınırı 1 MB, önerilen boyut en az 84×84 pikseldir. Liste `NodeOrder` ile sıralanır. Yayın aralığı için yerleşik `DocumentPublishFrom` ve `DocumentPublishTo` kullanılır.

## Page type 4 — `YKB.Announcement`

Mevcut bir duyuru tipi varsa yenisini açmayın; aşağıdaki alanları DTO'ya map edin.

| Field name | Data type / form control | Boyut | Zorunlu | Varsayılan / doğrulama | DTO |
|---|---|---:|---:|---|---|
| `AnnouncementTitle` | Text / Text input | 250 | Evet | Trim; HTML yok; tek satır | `Title` |
| `AnnouncementUrl` | Text / URL selector | 500 | Evet | NavigationUrl ile aynı güvenli protokol kuralı | `Url` |
| `AnnouncementOpenInNewTab` | Boolean / Check box | — | Evet | `false` | `OpenInNewTab` |

Yayın aralığı için yerleşik `DocumentPublishFrom` / `DocumentPublishTo`, sıralama için `NodeOrder` kullanılır. Duyuru sayısı için teknik sınır yoktur; editör performansı ve içerik kalitesi için aynı anda en fazla 10 aktif kayıt önerilir.

## Allowed child types

- `Navigation` (`CMS.Folder`) → yalnızca `YKB.NavigationMenu`.
- `YKB.NavigationMenu` → yalnızca `YKB.NavigationNode`.
- `YKB.NavigationNode` → `YKB.NavigationNode`; recursive header ağacı için gereklidir.
- `Header Notifications` → yalnızca `YKB.HeaderNotification`; bildirimler çocuk kabul etmez.
- `Announcements` → yalnızca `YKB.Announcement`; duyurular çocuk kabul etmez.
- `HeaderTop`, `FooterLegal`, `FooterBrands`, `FooterApps` ve `Social` altındaki node'ların çocuk oluşturması custom validation ile engellenmelidir.
- `Footer` menüsündeki birinci seviye node'lar kolon, ikinci seviye node'lar linktir; ikinci seviyenin altına çocuk eklenmemelidir.

## Repository eşlemesi

| `MenuKey` / kaynak | `LayoutData` alanı |
|---|---|
| `HeaderTop` | `HeaderTopLinks` |
| `HeaderMain` | `HeaderTabs` |
| `Footer` | `FooterColumns` |
| `FooterLegal` | `FooterBottomLinks` |
| `FooterBrands` | `FooterBrandLinks` |
| `FooterApps` | `FooterAppLinks` |
| `Social` | `Social.Title` + `Social.Links` |
| `YKB.HeaderNotification` sorgusu | `HeaderNotifications` |
| `YKB.Announcement` sorgusu | `Announcements` |

Repository kuralları:

1. Menü köklerini `NavigationMenuKey` üzerinden tek sorguda bulun; path sabiti kullanmayın.
2. Yalnızca yayınlanmış, site ve culture ile eşleşen node'ları alın. Gerekirse Kentico culture fallback politikasını kullanın.
3. Her seviyeyi `NodeOrder` ile sıraya koyun.
4. Navigation ağacını recursive DTO'ya dönüştürün; pratik güvenlik sınırı olarak 10 derinlikten sonra validation hatası/log üretin.
5. URL alanlarında `javascript:` ve bilinmeyen protokolleri repository katmanında reddedin.
6. Sonucu culture+site bazında cache'leyin. Cache dependency, ilgili menu root node GUID'leri ile `YKB.HeaderNotification` ve `YKB.Announcement` sınıflarını kapsamalıdır.
7. Eksik opsiyonel menü boş `MenuContent` üretir. `HeaderMain` veya aynı key'den birden fazla menu bulunması konfigürasyon hatası olarak loglanmalıdır.

## Koddan yönetilen değerler

Aşağıdaki değerler CMS field'ı değildir:

- Yapı Kredi logo ve pin asset yolları
- Ana sayfa ve header arama action adresleri
- “Duyurular” / “Tüm Duyurular” metinleri ve duyuru liste URL'si
- Duyuru otomatik dönüş süresi (`5000 ms`)
- Copyright metni ve dinamik yıl
- Responsive breakpoint, renk, ölçü ve animasyon değerleri

Bu nedenle `YKB.HeaderSettings` ve `YKB.FooterSettings` page type'ları oluşturulmaz.
