using AutoMapper;
using BuildingBlocks.Core.Messaging.Queries.Paging;
using BuildingBlocks.Core.Persistence.Extensions;
using LSevin.Modules.Identity.Identity.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PhoneNumbers;
using Sieve.Services;

namespace LSevin.Modules.Identity.Infrastructure.Extensions;

/// <summary>
/// Extension methods for <see cref="UserManager{TUser}"/>.
/// </summary>
public static class UserManagerExtensions
{
    /// <summary>
    /// Finds all users with roles.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A list of users with roles.</returns>
    public static async Task<IReadOnlyList<ApplicationUser>> FindAllUserWithRoleAsync(
        this UserManager<ApplicationUser> userManager,
        CancellationToken cancellationToken = default
    )
    {
        return await userManager
            .Users.Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .ToListAsync(cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Finds all users with roles by page.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="request">The page request.</param>
    /// <param name="mapper">The mapper.</param>
    /// <param name="sieveProcessor">The sieve processor.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <typeparam name="TResult">The type of the result.</typeparam>
    /// <returns>A list of users with roles.</returns>
    public static async Task<IPageList<TResult>> FindAllUsersByPageAsync<TResult>(
        this UserManager<ApplicationUser> userManager,
        IPageRequest request,
        IMapper mapper,
        ISieveProcessor sieveProcessor,
        CancellationToken cancellationToken
    )
        where TResult : class
    {
        // https://benjii.me/2018/01/expression-projection-magic-entity-framework-core/
        // we don't use include for loading nested navigation because with mapping we load them explicitly
        return await userManager
            .Users.OrderByDescending(x => x.CreatedAt)
            .AsNoTracking()
            .ApplyPagingAsync<ApplicationUser, TResult>(
                request,
                sieveProcessor,
                mapper.ConfigurationProvider,
                cancellationToken: cancellationToken
            );
    }

    /// <summary>
    /// Finds user with role by id.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="userId">The user identifier.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user with role.</returns>
    public static async Task<ApplicationUser?> FindUserWithRoleByIdAsync(
        this UserManager<ApplicationUser> userManager,
        Guid userId,
        CancellationToken cancellationToken = default
    )
    {
        return await userManager
            .Users.Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(x => x.AccessTokens)
            .Include(x => x.RefreshTokens)
            .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Finds user with role by username.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="userName">The username.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user with role.</returns>
    public static async Task<ApplicationUser?> FindUserWithRoleByUserNameAsync(
        this UserManager<ApplicationUser> userManager,
        string userName,
        CancellationToken cancellationToken = default
    )
    {
        return await userManager
            .Users.Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(x => x.AccessTokens)
            .Include(x => x.RefreshTokens)
            .FirstOrDefaultAsync(x => x.UserName == userName, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Finds user with role by email.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="email">The email.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user with role.</returns>
    public static async Task<ApplicationUser?> FindUserWithRoleByEmailAsync(
        this UserManager<ApplicationUser> userManager,
        string email,
        CancellationToken cancellationToken = default
    )
    {
        return await userManager
            .Users.Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(x => x.RefreshTokens)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken: cancellationToken);
    }

    /// <summary>
    /// Finds user with role by phone number.
    /// </summary>
    /// <param name="userManager">The user manager.</param>
    /// <param name="phoneNumber">The phone number.</param>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The user with role.</returns>
    public static async Task<ApplicationUser?> FindUserWithRoleByPhoneNumberAsync(
        this UserManager<ApplicationUser> userManager,
        string phoneNumber,
        CancellationToken cancellationToken = default
    )
    {
        try
        {
            var phoneNumberUtil = PhoneNumberUtil.GetInstance();
            var parsedNumber = phoneNumberUtil.Parse(phoneNumber, "IR");

            // Get country code and national number separately
            var countryCode = phoneNumberUtil.GetRegionCodeForNumber(parsedNumber);
            var nationalNumber = parsedNumber.NationalNumber.ToString();

            return await userManager
                .Users.Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Include(x => x.RefreshTokens)
                .FirstOrDefaultAsync(
                    x => x.PhoneNumber == nationalNumber && x.PhoneNumberCountryCode == countryCode,
                    cancellationToken: cancellationToken
                );
        }
        catch (NumberParseException e)
        {
            Console.WriteLine(e);
            return null;
        }
    }
}
