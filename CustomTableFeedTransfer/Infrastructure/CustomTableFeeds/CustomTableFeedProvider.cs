using System;
using System.Collections.Generic;
using YkbYapikredi.Application.CustomTableFeeds;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class CustomTableFeedProvider : ICustomTableFeedProvider
{
    private readonly IReadOnlyDictionary<string, ICustomTableFeedSource> sources;
    public CustomTableFeedProvider(IEnumerable<ICustomTableFeedSource> registrations)
    {
        var dictionary = new Dictionary<string, ICustomTableFeedSource>(StringComparer.OrdinalIgnoreCase);
        foreach (var source in registrations)
        {
            if (string.IsNullOrWhiteSpace(source.Key) || !dictionary.TryAdd(source.Key, source))
                throw new InvalidOperationException($"Geçersiz veya tekrarlanan feed anahtarı: {source.Key}");
        }
        sources = dictionary;
    }
    public ICustomTableFeedContent Load(string key, int pageSize = 0)
    {
        if (!sources.TryGetValue(key.Trim(), out var source))
            throw new InvalidOperationException($"Custom table feed kaydı bulunamadı: {key}");
        return source.Load(Math.Max(0, pageSize));
    }
}
