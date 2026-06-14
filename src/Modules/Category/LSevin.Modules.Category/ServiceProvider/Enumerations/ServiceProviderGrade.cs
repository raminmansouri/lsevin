using BuildingBlocks.Core.Domain.Primitives;

namespace LSevin.Modules.Category.ServiceProvider.Enumerations;

public sealed class ServiceProviderGrade : Enumeration
{
    public static readonly ServiceProviderGrade GradeA = new(1, nameof(GradeA));
    public static readonly ServiceProviderGrade GradeB = new(2, nameof(GradeB));
    public static readonly ServiceProviderGrade GradeC = new(3, nameof(GradeC));
    public static readonly ServiceProviderGrade GradeD = new(4, nameof(GradeD));
    public static readonly ServiceProviderGrade GradeE = new(5, nameof(GradeE));
    public static readonly ServiceProviderGrade GradeF = new(6, nameof(GradeF));
    public static readonly ServiceProviderGrade GradeG = new(7, nameof(GradeG));
    public static readonly ServiceProviderGrade GradeH = new(8, nameof(GradeH));
    public static readonly ServiceProviderGrade GradeI = new(9, nameof(GradeI));
    public static readonly ServiceProviderGrade GradeJ = new(10, nameof(GradeJ));
    public static readonly ServiceProviderGrade GradeK = new(11, nameof(GradeK));
    public static readonly ServiceProviderGrade GradeL = new(12, nameof(GradeL));
    public static readonly ServiceProviderGrade GradeM = new(13, nameof(GradeM));
    public static readonly ServiceProviderGrade GradeN = new(14, nameof(GradeN));
    public static readonly ServiceProviderGrade GradeO = new(15, nameof(GradeO));
    public static readonly ServiceProviderGrade GradeP = new(16, nameof(GradeP));
    public static readonly ServiceProviderGrade GradeQ = new(17, nameof(GradeQ));
    public static readonly ServiceProviderGrade GradeR = new(18, nameof(GradeR));
    public static readonly ServiceProviderGrade GradeS = new(19, nameof(GradeS));
    public static readonly ServiceProviderGrade GradeT = new(20, nameof(GradeT));
    public static readonly ServiceProviderGrade GradeU = new(21, nameof(GradeU));
    public static readonly ServiceProviderGrade GradeV = new(22, nameof(GradeV));
    public static readonly ServiceProviderGrade GradeW = new(23, nameof(GradeW));
    public static readonly ServiceProviderGrade GradeX = new(24, nameof(GradeX));
    public static readonly ServiceProviderGrade GradeY = new(25, nameof(GradeY));
    public static readonly ServiceProviderGrade GradeZ = new(26, nameof(GradeZ));

    private ServiceProviderGrade(int id, string name)
        : base(id, name) { }
}
