-- Kentico Custom tables uygulamasında tablo ve ItemGUID alanı oluşturulduktan sonra bir kez çalıştırın.
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.customtable_YkbCookieConsentDecision')
      AND name = N'UX_YkbCookieConsentDecision_ItemGUID'
)
BEGIN
    CREATE UNIQUE INDEX UX_YkbCookieConsentDecision_ItemGUID
        ON dbo.customtable_YkbCookieConsentDecision (ItemGUID);
END;
