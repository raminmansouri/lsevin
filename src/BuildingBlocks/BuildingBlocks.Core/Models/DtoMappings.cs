using AutoMapper;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Dtos.Localization;

namespace BuildingBlocks.Core.Models;

/// <summary>
/// Represents the DTO mappings.
/// </summary>
public sealed class DtoMappings : Profile
{
    public DtoMappings()
    {
        // Coordinates mappings
        CreateMap<Coordinates, CoordinatesDto>();
        CreateMap<CoordinatesDto, Coordinates>().ConvertUsing(src => Coordinates.Of(src.Longitude, src.Latitude));

        // Address mappings
        CreateMap<Address, AddressDto>()
            .ForMember(
                dest => dest.Street,
                opt =>
                    opt.MapFrom(src =>
                        src.Street != null
                            ? new LocalizedContentDto(
                                src.Street.Translations.ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
                            )
                            : null
                    )
            )
            .ForMember(
                dest => dest.Detail,
                opt =>
                    opt.MapFrom(src =>
                        src.Detail != null
                            ? new LocalizedContentDto(
                                src.Detail.Translations.ToDictionary(kvp => kvp.Key, kvp => kvp.Value)
                            )
                            : null
                    )
            );

        CreateMap<AddressDto, Address>()
            .ConvertUsing(src =>
                Address.Of(
                    src.Country,
                    src.City,
                    src.Street != null ? LocalizedString.Create(src.Street.Translations) : null,
                    src.ZipCode,
                    src.Detail != null ? LocalizedString.Create(src.Detail.Translations) : null,
                    src.Coordinates != null ? Coordinates.Of(src.Coordinates.Longitude, src.Coordinates.Latitude) : null
                )
            );
    }
}
