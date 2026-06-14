declare module "moment-hijri" {
  import { Moment, MomentFormatSpecification, MomentInput } from "moment";

  interface MomentHijri extends Moment {
    /**
     * Format the date using Hijri calendar format
     * Use 'i' prefix for Hijri formats (e.g., iYYYY, iMM, iDD, iMMMM)
     */
    format(format?: string): string;

    /**
     * Get or set the Hijri year
     */
    iYear(): number;
    iYear(year: number): MomentHijri;

    /**
     * Get or set the Hijri month (0-11)
     */
    iMonth(): number;
    iMonth(month: number): MomentHijri;

    /**
     * Get or set the Hijri date
     */
    iDate(): number;
    iDate(date: number): MomentHijri;

    /**
     * Get or set the Hijri day of year
     */
    iDayOfYear(): number;
    iDayOfYear(day: number): MomentHijri;

    /**
     * Get or set the Hijri week
     */
    iWeek(): number;
    iWeek(week: number): MomentHijri;

    /**
     * Get or set the Hijri week year
     */
    iWeekYear(): number;
    iWeekYear(year: number): MomentHijri;
  }

  interface MomentHijriStatic {
    (
      inp?: MomentInput,
      format?: MomentFormatSpecification,
      strict?: boolean
    ): MomentHijri;
    (
      inp?: MomentInput,
      format?: MomentFormatSpecification,
      language?: string,
      strict?: boolean
    ): MomentHijri;

    /**
     * Set the locale for moment-hijri
     */
    locale(locale: string): string;

    /**
     * Parse a Hijri date string
     */
    (inp?: MomentInput, format?: string, strict?: boolean): MomentHijri;
  }

  const momentHijri: MomentHijriStatic;
  export = momentHijri;
}
