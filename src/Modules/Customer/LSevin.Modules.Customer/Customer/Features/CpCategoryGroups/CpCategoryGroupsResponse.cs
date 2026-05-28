using BuildingBlocks.Core.Models;
using LSevin.Modules.Customer.Customer.Features.Explore;

namespace LSevin.Modules.Category.ServiceProvider.Features.GetServiceProviderByIdPublic;


public sealed record CpCategoryGroupsResponse
{
    public List<CpGroup> CategoryGroups { get; internal set; }
}

public sealed record CpGroup

{
    public string Title { get; internal set; }
    public List<CpCategory> Categories { get; internal set; }
}

<<<<<<< HEAD


public sealed record CpCategory
=======
public sealed record CpCategory

>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
{
    public string Name { get; internal set; }
    public string Image { get; internal set; }
    public int Count { get; internal set; }
    public string Gradient { get; internal set; }
<<<<<<< HEAD
    public int CategoryId { get; internal set; }
}
=======
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
