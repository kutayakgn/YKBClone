SELECT
    SiteCodeName AS [Site],
    CAST(DecisionUtc AS date) AS [Gün (UTC)],
    PolicyVersion AS [Metin sürümü],
    COUNT_BIG(*) AS [Toplam karar],
    COUNT_BIG(CASE WHEN IsInitial = 1 THEN 1 END) AS [İlk karar],
    COUNT_BIG(CASE WHEN IsInitial = 0 THEN 1 END) AS [Değişiklik],
    COUNT_BIG(CASE WHEN Outcome = 'accepted' THEN 1 END) AS [Tümüne izin],
    COUNT_BIG(CASE WHEN Outcome = 'rejected' THEN 1 END) AS [Yalnızca zorunlu],
    COUNT_BIG(CASE WHEN Outcome = 'partial' THEN 1 END) AS [Kısmi izin],
    COUNT_BIG(CASE WHEN DecisionAction = 'custom' THEN 1 END) AS [Özel kaydetme],
    COUNT_BIG(CASE WHEN FunctionalAllowed = 1 THEN 1 END) AS [İşlevsellik izni],
    COUNT_BIG(CASE WHEN AnalyticsAllowed = 1 THEN 1 END) AS [Analytics izni],
    COUNT_BIG(CASE WHEN AdvertisingAllowed = 1 THEN 1 END) AS [Reklam izni]
FROM dbo.customtable_YkbCookieConsentDecision
GROUP BY SiteCodeName, CAST(DecisionUtc AS date), PolicyVersion
ORDER BY CAST(DecisionUtc AS date) DESC, SiteCodeName, PolicyVersion DESC;
