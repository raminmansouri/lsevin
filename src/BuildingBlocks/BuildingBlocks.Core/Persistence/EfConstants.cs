namespace BuildingBlocks.Core.Persistence;

/// <summary>
/// Represents the constants for the EF.
/// </summary>
public static class EfConstants
{
    /// <summary>
    /// The name of the SQL connection string in configuration.
    /// </summary>
    public const string SqlConnectionStringName = "database";

    /// <summary>
    /// The UUID generator extension name for PostgreSQL.
    /// </summary>
    public const string UuidGenerator = "uuid-ossp";

    /// <summary>
    /// The vector extension name for PostgreSQL.
    /// </summary>
    public const string Vector = "vector";

    /// <summary>
    /// The UUID generation algorithm function name.
    /// </summary>
    public const string UuidAlgorithm = "uuid_generate_v4()";

    /// <summary>
    /// The current timestamp function name.
    /// </summary>
    public const string DateAlgorithm = "now()";

    /// <summary>
    /// The Localized table postfix.
    /// </summary>
    public const string LocalizedTablePostfix = "_translations";

    /// <summary>
    /// Represents the column types.
    /// </summary>
    public static class ColumnTypes
    {
        /// <summary>
        /// JSON binary column type.
        /// </summary>
        public const string Jsonb = "jsonb";

        /// <summary>
        /// Decimal column type for price values with 18 digits and 2 decimal places.
        /// </summary>
        public const string PriceDecimal = "decimal(18,2)";

        /// <summary>
        /// Unicode varchar column type with 15 character length.
        /// </summary>
        public const string TinyText = "nvarchar(15)";

        /// <summary>
        /// Unicode varchar column type with 25 character length.
        /// </summary>
        public const string SmallText = "nvarchar(25)";

        /// <summary>
        /// Unicode varchar column type with 50 character length.
        /// </summary>
        public const string NormalText = "nvarchar(50)";

        /// <summary>
        /// Unicode varchar column type with 100 character length.
        /// </summary>
        public const string MediumText = "nvarchar(100)";

        /// <summary>
        /// Unicode varchar column type with 250 character length.
        /// </summary>
        public const string LargeText = "nvarchar(250)";

        /// <summary>
        /// Unicode varchar column type with 500 character length.
        /// </summary>
        public const string ExtraLongText = "nvarchar(500)";

        /// <summary>
        /// Unicode varchar column type with 2000 character length for message types.
        /// </summary>
        public const string MessageTypeText = "nvarchar(2000)";

        /// <summary>
        /// Unicode varchar column type with maximum length.
        /// </summary>
        public const string MaxText = "nvarchar(max)";

        /// <summary>
        /// Timestamp with time zone column type.
        /// </summary>
        public const string DateTime = "timestamp with time zone";
    }

    /// <summary>
    /// Represents the length constants.
    /// </summary>
    public static class Lenght
    {
        /// <summary>
        /// Tiny length of 15 characters.
        /// </summary>
        public const int Tiny = 15;

        /// <summary>
        /// Small length of 25 characters.
        /// </summary>
        public const int Small = 25;

        /// <summary>
        /// Normal length of 50 characters.
        /// </summary>
        public const int Normal = 50;

        /// <summary>
        /// Medium length of 100 characters.
        /// </summary>
        public const int Medium = 100;

        /// <summary>
        /// Large length of 250 characters.
        /// </summary>
        public const int Large = 250;

        /// <summary>
        /// Extra long length of 500 characters.
        /// </summary>
        public const int ExtraLong = 500;

        /// <summary>
        /// Message type length of 2000 characters.
        /// </summary>
        public const int UltraLong = 2000;
    }
}
