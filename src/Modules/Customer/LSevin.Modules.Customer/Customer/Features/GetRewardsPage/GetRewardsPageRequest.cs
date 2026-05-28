using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LSevin.Modules.Customer.Customer.Features.GetRewardsPage
{
    public sealed record GetRewardsPageRequest
    {
        public long[]? priceRange { get; set; }
        public long? distance { get; set; }
        public long? minRating { get; set; }
        public bool? verifiedOnly { get; set; }
        public string[]? languages { get; set; }
        public string? responseTime { get; set; }
    }
}
