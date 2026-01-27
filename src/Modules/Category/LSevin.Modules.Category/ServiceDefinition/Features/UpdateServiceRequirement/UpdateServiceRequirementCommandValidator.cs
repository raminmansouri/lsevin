using FluentValidation;

namespace LSevin.Modules.Category.ServiceDefinition.Features.UpdateServiceRequirement;

internal sealed class UpdateServiceRequirementCommandValidator : AbstractValidator<UpdateServiceRequirementCommand>
{
    public UpdateServiceRequirementCommandValidator()
    {
        RuleFor(x => x.ServiceDefinitionId).NotEmpty();

        RuleFor(x => x.RequirementIndex).GreaterThanOrEqualTo(0);

        RuleFor(x => x.Description)
            .NotNull()
            .Must(dto => dto.Translations.Any(t => !string.IsNullOrWhiteSpace(t.Value)))
            .WithMessage("At least one description translation is required");
    }
}
