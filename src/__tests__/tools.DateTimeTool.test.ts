import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
    formatDateTime,
    formatDateTimeWithMs,
    getDefaultMembershipDates,
    getDefaultOneTimePaymentDates,
    getDefaultPeriodPaymentDates,
    localToUTCDate,
    localToUTCDatetime
} from "../tools/DateTimeTool";
import {MembershipTypeEnum, PortalConfigGroupEnum} from "../models";

dayjs.extend(timezone);
dayjs.extend(utc);
const timezoneId = "Europe/Helsinki";

describe("DateTimeTool", () => {
    it("formats Date objects without milliseconds", () => {
        const sample = new Date(Date.UTC(2025, 0, 1, 3, 4, 5));
        const expected = `${sample.getFullYear()}-${String(sample.getMonth() + 1).padStart(2, "0")}-${String(sample.getDate()).padStart(2, "0")} ${String(sample.getHours()).padStart(2, "0")}:${String(sample.getMinutes()).padStart(2, "0")}`;
        expect(formatDateTime(sample)).toBe(expected);
        expect(formatDateTime("2025-01-01T03:04:05Z")).toContain("2025-01-01");
    });

    it("formats stringified dates and keeps ms", () => {
        const sample = "2025-12-31T23:59:59.123Z";
        const parsed = new Date(sample);
        const expectedMs = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")} ${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}:${String(parsed.getSeconds()).padStart(2, "0")}:${String(parsed.getMilliseconds()).padStart(3, "0")}`;
        expect(formatDateTimeWithMs(sample)).toBe(expectedMs);
        expect(formatDateTimeWithMs(dayjs(sample))).toBe(expectedMs);
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

        it("computes yearly period with start point in January (length 1)", () => {
            setNow("2025-12-30T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "YEARS",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "1",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "1",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2025-12-29",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {startDate, endDate} = getDefaultMembershipDates(getCfg);
            expect(startDate.tz(timezoneId).format("YYYY-MM-DD")).toBe("2025-01-01");
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2026-01-01");
        });

        it("computes multi-year period anchored by membershipPeriodStart (length 2)", () => {
            setNow("2025-12-30T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "YEARS",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "2",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "1",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2025-12-29",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {startDate, endDate} = getDefaultMembershipDates(getCfg);
            expect(startDate.tz(timezoneId).format("YYYY-MM-DD")).toBe("2025-01-01");
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2027-01-01");
        });

        it("computes yearly period with May start point and length 3", () => {
            setNow("2025-12-30T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "YEARS",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "3",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "5",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2025-04-25",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {startDate, endDate} = getDefaultMembershipDates(getCfg);
            expect(startDate.tz(timezoneId).format("YYYY-MM-DD")).toBe("2024-05-01");
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2027-05-01");
        });

        it("computes monthly period starting day with length 3 months", () => {
            setNow("2025-12-30T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "MONTHS",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "3",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "1",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2025-04-25",
                [`${PortalConfigGroupEnum.GENERAL}.timezone`]: timezoneId,
            });
            const {startDate, endDate} = getDefaultMembershipDates(getCfg);
            expect(startDate.tz(timezoneId).format("YYYY-MM-DD")).toBe("2025-10-01");
            expect(endDate?.tz(timezoneId).format("YYYY-MM-DD")).toBe("2026-01-01");
        });

        it("computes weekly periods and clamps invalid start points", () => {
            setNow("2025-12-30T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "weeks",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start-point`]: "9"
            });
            const {startDate, endDate} = getDefaultMembershipDates(getCfg);
            expect(startDate.isBefore(endDate)).toBe(true);
            expect(endDate?.diff(startDate, "week")).toBe(1);
        });

        it("uses current date for disabled membership and supports payment expiry wrappers", () => {
            setNow("2025-05-15T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.DISABLED
            });
            expect(getDefaultMembershipDates(getCfg).endDate).toBeNull();
            const paymentCfg = (group: PortalConfigGroupEnum, key: string) =>
                getCfg(group === PortalConfigGroupEnum.PAYMENT ? PortalConfigGroupEnum.MEMBERSHIP : group, key);
            expect(getDefaultPeriodPaymentDates(paymentCfg).startDate).toBeDefined();
            expect(getDefaultOneTimePaymentDates(paymentCfg).startDate).toBeDefined();
        });

        it("returns both dates for an unknown period type", () => {
            setNow("2025-05-15T00:00:00Z");
            const getCfg = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: "UNKNOWN"
            });
            const result = getDefaultMembershipDates(getCfg);
            expect(result.endDate).toBe(result.startDate);
        });

        it("supports generic period units and durational non-month units", () => {
            setNow("2025-05-15T00:00:00Z");
            const generic = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-type`]: MembershipTypeEnum.PERIODICAL,
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "days",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "7",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-start`]: "2025-05-01"
            });
            const genericResult = getDefaultMembershipDates(generic);
            expect(genericResult.endDate?.isAfter(genericResult.startDate)).toBe(true);

            const durational = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "weeks",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "2"
            });
            const durationalResult = getDefaultMembershipDates(durational);
            expect(durationalResult.endDate?.diff(durationalResult.startDate, "week")).toBe(2);

            const longMonth = makeConfig({
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-unit`]: "months",
                [`${PortalConfigGroupEnum.MEMBERSHIP}.membership-period-length`]: "13"
            });
            expect(getDefaultMembershipDates(longMonth).endDate).toBeDefined();
        });
    });
});
