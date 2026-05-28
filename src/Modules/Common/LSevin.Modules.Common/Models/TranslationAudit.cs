using System;
using System.Collections.Generic;
using NodaTime;

namespace LSevinModels.Models;

public partial class TranslationAudit
{
    public long Id { get; set; }

    public string TableName { get; set; } = null!;

    public string ColumnName { get; set; } = null!;

    public string RowPk { get; set; } = null!;

    public string SourceLocale { get; set; } = null!;

    public string TargetLocale { get; set; } = null!;

    public string SourceText { get; set; } = null!;

    public string? TranslatedText { get; set; }

    public string Status { get; set; } = null!;

    public string? Error { get; set; }

    public string? Model { get; set; }

    public DateTime CreatedAt { get; set; }
}
