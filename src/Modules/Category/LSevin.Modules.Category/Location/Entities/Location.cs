using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.Location.Enumerations;
using LSevin.Modules.Category.Location.ValueObjects;

namespace LSevin.Modules.Category.Location.Entities;

public sealed class Location : AggregateRoot<LocationId>
{
    #region Constructors

    private Location()
    {
        Code = string.Empty;
        Value = LocalizedString.Create("en-US", string.Empty);
        _cities = new List<Location>();
        _locationTypeId = 0;
    }

    private Location(string code, LocalizedString value, LocationType locationType, LocationId? parentId = null)
    {
        Id = LocationId.Create(IdGenerator.NewId());
        Code = code;
        Value = value;
        _locationTypeId = locationType.Id;
        ParentId = parentId;
        _cities = new List<Location>();
    }

    #endregion

    #region Properties

    public string Code { get; private set; }
    public LocalizedString Value { get; private set; }
    public int? DisplayOrder { get; private set; }

    private readonly int _locationTypeId;
    public LocationType? LocationType { get; private set; }
    public LocationId? ParentId { get; private set; }

    public IReadOnlyCollection<Location> Cities => _cities.AsReadOnly();
    private readonly List<Location> _cities;

    #endregion

    #region Methods

    public static Location CreateCountry(string code, LocalizedString value)
    {
        Guard.Against.NullOrEmpty(code, nameof(code));
        Guard.Against.Null(value, nameof(value));

        return new Location(code, value, LocationType.Country);
    }

    public static Location CreateCity(string code, LocalizedString value, LocationId countryId)
    {
        Guard.Against.NullOrEmpty(code, nameof(code));
        Guard.Against.Null(value, nameof(value));
        Guard.Against.Null(countryId, nameof(countryId));

        return new Location(code, value, LocationType.City, countryId);
    }

    public int GetLocationTypeId() => _locationTypeId;

    #endregion
}
