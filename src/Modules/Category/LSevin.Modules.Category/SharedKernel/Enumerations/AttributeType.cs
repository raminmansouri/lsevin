using System.Text.Json.Serialization;
using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.SharedKernel.Enumerations;

public sealed class AttributeType : Enumeration
{
    #region Seed

    public static readonly AttributeType Text = new(1, nameof(Text));
    public static readonly AttributeType Number = new(2, nameof(Number));
    public static readonly AttributeType DateTime = new(3, nameof(DateTime));
    public static readonly AttributeType Boolean = new(4, nameof(Boolean));
    public static readonly AttributeType Select = new(5, nameof(Select));
    public static readonly AttributeType MultiSelect = new(6, nameof(MultiSelect));
    public static readonly AttributeType Enum = new(7, nameof(Enum));
    public static readonly AttributeType Json = new(8, nameof(Json));

    #endregion

    #region Constructor

    [JsonConstructor]
    private AttributeType(int id, string name)
        : base(id, name) { }

    #endregion

    #region Methods

    /// <summary>
    /// Gets the name of the attribute type from its ID.
    /// </summary>
    /// <param name="attributeTypeId">The ID of the attribute type.</param>
    /// <returns>The name of the attribute type, or "Unknown" if the ID is not recognized.</returns>
    public static string GetNameFromId(int attributeTypeId)
    {
        return attributeTypeId switch
        {
            1 => Text.Name,
            2 => Number.Name,
            3 => DateTime.Name,
            4 => Boolean.Name,
            5 => Select.Name,
            6 => MultiSelect.Name,
            7 => Enum.Name,
            8 => Json.Name,
            _ => "Unknown",
        };
    }

    #endregion
}
