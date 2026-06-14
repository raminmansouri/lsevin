using BuildingBlocks.Core.Domain.Constants;
using BuildingBlocks.Core.ErrorHandling;
using BuildingBlocks.Core.Extensions;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Resources;
using FluentValidation;

namespace BuildingBlocks.Validation.Common;

/// <summary>
/// Validates the <see cref="IPageRequest"/> before it's processed by command validators.
/// </summary>
public sealed class PageRequestValidator : AbstractValidator<IPageRequest>
{
    /// <summary>
    /// Initializes a new instance of the <see cref="PageRequestValidator"/> class.
    /// </summary>
    public PageRequestValidator()
    {
        RuleFor(r => r.PageNumber)
            .GreaterThanOrEqualTo(GlobalDomainConstValues.NaturalNumberMinue)
            .WithMessage(
                AppError.GreaterThanOrEqualToMessage(SharedResource.Page, GlobalDomainConstValues.NaturalNumberMinue)
            );

        RuleFor(r => r.PageSize)
            .GreaterThanOrEqualTo(GlobalDomainConstValues.NaturalNumberMinue)
            .WithMessage(
                AppError.GreaterThanOrEqualToMessage(
                    SharedResource.Page_Size,
                    GlobalDomainConstValues.NaturalNumberMinue
                )
            )
            .LessThanOrEqualTo(PageConstants.MaxPageSize)
            .WithMessage(AppError.MaxLengthMessage(SharedResource.Page_Size, maxLength: PageConstants.DefaultPageSize));

        // Add validation for date range
        When(
            x => x.StartDate.HasValue,
            () =>
            {
                RuleFor(x => x.EndDate)
                    .GreaterThanOrEqualTo(x => x.StartDate)
                    .When(x => x.EndDate.HasValue)
                    .WithMessage(
                        SharedResource.Greater_Or_Equal_Error_Message.FormatWithStr(
                            SharedResource.Start_Date,
                            SharedResource.End_Date
                        )
                    );
            }
        );
    }
}
