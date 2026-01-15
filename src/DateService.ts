import { DAILY_NOTE_FILENAME_REGEX, NOTE_FILE_EXTENSION } from "./constants";
import { DateInfo } from "./types";

/**
 * DateService handles all date-related operations for the plugin
 */
export class DateService {
  /**
   * Get today's date formatted as YYYY-MM-DD
   */
  static getTodayFormatted(): string {
    return this.formatDateToFileName(new Date());
  }

  /**
   * Format a Date object to YYYY-MM-DD
   */
  static formatDateToFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a Date object for display (e.g., "January 15th, 2026")
   */
  static formatDateForDisplay(date: Date, format?: string): string {
    // For now, use a simple format. Can be extended to support custom formats
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    const formatted = date.toLocaleDateString("en-US", options);

    // Add ordinal suffix (st, nd, rd, th)
    const day = date.getDate();
    const ordinal = this.getOrdinalSuffix(day);

    // Replace the day number with day + ordinal
    return formatted.replace(String(day), `${day}${ordinal}`);
  }

  /**
   * Get ordinal suffix for a day (1st, 2nd, 3rd, 4th, etc.)
   */
  private static getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  /**
   * Parse a date from a filename (YYYY-MM-DD.md)
   * Returns null if invalid format
   */
  static parseDateFromFilename(filename: string): Date | null {
    // Remove .md extension if present
    const nameWithoutExt = filename.replace(NOTE_FILE_EXTENSION, "");

    // Check if it matches the expected format
    if (!DAILY_NOTE_FILENAME_REGEX.test(filename)) {
      return null;
    }

    // Parse the date components
    const parts = nameWithoutExt.split("-");
    if (parts.length !== 3) {
      return null;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const day = parseInt(parts[2], 10);

    // Validate the parsed values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (year < 1900 || year > 2100) {
      return null;
    }

    if (month < 0 || month > 11) {
      return null;
    }

    if (day < 1 || day > 31) {
      return null;
    }

    // Create the date object
    const date = new Date(year, month, day);

    // Verify the date is valid (handles invalid dates like Feb 30)
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  /**
   * Check if a filename is a valid daily note filename
   */
  static isValidDailyNoteFilename(filename: string): boolean {
    if (!DAILY_NOTE_FILENAME_REGEX.test(filename)) {
      return false;
    }

    // Also verify the date is actually valid
    const date = this.parseDateFromFilename(filename);
    return date !== null;
  }

  /**
   * Generate a filename from a date
   */
  static generateFilename(date: Date): string {
    return `${this.formatDateToFileName(date)}${NOTE_FILE_EXTENSION}`;
  }

  /**
   * Get a range of dates starting from a date, going backwards
   * @param startDate Starting date (defaults to today)
   * @param count Number of dates to generate
   * @returns Array of dates in descending order (newest first)
   */
  static getDatesRange(startDate: Date = new Date(), count: number): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      // Reset time to midnight for consistency
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    return dates;
  }

  /**
   * Compare two dates (ignoring time component)
   * @returns Negative if date1 < date2, 0 if equal, positive if date1 > date2
   */
  static compareDates(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Reset time components
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    return d1.getTime() - d2.getTime();
  }

  /**
   * Check if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.compareDates(date1, date2) === 0;
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    return this.isSameDay(date, new Date());
  }

  /**
   * Get full date information for a given date
   */
  static getDateInfo(date: Date): DateInfo {
    return {
      date: date,
      fileName: this.formatDateToFileName(date),
      displayName: this.formatDateForDisplay(date),
      isoString: date.toISOString(),
      timestamp: date.getTime(),
    };
  }

  /**
   * Get the date at midnight (00:00:00.000)
   */
  static getDateAtMidnight(date: Date = new Date()): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from a date
   */
  static subtractDays(date: Date, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Parse a date string in YYYY-MM-DD format
   */
  static parseDateString(dateString: string): Date | null {
    return this.parseDateFromFilename(dateString + NOTE_FILE_EXTENSION);
  }

  /**
   * Sort an array of date strings in descending order (newest first)
   */
  static sortDateStringsDesc(dateStrings: string[]): string[] {
    return dateStrings.sort((a, b) => {
      const dateA = this.parseDateString(a);
      const dateB = this.parseDateString(b);

      if (!dateA || !dateB) return 0;

      return this.compareDates(dateB, dateA); // Reverse for descending
    });
  }

  /**
   * Get the oldest date from an array of date strings
   */
  static getOldestDate(dateStrings: string[]): Date | null {
    if (dateStrings.length === 0) return null;

    const sorted = this.sortDateStringsDesc(dateStrings);
    return this.parseDateString(sorted[sorted.length - 1]);
  }

  /**
   * Get the newest date from an array of date strings
   */
  static getNewestDate(dateStrings: string[]): Date | null {
    if (dateStrings.length === 0) return null;

    const sorted = this.sortDateStringsDesc(dateStrings);
    return this.parseDateString(sorted[0]);
  }
}
