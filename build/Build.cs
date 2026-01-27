using System;
using System.IO;
using System.Linq;
using Nuke.Common;
using Nuke.Common.CI;
using Nuke.Common.CI.GitHubActions;
using Nuke.Common.Git;
using Nuke.Common.IO;
using Nuke.Common.ProjectModel;
using Nuke.Common.Tooling;
using Nuke.Common.Tools.Coverlet;
using Nuke.Common.Tools.DotNet;
using Nuke.Common.Utilities.Collections;
using static Nuke.Common.Tools.DotNet.DotNetTasks;

/// <summary>
/// Represents the build class for the project.
/// </summary>
[ShutdownDotNetAfterServerBuild]
[GitHubActions(
    "continuous",
    GitHubActionsImage.UbuntuLatest,
    OnPushBranches = ["main"],
    InvokedTargets = [nameof(CI)],
    CacheKeyFiles = ["**/global.json", "**/*.csproj", "**/package.json", "**/pnpm-lock.yaml"],
    CacheIncludePatterns = [".nuke/temp", "~/.nuget/packages", "~/.pnpm-store"],
    EnableGitHubToken = true,
    AutoGenerate = false
)]
class Build : NukeBuild
{
    /// <summary>
    /// Support plugins are available for:
    ///   - JetBrains ReSharper        https://nuke.build/resharper
    ///   - JetBrains Rider            https://nuke.build/rider
    ///   - Microsoft VisualStudio     https://nuke.build/visualstudio
    ///   - Microsoft VSCode           https://nuke.build/vscode
    /// </summary>
    public static int Main() => Execute<Build>(x => x.CI);

    /// <summary>
    /// Checks if the current branch is the main branch.
    /// </summary>
    /// <summary>
    /// Checks if the current branch is the main branch.
    /// </summary>
    bool IsMainBranch()
    {
        // First check GitHub Actions specific environment variables
        var githubRef = Environment.GetEnvironmentVariable("GITHUB_REF");
        var githubHeadRef = Environment.GetEnvironmentVariable("GITHUB_HEAD_REF");
        var githubEventName = Environment.GetEnvironmentVariable("GITHUB_EVENT_NAME");

        // We're in a GitHub workflow
        if (!string.IsNullOrEmpty(githubRef))
        {
            // For push events directly to main
            if (githubEventName == "push" && githubRef == "refs/heads/main")
            {
                return true;
            }

            // Check if we're in a workflow triggered by a PR merge to main
            // In a PR context, GITHUB_REF will be refs/pull/X/merge
            // After merge to main, the event is "push" and GITHUB_REF is refs/heads/main
            if (githubEventName == "push" && githubRef == "refs/heads/main" && string.IsNullOrEmpty(githubHeadRef))
            {
                return true;
            }

            // Not on main
            return false;
        }

        // Fallback to GitRepository check for local builds
        return GitRepository?.IsOnMainBranch() ?? false;
    }

    /// <summary>
    /// Gets or sets the build configuration. Defaults to Debug for local builds and Release for server builds.
    /// </summary>
    [Parameter("Configuration to build - Default is 'Debug' (local) or 'Release' (server)")]
    readonly Configuration Configuration = IsLocalBuild ? Configuration.Debug : Configuration.Release;

    /// <summary>
    /// Gets or sets the GitHub authentication token.
    /// </summary>
    [Parameter("GitHub token for authentication")]
    readonly string GitHubToken;

    /// <summary>
    /// Gets the solution file.
    /// </summary>
    [Solution(SuppressBuildProjectCheck = true)]
    readonly Solution Solution;

    /// <summary>
    /// Gets the Git repository information.
    /// </summary>
    [GitRepository]
    readonly GitRepository GitRepository;

    /// <summary>
    /// Gets the source directory path.
    /// </summary>
    AbsolutePath SourceDirectory => RootDirectory / "src";

    /// <summary>
    /// Gets the tests directory path.
    /// </summary>
    AbsolutePath TestsDirectory => RootDirectory / "tests";

    /// <summary>
    /// Gets the artifacts directory path.
    /// </summary>
    AbsolutePath ArtifactsDirectory => RootDirectory / "artifacts";

    /// <summary>
    /// Gets the test results directory path.
    /// </summary>
    AbsolutePath TestResultsDirectory => RootDirectory / "test-results";

    /// <summary>
    /// Gets the coverage report directory path.
    /// </summary>
    AbsolutePath CoverageReportDirectory => RootDirectory / "coverage-report";

    /// <summary>
    /// Gets the reports directory path.
    /// </summary>
    AbsolutePath ReportsDirectory => RootDirectory / "reports";

    /// <summary>
    /// Gets the webapp directory path.
    /// </summary>
    AbsolutePath WebappDirectory => RootDirectory / "frontend" / "webapp";

    /// <summary>
    /// Gets the version.
    /// </summary>
    /// <returns>The version.</returns>
    string GetVersion()
    {
        var result = ProcessTasks
            .StartProcess(
                "dotnet",
                "nbgv get-version -v Version",
                workingDirectory: RootDirectory,
                logger: (_, text) => Console.WriteLine(text)
            )
            .AssertZeroExitCode();

        return result.Output.FirstOrDefault().ToString() ?? "latest";
    }

    /// <summary>
    /// Cleans the build directories.
    /// </summary>
    Target Clean =>
        d =>
            d.Before(Restore)
                .Executes(() =>
                {
                    SourceDirectory.GlobDirectories("**/bin", "**/obj").ForEach(x => x.DeleteDirectory());

                    TestsDirectory.GlobDirectories("**/bin", "**/obj").ForEach(x => x.DeleteDirectory());

                    ArtifactsDirectory.CreateOrCleanDirectory();
                    TestResultsDirectory.CreateOrCleanDirectory();
                    CoverageReportDirectory.CreateOrCleanDirectory();
                    ReportsDirectory.CreateOrCleanDirectory();
                });

    /// <summary>
    /// Restores .NET tools.
    /// </summary>
    Target RestoreDotNetTools =>
        d =>
            d.Executes(() =>
            {
                DotNet($"tool restore");
            });

    /// <summary>
    /// Restores NuGet packages.
    /// </summary>
    Target Restore =>
        d =>
            d.DependsOn(Clean)
                .Executes(() =>
                {
                    DotNetRestore(s => s.SetProjectFile(Solution));
                });

    /// <summary>
    /// Compiles the solution.
    /// </summary>
    Target Compile =>
        d =>
            d.DependsOn(Restore)
                .Executes(() =>
                {
                    DotNetBuild(s => s.SetProjectFile(Solution).SetConfiguration(Configuration).EnableNoRestore());
                });

    /// <summary>
    /// Runs code formatting tools.
    /// </summary>
    Target Lint =>
        d =>
            d.DependsOn(Compile, RestoreDotNetTools)
                .Executes(() =>
                {
                    if (!IsLocalBuild)
                        return;

                    DotNet("csharpier format .");
                    DotNet($"format {Solution} style --verbosity diagnostic");
                    DotNet($"format {Solution} analyzers --verbosity diagnostic");
                });

    /// <summary>
    /// Verifies code formatting.
    /// </summary>
    Target LintCheck =>
        d =>
            d.DependsOn(Lint)
                .Executes(() =>
                {
                    DotNet("csharpier check .");

                    DotNet($"format {Solution} style --verify-no-changes --verbosity diagnostic");

                    DotNet($"format {Solution} analyzers --verify-no-changes --verbosity diagnostic");
                });

    /// <summary>
    /// Runs unit tests.
    /// </summary>
    Target UnitTests =>
        d =>
            d.DependsOn(LintCheck)
                .Executes(() =>
                {
                    var testProjects = Solution.AllProjects.Where(p => p.Name.EndsWith(".UnitTests"));

                    DotNetTest(s =>
                        s.SetProjectFile(Solution)
                            .SetConfiguration(Configuration)
                            .SetFilter("Category=Unit")
                            .SetNoBuild(true)
                            .SetNoRestore(true)
                            .ResetVerbosity()
                            .SetResultsDirectory(TestResultsDirectory)
                            .EnableCollectCoverage()
                            .SetCoverletOutputFormat(CoverletOutputFormat.cobertura)
                            .SetExcludeByFile("*.Generated.cs")
                            .EnableUseSourceLink()
                            .CombineWith(
                                testProjects,
                                (settings, project) =>
                                    settings
                                        .SetProjectFile(project)
                                        .AddLoggers($"trx;LogFileName={project.Name}.trx")
                                        .SetCoverletOutput(CoverageReportDirectory / $"{project.Name}.cobertura.xml")
                            )
                    );
                });

    /// <summary>
    /// Runs architecture tests.
    /// </summary>
    Target ArchitectureTests =>
        d =>
            d.DependsOn(LintCheck)
                .Executes(() =>
                {
                    var testProjects = Solution.AllProjects.Where(p => p.Name.EndsWith(".ArchitectureTests"));

                    DotNetTest(s =>
                        s.SetProjectFile(Solution)
                            .SetConfiguration(Configuration)
                            .SetFilter("Category=Architecture")
                            .SetNoBuild(true)
                            .SetNoRestore(true)
                            .ResetVerbosity()
                            .SetResultsDirectory(TestResultsDirectory)
                            .EnableCollectCoverage()
                            .SetCoverletOutputFormat(CoverletOutputFormat.cobertura)
                            .SetExcludeByFile("*.Generated.cs")
                            .EnableUseSourceLink()
                            .CombineWith(
                                testProjects,
                                (settings, project) =>
                                    settings
                                        .SetProjectFile(project)
                                        .AddLoggers($"trx;LogFileName={project.Name}.trx")
                                        .SetCoverletOutput(CoverageReportDirectory / $"{project.Name}.cobertura.xml")
                            )
                    );
                });

    /// <summary>
    /// Runs all tests.
    /// </summary>
    Target AllTests => d => d.DependsOn(UnitTests, ArchitectureTests).Triggers(CopyTestResults);

    /// <summary>
    /// Copies test results to output directories.
    /// </summary>
    Target CopyTestResults =>
        d =>
            d.DependsOn(AllTests)
                .Executes(() =>
                {
                    TestResultsDirectory.CreateDirectory();
                    CoverageReportDirectory.CreateDirectory();
                    ReportsDirectory.CreateDirectory();

                    TestsDirectory
                        .GlobFiles("**/*.trx")
                        .ForEach(x => x.CopyToDirectory(TestResultsDirectory, ExistsPolicy.FileOverwrite));

                    TestsDirectory
                        .GlobFiles("**/*.cobertura.xml")
                        .ForEach(x => x.CopyToDirectory(CoverageReportDirectory, ExistsPolicy.FileOverwrite));
                });

    /// <summary>
    /// Runs mutation tests.
    /// </summary>
    Target RunMutationTests =>
        d =>
            d.DependsOn(AllTests)
                .Executes(() =>
                {
                    var testProjects = Solution.AllProjects.Where(s => s.Name.EndsWith(".UnitTests"));

                    foreach (var testProject in testProjects)
                    {
                        DotNet(workingDirectory: testProject.Directory, arguments: "stryker");
                    }
                });

    /// <summary>
    /// Publishes the application.
    /// </summary>
    Target Publish =>
        d =>
            d.DependsOn(AllTests)
                .Produces(ArtifactsDirectory / "*")
                .Executes(() =>
                {
                    DotNetPublish(s =>
                        s.SetProject(Solution)
                            .SetConfiguration(Configuration)
                            .SetOutput(ArtifactsDirectory)
                            .EnableNoRestore()
                            .EnableNoBuild()
                    );
                });

    Target LintWebapp =>
        d =>
            d.DependsOn(InstallWebappDependencies)
                .Before(BuildWebapp)
                .Executes(() =>
                {
                    ProcessTasks
                        .StartProcess("pnpm", "lint", workingDirectory: WebappDirectory, logOutput: true)
                        .AssertZeroExitCode();
                });

    /// <summary>
    /// Runs Prettier check for webapp.
    /// </summary>
    Target PrettierCheckWebapp =>
        d =>
            d.DependsOn(InstallWebappDependencies)
                .Before(BuildWebapp)
                .Executes(() =>
                {
                    ProcessTasks
                        .StartProcess("pnpm", "prettier:check", workingDirectory: WebappDirectory, logOutput: true)
                        .AssertZeroExitCode();
                });

    /// <summary>
    /// Runs compiler health check for webapp.
    /// </summary>
    Target CompilerHealthWebapp =>
        d =>
            d.DependsOn(InstallWebappDependencies)
                .Before(BuildWebapp)
                .Executes(() =>
                {
                    ProcessTasks
                        .StartProcess("pnpm", "compiler-health", workingDirectory: WebappDirectory, logOutput: true)
                        .AssertZeroExitCode();
                });

    /// <summary>
    /// Cleans the webapp directory.
    /// </summary>
    Target CleanWebapp =>
        d =>
            d.Before(InstallWebappDependencies)
                .Executes(() =>
                {
                    WebappDirectory
                        .GlobDirectories("**/node_modules", "**/.next", "**/dist", "**/build")
                        .ForEach(x => x.DeleteDirectory());
                    WebappDirectory.GlobFiles("**/*.tsbuildinfo").ForEach(x => x.DeleteFile());
                });

    /// <summary>
    /// Installs PNPM.
    /// </summary>
    Target InstallPnpm =>
        d =>
            d.Before(InstallWebappDependencies)
                .Executes(() =>
                {
                    try
                    {
                        // Disable corepack
                        ProcessTasks
                            .StartProcess("npm", "uninstall -g corepack", logOutput: true)
                            .AssertZeroExitCode();

                        // Remove existing PNPM installation
                        if (Environment.OSVersion.Platform == PlatformID.Win32NT)
                        {
                            ProcessTasks.StartProcess("npm", "rm -g pnpm", logOutput: true);
                        }
                        else
                        {
                            ProcessTasks.StartProcess("npm", "rm -g pnpm", logOutput: true);
                        }

                        // Install specific version of PNPM
                        Console.WriteLine("Installing PNPM 8.15.1...");
                        ProcessTasks
                            .StartProcess("npm", "install -g pnpm@8.15.1", logOutput: true)
                            .AssertZeroExitCode();

                        Console.WriteLine("PNPM installed successfully.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error during PNPM installation: {ex.Message}");
                        throw;
                    }
                });

    /// <summary>
    /// Installs webapp dependencies.
    /// </summary>
    Target InstallWebappDependencies =>
        d =>
            d.DependsOn(InstallPnpm)
                .After(CleanWebapp)
                .Executes(() =>
                {
                    try
                    {
                        Console.WriteLine("Installing webapp dependencies...");

                        // Create .npmrc file with specific settings
                        var npmrcPath = WebappDirectory / ".npmrc";
                        if (!File.Exists(npmrcPath))
                        {
                            File.WriteAllText(
                                npmrcPath,
                                @"
node-linker=hoisted
shamefully-hoist=true
strict-peer-dependencies=false
enable-pre-post-scripts=true
"
                            );
                        }

                        // Try installation with specific flags
                        try
                        {
                            ProcessTasks
                                .StartProcess(
                                    "pnpm",
                                    "install --prefer-offline --no-frozen-lockfile",
                                    workingDirectory: WebappDirectory,
                                    logOutput: true,
                                    logInvocation: true
                                )
                                .AssertZeroExitCode();
                        }
                        catch (Exception firstTryEx)
                        {
                            Console.WriteLine($"Error during first installation attempt: {firstTryEx.Message}");
                            Console.WriteLine("Cleaning and retrying...");

                            // Clean node_modules and pnpm store
                            WebappDirectory.GlobDirectories("**/node_modules").ForEach(x => x.DeleteDirectory());

                            // Try installation with alternative flags
                            ProcessTasks
                                .StartProcess(
                                    "pnpm",
                                    "install --no-verify-store-integrity --ignore-scripts",
                                    workingDirectory: WebappDirectory,
                                    logOutput: true,
                                    logInvocation: true
                                )
                                .AssertZeroExitCode();
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Fatal error installing dependencies: {ex.Message}");
                        throw;
                    }
                });

    /// <summary>
    /// Builds the webapp.
    /// </summary>
    Target BuildWebapp =>
        d =>
            d.DependsOn(InstallWebappDependencies, LintWebapp, PrettierCheckWebapp, CompilerHealthWebapp)
                .Executes(() =>
                {
                    try
                    {
                        ProcessTasks
                            .StartProcess("pnpm", "build", workingDirectory: WebappDirectory, logOutput: true)
                            .AssertZeroExitCode();
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error during build: {ex.Message}");
                        // Try cleaning .next directory and rebuild
                        WebappDirectory.GlobDirectories("**/.next").ForEach(x => x.DeleteDirectory());
                        ProcessTasks
                            .StartProcess("pnpm", "build", workingDirectory: WebappDirectory, logOutput: true)
                            .AssertZeroExitCode();
                    }
                });

    /// <summary>
    /// Runs the complete CI pipeline.
    /// </summary>
    Target CI => d => d.DependsOn(Clean, CleanWebapp, Restore, Compile, LintCheck, AllTests, BuildWebapp, Publish);
}
