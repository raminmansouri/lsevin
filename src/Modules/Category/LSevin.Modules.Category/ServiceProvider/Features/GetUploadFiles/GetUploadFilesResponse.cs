namespace LSevin.Modules.Category.ServiceProvider.Features.GetUploadFiles;

    using System;
    using System.Collections.Generic;

    using System.Text.Json;
    using System.Text.Json.Serialization;

public partial class GetUploadFilesResponse
{
    [JsonPropertyName("uploadFiles")]
    public UploadFile[] UploadFiles { get; set; } = Array.Empty<UploadFile>();
}

public partial class UploadFile
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("required")]
    public bool UploadFileRequired { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("maxFileSizeBytes")]
    public long MaxFileSizeBytes { get; set; }

    [JsonPropertyName("maxFileSizeLabel")]
    public string MaxFileSizeLabel { get; set; } = string.Empty;

    [JsonPropertyName("allowedExtensions")]
    public string[] AllowedExtensions { get; set; } = Array.Empty<string>();

    [JsonPropertyName("allowedMimeTypes")]
    public string[] AllowedMimeTypes { get; set; } = Array.Empty<string>();

    [JsonPropertyName("maxFiles")]
    public int MaxFiles { get; set; }

    [JsonPropertyName("displayOrder")]
    public int DisplayOrder { get; set; }

    [JsonPropertyName("exampleFileUrl")]
    public string? ExampleFileUrl { get; set; }
}



public partial class GetUploadFilesResponse
    {
        public static GetUploadFilesResponse FromJson(string json) => JsonSerializer.Deserialize<GetUploadFilesResponse>(json, Converter.Settings);
    }

    public static class Serialize
    {
        public static string ToJson(this GetUploadFilesResponse self) => JsonSerializer.Serialize(self, Converter.Settings);
    }

    internal static class Converter
    {
        public static readonly JsonSerializerOptions Settings = new(JsonSerializerDefaults.Web)
        {
            Converters =
            {
                new DateOnlyConverter(),
                new TimeOnlyConverter(),
            },
        };
    }

    public class DateOnlyConverter : JsonConverter<DateOnly>
    {
        private readonly string serializationFormat;
        public DateOnlyConverter() : this(null) { }

        public DateOnlyConverter(string? serializationFormat)
        {
            this.serializationFormat = serializationFormat ?? "yyyy-MM-dd";
        }

        public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return DateOnly.Parse(value!);
        }

        public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString(serializationFormat));
    }
    public class TimeOnlyConverter : JsonConverter<TimeOnly>
    {
        private readonly string serializationFormat;

        public TimeOnlyConverter() : this(null) { }

        public TimeOnlyConverter(string? serializationFormat)
        {
            this.serializationFormat = serializationFormat ?? "HH:mm:ss.fff";
        }

        public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return TimeOnly.Parse(value!);
        }

        public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.ToString(serializationFormat));
    }
