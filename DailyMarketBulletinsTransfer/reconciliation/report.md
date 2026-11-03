# Piyasa bültenleri kayıt karşılaştırması

Verilen beş parça **3516 kayıt** içeriyor. Tam kaynak snapshotı **3122 kayıt** içeriyor. Kaynakta tarih/tür olarak hiç bulunmayan **441 farklı anahtara ait 443 kayıt** silme adayıdır. Kaynakta bulunan anahtarlarda adet fazlası **yoktur**.

Yalnız bu 443 kayıt çıkarılırsa sağlanan listede **3073 kayıt** kalır. Kaynakta bulunan fakat sağlanan listede eksik olan **49 kayıt** ayrıca vardır; yalnız silme işlemiyle 3122 sayısına ulaşmak doğru hedef değildir. Net sayı farkı 394 olsa da silme adayı sayısı 443'tür.

## Kaynak ve kapsam

- Kaynak: [Yapı Kredi piyasa bültenleri](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/)
- API: https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/default.aspx/LoadMarketReleases
- Filtre: dateFrom=null, dateTo=null, type=Any; başlangıç veya bitiş yılı kısıtı yok.
- Snapshot zamanı (UTC): 2026-11-03T08:44:44.7052391Z
- Sayfalar: 313/313; son sayfada 2 kayıt. İlk sayfa işlem sonunda yeniden okunarak doğrulandı.
- Kaynak tarihleri: 2011-06-22–2026-11-03.
- Snapshot SHA-256: `a01ba358be73143b0841e3536c088830a5134b3221973de8219dfb42c7ade3f6`
- Kaynak snapshotı değişmeden kullanıldı. Bu karşılaştırma hiçbir PDF/DOCX indirmedi, veritabanı veya medya dosyası silmedi.

## Girdi doğrulaması

Beş dosya verilen sırayla birleştirildiğinde doğrudan geçerli tek JSON dizisi oluyor. İlk dosya açılış köşeli parantezini, son dosya kapanış parantezini taşıyor. Nesne atlama, tarih tahmini veya eksik satır tamamlama yapılmadı. Birleşik dizi ile parça bazında ayrıştırılan değerler birebir doğrulandı. Tarihler takvim kontrolünden sonra ISO biçimine çevrildi.

| Parça | Kayıt | En eski tarih | En yeni tarih | Türler |
|---|---:|---|---|---|
| 1 (5cf34e34-8272-497b-83f3-66a54d3b8591) | 780 | 2023-09-06 | 2026-10-27 | Günlük: 780 |
| 2 (33d2a31c-b3b7-4d8b-9c17-794a1a52b54b) | 865 | 2020-03-13 | 2023-09-05 | Günlük: 865 |
| 3 (8b01586d-778f-4f76-af22-c152fa57a2f6) | 685 | 2016-11-14 | 2020-03-11 | Günlük: 685 |
| 4 (be20bd61-7c47-476f-ae77-ba39b08c614f) | 840 | 2012-12-04 | 2016-11-11 | Günlük: 840 |
| 5 (b3de1ca5-8354-44a6-8bb0-512bcdb19185) | 346 | 2011-06-22 | 2026-11-02 | Aylık: 11, Günlük: 335 |

Girdilerde yalnız `date` ve `bulletinType` alanları var. Custom table sınıf adı, `ItemID`, `Pdf`, `sourceUrl` veya dosya adı yer almıyor. Bu nedenle karşılaştırma, mevcut CMS veritabanının anlık tam dışa aktarımı olduğunu bağımsız olarak kanıtlamaz; sağlanan listeyi karşılaştırır. Son parçanın sonuna eklenen 02.11.2026 kaydı da atlanmadan sayıldı.

## Sayılar

| Ölçü | Sağlanan liste | Kaynak |
|---|---:|---:|
| Ham kayıt | 3516 | 3122 |
| Farklı tarih/tür | 3505 | 3107 |
| Birden fazla kaydı olan tarih/tür grubu | 11 | 15 |

| Tür | Liste kayıt | Kaynak kayıt | Kaynakta olmayan liste kaydı | Kaynakta olup listede eksik kayıt |
|---|---:|---:|---:|---:|
| Aylık | 11 | 11 | 0 | 0 |
| Günlük | 3505 | 3111 | 443 | 49 |

Aylık türündeki 11 kaydın tamamı kaynakta mevcut. Bu türü topluca silmek doğru değildir.

## Silme adaylarının dağılımı

İlk aday: **04.11.2014 / Günlük**. Son aday: **10.05.2021 / Günlük**.

| Yıl | Farklı tarih/tür | Kayıt |
|---|---:|---:|
| 2014 | 4 | 4 |
| 2015 | 19 | 19 |
| 2016 | 2 | 2 |
| 2018 | 1 | 1 |
| 2019 | 107 | 107 |
| 2020 | 219 | 221 |
| 2021 | 89 | 89 |

## Sağlanan listedeki 11 çift kayıt grubu

Dokuz grup kaynakta da iki farklı belge bağlantısı ile iki kez yer alıyor. Bunları yalnız aynı tarih/tür oldukları için tekilleştirmek kaynakla eşleşmeyi bozar. Diğer iki grubun anahtarı kaynakta hiç yoktur; bu grupların toplam dört satırı 443 silme adayının içindedir.

| Tarih | Tür | Liste adet | Kaynak adet | Karar |
|---|---|---:|---:|---|
| 25.01.2012 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 19.03.2013 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 27.03.2013 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 21.05.2013 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 24.05.2018 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 31.07.2018 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 10.12.2018 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 11.12.2018 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 12.12.2018 | Günlük | 2 | 2 | Koru; kaynakta iki ayrı URL var |
| 20.02.2020 | Günlük | 2 | 0 | Kaynakta yok; üyelik bazlı silme adayı |
| 20.11.2020 | Günlük | 2 | 0 | Kaynakta yok; üyelik bazlı silme adayı |

## Kaynakta olup listede bulunmayan 43 tarih/tür

Bunlar toplam 43 kaynak kaydıdır. Ayrıca aşağıdaki altı mevcut grupta birer kaynak kaydı eksiktir. 03.11.2026 kaydı kaynak snapshotının, sağlanan listenin en yeni 02.11.2026 tarihinden sonra alınmasıyla da ilişkili olabilir; burada yine kaynak/listede yok farkı olarak gösterilir.

| Tarih | Tür | Kaynak adet | Kaynak bağlantısı |
|---|---|---:|---|
| 27.08.2012 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-dokuman_8922/view) |
| 20.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/20.08.2013_20130820tr%5B1%5D.pdf) |
| 21.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/21.08.2013_20130821tr%5B1%5D.pdf) |
| 22.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/22.08.2013_20130822tr%5B1%5D.pdf) |
| 23.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/23.08.2013_20130823tr%5B1%5D.pdf) |
| 26.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/26.08.2013_20130826tr%5B1%5D.pdf) |
| 27.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/27.08.2013_20130827tr%5B1%5D.pdf) |
| 28.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/28.08.2013_20130828tr%5B1%5D.pdf) |
| 29.08.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/29.08.2013_20130829tr%5B1%5D.pdf) |
| 02.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/02.09.2013_20130902tr%5B1%5D.pdf) |
| 04.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/04.09.2013_20130904tr%5B1%5D.pdf) |
| 05.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/05.09.2013_20130905tr%5B1%5D.pdf) |
| 06.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/06.09.2013_20130906tr%5B1%5D.pdf) |
| 09.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/09.09.2013_20130909tr%5B1%5D.pdf) |
| 10.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/10.09.2013_20130910tr%5B1%5D.pdf) |
| 11.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/11.09.2013_20130911tr%5B1%5D.pdf) |
| 12.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/12.09.2013_20130912tr%5B1%5D.pdf) |
| 13.09.2013 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/ufiles/piyasaBultenleri/13.09.2013_20130913tr%5B1%5D.pdf) |
| 15.07.2014 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 17.11.2014 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/17112014_18073/view) |
| 18.09.2015 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/18092015_22318/view) |
| 17.03.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni_24659/view) |
| 01.09.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 28.09.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni_27448/view) |
| 24.10.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 25.10.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 21.12.2016 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 05.01.2017 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 11.05.2017 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/yapi-kredi-hakkinda/piyasa-bulteni/) |
| 12.07.2017 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_35543/view) |
| 13.07.2017 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_35552/view) |
| 14.07.2017 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_35599/view) |
| 30.03.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_43747/view) |
| 09.04.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni_43952/view) |
| 27.04.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_44521/view) |
| 30.04.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_44530/view) |
| 03.05.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_44667/view?t=636609392740000000) |
| 04.05.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_44689/view) |
| 07.05.2018 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_44718/view) |
| 01.03.2021 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/blue-class-bulten_63022/view) |
| 19.04.2022 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/blue-class-gunluk-bulten_65228/view) |
| 07.06.2022 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/blue-class-gunluk-bulten_65481/view) |
| 03.11.2026 | Günlük | 1 | [Belge](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_73044/view) |

## Kaynakta iki belge olup listede bir kayıt bulunan altı grup

Bu gruplarda toplam altı kayıt eksiktir. Sağlanan listede Pdf/ItemID bulunmadığı için iki kaynak URL’sinden hangisinin eksik olduğu kesin seçilemez.

| Tarih | Tür | Liste adet | Kaynak adet | Kaynak URL’leri |
|---|---|---:|---:|---|
| 05.05.2015 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/04052015_20572/view), [2](https://www.yapikredi.com.tr/medium/file/05052015_20574/view) |
| 14.09.2018 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_47534/view), [2](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_47536/view) |
| 18.04.2019 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_53437/view), [2](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_53442/view) |
| 06.05.2019 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_53771/view), [2](https://www.yapikredi.com.tr/medium/file/piyasa-bulteni-yonetimi_53773/view) |
| 21.04.2020 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/blue-class-bulten_60623/view), [2](https://www.yapikredi.com.tr/medium/file/blue-class-piyasa-bulteni-yonetimi_60633/view) |
| 31.07.2025 | Günlük | 1 | 2 | [1](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_71353/view), [2](https://www.yapikredi.com.tr/medium/file/gunluk-bulten_71355/view) |

## Güvenli işlem politikası

Silme adayı, yalnız tarih + bülten türü anahtarı doğrulanmış tam kaynak snapshotında hiç bulunmayan CMS kaydıdır. Kaynakta bulunan anahtarlar ve dokuz meşru çift grup korunmalıdır. Bu listede kaynakta bulunan bir anahtarda adet fazlası çıkmadı. İşlemden önce gerçek CMS satırları ItemID/Pdf ile yeniden okunmalı, ön izleme ve yedek üzerinden güncel kapsam doğrulanmalıdır. Medya dosyası silme/taşıma kararı için dosyanın korunan başka satır tarafından kullanılmadığı da kontrol edilmelidir.

Kaynak URL’si, aynı Daily/historical dosya adı algoritmasıyla 12 haneli kimlik hash ekine ve olası PDF/DOCX adlarına çevrilebilir. `comparison.json` her kaynak belge için bu adayları içerir. Ancak girdide Pdf/dosya adı olmadığı ve belge uzantıları/içerikleri indirilmediği için bu, gerçek CMS dosyasının doğrulandığı anlamına gelmez.

## Tüm silme adayı anahtarlar (441 anahtar / 443 kayıt)

Aynı listenin makineye uygun biçimi `extras.csv` dosyasındadır. CSV ayrıca parça/satır ve birleşik dizi sıra numaralarını içerir. JSON dosyası tüm üyelik ve çoklu küme farklarını, kaynak URL’lerini ve olası dosya adlarını tutar.

| Tarih | Tür | Liste adet | Kaynak adet |
|---|---|---:|---:|
| 04.11.2014 | Günlük | 1 | 0 |
| 05.11.2014 | Günlük | 1 | 0 |
| 06.11.2014 | Günlük | 1 | 0 |
| 19.12.2014 | Günlük | 1 | 0 |
| 16.01.2015 | Günlük | 1 | 0 |
| 12.03.2015 | Günlük | 1 | 0 |
| 16.03.2015 | Günlük | 1 | 0 |
| 18.03.2015 | Günlük | 1 | 0 |
| 15.04.2015 | Günlük | 1 | 0 |
| 04.05.2015 | Günlük | 1 | 0 |
| 03.06.2015 | Günlük | 1 | 0 |
| 12.06.2015 | Günlük | 1 | 0 |
| 27.07.2015 | Günlük | 1 | 0 |
| 10.08.2015 | Günlük | 1 | 0 |
| 11.08.2015 | Günlük | 1 | 0 |
| 12.08.2015 | Günlük | 1 | 0 |
| 13.08.2015 | Günlük | 1 | 0 |
| 14.08.2015 | Günlük | 1 | 0 |
| 17.08.2015 | Günlük | 1 | 0 |
| 18.08.2015 | Günlük | 1 | 0 |
| 19.08.2015 | Günlük | 1 | 0 |
| 20.08.2015 | Günlük | 1 | 0 |
| 21.08.2015 | Günlük | 1 | 0 |
| 07.04.2016 | Günlük | 1 | 0 |
| 28.04.2016 | Günlük | 1 | 0 |
| 07.11.2018 | Günlük | 1 | 0 |
| 20.05.2019 | Günlük | 1 | 0 |
| 21.05.2019 | Günlük | 1 | 0 |
| 22.05.2019 | Günlük | 1 | 0 |
| 05.07.2019 | Günlük | 1 | 0 |
| 08.07.2019 | Günlük | 1 | 0 |
| 09.07.2019 | Günlük | 1 | 0 |
| 10.07.2019 | Günlük | 1 | 0 |
| 11.07.2019 | Günlük | 1 | 0 |
| 12.07.2019 | Günlük | 1 | 0 |
| 16.07.2019 | Günlük | 1 | 0 |
| 17.07.2019 | Günlük | 1 | 0 |
| 18.07.2019 | Günlük | 1 | 0 |
| 19.07.2019 | Günlük | 1 | 0 |
| 23.07.2019 | Günlük | 1 | 0 |
| 24.07.2019 | Günlük | 1 | 0 |
| 25.07.2019 | Günlük | 1 | 0 |
| 26.07.2019 | Günlük | 1 | 0 |
| 30.07.2019 | Günlük | 1 | 0 |
| 31.07.2019 | Günlük | 1 | 0 |
| 01.08.2019 | Günlük | 1 | 0 |
| 02.08.2019 | Günlük | 1 | 0 |
| 05.08.2019 | Günlük | 1 | 0 |
| 07.08.2019 | Günlük | 1 | 0 |
| 08.08.2019 | Günlük | 1 | 0 |
| 09.08.2019 | Günlük | 1 | 0 |
| 15.08.2019 | Günlük | 1 | 0 |
| 16.08.2019 | Günlük | 1 | 0 |
| 19.08.2019 | Günlük | 1 | 0 |
| 20.08.2019 | Günlük | 1 | 0 |
| 21.08.2019 | Günlük | 1 | 0 |
| 22.08.2019 | Günlük | 1 | 0 |
| 26.08.2019 | Günlük | 1 | 0 |
| 27.08.2019 | Günlük | 1 | 0 |
| 28.08.2019 | Günlük | 1 | 0 |
| 29.08.2019 | Günlük | 1 | 0 |
| 02.09.2019 | Günlük | 1 | 0 |
| 04.09.2019 | Günlük | 1 | 0 |
| 05.09.2019 | Günlük | 1 | 0 |
| 06.09.2019 | Günlük | 1 | 0 |
| 09.09.2019 | Günlük | 1 | 0 |
| 10.09.2019 | Günlük | 1 | 0 |
| 11.09.2019 | Günlük | 1 | 0 |
| 12.09.2019 | Günlük | 1 | 0 |
| 13.09.2019 | Günlük | 1 | 0 |
| 16.09.2019 | Günlük | 1 | 0 |
| 17.09.2019 | Günlük | 1 | 0 |
| 18.09.2019 | Günlük | 1 | 0 |
| 19.09.2019 | Günlük | 1 | 0 |
| 20.09.2019 | Günlük | 1 | 0 |
| 23.09.2019 | Günlük | 1 | 0 |
| 24.09.2019 | Günlük | 1 | 0 |
| 25.09.2019 | Günlük | 1 | 0 |
| 27.09.2019 | Günlük | 1 | 0 |
| 30.09.2019 | Günlük | 1 | 0 |
| 01.10.2019 | Günlük | 1 | 0 |
| 02.10.2019 | Günlük | 1 | 0 |
| 03.10.2019 | Günlük | 1 | 0 |
| 04.10.2019 | Günlük | 1 | 0 |
| 07.10.2019 | Günlük | 1 | 0 |
| 08.10.2019 | Günlük | 1 | 0 |
| 09.10.2019 | Günlük | 1 | 0 |
| 10.10.2019 | Günlük | 1 | 0 |
| 11.10.2019 | Günlük | 1 | 0 |
| 17.10.2019 | Günlük | 1 | 0 |
| 18.10.2019 | Günlük | 1 | 0 |
| 21.10.2019 | Günlük | 1 | 0 |
| 22.10.2019 | Günlük | 1 | 0 |
| 23.10.2019 | Günlük | 1 | 0 |
| 24.10.2019 | Günlük | 1 | 0 |
| 25.10.2019 | Günlük | 1 | 0 |
| 30.10.2019 | Günlük | 1 | 0 |
| 01.11.2019 | Günlük | 1 | 0 |
| 04.11.2019 | Günlük | 1 | 0 |
| 05.11.2019 | Günlük | 1 | 0 |
| 06.11.2019 | Günlük | 1 | 0 |
| 08.11.2019 | Günlük | 1 | 0 |
| 11.11.2019 | Günlük | 1 | 0 |
| 12.11.2019 | Günlük | 1 | 0 |
| 13.11.2019 | Günlük | 1 | 0 |
| 14.11.2019 | Günlük | 1 | 0 |
| 15.11.2019 | Günlük | 1 | 0 |
| 18.11.2019 | Günlük | 1 | 0 |
| 19.11.2019 | Günlük | 1 | 0 |
| 21.11.2019 | Günlük | 1 | 0 |
| 22.11.2019 | Günlük | 1 | 0 |
| 25.11.2019 | Günlük | 1 | 0 |
| 26.11.2019 | Günlük | 1 | 0 |
| 27.11.2019 | Günlük | 1 | 0 |
| 28.11.2019 | Günlük | 1 | 0 |
| 29.11.2019 | Günlük | 1 | 0 |
| 03.12.2019 | Günlük | 1 | 0 |
| 04.12.2019 | Günlük | 1 | 0 |
| 05.12.2019 | Günlük | 1 | 0 |
| 06.12.2019 | Günlük | 1 | 0 |
| 11.12.2019 | Günlük | 1 | 0 |
| 12.12.2019 | Günlük | 1 | 0 |
| 13.12.2019 | Günlük | 1 | 0 |
| 16.12.2019 | Günlük | 1 | 0 |
| 18.12.2019 | Günlük | 1 | 0 |
| 19.12.2019 | Günlük | 1 | 0 |
| 23.12.2019 | Günlük | 1 | 0 |
| 24.12.2019 | Günlük | 1 | 0 |
| 25.12.2019 | Günlük | 1 | 0 |
| 26.12.2019 | Günlük | 1 | 0 |
| 27.12.2019 | Günlük | 1 | 0 |
| 30.12.2019 | Günlük | 1 | 0 |
| 31.12.2019 | Günlük | 1 | 0 |
| 02.01.2020 | Günlük | 1 | 0 |
| 06.01.2020 | Günlük | 1 | 0 |
| 07.01.2020 | Günlük | 1 | 0 |
| 08.01.2020 | Günlük | 1 | 0 |
| 09.01.2020 | Günlük | 1 | 0 |
| 10.01.2020 | Günlük | 1 | 0 |
| 13.01.2020 | Günlük | 1 | 0 |
| 14.01.2020 | Günlük | 1 | 0 |
| 15.01.2020 | Günlük | 1 | 0 |
| 16.01.2020 | Günlük | 1 | 0 |
| 17.01.2020 | Günlük | 1 | 0 |
| 20.01.2020 | Günlük | 1 | 0 |
| 21.01.2020 | Günlük | 1 | 0 |
| 22.01.2020 | Günlük | 1 | 0 |
| 23.01.2020 | Günlük | 1 | 0 |
| 24.01.2020 | Günlük | 1 | 0 |
| 27.01.2020 | Günlük | 1 | 0 |
| 28.01.2020 | Günlük | 1 | 0 |
| 29.01.2020 | Günlük | 1 | 0 |
| 30.01.2020 | Günlük | 1 | 0 |
| 31.01.2020 | Günlük | 1 | 0 |
| 03.02.2020 | Günlük | 1 | 0 |
| 04.02.2020 | Günlük | 1 | 0 |
| 05.02.2020 | Günlük | 1 | 0 |
| 06.02.2020 | Günlük | 1 | 0 |
| 07.02.2020 | Günlük | 1 | 0 |
| 11.02.2020 | Günlük | 1 | 0 |
| 12.02.2020 | Günlük | 1 | 0 |
| 13.02.2020 | Günlük | 1 | 0 |
| 14.02.2020 | Günlük | 1 | 0 |
| 17.02.2020 | Günlük | 1 | 0 |
| 18.02.2020 | Günlük | 1 | 0 |
| 19.02.2020 | Günlük | 1 | 0 |
| 20.02.2020 | Günlük | 2 | 0 |
| 21.02.2020 | Günlük | 1 | 0 |
| 24.02.2020 | Günlük | 1 | 0 |
| 25.02.2020 | Günlük | 1 | 0 |
| 27.02.2020 | Günlük | 1 | 0 |
| 28.02.2020 | Günlük | 1 | 0 |
| 02.03.2020 | Günlük | 1 | 0 |
| 03.03.2020 | Günlük | 1 | 0 |
| 04.03.2020 | Günlük | 1 | 0 |
| 09.03.2020 | Günlük | 1 | 0 |
| 10.03.2020 | Günlük | 1 | 0 |
| 11.03.2020 | Günlük | 1 | 0 |
| 13.03.2020 | Günlük | 1 | 0 |
| 16.03.2020 | Günlük | 1 | 0 |
| 17.03.2020 | Günlük | 1 | 0 |
| 18.03.2020 | Günlük | 1 | 0 |
| 19.03.2020 | Günlük | 1 | 0 |
| 20.03.2020 | Günlük | 1 | 0 |
| 24.03.2020 | Günlük | 1 | 0 |
| 25.03.2020 | Günlük | 1 | 0 |
| 26.03.2020 | Günlük | 1 | 0 |
| 27.03.2020 | Günlük | 1 | 0 |
| 30.03.2020 | Günlük | 1 | 0 |
| 31.03.2020 | Günlük | 1 | 0 |
| 01.04.2020 | Günlük | 1 | 0 |
| 02.04.2020 | Günlük | 1 | 0 |
| 03.04.2020 | Günlük | 1 | 0 |
| 06.04.2020 | Günlük | 1 | 0 |
| 07.04.2020 | Günlük | 1 | 0 |
| 08.04.2020 | Günlük | 1 | 0 |
| 09.04.2020 | Günlük | 1 | 0 |
| 10.04.2020 | Günlük | 1 | 0 |
| 13.04.2020 | Günlük | 1 | 0 |
| 14.04.2020 | Günlük | 1 | 0 |
| 15.04.2020 | Günlük | 1 | 0 |
| 16.04.2020 | Günlük | 1 | 0 |
| 20.04.2020 | Günlük | 1 | 0 |
| 22.04.2020 | Günlük | 1 | 0 |
| 24.04.2020 | Günlük | 1 | 0 |
| 27.04.2020 | Günlük | 1 | 0 |
| 28.04.2020 | Günlük | 1 | 0 |
| 29.04.2020 | Günlük | 1 | 0 |
| 30.04.2020 | Günlük | 1 | 0 |
| 04.05.2020 | Günlük | 1 | 0 |
| 05.05.2020 | Günlük | 1 | 0 |
| 06.05.2020 | Günlük | 1 | 0 |
| 07.05.2020 | Günlük | 1 | 0 |
| 11.05.2020 | Günlük | 1 | 0 |
| 12.05.2020 | Günlük | 1 | 0 |
| 13.05.2020 | Günlük | 1 | 0 |
| 14.05.2020 | Günlük | 1 | 0 |
| 15.05.2020 | Günlük | 1 | 0 |
| 18.05.2020 | Günlük | 1 | 0 |
| 20.05.2020 | Günlük | 1 | 0 |
| 21.05.2020 | Günlük | 1 | 0 |
| 22.05.2020 | Günlük | 1 | 0 |
| 27.05.2020 | Günlük | 1 | 0 |
| 28.05.2020 | Günlük | 1 | 0 |
| 29.05.2020 | Günlük | 1 | 0 |
| 01.06.2020 | Günlük | 1 | 0 |
| 02.06.2020 | Günlük | 1 | 0 |
| 03.06.2020 | Günlük | 1 | 0 |
| 04.06.2020 | Günlük | 1 | 0 |
| 05.06.2020 | Günlük | 1 | 0 |
| 08.06.2020 | Günlük | 1 | 0 |
| 09.06.2020 | Günlük | 1 | 0 |
| 10.06.2020 | Günlük | 1 | 0 |
| 11.06.2020 | Günlük | 1 | 0 |
| 12.06.2020 | Günlük | 1 | 0 |
| 15.06.2020 | Günlük | 1 | 0 |
| 16.06.2020 | Günlük | 1 | 0 |
| 17.06.2020 | Günlük | 1 | 0 |
| 18.06.2020 | Günlük | 1 | 0 |
| 19.06.2020 | Günlük | 1 | 0 |
| 23.06.2020 | Günlük | 1 | 0 |
| 24.06.2020 | Günlük | 1 | 0 |
| 25.06.2020 | Günlük | 1 | 0 |
| 26.06.2020 | Günlük | 1 | 0 |
| 29.06.2020 | Günlük | 1 | 0 |
| 30.06.2020 | Günlük | 1 | 0 |
| 01.07.2020 | Günlük | 1 | 0 |
| 02.07.2020 | Günlük | 1 | 0 |
| 03.07.2020 | Günlük | 1 | 0 |
| 06.07.2020 | Günlük | 1 | 0 |
| 07.07.2020 | Günlük | 1 | 0 |
| 08.07.2020 | Günlük | 1 | 0 |
| 09.07.2020 | Günlük | 1 | 0 |
| 10.07.2020 | Günlük | 1 | 0 |
| 13.07.2020 | Günlük | 1 | 0 |
| 14.07.2020 | Günlük | 1 | 0 |
| 16.07.2020 | Günlük | 1 | 0 |
| 17.07.2020 | Günlük | 1 | 0 |
| 20.07.2020 | Günlük | 1 | 0 |
| 21.07.2020 | Günlük | 1 | 0 |
| 22.07.2020 | Günlük | 1 | 0 |
| 23.07.2020 | Günlük | 1 | 0 |
| 24.07.2020 | Günlük | 1 | 0 |
| 27.07.2020 | Günlük | 1 | 0 |
| 28.07.2020 | Günlük | 1 | 0 |
| 29.07.2020 | Günlük | 1 | 0 |
| 30.07.2020 | Günlük | 1 | 0 |
| 05.08.2020 | Günlük | 1 | 0 |
| 06.08.2020 | Günlük | 1 | 0 |
| 07.08.2020 | Günlük | 1 | 0 |
| 10.08.2020 | Günlük | 1 | 0 |
| 11.08.2020 | Günlük | 1 | 0 |
| 12.08.2020 | Günlük | 1 | 0 |
| 13.08.2020 | Günlük | 1 | 0 |
| 14.08.2020 | Günlük | 1 | 0 |
| 17.08.2020 | Günlük | 1 | 0 |
| 19.08.2020 | Günlük | 1 | 0 |
| 20.08.2020 | Günlük | 1 | 0 |
| 21.08.2020 | Günlük | 1 | 0 |
| 24.08.2020 | Günlük | 1 | 0 |
| 25.08.2020 | Günlük | 1 | 0 |
| 26.08.2020 | Günlük | 1 | 0 |
| 27.08.2020 | Günlük | 1 | 0 |
| 28.08.2020 | Günlük | 1 | 0 |
| 31.08.2020 | Günlük | 1 | 0 |
| 01.09.2020 | Günlük | 1 | 0 |
| 02.09.2020 | Günlük | 1 | 0 |
| 03.09.2020 | Günlük | 1 | 0 |
| 04.09.2020 | Günlük | 1 | 0 |
| 07.09.2020 | Günlük | 1 | 0 |
| 08.09.2020 | Günlük | 1 | 0 |
| 09.09.2020 | Günlük | 1 | 0 |
| 10.09.2020 | Günlük | 1 | 0 |
| 11.09.2020 | Günlük | 1 | 0 |
| 21.09.2020 | Günlük | 1 | 0 |
| 22.09.2020 | Günlük | 1 | 0 |
| 23.09.2020 | Günlük | 1 | 0 |
| 24.09.2020 | Günlük | 1 | 0 |
| 25.09.2020 | Günlük | 1 | 0 |
| 28.09.2020 | Günlük | 1 | 0 |
| 29.09.2020 | Günlük | 1 | 0 |
| 30.09.2020 | Günlük | 1 | 0 |
| 01.10.2020 | Günlük | 1 | 0 |
| 02.10.2020 | Günlük | 1 | 0 |
| 05.10.2020 | Günlük | 1 | 0 |
| 06.10.2020 | Günlük | 1 | 0 |
| 07.10.2020 | Günlük | 1 | 0 |
| 08.10.2020 | Günlük | 1 | 0 |
| 09.10.2020 | Günlük | 1 | 0 |
| 12.10.2020 | Günlük | 1 | 0 |
| 13.10.2020 | Günlük | 1 | 0 |
| 14.10.2020 | Günlük | 1 | 0 |
| 15.10.2020 | Günlük | 1 | 0 |
| 16.10.2020 | Günlük | 1 | 0 |
| 19.10.2020 | Günlük | 1 | 0 |
| 20.10.2020 | Günlük | 1 | 0 |
| 22.10.2020 | Günlük | 1 | 0 |
| 23.10.2020 | Günlük | 1 | 0 |
| 02.11.2020 | Günlük | 1 | 0 |
| 09.11.2020 | Günlük | 1 | 0 |
| 10.11.2020 | Günlük | 1 | 0 |
| 11.11.2020 | Günlük | 1 | 0 |
| 12.11.2020 | Günlük | 1 | 0 |
| 13.11.2020 | Günlük | 1 | 0 |
| 16.11.2020 | Günlük | 1 | 0 |
| 17.11.2020 | Günlük | 1 | 0 |
| 18.11.2020 | Günlük | 1 | 0 |
| 19.11.2020 | Günlük | 1 | 0 |
| 20.11.2020 | Günlük | 2 | 0 |
| 23.11.2020 | Günlük | 1 | 0 |
| 24.11.2020 | Günlük | 1 | 0 |
| 25.11.2020 | Günlük | 1 | 0 |
| 26.11.2020 | Günlük | 1 | 0 |
| 27.11.2020 | Günlük | 1 | 0 |
| 30.11.2020 | Günlük | 1 | 0 |
| 01.12.2020 | Günlük | 1 | 0 |
| 02.12.2020 | Günlük | 1 | 0 |
| 03.12.2020 | Günlük | 1 | 0 |
| 04.12.2020 | Günlük | 1 | 0 |
| 07.12.2020 | Günlük | 1 | 0 |
| 08.12.2020 | Günlük | 1 | 0 |
| 09.12.2020 | Günlük | 1 | 0 |
| 10.12.2020 | Günlük | 1 | 0 |
| 11.12.2020 | Günlük | 1 | 0 |
| 21.12.2020 | Günlük | 1 | 0 |
| 22.12.2020 | Günlük | 1 | 0 |
| 23.12.2020 | Günlük | 1 | 0 |
| 24.12.2020 | Günlük | 1 | 0 |
| 25.12.2020 | Günlük | 1 | 0 |
| 28.12.2020 | Günlük | 1 | 0 |
| 30.12.2020 | Günlük | 1 | 0 |
| 31.12.2020 | Günlük | 1 | 0 |
| 04.01.2021 | Günlük | 1 | 0 |
| 05.01.2021 | Günlük | 1 | 0 |
| 06.01.2021 | Günlük | 1 | 0 |
| 07.01.2021 | Günlük | 1 | 0 |
| 08.01.2021 | Günlük | 1 | 0 |
| 11.01.2021 | Günlük | 1 | 0 |
| 12.01.2021 | Günlük | 1 | 0 |
| 13.01.2021 | Günlük | 1 | 0 |
| 14.01.2021 | Günlük | 1 | 0 |
| 15.01.2021 | Günlük | 1 | 0 |
| 18.01.2021 | Günlük | 1 | 0 |
| 19.01.2021 | Günlük | 1 | 0 |
| 20.01.2021 | Günlük | 1 | 0 |
| 21.01.2021 | Günlük | 1 | 0 |
| 22.01.2021 | Günlük | 1 | 0 |
| 25.01.2021 | Günlük | 1 | 0 |
| 26.01.2021 | Günlük | 1 | 0 |
| 27.01.2021 | Günlük | 1 | 0 |
| 28.01.2021 | Günlük | 1 | 0 |
| 29.01.2021 | Günlük | 1 | 0 |
| 01.02.2021 | Günlük | 1 | 0 |
| 02.02.2021 | Günlük | 1 | 0 |
| 03.02.2021 | Günlük | 1 | 0 |
| 04.02.2021 | Günlük | 1 | 0 |
| 05.02.2021 | Günlük | 1 | 0 |
| 08.02.2021 | Günlük | 1 | 0 |
| 09.02.2021 | Günlük | 1 | 0 |
| 10.02.2021 | Günlük | 1 | 0 |
| 11.02.2021 | Günlük | 1 | 0 |
| 12.02.2021 | Günlük | 1 | 0 |
| 15.02.2021 | Günlük | 1 | 0 |
| 16.02.2021 | Günlük | 1 | 0 |
| 17.02.2021 | Günlük | 1 | 0 |
| 18.02.2021 | Günlük | 1 | 0 |
| 19.02.2021 | Günlük | 1 | 0 |
| 22.02.2021 | Günlük | 1 | 0 |
| 23.02.2021 | Günlük | 1 | 0 |
| 24.02.2021 | Günlük | 1 | 0 |
| 25.02.2021 | Günlük | 1 | 0 |
| 26.02.2021 | Günlük | 1 | 0 |
| 02.03.2021 | Günlük | 1 | 0 |
| 03.03.2021 | Günlük | 1 | 0 |
| 04.03.2021 | Günlük | 1 | 0 |
| 05.03.2021 | Günlük | 1 | 0 |
| 08.03.2021 | Günlük | 1 | 0 |
| 09.03.2021 | Günlük | 1 | 0 |
| 10.03.2021 | Günlük | 1 | 0 |
| 11.03.2021 | Günlük | 1 | 0 |
| 12.03.2021 | Günlük | 1 | 0 |
| 15.03.2021 | Günlük | 1 | 0 |
| 16.03.2021 | Günlük | 1 | 0 |
| 17.03.2021 | Günlük | 1 | 0 |
| 18.03.2021 | Günlük | 1 | 0 |
| 19.03.2021 | Günlük | 1 | 0 |
| 22.03.2021 | Günlük | 1 | 0 |
| 23.03.2021 | Günlük | 1 | 0 |
| 24.03.2021 | Günlük | 1 | 0 |
| 25.03.2021 | Günlük | 1 | 0 |
| 26.03.2021 | Günlük | 1 | 0 |
| 29.03.2021 | Günlük | 1 | 0 |
| 30.03.2021 | Günlük | 1 | 0 |
| 31.03.2021 | Günlük | 1 | 0 |
| 01.04.2021 | Günlük | 1 | 0 |
| 02.04.2021 | Günlük | 1 | 0 |
| 05.04.2021 | Günlük | 1 | 0 |
| 06.04.2021 | Günlük | 1 | 0 |
| 07.04.2021 | Günlük | 1 | 0 |
| 08.04.2021 | Günlük | 1 | 0 |
| 09.04.2021 | Günlük | 1 | 0 |
| 12.04.2021 | Günlük | 1 | 0 |
| 13.04.2021 | Günlük | 1 | 0 |
| 14.04.2021 | Günlük | 1 | 0 |
| 15.04.2021 | Günlük | 1 | 0 |
| 16.04.2021 | Günlük | 1 | 0 |
| 19.04.2021 | Günlük | 1 | 0 |
| 20.04.2021 | Günlük | 1 | 0 |
| 21.04.2021 | Günlük | 1 | 0 |
| 22.04.2021 | Günlük | 1 | 0 |
| 26.04.2021 | Günlük | 1 | 0 |
| 27.04.2021 | Günlük | 1 | 0 |
| 28.04.2021 | Günlük | 1 | 0 |
| 29.04.2021 | Günlük | 1 | 0 |
| 30.04.2021 | Günlük | 1 | 0 |
| 03.05.2021 | Günlük | 1 | 0 |
| 04.05.2021 | Günlük | 1 | 0 |
| 05.05.2021 | Günlük | 1 | 0 |
| 06.05.2021 | Günlük | 1 | 0 |
| 07.05.2021 | Günlük | 1 | 0 |
| 10.05.2021 | Günlük | 1 | 0 |
