using BuildingBlocks.Core.FileUpload.Extensions;
using BuildingBlocks.Core.FileUpload.Options;
using LSevin.Tests.Shared.XunitCategories;
using LSevin.UnitTests.Abstractions;

namespace LSevin.UnitTests.Core;

/// <summary>
/// Unit tests for <see cref="FileStorageBackendGuard"/> — the startup check that refuses a
/// storage configuration which would silently drop uploads.
/// </summary>
public class FileStorageBackendGuardTests : BaseUnitTest
{
    private static FileUploadOptions FileSystemOptions() =>
        new() { UploadDirectory = "UploadFiles", Backend = FileStorageBackend.FileSystem };

    private static FileUploadOptions MinioOptions(
        string serviceUrl = "http://minio:9000",
        string bucket = "lsevin-media",
        string accessKey = "access",
        string secretKey = "secret"
    ) =>
        new()
        {
            UploadDirectory = "UploadFiles",
            Backend = FileStorageBackend.Minio,
            S3 = new S3StorageOptions
            {
                ServiceUrl = serviceUrl,
                Bucket = bucket,
                AccessKey = accessKey,
                SecretKey = secretKey,
            },
        };

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Validate_FileSystemInProduction_Throws()
    {
        var act = () => FileStorageBackendGuard.Validate(FileSystemOptions(), isProduction: true);

        act.Should().Throw<InvalidOperationException>().WithMessage("*FILE_STORAGE_BACKEND*");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Validate_FileSystemOutsideProduction_DoesNotThrow()
    {
        var act = () => FileStorageBackendGuard.Validate(FileSystemOptions(), isProduction: false);

        act.Should().NotThrow();
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Validate_MinioWithFullCredentialsInProduction_DoesNotThrow()
    {
        var act = () => FileStorageBackendGuard.Validate(MinioOptions(), isProduction: true);

        act.Should().NotThrow();
    }

    [Theory]
    [CategoryTrait(TestCategory.Unit)]
    [InlineData("", "lsevin-media", "access", "secret", "ServiceUrl")]
    [InlineData("http://minio:9000", "  ", "access", "secret", "Bucket")]
    [InlineData("http://minio:9000", "lsevin-media", "", "secret", "AccessKey")]
    [InlineData("http://minio:9000", "lsevin-media", "access", "", "SecretKey")]
    public void Validate_MinioWithBlankSetting_ThrowsAndNamesIt(
        string endpoint,
        string bucket,
        string accessKey,
        string secretKey,
        string expectedName
    )
    {
        var options = MinioOptions(endpoint, bucket, accessKey, secretKey);

        var act = () => FileStorageBackendGuard.Validate(options, isProduction: true);

        act.Should().Throw<InvalidOperationException>().WithMessage($"*{expectedName}*");
    }

    [Fact]
    [CategoryTrait(TestCategory.Unit)]
    public void Validate_MinioWithBlankCredentials_IsRejectedOutsideProductionToo()
    {
        var options = MinioOptions(accessKey: "", secretKey: "");

        var act = () => FileStorageBackendGuard.Validate(options, isProduction: false);

        act.Should().Throw<InvalidOperationException>();
    }
}
