namespace BuildingBlocks.Core.Domain.Primitives;

/// <summary>
/// Represents the attribute for ignoring a member.
/// </summary>
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public sealed class IgnoreMemberAttribute : Attribute;
