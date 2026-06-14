using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;
using BuildingBlocks.Core.Domain.Data;
using BuildingBlocks.Core.Domain.Primitives;
using BuildingBlocks.Core.Domain.Services;
using BuildingBlocks.Core.Domain.Specification;
using BuildingBlocks.Core.Messaging.Commands;
using BuildingBlocks.Core.Messaging.Events;
using BuildingBlocks.Core.Messaging.Queries;
using BuildingBlocks.Web.Endpoints;
using FluentValidation;
using MediatR;
using NetArchTest.Rules;

namespace LSevin.Tests.Shared.Extensions;

/// <summary>
/// Extensions for the <see cref="Microsoft.VisualStudio.TestPlatform.ObjectModel.TestResult"/> class.
/// </summary>
public static class TestResultExtensions
{
    /// <summary>
    /// Asserts that the types are immutable and have only private constructors.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertAreImmutable(this IEnumerable<Type> types)
    {
        types
            .Where(type =>
                type.GetFields(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
                    .Any(x => !x.IsInitOnly)
                || type.GetProperties(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
                    .Any(x =>
                        x.SetMethod is { IsPublic: true, IsFinal: false }
                        && !x.SetMethod.ReturnParameter.GetRequiredCustomModifiers().Contains(typeof(IsExternalInit))
                    )
            )
            .AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that the types have only private constructors.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertHavePrivateConstructorsOnly(this IEnumerable<Type> types)
    {
        var failingTypes = types
            .Where(type =>
                type.GetConstructors(BindingFlags.Public | BindingFlags.Instance).Length != 0
                || type.GetConstructors(BindingFlags.NonPublic | BindingFlags.Instance).All(c => !c.IsPrivate)
            )
            .ToList();

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that the types only have private setters.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertOnlyHavePrivateOrInitSetters(this IEnumerable<Type> types)
    {
        var failingTypes = types
            .Where(type =>
                type.GetProperties(BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic)
                    .Any(prop =>
                        prop.SetMethod != null
                        && !prop.SetMethod.IsPrivate
                        && !prop.SetMethod.ReturnParameter.GetRequiredCustomModifiers().Contains(typeof(IsExternalInit))
                    )
            )
            .ToList();

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that the test result is successful.
    /// </summary>
    /// <param name="result">The result.</param>
    public static void ShouldBeSuccessful(this TestResult result)
    {
        result.FailingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that the types have a private parameterless constructor.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertHavePrivateParameterlessConstructor(this IEnumerable<Type> types)
    {
        var failingTypes = types
            .Where(type =>
                !type.GetConstructors(BindingFlags.NonPublic | BindingFlags.Instance)
                    .Any(c => c.IsPrivate && c.GetParameters().Length == 0)
            )
            .ToList();

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that the entities do not reference other aggregate roots.
    /// </summary>
    /// <param name="types">The types to check.</param>
    /// <param name="preventedTypes">The list of prevented types.</param>
    public static void AssertDoNotReferenceOtherTypes(this IList<Type> types, IList<Type> preventedTypes)
    {
        const BindingFlags bindingFlags = BindingFlags.DeclaredOnly | BindingFlags.NonPublic | BindingFlags.Instance;

        var failingTypes = types
            .Where(type =>
                type.GetFields(bindingFlags)
                    .Any(field =>
                        preventedTypes.Contains(field.FieldType)
                        || field.FieldType.GenericTypeArguments.Any(preventedTypes.Contains)
                    )
                || type.GetProperties(bindingFlags)
                    .Any(property =>
                        preventedTypes.Contains(property.PropertyType)
                        || property.PropertyType.GenericTypeArguments.Any(preventedTypes.Contains)
                    )
            )
            .ToList();

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Asserts that repositories only exist for the specified types.
    /// </summary>
    /// <param name="types">The current types.</param>
    /// <param name="allowedTypes">The types allowed to have repositories.</param>
    /// <param name="name">The name of the type.</param>
    public static void AssertOnlyExistForSpecificTypesByName(
        this IEnumerable<Type> types,
        IEnumerable<string> allowedTypes,
        string name
    )
    {
        var names = types.Select(t => t.Name.Replace(name, string.Empty, StringComparison.Ordinal)).ToList();

        var invalidTypes = names.Except(allowedTypes).ToList();

        invalidTypes.Should().BeEmpty($"current types {string.Join(", ", invalidTypes)} exist for target types");
    }

    /// <summary>
    /// Asserts that the enumeration types inherit from Enumeration and have static readonly fields.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertHaveStaticData(this IList<Type> types)
    {
        foreach (var type in types)
        {
            var staticReadOnlyFields = type.GetFields(BindingFlags.Public | BindingFlags.Static)
                .Where(f => f.IsInitOnly && f.FieldType == type)
                .ToList();

            staticReadOnlyFields
                .Should()
                .NotBeEmpty(
                    $"{
                        type.Name
                    } should have at least one public static readonly field of its own type"
                );

            foreach (var field in staticReadOnlyFields)
            {
                field
                    .GetValue(null)
                    .Should()
                    .NotBeNull($"Static readonly field {field.Name} in {type.Name} should be initialized");
            }
        }

        types.Should().NotBeEmpty("There should be at least one type in the assembly");
    }

    /// <summary>
    /// Asserts that the types have a public static Create method.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertHaveStaticCreateMethod(this IEnumerable<Type> types)
    {
        var failingTypes = types
            .Where(type =>
            {
                var createMethod = type.GetMethod(
                    "Create",
                    BindingFlags.Public | BindingFlags.Static | BindingFlags.NonPublic
                );

                return createMethod == null;
            })
            .ToList();

        failingTypes
            .Should()
            .BeEmpty(
                because: "{0} should have a public static Create method",
                string.Join(", ", failingTypes.Select(t => t.Name))
            );
    }

    /// <summary>
    /// Asserts that the types have a constructor with the JsonConstructorAttribute.
    /// </summary>
    /// <param name="types">The types to assert.</param>
    public static void AssertHaveConstructorWithJsonConstructorAttribute(this IEnumerable<Type> types)
    {
        List<Type> failingTypes = [];

        failingTypes.AddRange(
            from type in types
            let constructors = type.GetConstructors(
                BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance
            )
            let hasJsonConstructorDefined = constructors
                .Select(constructorInfo =>
                    constructorInfo.GetCustomAttributes(typeof(JsonConstructorAttribute), inherit: false)
                )
                .Any(jsonConstructorAttribute => jsonConstructorAttribute.Length > 0)
            where !hasJsonConstructorDefined
            select type
        );

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Filters types that implement IRequestHandler but not the specified handler interfaces.
    /// </summary>
    /// <param name="types">The types to filter.</param>
    /// <param name="handlerInterfaces">The handler interfaces to check against.</param>
    public static void AssertOnlyHaveRequestHandlers(this IEnumerable<Type> types, params Type[] handlerInterfaces)
    {
        List<Type> failingTypes = [];

        failingTypes.AddRange(
            types.Where(type =>
            {
                var implementsRequestHandler = type.GetInterfaces()
                    .Any(x => x.IsGenericType && x.GetGenericTypeDefinition() == typeof(IRequestHandler<,>));

                var implementsSpecificHandler = handlerInterfaces.Any(handlerInterface =>
                    type.GetInterfaces().Any(x => x.IsGenericType && x.GetGenericTypeDefinition() == handlerInterface)
                );

                return implementsRequestHandler && !implementsSpecificHandler;
            })
        );

        failingTypes.AssertFailingTypes();
    }

    /// <summary>
    /// Predicts types that are entities based on interface implementation or inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be entities.</returns>
    public static PredicateList PredictEntities(this Predicates predicates)
    {
        return predicates
            .Inherit(typeof(Entity))
            .And()
            .AreNotAbstract()
            .Or()
            .Inherit(typeof(Entity<>))
            .And()
            .AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are value objects based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be value objects.</returns>
    public static PredicateList PredictValueObjects(this Predicates predicates)
    {
        return predicates.Inherit(typeof(ValueObject)).And().AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are aggregate roots based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be aggregate roots.</returns>
    public static PredicateList PredictAggregateRoots(this Predicates predicates)
    {
        return predicates.Inherit(typeof(AggregateRoot<>)).And().AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are specifications based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be specifications.</returns>
    public static PredicateList PredictSpecifications(this Predicates predicates)
    {
        return predicates
            .Inherit(typeof(SpecificationBase<,>))
            .And()
            .AreNotAbstract()
            .Or()
            .Inherit(typeof(SpecificationBase<,,>))
            .And()
            .AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are business rules based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be business rules.</returns>
    public static PredicateList PredictBusinessRules(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IBusinessRule));
    }

    /// <summary>
    /// Predicts types that are domain events based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be domain events.</returns>
    public static PredicateList PredictDomainEvents(this Predicates predicates)
    {
        return predicates.Inherit(typeof(DomainEvent)).And().AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are domain event handlers based on interface implementation.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be domain event handlers.</returns>
    public static PredicateList PredictDomainEventHandlers(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IDomainEventHandler<>));
    }

    /// <summary>
    /// Predicts types that are domain services based on interface implementation.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be domain services.</returns>
    public static PredicateList PredictDomainServices(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IDomainService));
    }

    /// <summary>
    /// Predicts types that are repositories based on interface implementation.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be repositories.</returns>
    public static PredicateList PredictRepositories(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IRepository<,>));
    }

    /// <summary>
    /// Predicts types that are typed IDs based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be typed IDs.</returns>
    public static PredicateList PredictTypedIds(this Predicates predicates)
    {
        return predicates.Inherit(typeof(TypedIdValueBase));
    }

    /// <summary>
    /// Predicts types that are domain objects based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be domain objects.</returns>
    public static PredicateList PredictDomainObjects(this Predicates predicates)
    {
        return predicates.PredictEntities().Or().PredictValueObjects().Or().PredictAggregateRoots();
    }

    /// <summary>
    /// Predicts types that are commands based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be commands.</returns>
    public static PredicateList PredictCommands(this Predicates predicates)
    {
        return predicates
            .Inherit(typeof(Command<>))
            .And()
            .AreNotAbstract()
            .Or()
            .ImplementInterface(typeof(ICommand<>))
            .And()
            .AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are commands based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be commands.</returns>
    public static PredicateList PredictCommandHandlers(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(ICommandHandler<,>)).And().AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are queries based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be queries.</returns>
    public static PredicateList PredictQueries(this Predicates predicates)
    {
        return predicates
            .ImplementInterface(typeof(IQuery<>))
            .And()
            .AreNotAbstract()
            .Or()
            .Inherit(typeof(Query<>))
            .And()
            .AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are query handlers based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be query handlers.</returns>
    public static PredicateList PredictQueryHandlers(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IQueryHandler<,>)).And().AreNotAbstract();
    }

    /// <summary>
    /// Predicts types that are validators based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be validators.</returns>
    public static PredicateList PredictValidators(this Predicates predicates)
    {
        return predicates.Inherit(typeof(AbstractValidator<>));
    }

    /// <summary>
    /// Predicts types that are endpoints based on inheritance.
    /// </summary>
    /// <param name="predicates">The predicates to filter.</param>
    /// <returns>A filtered set of types that are predicted to be endpoints.</returns>
    public static PredicateList PredictEndpoints(this Predicates predicates)
    {
        return predicates.ImplementInterface(typeof(IEndpointDefinition));
    }

    /// <summary>
    /// Asserts that the types are failing.
    /// </summary>
    /// <param name="types">The types.</param>
    public static void AssertFailingTypes(this IEnumerable<Type> types)
    {
        types.Should().BeNullOrEmpty();
    }

    /// <summary>
    /// Asserts that the two objects are equivalent to each other with a custom date time comparison.
    /// </summary>
    /// <typeparam name="T">The type of the objects to compare.</typeparam>
    /// <param name="actual">The actual object.</param>
    /// <param name="expected">The expected object.</param>
    public static void ShouldBeEquivalentToWithCustomDateTime<T>(this T actual, T expected)
    {
        actual
            .Should()
            .BeEquivalentTo(
                expected,
                options =>
                    options
                        .Using<DateTime>(ctx =>
                            ctx.Subject.Should().BeCloseTo(ctx.Expectation, TimeSpan.FromSeconds(1))
                        )
                        .WhenTypeIs<DateTime>()
                        .Using<DateTimeOffset>(ctx =>
                            ctx.Subject.Should().BeCloseTo(ctx.Expectation, TimeSpan.FromSeconds(1))
                        )
                        .WhenTypeIs<DateTimeOffset>()
            );
    }
}
