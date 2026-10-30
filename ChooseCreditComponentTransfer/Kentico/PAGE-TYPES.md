# Kentico page type ve alan tanımları

Üç page type da içerik saklamak için oluşturulur. Kentico 13 sihirbazında **Page builder**, **URL** ve **Navigation item** özelliklerini kapalı bırakın; custom field'lar için ayrı tablo oluşturun. Component'i mevcut DynamicPage/component container ağacınızda kullanın; soru ve cevapları menüye veya site haritasına dahil etmeyin. Aşağıdaki alan adları caption değil, kodun okuduğu **field code name** değerleridir; yazımları birebir korunmalıdır. Sihirbaz ve Page name source field ayarı için [Kentico 13 resmi dokümanı](https://docs.kentico.com/13/developing-websites/defining-website-content-structure/managing-page-types/creating-page-types).

## 1. ChooseCreditComponent

Display name: `Choose Credit Component`  
Code name: `YkbYapikredi.ChooseCreditComponent`  
Allowed child page types: yalnızca `YkbYapikredi.ChooseCreditQuestion`  
Name field: `Name`

| Field code name | Kentico veri tipi | Boyut | Form control | Zorunlu | Varsayılan / açıklama |
| --- | --- | --- | --- | --- | --- |
| `Name` | Text | 200 | Text box | Evet | CMS kayıt adı; ör. Kredini Seç |
| `StartQuestionKey` | Text | 100 | Text box | Hayır | Boş; boşsa ilk `NodeOrder` sırasındaki soru açılır |
| `ContinueButtonText` | Text | 100 | Text box | Evet | `Devam` |
| `SelectionRequiredMessage` | Text | 250 | Text box | Evet | `Lütfen bir seçenek seçin.` |
| `ConfigurationErrorMessage` | Text | 250 | Text box | Evet | `Kredi seçim adımları şu anda görüntülenemiyor.` |

Component'i kabul eden üst page type/container'ın Allowed child types listesine bu page type'ı ekleyin. Aynı component içinde başka component/cevap türü doğrudan çocuk olmamalıdır.

## 2. ChooseCreditQuestion

Display name: `Choose Credit Question`  
Code name: `YkbYapikredi.ChooseCreditQuestion`  
Allowed child page types: yalnızca `YkbYapikredi.ChooseCreditAnswer`  
Name field: `Name`  
Allowed parent: `YkbYapikredi.ChooseCreditComponent`

| Field code name | Kentico veri tipi | Boyut | Form control | Zorunlu | Varsayılan / açıklama |
| --- | --- | --- | --- | --- | --- |
| `Name` | Text | 200 | Text box | Evet | CMS adı; görünür soru metni yoksa erişilebilir soru grubu adı olarak da kullanılır |
| `QuestionKey` | Text | 100 | Text box | Evet | Ör. `amac`, `ihtiyac`; aynı component içinde benzersiz |
| `Heading` | Text | 500 | Text area | Hayır | Boş; mavi başlık |
| `Description` | Text | 1000 | Text area | Hayır | Boş; mavi açıklama / ikinci satır |
| `QuestionText` | Text | 2000 | Text area | Hayır | Boş; cevapların üstündeki kalın soru metni |

`QuestionKey` için doğrulama deseni:

```text
^[a-z0-9][a-z0-9_-]{0,99}$
```

Küçük Latin harfleri, rakam, `_` ve `-` kullanın; boşluk/Türkçe karakter kullanmayın. Benzersizlik kapsamı bu component'tir, tüm site değildir. Aynı site içindeki başka bir kredi seçim component'i aynı anahtarları kullanabilir. `Heading`, `Description` ve `QuestionText` düz metindir; rich text/HTML alanı açmayın. İkinci adımda görünür soru metni istenmiyorsa üç alan da boş bırakılabilir.

## 3. ChooseCreditAnswer

Display name: `Choose Credit Answer`  
Code name: `YkbYapikredi.ChooseCreditAnswer`  
Allowed child page types: yok  
Name field: `Text`  
Allowed parent: `YkbYapikredi.ChooseCreditQuestion`

| Field code name | Kentico veri tipi | Boyut | Form control | Zorunlu | Varsayılan / açıklama |
| --- | --- | --- | --- | --- | --- |
| `Text` | Text | 2000 | Text area | Evet | Radio yanında görünen cevap; düz metin |
| `ActionType` | Text | 20 | Drop-down list | Evet | `question` veya `redirect`; aşağıdaki seçenekler |
| `NextQuestionKey` | Text | 100 | Text box | Koşullu | Yalnızca `ActionType=question` iken zorunlu; hedef sorunun anahtarı |
| `RedirectUrl` | Text | 2000 | Text box / URL saklayan selector | Koşullu | Yalnızca `ActionType=redirect` iken zorunlu |

Dropdown seçenekleri, **değer;görünen metin** biçiminde:

```text
question;Başka soruya geç
redirect;URL'ye yönlendir
```

Kaydedilen değer `question` / `redirect` olmalıdır. Caption veya `NextQuestion` gibi farklı bir değer kaydetmeyin. Yanlışlıkla yönlendirme oluşturmamak için dropdown'a otomatik bir varsayılan atamak yerine editörün seçim yapmasını sağlayabilirsiniz.

| ActionType | NextQuestionKey | RedirectUrl |
| --- | --- | --- |
| `question` | Dolu; aynı component içindeki soruyu göstermeli | Boş |
| `redirect` | Boş | Dolu; geçerli hedef URL |

Koşullu zorunlulukları kullandığınız Kentico form düzeni/validation altyapısına göre ekleyin. Bu kurallar uygulama tarafında da kontrol edilir; iki hedefi birden doldurmayın. `NextQuestionKey`, `QuestionKey` ile aynı desene uymalıdır. Bir soru kendisine veya önceki bir soruya dönerek döngü oluşturmamalıdır.

Desteklenen URL örnekleri:

```text
/kredi/konut-kredisi/doga-dostu-mortgage
~/kredi/konut-kredisi/doga-dostu-mortgage
https://www.yapikredi.com.tr/kredi/konut-kredisi/doga-dostu-mortgage
```

`javascript:`, `data:`, `//domain/...`, ters eğik çizgi veya kontrol karakteri içeren adresleri kullanmayın. `~/` uygulama kökünden, `/` host kökünden çözülür. URL'ler aynı sekmede açılır.

## Sayfa ağacı ve yayın

```text
ChooseCreditComponent [Name: Kredini Seç; StartQuestionKey: amac]
├── ChooseCreditQuestion [QuestionKey: amac]
│   ├── ChooseCreditAnswer [ActionType: question; NextQuestionKey: ihtiyac]
│   ├── ChooseCreditAnswer [ActionType: redirect; RedirectUrl: /...]
│   └── ChooseCreditAnswer [ActionType: redirect; RedirectUrl: /...]
└── ChooseCreditQuestion [QuestionKey: ihtiyac]
    ├── ChooseCreditAnswer [ActionType: redirect; RedirectUrl: /...]
    └── ...
```

Soru ve cevap sırası standart `NodeOrder` ile yönetilir; ek bir sıralama alanı açılmaz. `NodeID`, `NodeGUID` ve `NodeOrder` Kentico'nun standart alanlarıdır; tekrar custom field olarak oluşturmayın. Component, bütün soruları ve bütün cevapları doğru site/kültürde yayınlayın. Hedef soru yayınlanmamışsa live sitede akış tamamlanamaz.

Mapper'lar field'ları `GetValue` ile okur; generated page type sınıfları paketin bağımlılığı değildir. Projeniz generated sınıf kullanıyorsa CMS'den yeniden üretin, elle düzenlemeyin. Çok tipli sorguda custom alanların ve üç seviyenin yüklenmesi, üç mapper'ın ilgili modüle kaydedilmesi gerekir; [README](../README.md) entegrasyon örneğini içerir.
