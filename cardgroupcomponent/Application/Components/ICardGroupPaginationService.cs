using System;

namespace YkbYapikredi.Application.Components;

public interface ICardGroupPaginationService
{
    CardGroupComponentModel? GetPage(Guid groupId, string culture, int page);
}
