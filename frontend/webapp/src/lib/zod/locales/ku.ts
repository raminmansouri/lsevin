/**
 * Kurdish (Sorani) locale for Zod v4
 * Based on the standard Zod locale structure
 */

// Utility functions copied from zod/v4/core/util
function stringifyPrimitive(value: unknown): string {
  if (typeof value === "bigint") return value.toString() + "n";
  if (typeof value === "string") return `"${value}"`;
  return `${value}`;
}

function joinValues(array: unknown[], separator = "|"): string {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}

export const parsedType = (data: unknown): string => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "ژمارە";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "لیست";
      }
      if (data === null) {
        return "null";
      }
      if (
        Object.getPrototypeOf(data) !== Object.prototype &&
        (data as object).constructor
      ) {
        return (data as { constructor: { name: string } }).constructor.name;
      }
    }
  }
  return t;
};

const error = () => {
  const Sizable: Record<string, { unit: string; verb: string } | undefined> = {
    string: { unit: "پیت", verb: "هەبێت" },
    file: { unit: "بایت", verb: "هەبێت" },
    array: { unit: "دانە", verb: "هەبێت" },
    set: { unit: "دانە", verb: "هەبێت" },
  };

  function getSizing(origin: string) {
    return Sizable[origin] ?? null;
  }

  const Nouns: Record<string, string> = {
    regex: "داخڵکردن",
    email: "ناونیشانی ئیمێڵ",
    url: "بەستەر",
    emoji: "ئیمۆجی",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "کات و بەرواری ISO",
    date: "بەرواری ISO",
    time: "کاتی ISO",
    duration: "ماوەی ISO",
    ipv4: "ناونیشانی IPv4",
    ipv6: "ناونیشانی IPv6",
    cidrv4: "مەودای IPv4",
    cidrv6: "مەودای IPv6",
    base64: "ڕستەی کۆدکراوی base64",
    base64url: "ڕستەی کۆدکراوی base64url",
    json_string: "ڕستەی JSON",
    e164: "ژمارەی E.164",
    jwt: "JWT",
    template_literal: "داخڵکردن",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (issue: any): string => {
    switch (issue.code) {
      case "invalid_type":
        return `داخڵکردنی نادروست: چاوەڕوانی ${issue.expected} دەکرا، بەڵام ${parsedType(issue.input)} وەرگیرا`;

      case "invalid_value":
        if (issue.values.length === 1)
          return `داخڵکردنی نادروست: چاوەڕوانی ${stringifyPrimitive(issue.values[0])} دەکرا`;
        return `هەڵبژاردەی نادروست: چاوەڕوانی یەکێک لە ${joinValues(issue.values, "|")} دەکرا`;

      case "too_big": {
        const adj = issue.inclusive ? "<=" : "<";
        const sizing = getSizing(issue.origin);
        if (sizing)
          return `گەورە زۆرە: چاوەڕوان دەکرا ${issue.origin ?? "بەها"} ${sizing.verb} ${adj}${issue.maximum.toString()} ${sizing.unit ?? "توخم"}`;
        return `گەورە زۆرە: چاوەڕوان دەکرا ${issue.origin ?? "بەها"} ${adj}${issue.maximum.toString()} بێت`;
      }

      case "too_small": {
        const adj = issue.inclusive ? ">=" : ">";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `بچووک زۆرە: چاوەڕوان دەکرا ${issue.origin} ${sizing.verb} ${adj}${issue.minimum.toString()} ${sizing.unit}`;
        }
        return `بچووک زۆرە: چاوەڕوان دەکرا ${issue.origin} ${adj}${issue.minimum.toString()} بێت`;
      }

      case "invalid_format": {
        const _issue = issue;
        if (_issue.format === "starts_with") {
          return `ڕستەی نادروست: دەبێت بە "${_issue.prefix}" دەستپێبکات`;
        }
        if (_issue.format === "ends_with")
          return `ڕستەی نادروست: دەبێت بە "${_issue.suffix}" کۆتایی بێت`;
        if (_issue.format === "includes")
          return `ڕستەی نادروست: دەبێت "${_issue.includes}" لەخۆبگرێت`;
        if (_issue.format === "regex")
          return `ڕستەی نادروست: دەبێت لەگەڵ پاتێرنی ${_issue.pattern} بگونجێت`;
        return `${Nouns[_issue.format] ?? issue.format} نادروستە`;
      }

      case "not_multiple_of":
        return `ژمارەی نادروست: دەبێت لێکدەری ${issue.divisor} بێت`;

      case "unrecognized_keys":
        return `کلیلی نەناسراو${issue.keys.length > 1 ? "ەکان" : ""}: ${joinValues(issue.keys, ", ")}`;

      case "invalid_key":
        return `کلیلی نادروست لە ${issue.origin}`;

      case "invalid_union":
        return "داخڵکردنی نادروست";

      case "invalid_element":
        return `بەهای نادروست لە ${issue.origin}`;

      default:
        return `داخڵکردنی نادروست`;
    }
  };
};

export default function kurdishLocale() {
  return {
    localeError: error(),
  };
}
