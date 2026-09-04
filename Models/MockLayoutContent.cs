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
            [MenuKeys.Footer] = new(),
            [MenuKeys.FooterLegal] = new(),
            [MenuKeys.Social] = new() { Title = "Sosyal Medya" }
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
                N("deposits", "Mevduat Ürünleri", $"{YkbRoot}/bireysel-bankacilik/mevduat-urunleri/", children: [N("gold", "Altın Bankacılığı", "#")]),
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

        var personalTab = N("personal-tab", "Kendim İçin", "#", role: NavigationRoles.Tab, children:
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
        IReadOnlyList<NavigationNodeDto>? children = null) =>
        new()
        {
            Id = id,
            Title = title,
            Url = url,
            IconCssClass = icon,
            BadgeText = badge,
            Role = role,
            DisplayOnDesktop = desktop,
            DisplayOnMobile = mobile,
            PromoteChildrenOnDesktop = promoteChildrenOnDesktop,
            Children = children ?? []
        };
}
