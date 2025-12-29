import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {formatDateTime, formatDateTimeWithMs, localToUTCDate, localToUTCDatetime} from "../tools";

dayjs.extend(timezone);
dayjs.extend(utc);

describe("DateTimeTool", () => {
    it("formats Date objects without milliseconds", () => {
        const sample = new Date(Date.UTC(2025, 0, 1, 3, 4, 5));
        const expected = `${sample.getFullYear()}-${String(sample.getMonth() + 1).padStart(2, "0")}-${String(sample.getDate()).padStart(2, "0")} ${String(sample.getHours()).padStart(2, "0")}:${String(sample.getMinutes()).padStart(2, "0")}`;
        expect(formatDateTime(sample)).toBe(expected);
    });

    it("formats stringified dates and keeps ms", () => {
        const sample = "2025-12-31T23:59:59.123Z";
        const parsed = new Date(sample);
        const expectedMs = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}:${String(parsed.getSeconds()).padStart(2, "0")}:${String(parsed.getMilliseconds()).padStart(3, "0")}`;
        expect(formatDateTimeWithMs(sample)).toBe(expectedMs);
    });

    it("converts local date to timezone-aware UTC midnight", () => {
        const local = dayjs.tz("2025-11-01", "Europe/Helsinki");
        const result = localToUTCDate(local, "Europe/Helsinki");
        expect(result.hour()).toBe(0);
        expect(result.utcOffset()).toBe(120);
    });

    it("converts local datetime to UTC in minutes precision", () => {
        const local = dayjs.tz("2025-11-01T12:30", "Europe/Helsinki");
        const result = localToUTCDatetime(local, "Europe/Helsinki");
        expect(result.minute()).toBe(30);
        expect(result.utcOffset()).toBe(120);
    });
});
