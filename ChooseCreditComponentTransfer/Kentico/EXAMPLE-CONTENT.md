# Referans sayfa için CMS kayıtları

Kaynak: [Yapı Kredi / Kredini Seç](https://www.yapikredi.com.tr/kredi/konut-kredisi/kredini-sec), 30 Ekim 2026 tarihinde incelenen akış. Aşağıdaki kayıtları alan code name'leriyle oluşturun. Aynı örneğin makine tarafından okunabilen hali `Preview/flow.json` dosyasındadır; bu dosya Kentico import/export paketi değildir.

## Component

Page type: `YkbYapikredi.ChooseCreditComponent`

| Alan | Değer |
| --- | --- |
| `Name` | Kredini Seç |
| `StartQuestionKey` | amac |
| `ContinueButtonText` | Devam |
| `SelectionRequiredMessage` | Lütfen bir seçenek seçin. |
| `ConfigurationErrorMessage` | Kredi seçim adımları şu anda görüntülenemiyor. |

## Soru 1 — amac

Component'in doğrudan altına `YkbYapikredi.ChooseCreditQuestion` oluşturun:

| Alan | Değer |
| --- | --- |
| `Name` | Kredi alma amacı |
| `QuestionKey` | amac |
| `Heading` | Gelin size en uygun krediyi birlikte belirleyelim! |
| `Description` | Koşullarınıza özel krediyi belirlememiz için birkaç kısa sorumuz olacak. |
| `QuestionText` | Krediyi hangi amaçla almayı düşünüyorsunuz? |

Bu sorunun doğrudan altına üç `YkbYapikredi.ChooseCreditAnswer` ekleyin; sırayı aşağıdaki gibi tutun. `—` gösterilen alanları boş bırakın.

| Sıra | Text | ActionType | NextQuestionKey | RedirectUrl |
| --- | --- | --- | --- | --- |
| 1 | Oturma / Yatırım amaçlı ev almak için | question | ihtiyac | — |
| 2 | Başka bankadaki kredimi getirmek için | redirect | — | /kredi/konut-kredisi/ailem-sagolsun-mortgage |
| 3 | Mevcut evimin de teminatı ile kredi almak için | redirect | — | /kredi/konut-kredisi/yuzde-yuz-mortgage |

**Kaynak davranışı:** İkinci cevabın kaynak sayfadaki `data-url` değeri `ailem-sagolsun-mortgage` idi. Bu örnek aynı hedefi kullanır. “Başka bankadaki kredimi getirmek” için ürününüzün istediği hedef Transfer Mortgage ise bu kaydın `RedirectUrl` değerini `/kredi/konut-kredisi/transfer-mortgage` yapın. Metne bakarak kaynak yönlendirmesi değiştirilmemiştir.

## Soru 2 — ihtiyac

Yine component'in doğrudan altına, ilk sorunun kardeşi olarak `YkbYapikredi.ChooseCreditQuestion` oluşturun:

| Alan | Değer |
| --- | --- |
| `Name` | Kredini Seç |
| `QuestionKey` | ihtiyac |
| `Heading` | Boş |
| `Description` | Boş |
| `QuestionText` | Boş |

Sayfanın dışındaki “Kredini Seç” ana başlığı component'e yeniden girilmez. Bu sorunun altına sekiz cevap ekleyin. Hepsinde `ActionType=redirect`, `NextQuestionKey` boş olmalıdır.

| Sıra | Text | RedirectUrl |
| --- | --- | --- |
| 1 | Satın almak istediğim konut A ve B sınıfı Enerji Kimlik Belgesine sahip. | /kredi/konut-kredisi/doga-dostu-mortgage |
| 2 | Ailemin desteği ve mevcut birikimlerini kullanarak ilk defa konut sahibi olacağım. | /kredi/konut-kredisi/ailem-sagolsun-mortgage |
| 3 | Mevcut evimin satışını beklemeden yeni evimi satın almak istiyorum. | /kredi/konut-kredisi/ev-degistiren-mortgage |
| 4 | Ev alırken yapacağım harcamaları (tahsis ücreti, DASK, Konut/ Hayat sigortası primleri, ekspertiz ücreti, ipotek tesis ücreti, emlakçı komisyonu vb.) kredilendirmek istiyorum. | /kredi/konut-kredisi/anahtar-teslim-mortgage |
| 5 | Evi müşterek tapulu olarak satın alıp ve kredi ödemelerimi arkadaş, kardeş, akraba ya da eşimle beraber yapmak istiyorum. | /kredi/konut-kredisi/ev-beraber-mortgage |
| 6 | Yurtdışında yaşıyorum ve Türkiye’de ev sahibi olmak istiyorum. | /kredi/konut-kredisi/yurtdisinda-yerlesikler-icin-mortgage |
| 7 | Taksit tutarlarımın zamanla azalmasını istiyorum. | /kredi/konut-kredisi/esit-anapara-odemeli-mortgage |
| 8 | Taksitlerim tüm vadelerde eşit kalsın istiyorum. | /kredi/konut-kredisi/sabit-taksitli-mortgage |

İkinci adımdaki kaynak adresler tam `https://www.yapikredi.com.tr/...` biçimindedir. Örnekte aynı yollar `/...` olarak verilmiştir; böylece aktarım yapılan host üzerinde aynı içerik sayfalarına gider. Mutlaka canlı Yapı Kredi alan adına yönlendirmek istiyorsanız tam kaynak URL'yi girin.

## Üçüncü soru ekleme örneği

Component altında `QuestionKey=odeme` olan üçüncü bir soru oluşturabilirsiniz. İkinci sorudaki istediğiniz cevabı `ActionType=question`, `NextQuestionKey=odeme`, `RedirectUrl` boş olacak şekilde güncelleyin. Yeni sorunun cevaplarına hedef URL'leri girin. Soru/cevap adedi ve bu dalın uzunluğu için view veya JavaScript değişmez.
