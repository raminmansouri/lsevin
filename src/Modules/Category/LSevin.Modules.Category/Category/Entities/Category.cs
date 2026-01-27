using Ardalis.GuardClauses;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.ValueObjects;
using BuildingBlocks.Core.Generators;
using LSevin.Modules.Category.Category.Rule;
using LSevin.Modules.Category.Category.ValueObjects;

namespace LSevin.Modules.Category.Category.Entities;

public sealed class Category : AggregateRoot<CategoryId>
{
    #region Constructors

    private Category()
    {
        Name = null!;
        Description = null!;
        IsActive = true;
        DisplayOrder = 0;
        _children = [];
    }

    private Category(
        Guid id,
        LocalizedString name,
        LocalizedString description,
        CategoryId? parentId,
        int displayOrder,
        bool isActive,
        string? iconUrl,
        IReadOnlyCollection<Category> children
    )
        : this()
    {
        Id = CategoryId.Create(id);
        Name = name;
        Description = description;
        ParentId = parentId;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        IconUrl = iconUrl;
        _children = [.. children];
    }

    #endregion

    #region Properties

    public LocalizedString Name { get; private set; }
    public LocalizedString Description { get; private set; }
    public CategoryId? ParentId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; }
    public string? IconUrl { get; private set; }
    public IReadOnlyCollection<Category> Children => _children.AsReadOnly();
    private readonly List<Category> _children;

    #endregion

    #region Methods

    public static Category Create(
        LocalizedString name,
        LocalizedString description,
        CategoryId? parentId = null,
        int displayOrder = 0,
        bool isActive = true,
        string? iconUrl = null
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.OutOfRange(displayOrder, nameof(displayOrder), 0, int.MaxValue);

        var id = IdGenerator.NewId();
        var category = new Category(id, name, description, parentId, displayOrder, isActive, iconUrl, []);

        return category;
    }

    public void Update(
        LocalizedString name,
        LocalizedString description,
        int displayOrder,
        bool isActive,
        string? iconUrl
    )
    {
        Guard.Against.Null(name, nameof(name));
        Guard.Against.Null(description, nameof(description));
        Guard.Against.OutOfRange(displayOrder, nameof(displayOrder), 0, int.MaxValue);

        Name = name;
        Description = description;
        DisplayOrder = displayOrder;
        IsActive = isActive;
        IconUrl = iconUrl;
    }

    public void ChangeParent(CategoryId? newParentId)
    {
        if (newParentId is not null)
        {
            CheckRule(new CategoryCannotBeItsOwnParentRule(Id, newParentId));
        }

        ParentId = newParentId;
    }

    public void AddChild(Category child)
    {
        Guard.Against.Null(child, nameof(child));

        CheckRule(new CategoryMustHaveThisParentRule(Id, child.ParentId));
        CheckRule(new CategoryMustNotHaveDuplicateChildRule(_children, child.Id));

        _children.Add(child);
    }

    public void RemoveChild(CategoryId childId)
    {
        Guard.Against.Null(childId, nameof(childId));

        CheckRule(new CategoryChildMustExistRule(_children, childId));

        var child = _children.First(c => c.Id == childId);
        _children.Remove(child);
    }

    public void ChangeActivation(bool isActive)
    {
        IsActive = isActive;
    }

    public void DeleteApproval()
    {
        CheckRule(new CategoryWithChildrenCannotBeDeletedRule(_children));
    }

    #endregion
}
