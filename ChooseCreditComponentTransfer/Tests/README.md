# Yerel doğrulama

Bu önizleme gerçek Application modellerini, validator'ı, Razor partial'larını ve JS/CSS dosyalarını kullanır. `Preview/ComponentContract.cs` yalnızca bu repo için bir arayüz taklididir; asıl projeye taşınmaz. Kentico paketleri ve gerçek hedef çözüm burada bulunmadığından Kentico mapper/loader entegrasyonu hedef çözümde doğrulanmalıdır.

Repo kökünden:

```powershell
dotnet build ChooseCreditComponentTransfer/Preview/ChooseCreditPreview.csproj
dotnet run --project ChooseCreditComponentTransfer/Preview/ChooseCreditPreview.csproj -- --self-test
dotnet run --project ChooseCreditComponentTransfer/Preview/ChooseCreditPreview.csproj --urls http://127.0.0.1:5187
```

Önizleme adresleri:

- `/`: Referans sayfaya göre CMS örneği. Son adım gerçek hedef URL'ye gider.
- `/?scenario=local`: Aynı sorular; yönlendirme hedefleri yalnızca yerel `/destination` doğrulama sayfasıdır.
- `/?scenario=three`: Üç soru; ilk soruda bitirme, sonraki soruya geçme veya bir soruyu atlama. Son soruda `~/` ve URL sorgusu örnekleri bulunur.
- `/?scenario=one`: Tek soru ve tek cevap.
- `/?scenario=multi`: Aynı component modeli iki kez render edilir; seçim ve DOM ID'leri birbirinden bağımsız olmalıdır.
- `/?scenario=invalid`: Eksik başlangıç/hedef anahtarı. Genel hata metni gösterilir; Devam düğmesi render edilmez.

Tarayıcı kontrolünde seçim yapmadan Devam'a basın; hata ve radio odağı görünmelidir. Radio seçimi tek başına geçiş yapmamalıdır. Devam'la bir sonraki soru açılmalı, önceki soru ve radio'ları gizlenip devre dışı kalmalıdır. Yönlendirme cevaplarını Devam'la tamamlayın. Dar ekranda uzun cevaplarda yatay taşma olmamalıdır. İki component örneğinde birindeki seçim diğerini etkilememelidir.

Self-test; değişken soru/cevap sayısı, dallanma, hatalı anahtarlar, döngü, iki hedefin aynı cevapta doldurulması ve güvenli URL kurallarını doğrular. Önizleme build'i ayrıca gerçek üç Razor partial'ını derler.

## Tarayıcıda doğrulanan davranışlar

30 Ekim 2026 tarihinde gerçek Razor çıktısı ve paket JS/CSS dosyalarıyla:

- Cevapsız Devam: hata metni görünür, ilk radio odağı alır; soru değişmez.
- Radio seçimi tek başına geçiş yapmaz; Devam ilk soruyu gizleyip ikinci soruyu açar. Gizli fieldset devre dışı, yeni fieldset odaktadır.
- İlk sorunun ikinci cevabı ve ikinci sorunun son cevabı beklenen hedefe gider. `local` senaryosunda hedefler aynı makinedeki doğrulama sayfasında kontrol edilmiştir.
- Üç sorulu akış, ikinci soruyu atlama, `~/` yolu ve `%20` içeren hedef sorgusu çalışır.
- Aynı model iki kez render edildiğinde DOM ID'leri benzersizdir; seçimler ve görünen sorular birbirini etkilemez.
- Geçersiz akış genel hata metnini gösterir; etkileşimli düğme oluşturulmaz.
- 375px genişlikte sekiz cevabın uzun metinleri sarılır; belge genişliği 375px kalır ve Devam görünürdür.

Görseller `../Preview/screenshots/` altındadır. Kontrol sonunda yerel önizleme sunucusu durdurulmuştur.

30 Ekim 2026 doğrulaması: önizleme build'i **0 uyarı, 0 hata** ile tamamlandı; **25 self-test kontrolü geçti**. Kentico runtime/loader kontrolü bu sayıların kapsamına girmez.
