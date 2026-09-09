using YkbYapikredi.Application.Navigation;

namespace YkbClone;

/// <summary>
/// Kentico bağlantısı yapılana kadar içerik ağacını aynı DTO'larla besleyen örnek kaynak.
/// </summary>
public static class MockLayoutContent
{
    private const string YkbRoot = "https://www.yapikredi.com.tr";

    public static LayoutContent Create()
    {
        var menus = new Dictionary<string, MenuContent>
        {
            [MenuKeys.HeaderTop] = new()
            {
                Items =
                [
                    N("mobile-download-top", "Mobil Uygulama İndir", "#mobil-uygulama"),
                    N("branch-atm-top", "Şube ve ATM'ler", $"{YkbRoot}/sinirsiz-bankacilik/atm/sube-ve-atm-arama"),
                    N("fees-top", "Ürün ve Hizmet Ücretleri", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/bireysel-urun-ve-hizmet-ucretleri"),
                    N("language-en", "EN", $"{YkbRoot}/en/")
                ]
            },
            [MenuKeys.HeaderMain] = new()
            {
                Items = BuildHeaderTree()
            },
            [MenuKeys.Footer] = new()
            {
                Items = BuildFooterColumns()
            },
            [MenuKeys.FooterLegal] = new()
            {
                Items =
                [
                    N("time-barred-lists", "TMSF ve YTM Zaman Aşımı Listesi", $"{YkbRoot}/zaman-asimi-listeleri"),
                    N("information-society", "Bilgi Toplumu Hizmetleri", "https://e-sirket.mkk.com.tr/esir/Dashboard.jsp#/sirketbilgileri/10466", newTab: true),
                    N("personal-data", "Kişisel Verilerin Korunması", $"{YkbRoot}/yapi-kredi-hakkinda/kvkk"),
                    N("privacy-policy", "Gizlilik Politikası", $"{YkbRoot}/memnuniyetiniz-icin-buradayiz/gizlilik"),
                    N("cookie-policy", "Çerez Aydınlatma Metni", $"{YkbRoot}/memnuniyetiniz-icin-buradayiz/cerez-politikasi"),
                    N("footer-contact", "İletişim", $"{YkbRoot}/yapi-kredi-hakkinda/iletisim", desktop: false),
                    N("footer-english", "English", $"{YkbRoot}/en", desktop: false)
                ]
            },
            [MenuKeys.FooterBrands] = new()
            {
                Items =
                [
                    N("footer-blog", "Blog", $"{YkbRoot}/blog/", image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/blog-logo.svg", imageAlt: "Blog", newTab: true),
                    N("footer-frwrd", "FRWRD", "https://www.yapikredifrwrd.com/", image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/frwrd-logo.svg", imageAlt: "FRWRD", newTab: true),
                    N("footer-koc-100", "Koç 100. Yıl", string.Empty, image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/100_yil_koc.svg", mobileImage: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/100_yil_koc_mobile.svg", imageAlt: "Koç 100. Yıl")
                ]
            },
            [MenuKeys.FooterApps] = new()
            {
                Items =
                [
                    N("footer-app-store", "App Store'dan İndirin", "https://itunes.apple.com/tr/app/yap-kredi-mobil-bankac-l-k/id458627086?mt=8", image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/app-store-f.png", imageAlt: "App Store'dan indirin", desktop: false, newTab: true),
                    N("footer-google-play", "Google Play'den Alın", "https://play.google.com/store/apps/details?id=com.ykb.android&hl=tr&gl=US", image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/google-play-f.png", imageAlt: "Google Play'den alın", desktop: false, newTab: true),
                    N("footer-app-gallery", "AppGallery'den İndirin", "https://appgallery.huawei.com/#/app/C101430581", image: "https://assets.yapikredi.com.tr/WebSite/_assets_responsive/img/app-gallery-f.png", imageAlt: "AppGallery'den indirin", desktop: false, newTab: true)
                ]
            },
            [MenuKeys.Social] = new()
            {
                Title = "Bizi Takip Edin",
                Items =
                [
                    N("social-facebook", "Facebook", "https://www.facebook.com/YapiKredi/", icon: "icon-facebook1", newTab: true),
                    N("social-x", "X", "https://twitter.com/YapiKredi", icon: "icon-icon-twitter-new", newTab: true),
                    N("social-instagram", "Instagram", "https://www.instagram.com/yapikredi/", icon: "icon-instagram1", newTab: true),
                    N("social-linkedin", "LinkedIn", "https://www.linkedin.com/company/yapikredi", icon: "icon-linkedin1", newTab: true),
                    N("social-youtube", "YouTube", "https://www.youtube.com/channel/UCnAFL68slzVjJkOiNHweojQ", icon: "icon-youtube1", newTab: true)
                ]
            }
        };

        return new LayoutContent(
            menus,
            announcements: [],
            headerNotifications:
            [
                new HeaderNotificationDto
                {
                    Title = "100.000 TL'ye varan fırsatlar Yapı Kredi Mobil'de!",
                    Url = YkbRoot,
                    ImageUrl = "/assets/notification-credit.png",
                    ImageAlt = "Yapı Kredi kampanyası"
                },
                new HeaderNotificationDto
                {
                    Title = "Ekstreni 20.000 TL hafifleten kart!",
                    Url = $"{YkbRoot}/bireysel-bankacilik/kartlar/",
                    ImageUrl = "/assets/notification-mobile.png",
                    ImageAlt = "Kart kampanyası"
                },
                new HeaderNotificationDto
                {
                    Title = "Gümüş Hesap Yapı Kredi Mobil'de!",
                    Url = $"{YkbRoot}/bireysel-bankacilik/mevduat-urunleri/diger-kiymetli-madenler/gumus-hesap",
                    ImageUrl = "/assets/yapikredi-logo.svg",
                    ImageAlt = "Yapı Kredi"
                }
            ]);
    }

    private static IReadOnlyList<NavigationNodeDto> BuildFooterColumns() =>
    [
        N("footer-contact-column", "Bize Ulaşın", "#", mobile: false, children:
        [
            N("footer-satisfaction", "Memnuniyetiniz İçin", $"{YkbRoot}/memnuniyetiniz-icin-buradayiz/"),
            N("footer-contact-link", "İletişim", $"{YkbRoot}/yapi-kredi-hakkinda/iletisim")
        ]),
        N("footer-interesting", "İlginizi Çekebilir", "#", children:
        [
            N("footer-retirement-promotion", "Emekli Promosyon", $"{YkbRoot}/bireysel-bankacilik/odemeler-ve-hizmetler/sgk-emekli-maas-promosyonu"),
            N("footer-app-market", "Uygulama Marketi", $"{YkbRoot}/sinirsiz-bankacilik/mobil-bankacilik/uygulama-marketi"),
            N("footer-demand-deposit", "Vadesiz Mevduat", $"{YkbRoot}/mevduat-urunleri/vadesiz-mevduat"),
            N("footer-time-deposit", "Vadeli Mevduat", $"{YkbRoot}/mevduat-urunleri/e-mevduat"),
            N("footer-about", "Yapı Kredi Hakkında", $"{YkbRoot}/yapi-kredi-hakkinda/"),
            N("footer-sustainability", "Sürdürülebilirlik", $"{YkbRoot}/yapi-kredi-hakkinda/surdurulebilirlik/"),
            N("footer-news", "Haberler", $"{YkbRoot}/yapi-kredi-hakkinda/haberler", newTab: true),
            N("footer-press", "Basın Bültenleri", $"{YkbRoot}/yapi-kredi-hakkinda/basin-bultenleri"),
            N("footer-human-resources", "İnsan Kaynakları", $"{YkbRoot}/yapi-kredi-hakkinda/insan-kaynaklari/"),
            N("footer-eyt", "EYT", $"{YkbRoot}/bireysel-bankacilik/odemeler-ve-hizmetler/eyt-emeklilikte-yasa-takilanlar")
        ]),
        N("footer-investment", "Yatırım & Finans", "#", children:
        [
            N("footer-live-fx", "Canlı Döviz", $"{YkbRoot}/yatirimci-kosesi/doviz-kurlari/"),
            N("footer-funds", "Yatırım Fonları", $"{YkbRoot}/bireysel-bankacilik/yatirim-urunleri/yatirim-fonlari/"),
            N("footer-gold-deposit", "Altın Mevduat", $"{YkbRoot}/bireysel-bankacilik/mevduat-urunleri/altin-mevduati"),
            N("footer-gold", "Altın", $"{YkbRoot}/yatirimci-kosesi/altin-bilgileri"),
            N("footer-ipo", "Halka Arz", $"{YkbRoot}/bireysel-bankacilik/yatirim-urunleri/hisse-senetleri/hisse-senedi-halka-arz"),
            N("footer-stocks", "Hisse Senedi", $"{YkbRoot}/yatirimci-kosesi/hisse-senedi-bilgileri"),
            N("footer-deposit-rates", "Vadeli Mevduat Oranları", $"{YkbRoot}/yatirimci-kosesi/vadeli-mevduat-oranlari"),
            N("footer-foreign-markets", "Yurt Dışı Piyasaları", $"{YkbRoot}/yatirimci-kosesi/fon-bilgileri/"),
            N("footer-investor-corner", "Yatırımcı Köşesi", $"{YkbRoot}/yatirimci-kosesi"),
            N("footer-dollar", "Dolar Kaç TL", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/doviz-hesaplama")
        ]),
        N("footer-cards", "Kartlar & Başvurular", "#", children:
        [
            N("footer-open-bank-account", "Banka Hesabı Aç", $"{YkbRoot}/banka-hesabi-ac"),
            N("footer-open-commercial-account", "Ticari Hesap Aç", $"{YkbRoot}/ticari-hesap-acma"),
            N("footer-card-application", "Kredi Kartı Başvuru", $"{YkbRoot}/basvuru-merkezi/kredi-karti-basvurusu"),
            N("footer-debit-card", "Banka Kartı", $"{YkbRoot}/bireysel-bankacilik/kartlar/banka-kartlari/"),
            N("footer-credit-card", "Kredi Kartı", $"{YkbRoot}/kartlar/kredi-kartlari/"),
            N("footer-worldcard", "Worldcard", $"{YkbRoot}/kartlar/kredi-kartlari/worldcard"),
            N("footer-commercial-cards", "Ticari Kartlar", $"{YkbRoot}/kartlar/ticari-kartlar"),
            N("footer-minimum-payment", "Kredi Kartı Asgari Hesaplama", $"{YkbRoot}/bireysel-bankacilik/kartlar/akdi-ve-gecikme-faizi-hesaplama-ornekleri"),
            N("footer-secure-vehicle", "Güvenli Araç Alım Satım", $"{YkbRoot}/basvuru-merkezi/guvenli-alim-satim"),
            N("footer-rent", "Kiram Hesabımda", $"{YkbRoot}/basvuru-merkezi/kiram-hesabimda")
        ]),
        N("footer-loans", "Krediler", "#", children:
        [
            N("footer-mortgage", "Konut Kredisi", $"{YkbRoot}/kredi/konut-kredisi/"),
            N("footer-consumer-loan", "İhtiyaç Kredisi", $"{YkbRoot}/kredi/ihtiyac-kredisi/"),
            N("footer-loan", "Kredi", $"{YkbRoot}/bireysel-bankacilik/krediler/"),
            N("footer-vehicle-loan", "Taşıt Kredisi", $"{YkbRoot}/bireysel-bankacilik/krediler/tasit-kredisi/"),
            N("footer-loan-application", "Kredi Başvurusu", $"{YkbRoot}/basvuru-merkezi/bireysel-ihtiyac-kredisi"),
            N("footer-deferred-loan", "3 Ay Ertelemeli Kredi", $"{YkbRoot}/kredi/ihtiyac-kredisi/3-ay-ertelemeli-ihtiyac-kredisi"),
            N("footer-flex-account", "Esnek Hesap/Kredili Mevduat Hesabı", $"{YkbRoot}/bireysel-bankacilik/krediler/esnek-hesap/"),
            N("footer-eyt-loan", "EYT Kredisi", $"{YkbRoot}/kredi/ihtiyac-kredisi/sgk-prim-borcuna-ozel-ihtiyac-kredisi"),
            N("footer-shopping-loan", "Alışveriş Kredisi", $"{YkbRoot}/kredi/ihtiyac-kredisi/alisveris-kredisi/"),
            N("footer-used-car-loan", "2. El Araç Kredisi", $"{YkbRoot}/bireysel-bankacilik/krediler/tasit-kredisi/")
        ]),
        N("footer-useful-pages", "Faydalı Sayfalar", "#", children:
        [
            N("footer-investor-relations", "Yatırımcı İlişkileri", "https://www.yapikrediinvestorrelations.com/tr/"),
            N("footer-loan-calculation", "Kredi Hesaplama", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/kredi-hesaplama"),
            N("footer-fx-calculation", "Döviz Hesaplama", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/doviz-hesaplama"),
            N("footer-deposit-calculation", "Mevduat Hesaplama", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/e-mevduat-faizi-hesaplama"),
            N("footer-bill-payment", "Fatura Ödeme", $"{YkbRoot}/odeme-merkezi/"),
            N("footer-hgs", "HGS", $"{YkbRoot}/bireysel-bankacilik/odemeler-ve-hizmetler/hizli-gecis-sistemi"),
            N("footer-mtv", "MTV Ödeme", $"{YkbRoot}/odeme-merkezi/mtv-odeme"),
            N("footer-traffic-insurance", "Trafik Sigortası", $"{YkbRoot}/bireysel-bankacilik/sigorta-ve-emeklilik/zorunlu-trafik-sigortalari"),
            N("footer-casco", "Kasko", $"{YkbRoot}/bireysel-bankacilik/sigorta-ve-emeklilik/kasko-sigortalari"),
            N("footer-faq", "Sıkça Sorulan Sorular", $"{YkbRoot}/kendim-icin/sinirsiz-bankacilik/sikca-sorulan-sorular/"),
            N("footer-site-map", "Site Haritası", $"{YkbRoot}/site-haritasi")
        ])
    ];

    private static IReadOnlyList<NavigationNodeDto> BuildHeaderTree()
    {
        var shoppingCredit = N("shopping-credit", "Alışveriş Kredisi", $"{YkbRoot}/kredi/alisveris-kredisi/", children:
        [
            N("world-pay-credit", "World PAY Alışveriş Kredisi", $"{YkbRoot}/kredi/alisveris-kredisi/world-pay-alisveris-kredisi/", children:
            [
                N("arcelik-credit", "Arçelik Alışveriş Kredisi", "#"),
                N("setur-credit", "Setur Alışveriş Kredisi", "#"),
                N("mediamarkt-credit", "MediaMarkt Alışveriş Kredisi", "#"),
                N("vatan-credit", "Vatan Bilgisayar Alışveriş Kredisi", "#"),
                N("koctas-credit", "Koçtaş Alışveriş Kredisi", "#"),
                N("troy-credit", "Troy Alışveriş Kredisi", "#")
            ])
        ]);

        var personalLoans = N("personal-loans", "Bireysel İhtiyaç Kredisi", $"{YkbRoot}/kredi/ihtiyac-kredisi/", children:
        [
            N("salary-credit", "Maaş Müşterilerine Özel İhtiyaç Kredisi", "#"),
            N("instant-credit", "Mobilden ve İnternetten Anında Online Kredi", "#"),
            N("debt-transfer", "Borç Transfer Kredisi", "#"),
            N("debt-close", "Kredi Kapama Koşullu Kredi - Borçlarınızı Tek Kredi ile Kapatın", "#"),
            N("postponed-credit", "3 Ay Ertelemeli Bireysel İhtiyaç Kredisi", "#"),
            N("hepsipay-credit", "Hepsipay İhtiyaç Kredisi", "#"),
            shoppingCredit,
            N("credit-tips", "İhtiyaç Kredisi İçin İpuçları", "#"),
            N("retired-credit", "Emekliye Özel İhtiyaç Kredisi", "#"),
            N("sgk-credit", "SGK Prim Borcunuza Özel İhtiyaç Kredisi", "#")
        ]);

        var loans = N("loans", "Krediler", $"{YkbRoot}/bireysel-bankacilik/krediler/", children:
        [
            personalLoans,
            N("flex-account", "Esnek Hesap (Kredili Mevduat Hesabı - KMH)", "#"),
            N("installment-flex", "Taksitli Esnek Hesap ile Esnek Çözümler", "#"),
            N("home-credit", "Ev Kredisi - Konut Kredi Faizleri", "#", children: [N("green-mortgage", "Doğa Dostu Mortgage", "#")]),
            N("vehicle-credit", "Taşıt Kredisi", "#", children: [N("motorcycle-credit", "Motosiklet Kredisi", "#")]),
            N("boat-credit", "Tekne Kredisi", "#"),
            N("flex-payback", "Esnek Geri Ödeme Modeli", "#"),
            N("ready-limit", "Hazır Limitim", "#", badge: "YENİ"),
            N("findeks", "Findeks Paketleri", "#")
        ]);

        var retailBanking = N(
            "retail-banking",
            "Bireysel Bankacılık",
            "#",
            icon: "icon-mobile-nav-bireysel-bankaclk",
            promoteChildrenOnDesktop: true,
            children:
            [
                N("become-customer", "Şimdi Yapı Kredili Olun", $"{YkbRoot}/banka-hesabi-ac", desktop: false),
                loans,
                N("cards", "Kartlar", $"{YkbRoot}/bireysel-bankacilik/kartlar/", children: [N("credit-cards", "Kredi Kartları", "#")]),
                N("deposits", "Mevduat Ürünleri", $"{YkbRoot}/bireysel-bankacilik/mevduat-urunleri/", desktopName: "Mevduat", children: [N("gold", "Altın Bankacılığı", "#")]),
                N("investments", "Yapı Kredi Yatırım Ürünleri", $"{YkbRoot}/bireysel-bankacilik/yatirim-urunleri/", children: [N("funds", "Yatırım Fonları", "#")]),
                N("payments", "Ödemeler ve Hizmetler", $"{YkbRoot}/bireysel-bankacilik/odemeler-ve-hizmetler/", children: [N("bills", "Fatura Ödemeleri", "#")]),
                N("central-service", "Merkezi Hizmet", "#", desktop: false),
                N("children-banking", "Çocuk Bankacılığı", "#", desktop: false),
                N("youth-banking", "Gençlik Bankacılığı", "#", desktop: false),
                N("insurance", "Sigorta ve Emeklilik", $"{YkbRoot}/bireysel-bankacilik/sigorta-ve-emeklilik/", children: [N("bes", "Bireysel Emeklilik Sistemi", "#")]),
                N("calculators", "Hesaplama Araçları", "#", desktop: false, children: [N("loan-calculator", "Kredi Hesaplama Aracı", "#")]),
                N("contracts", "Sözleşmeler ve Formlar", "#", desktop: false),
                N("unlimited-desktop", "Sınırsız Bankacılık", $"{YkbRoot}/kendim-icin/sinirsiz-bankacilik/", mobile: false)
            ]);

        var personalTab = N("personal-tab", "Kendim İçin", "#", icon: "icon-mobile-nav-bireysel-bankaclk", role: NavigationRoles.Tab, children:
        [
            N("home", "Ana Sayfa", "/", icon: "icon-mobile-nav-ana-sayfa", desktop: false),
            retailBanking,
            N("blue-class", "Yapı Kredi Blue Class", $"{YkbRoot}/yapi-kredi-blue-class/", icon: "icon-mobile-nav-blue-class"),
            N("private-banking", "Özel Bankacılık", $"{YkbRoot}/ozel-bankacilik/", icon: "icon-mobile-nav-ozel-bankacilik"),
            N("bill-payment", "Fatura Ödeme", "#", icon: "icon-mobile-nav-fatura-odeme", badge: "Hemen Öde", desktop: false, children: [N("all-bills", "Tüm Faturalar", "#")]),
            N("application-center", "Başvuru Merkezi", "#", icon: "icon-mobile-nav-basvuru-merkezi", badge: "Hemen Başvur", desktop: false, children: [N("customer-application", "Yapı Kredi Müşterisi Ol", "#")]),
            N("market-analysis", "Yatırımcı Köşesi: Piyasa Analizleri", "#", icon: "icon-mobile-nav-yatirimci-kosesi", desktop: false, children: [N("stock-market", "Borsa", "#")]),
            N("about", "Yapı Kredi Hakkında", "#", icon: "icon-mobile-nav-yk-hakkinda", desktop: false, children: [N("news", "Haberler", "#")]),
            N("satisfaction", "Memnuniyetiniz İçin Buradayız", "#", icon: "icon-mobile-nav-memnuniyet", desktop: false, children: [N("contact", "İletişim", "#")]),
            N("unlimited-mobile", "Sınırsız Bankacılık", $"{YkbRoot}/kendim-icin/sinirsiz-bankacilik/", icon: "icon-mobile-nav-sinirsiz-bankacilik", desktop: false, children: [N("mobile-branch", "Mobil Şube", "#")]),
            N("english", "English", $"{YkbRoot}/en/", icon: "icon-mobile-nav-english", desktop: false)
        ]);

        var businessTab = N("business-tab", "İşim İçin", "#", role: NavigationRoles.Tab, icon: "icon-mobile-nav-kurumsal", children:
        [
            N("sme", "KOBİ", $"{YkbRoot}/kobi/", icon: "icon-mobile-nav-kobi", children: [N("sme-loans", "Krediler", "#")]),
            N("commercial", "Ticari", $"{YkbRoot}/ticari/", icon: "icon-mobile-nav-ticari", children: [N("cash-management", "Nakit Yönetimi", "#")]),
            N("corporate", "Kurumsal", $"{YkbRoot}/kurumsal/", icon: "icon-mobile-nav-kurumsal", children: [N("corporate-cash", "Nakit Yönetimi", "#")]),
            N("business-digital", "Sınırsız Bankacılık", $"{YkbRoot}/isim-icin/sinirsiz-bankacilik/"),
            N("commercial-cards", "Ticari Kartlar", $"{YkbRoot}/ticari-kartlar/"),
            N("business-loans", "Krediler", $"{YkbRoot}/kobi/krediler/kobi-kredileri"),
            N("commercial-account", "Ticari Hesap Açma", $"{YkbRoot}/ticari-hesap-acma"),
            N("salary-payments", "Maaş Ödemeleri", "#"),
            N("collaborations", "İş Birliklerimiz", "#")
        ]);

        var becomeCustomer = N("become-customer-action", "Yapı Kredili Ol", "#", role: NavigationRoles.CustomerAcquisition, icon: "icon-user-plus-24", desktop: false, children:
        [
            N("individual-customer", "Bireysel Müşteri", $"{YkbRoot}/banka-hesabi-ac", icon: "icon-user-plus-40"),
            N("legal-customer", "Tüzel Müşteri", $"{YkbRoot}/ticari-hesap-acma", icon: "icon-business-plus-40")
        ]);

        var internetBranch = N("internet-branch-action", "İnternet Şubesi", "#", role: NavigationRoles.InternetBranch, icon: "icon-pointer-click-24", desktop: false, children:
        [
            N("personal-login", "Bireysel Giriş", "https://internetsube.yapikredi.com.tr/ngi/index.do", icon: "icon-user-24", children:
            [
                N("card-transactions", "Kart İşlemleri", "https://internetsube.yapikredi.com.tr/ngi/index.do?type=W"),
                N("personal-password", "Şifre Al / Şifremi Unuttum", "https://internetsube.yapikredi.com.tr/ngi/huoRetailWeb.do")
            ]),
            N("corporate-login", "Kurumsal Giriş", "https://ticari.yapikredi.com.tr/ngc/indexNgc.do", icon: "icon-user-business-24", children:
            [
                N("corporate-password", "Şifre Al / Şifremi Unuttum", "https://ticari.yapikredi.com.tr/ngc/huoCorporate.do")
            ])
        ]);

        var mobileQuickLinks = N("mobile-quick-links", "Mobil Kısayollar", "#", role: NavigationRoles.MobileQuickLinks, desktop: false, children:
        [
            N("mobile-app-download", "Yapı Kredi Mobil'i İndir", "#mobil-uygulama", icon: "icon-mobile-nav-mobil-indir"),
            N("mobile-fees", "Ürün ve Hizmet Ücretleri", $"{YkbRoot}/bireysel-bankacilik/hesaplama-araclari/bireysel-urun-ve-hizmet-ucretleri", icon: "icon-mobile-nav-paper-search"),
            N("mobile-atm", "Şube ve ATM'ler", $"{YkbRoot}/sinirsiz-bankacilik/atm/sube-ve-atm-arama", icon: "icon-mobile-nav-pin"),
            N("mobile-password", "Şifre Merkezi", $"{YkbRoot}/sinirsiz-bankacilik/internet-subesi/bireysel-internet-subesi/nasil-sifre-alinir", icon: "icon-mobile-nav-sifre-merkezi")
        ]);

        return [personalTab, businessTab, becomeCustomer, internetBranch, mobileQuickLinks];
    }

    private static NavigationNodeDto N(
        string id,
        string title,
        string url,
        string icon = "",
        string badge = "",
        string role = NavigationRoles.MenuItem,
        bool desktop = true,
        bool mobile = true,
        bool promoteChildrenOnDesktop = false,
        IReadOnlyList<NavigationNodeDto>? children = null,
        string image = "",
        string mobileImage = "",
        string imageAlt = "",
        bool newTab = false,
        string desktopName = "") =>
        new()
        {
            Id = id,
            Title = title,
            DesktopName = desktopName,
            Url = url,
            IconCssClass = icon,
            ImageUrl = image,
            MobileImageUrl = mobileImage,
            ImageAlt = imageAlt,
            BadgeText = badge,
            Role = role,
            OpenInNewTab = newTab,
            DisplayOnDesktop = desktop,
            DisplayOnMobile = mobile,
            PromoteChildrenOnDesktop = promoteChildrenOnDesktop,
            Children = children ?? []
        };
}
