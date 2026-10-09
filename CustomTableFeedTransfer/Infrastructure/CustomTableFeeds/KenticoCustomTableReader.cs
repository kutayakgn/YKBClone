using System;
using System.Collections.Generic;
using System.Linq;
using CMS.CustomTables;
using CMS.DataEngine;

namespace YkbYapikredi.Infrastructure.CustomTableFeeds;

public sealed class KenticoCustomTableReader
{
    public IReadOnlyList<CustomTableItem> Read(string className)
    {
        // The class name comes exclusively from registered code sources.
        var dataClass = DataClassInfoProvider.GetDataClassInfo(className);
        if (dataClass is null || !dataClass.ClassIsCustomTable)
            throw new InvalidOperationException($"Custom table bulunamadı: {className}");
        return CustomTableItemProvider.GetItems(className)
            .OrderBy("ItemID")
            .ToArray();
    }
}
