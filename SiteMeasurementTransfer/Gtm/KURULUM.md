# GTM’de Dataroid kurulumu

Dataroid için ayrılmış **Web** kapsayıcısını açın. Mevcut GA4 yükleyicisi zaten sayfa görüntülemesini ve seçili düğme olaylarını gönderir. Bu kapsayıcıya yalnız Dataroid ve onun izin etiketlerini ekleyin. Kentico, GTM’yi `ykbPartnerLayer` isimli ayrı bir olay listesiyle yükler. Ayrıca GTM kurulum betiği eklemek çift yüklemeye yol açar. [GTM veri katmanı](https://developers.google.com/tag-platform/tag-manager/datalayer)

## 1. Dataroid’in Analiz iznini okumasını sağlayın

1. **Templates → Tag Templates → New** ekranında bir şablon oluşturun. Türü **Checkbox**, adı `initialize` olan alan ekleyin. **Code** bölümüne [consent-template.js](consent-template.js) içeriğini yapıştırın.
2. **Permissions** bölümünde `access_globals` için `YkbPartnerTracking.analyticsAllowed` yoluna **Read**, `access_consent` için `ykb_dataroid_storage` türüne **Write** verin.
3. Bu şablondan iki etiket oluşturun. İlkinde `initialize` işaretli, tetikleyici **Consent Initialization – All Pages**. İkincisinde işaret boş, tetikleyici **Custom Event → k13.partner_consent_update**. Bunlar izin durumunu yazar. [GTM izin API’si](https://developers.google.com/tag-platform/tag-manager/templates/consent-apis)

## 2. Dataroid başlatıcısı

1. Hesabınızın onaylı şablonunu veya sağlayıcının [Dataroid GTM şablonunu](https://github.com/dataroid/dataroid-gtm-template) içe aktarın.
2. Aşağıdaki adlarla **Data Layer Variable** (Version 2) açın. DLV adı ve Data Layer Variable Name alanı için tabloda verilen adları kullanabilirsiniz.

   | GTM alanı | Variable Name / değer |
   | --- | --- |
   | SDK Key | `{{k13_dataroid_sdk_key}}` |
   | SDK Endpoint | `{{k13_dataroid_endpoint}}` |
   | SDK URL | Hedef tenant için onaylı Web SDK URL'si. Envanter ve sağlayıcı şablonunda görülen CDN `https://cdn.dataroid.com/sdk/web/dataroid-websdk.js`. |
   | App Name | `{{k13_dataroid_app_name}}` |
   | App Version Code | `{{k13_dataroid_app_version}}` |
   | View Label | `{{k13_page_path}}` |
   | Custom event parametreleri | `{{k13_section}}`, `{{k13_button_name}}`, `{{k13_button_url}}`, `{{k13_page_url}}` |

3. **Dataroid – Init** tag'i oluşturun. **Tag Action** olarak **Init** seçin. Üstteki ilk beş alanı doldurun. **Once per page** seçin. Bu tag'i aşağıdaki olay tag'lerinin setup tag'i olarak kullanın. Sayfa otomatik yakalama, in-app, ekran yakalama ve push ayarlarını kapatın. **Ignore Query Params** açın. Envanterdeki ikinci Custom HTML başlatıcısını eklemeyin. Kullandığınız SDK sürümünde otomatik component/DOM yakalama ayrıca açıksa sağlayıcının sürüm talimatına göre kapatın ve staging payload'unu kontrol edin. [Dataroid şablon kaynak kodu](https://github.com/dataroid/dataroid-gtm-template/blob/master/template.tpl)
4. **Init** dahil her Dataroid tag'inde **Advanced Settings → Consent Settings → Require additional consent** altında `ykb_dataroid_storage` seçin.

## 3. Sayfa ve düğme etiketlerini bağlayın

**Triggers → New → Custom Event** ile [OLAYLAR.csv](OLAYLAR.csv) tablosundaki ilk sütunun her satırı için bir tetikleyici oluşturun. Tetikleyici, siteden gelen olayın adını dinler. Aşağıdaki üç Dataroid etiketi bu tetikleyicilere cevap verir.

| Etiket | GTM’de seçilecek Dataroid aksiyonu | Bağlanacak tetikleyici ve gönderilecek değer |
| --- | --- | --- |
| Sayfa açılışı | **Page View** | `k13.dataroid_page_view`. **View Label** alanına `{{k13_page_path}}` girin. |
| Başvuru ve ödeme bağlantıları | **Custom Event** | Olay adı `Anasayfa_Buttons`. CSV’de bu adla eşleşen 10 tetikleyiciyi bağlayın. Parametreler `section={{k13_section}}`, `buttonName={{k13_button_name}}`, `buttonDetail={{k13_button_url}}`. |
| Yapı Kredili Ol bağlantısı | **Custom Event** | `k13.Yapi_Kredili_Ol_ButtonClick` tetikleyicisini bağlayın. Olay adı `YapıKrediliOl_Butonu`. Parametreler `buttonName={{k13_button_name}}`, `buttonURL={{k13_button_url}}`, `pageURL={{k13_page_url}}`. |

Her üç etiketin **Advanced Settings → Tag Sequencing** bölümünde **Dataroid – Init** etiketini önce çalışacak kurulum etiketi olarak seçin. Başlatma başarısızsa olay etiketini çalıştırmama seçeneğini işaretleyin. `Tüm Hesaplama Araçları` tıklaması eski yayındaki gibi yalnız GA4’e gider.

## 4. Yayın öncesi deneyin

Test hostunda Analiz izni verin ve sorgu parametresi olmayan bir adres açın. GTM Preview sayfaya bir debug parametresi ekliyorsa bağlantıyı kurarken URL’ye debug sinyali ekleme seçimini kapatın. Önce sayfa açılışı, sonra seçili düğmede bir tıklama görünmeli. Dataroid’in test uygulamasında aynı iki kaydı kontrol edin. Tarayıcıda Network bölümünde SDK indirmesi ile olay isteği ayrı kayıtlardır. CSP kullanıyorsanız SDK için `script-src`, Dataroid API adresi için `connect-src` izinlerini test ortamında doğrulayın. [GTM ve CSP](https://developers.google.com/tag-platform/security/guides/csp)

Testten sonra GTM’de **Submit → Publish** ile hedef kapsayıcının sürümünü yayımlayın. Ziyaretçi, GTM veya SDK yüklenmeden başka bir sayfaya geçerse o hızlı tıklamanın Dataroid’e ulaşması garanti edilmez.
