# Ölçüm yapılacak sayfayı ve bağlantıyı seçme

1. Ana sayfanın Razor view’ında aşağıdaki değeri verin. Ortak layout, mevcut çerez tercihinden Analiz iznini okuduktan sonra takip partial’ını çağırır.

   ```cshtml
   @{
       ViewData["PartnerTrackingPath"] = "/";
   }
   ```

2. Ürün, kampanya veya blog sayfasında, aynı alana o yayındaki sayfanın yolunu verin. Örneğin online kredi için `/kredi/ihtiyac-kredisi/online-kredi`. Dinamik sayfalarda bu değeri Kentico’nun mevcut yayın URL’sinden üretin. Etiketlenen sayfaları ziyaretçi sitesinde seçin. Kod HTTPS ve tanımlı tam sunucu adını kontrol eder. Kentico Preview ve Page Builder düzenlemesinde çalışmaz. Testte [PartnerSettings.cs](../Infrastructure/CookieConsent/PartnerSettings.cs) içindeki listeye test sunucunuzun tam adını ekleyin.
3. Sayfa içindeki takip edilecek bağlantıda CMS’ten **Tıklama takibi** seçin. Ödeme kartında seçim gerçek bağlantının üzerinde olmalı. Yalnız içerik değiştiren sekme, açılır menü ve ekran adımı için seçim boş kalır. Yeni ölçüm kodu için `PartnerTrackingPath` boş bırakılan sayfada GTM yüklenmez ve düğme dinleyicisi eklenmez. [Buton kurulumu](BUTON-ALANI.md)
4. GA4 panelinde **Yönetici → Veri akışları → Web → Gelişmiş ölçüm → ayarlar → Sayfa görüntülemeleri → Gelişmiş ayarları göster** bölümünü açın. **Tarayıcı geçmişi etkinliklerine dayalı sayfa değişiklikleri** seçimini kapatın. Böylece normal sayfa yüklemesi ölçülür, aynı belge içinde geçmiş güncelleyen sekmeler ek sayfa görüntülemesi yazmaz. Bu ayar seçili veri akışını kullanan sitelere uygulanır. Mevcut GA4 akışında dış bağlantı tıklamalarını da kapsam dışında tutmak istiyorsanız **Giden tıklamalar** seçeneğini kapatın. [GA4 gelişmiş ölçüm](https://support.google.com/analytics/answer/9216061)

Dataroid için GTM’de otomatik sayfa ve bileşen yakalamayı kapatıp paketin tek sayfa açılış olayını kullanın. Ziyaret edilen adres sorgu parametresi taşıyorsa önceki paketteki davranış korunur ve o açılışta Dataroid yüklenmez. İşaretli düğme GA4’e gönderilirken sayfa ve hedef için sorgusuz adres kullanılır. Layout’un çerez kurulumundaki `private, no-store` önbellek ayarını koruyun.
