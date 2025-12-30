import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {formatDateTime, formatDateTimeWithMs, getDefaultMembershipDates, localToUTCDate, localToUTCDatetime} from "../tools";
import {MembershipTypeEnum, PortalConfigGroupEnum} from "../models";

dayjs.extend(timezone);
dayjs.extend(utc);
const timezoneId = "Europe/Helsinki";

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

    describe("getDefaultMembershipDates", () => {
        const makeConfig = (overrides: Record<string, string>) => {
            const base = {
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: "UTC",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.DURATIONAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "month",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "0",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2020-01-01",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
            };
            const cfg = {...base, ...overrides};
            return (group: PortalConfigGroupEnum, key: string) => cfg[`${group}.${key}`];
        };

        const setNow = (iso: string) => {
            jest.useFakeTimers({now: new Date(iso)});
        };

        afterEach(() => {
            jest.useRealTimers();
        });

        it("handles year periodical month from Feb to last of Dec", () => {
            setNow("2024-02-15T12:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "YEARS",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {endDate} = getDefaultMembershipDates(getCfg);
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2025-01-01");
        });

        it("handles durational month from 31st into shorter month", () => {
            setNow("2023-01-31T12:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "month",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {endDate} = getDefaultMembershipDates(getCfg);
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2023-02-28");
        });

        it("handles durational month into leap-year February", () => {
            setNow("2024-01-31T12:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "month",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {endDate} = getDefaultMembershipDates(getCfg);
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2024-02-29");
        });

        it("handles durational year from leap day to non-leap year", () => {
            setNow("2024-02-29T08:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "year",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {endDate} = getDefaultMembershipDates(getCfg);
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2025-02-28");
        });

        it("returns null end date for disabled/perpetual", () => {
            setNow("2025-05-15T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERPETUAL,
            });
            const {endDate} = getDefaultMembershipDates(getCfg);
            expect(endDate).toBeNull();
        });
    });
});
