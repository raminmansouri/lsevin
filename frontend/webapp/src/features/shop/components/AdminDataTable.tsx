"use client";

type AdminColumn = {
  key: string;
  label: string;
  format?: "text" | "money" | "date" | "datetime" | "boolean";
  currencyKey?: string;
};

type AdminDataTableProps<T extends Record<string, any>> = {
  rows: T[];
  columns: AdminColumn[];
};

function formatCell(row: Record<string, any>, column: AdminColumn) {
  const value = row[column.key];

  switch (column.format) {
    case "money": {
      const currency = column.currencyKey ? row[column.currencyKey] || "USD" : "USD";
      const amount = Number(value ?? 0);

      try {
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${currency} ${amount.toFixed(2)}`;
      }
    }

    case "date": {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleDateString("en");
    }

    case "datetime": {
      if (!value) return "—";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "—";
      return date.toLocaleString("en");
    }

    case "boolean":
      return value ? "Yes" : "No";

    case "text":
    default:
      return value == null || value === "" ? "—" : String(value);
  }
}

export function AdminDataTable<T extends Record<string, any>>({
  rows,
  columns,
}: AdminDataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left font-semibold text-gray-700"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-gray-900">
                      {formatCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}