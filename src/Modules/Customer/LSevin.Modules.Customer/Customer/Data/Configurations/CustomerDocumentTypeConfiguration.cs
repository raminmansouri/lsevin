using BuildingBlocks.Core.Persistence.Contracts;
using BuildingBlocks.Core.Persistence.Extensions;
using BuildingBlocks.Core.Types;
using LSevin.Modules.Customer.Customer.Enumerations;
using LSevin.Modules.Customer.Infrastructure.Data.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LSevin.Modules.Customer.Customer.Data.Configurations;

internal sealed class CustomerDocumentTypeConfiguration
    : EntityConfigConfigurationContracts<CustomerDocumentType>,
        IEntityTypeConfiguration<CustomerDocumentType>
{
    public void Configure(EntityTypeBuilder<CustomerDocumentType> builder) => builder.Tap(ConfigDataStructure);

    #region Overrides

    public override void ConfigDataStructure(EntityTypeBuilder<CustomerDocumentType> builder)
    {
        builder.ConfigureEnumeration(
            tableName: nameof(CustomerDocumentType),
            schemaName: CustomerContext.DefaultSchema
        );
    }

    #endregion
}
