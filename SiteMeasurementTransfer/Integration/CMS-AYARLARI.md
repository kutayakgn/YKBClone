# Çerez tercihleri altındaki üç yeni alan

| Durum | Panelde görünen ad | Code name | Girilecek değer |
| --- | --- | --- | --- |
| Mevcut | GA4 ölçüm kimliği | `YkbCookieConsentMeasurementId` | Mevcut doğrudan GA4 kurulumunun `G-…` kimliği. Eski sitede `G-XKF00DEPEL`. |
| Yeni | Dataroid için GTM kimliği | `YkbCookieConsentPartnerGtmId` | Dataroid etiketlerini yönettiğiniz Web kapsayıcısının `GTM-…` kimliği. |
| Yeni | Dataroid Web SDK anahtarı | `YkbCookieConsentDataroidSdkKey` | Seçili ortamın Web uygulama anahtarı. Canlı ve test değerleri farklıdır. |
| Yeni | Dataroid API adresi | `YkbCookieConsentDataroidEndpoint` | Eski kurulumun adresi `https://ykb.api.dataroid.com`. |

## Kentico panelinde oluşturma

1. **Modules** uygulamasında mevcut çerez modülünü açın. Önceki kurulumdaki modül kodu `YkbCookieConsentConfiguration`. **Settings → Çerez tercihleri** kategorisini seçin.
2. **New settings group** ile “Dataroid ve etiket yöneticisi” grubunu oluşturun. Grup kodu `YkbCookieConsentPartners`. Bu grup veya alanlar önceki paketten varsa aynı kayıtları kullanın.
3. Grupta her **Yeni** satırı için **New settings key** seçin. Tür **Text**, varsayılan değer boş. **Key is only global** kapalı olsun. Tablodaki code name’i aynen girin.
4. **Settings → Çerez tercihleri** ekranında üstten hedef siteyi seçin. Bu üç alanda **Inherit from global settings** seçimini kaldırıp ortama ait değerleri kaydedin. Test ve canlı aynı veritabanını ve aynı site kaydını kullanıyorsa bu değerler ortaktır. Ayrı değer girmek için ayrı Kentico site kaydı veya ayrı ortam veritabanı gerekir. [Kentico ayar tanımları](https://docs.kentico.com/13/custom-development/creating-custom-modules/adding-custom-website-settings)

## Eksik değerleri bulma

- **GA4** hesabında **Yönetici → Veri akışları → ilgili Web akışı → Ölçüm kimliği**. Bu değeri mevcut CMS ayarıyla karşılaştırın.
- **GTM** hesabında Dataroid’e ayrılmış Web kapsayıcısını açın. Üst bölümdeki `GTM-…` kimliğini alın. Böyle bir kapsayıcınız yoksa **Yönetici → Kapsayıcı oluştur → Hedef platform: Web** seçin. Eski `GTM-M26SV5T` içinde ayrıca bir GA4 kurulumu bulunduğu için bunu olduğu gibi bağlamak sayfa görüntülemelerini iki kez sayabilir. Hesabınız yoksa analitik ekibinden Dataroid kapsayıcısının kimliğini ve etiketleri yayımlayacak kişiyi isteyin. [Google GTM kurulumu](https://support.google.com/tagmanager/answer/14842164)
- **Dataroid** için eski GTM hesabında **Etiketler → Dataroid → Init** etiketini açın. **SDK Key**, **SDK Endpoint**, **App Name** ve **App Version** değerlerini okuyun. Canlı ve test başlatıcılarını ayrı kontrol edin. Yeni hesap veya yeni ortam kullanıyorsanız Dataroid yöneticisine “Web uygulamamızın test ve canlı browser SDK key’leri, HTTPS API adresi, uygulama adı ve sürümü nedir?” diye sorun. Gerekli anahtar, web tarayıcısı için verilen SDK anahtarıdır. [Dataroid Web şablonu](https://github.com/dataroid/dataroid-gtm-template)
- Eski yayından okunan iki SDK anahtarı dahil tam değerler bu çalışma kopyasındaki `CANLI-DEGERLER.local.md` dosyasındadır. Dosya Git’e dahil edilmez. Değeri ancak ilgili ortam aynı Dataroid uygulamasına veri gönderecekse kullanın.

`PartnerSettings` ayarları mevcut Kentico site koduyla okur. Dataroid uygulama adı `yapikredi.com.tr`, sürümü `1.0` olarak [Razor dosyasında](../Web/Views/Shared/_PartnerTracking.cshtml) tutulur. Hedef Dataroid hesabı farklı bir uygulama adı veya sürümü verirse bu iki sabiti güncelleyin. Bu kurulum için `appsettings.json` değişikliği gerekmez. Üç yeni alandan biri boşsa Dataroid başlamaz. Mevcut GA4 kimliği ile seçili düğmelerin ölçümü çalışabilir.
