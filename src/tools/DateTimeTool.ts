import dayjs, {Dayjs} from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {MembershipTypeEnum, PortalConfigGroupEnum} from "../models";

dayjs.extend(utc);
dayjs.extend(timezone);

// Copied from https://bobbyhadz.com/blog/javascript-format-date-yyyy-mm-dd-hh-mm-ss
function padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
}

function padTo3Digits(num: number) {
    return num.toString().padStart(3, '0');
}

function formatDateTime(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        [
            date.getFullYear(),
            padTo2Digits(date.getMonth() + 1),
            padTo2Digits(date.getDate())
        ].join('-') +
        ' ' +
        [
            padTo2Digits(date.getHours()),
            padTo2Digits(date.getMinutes())
        ].join(':')
    );
}

function formatDateTimeWithMs(date: Date | string) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }

    return (
        formatDateTime(date) + ':' +
        [
            padTo2Digits(date.getSeconds()),
            padTo3Digits(date.getMilliseconds())
        ].join(':')
    );
}

function localToUTCDate(date: Dayjs, timeZone: string): Dayjs {
    const year = date.year();
    const month = String(date.month() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.date()).padStart(2, "0");
    // Step 2: Create a timezone-less datetime string
    const timezoneLessDatetime: string = `${year}-${month}-${day}`;
    // Step 3: Use dayjs.tz() to interpret it in the desired timezone
    return dayjs.tz(timezoneLessDatetime, timeZone);
}

function localToUTCDatetime(date: Dayjs, timeZone: string): Dayjs {
    // Step 1: Deconstruct the date object into components
    const year = date.year();
    const month = String(date.month() + 1).padStart(2, "0"); // Months are 0-indexed
    const day = String(date.date()).padStart(2, "0");
    const hours = String(date.hour()).padStart(2, "0");
    const minutes = String(date.minute()).padStart(2, "0");

    // Step 2: Create a timezone-less datetime string
    const timezoneLessDatetime: string = `${year}-${month}-${day}T${hours}:${minutes}`;
    // Step 3: Use dayjs.tz() to interpret it in the desired timezone
    return dayjs.tz(timezoneLessDatetime, timeZone);
}

function getDefaultMembershipDates(getPortalConfigurationValue: (
    groupKey: PortalConfigGroupEnum,
    settingKey: string
) => string): { startDate: Dayjs, endDate: Dayjs | null } {
    const periodType: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-type");
    const periodUnit: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-unit");
    const periodStartPoint: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-start-point");
    const periodStart: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-start");
    const periodLength: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-length");
    const timezoneId: string = getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "timezone") || dayjs.tz.guess();

    return calculatePeriod(periodUnit, periodLength, periodType, periodStart, timezoneId, periodStartPoint);
}

function getDefaultPeriodPaymentDates(getPortalConfigurationValue: (
    groupKey: PortalConfigGroupEnum,
    settingKey: string
) => string): { startDate: Dayjs, endDate: Dayjs | null } {
    const periodType: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "periodical-payment-method-type");
    const periodUnit: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "periodical-payment-method-unit");
    const periodStartPoint: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "payment-period-start-point");
    const periodStart: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "payment-period-start");
    const periodLength: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "payment-period-length");
    const timezoneId: string = getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "timezone") || dayjs.tz.guess();

    return calculatePeriod(periodUnit, periodLength, periodType, periodStart, timezoneId, periodStartPoint);
}

function getDefaultOneTimePaymentDates(getPortalConfigurationValue: (
    groupKey: PortalConfigGroupEnum,
    settingKey: string
) => string): { startDate: Dayjs, endDate: Dayjs | null } {
    const periodType: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-type");
    const periodUnit: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-unit");
    const periodStartPoint: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "payment-period-start-point");
    const periodStart: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "payment-period-start");
    const periodLength: string = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-length");
    const timezoneId: string = getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "timezone") || dayjs.tz.guess();

    return calculatePeriod(periodUnit, periodLength, periodType, periodStart, timezoneId, periodStartPoint);
}

function calculatePeriod(periodUnit: string, periodLength: string, periodType: string, periodStartString: string, timezoneId: string, periodStartPointString: string) {
    const now = dayjs().tz(timezoneId);
    const unitCounts = parseInt(periodLength, 10);
    const periodStartPoint = parseInt(periodStartPointString, 10);
    const chronoUnitRaw = (periodUnit || "").toLowerCase();
    const chronoUnit = chronoUnitRaw.endsWith("s")
        ? (chronoUnitRaw.slice(0, -1) as dayjs.ManipulateType)
        : (chronoUnitRaw as dayjs.ManipulateType);

    // The string values are the same for both MembershipTypeEnum and PaymentTypeEnum
    if (periodType === MembershipTypeEnum.DISABLED || periodType === MembershipTypeEnum.PERPETUAL) {
        return {startDate: now, endDate: null};
    }

    if (periodType === MembershipTypeEnum.PERIODICAL) {
        const anchor = dayjs(periodStartString).tz(timezoneId);
        const clampDay = (y: number, m1: number, d: number) => {
            const daysInMonth = dayjs(`${y}-${padTo2Digits(m1)}-01`).daysInMonth();
            return d > daysInMonth ? daysInMonth : d;
        };

        let periodStart: Dayjs;

        if (chronoUnit === "year") {
            const startMonth = Math.max(1, Math.min(12, periodStartPoint || 1));
            const candidateDay = 1;
            const candidate = dayjs(`${anchor.year()}-${padTo2Digits(startMonth)}-${padTo2Digits(candidateDay)}`).tz(timezoneId);
            periodStart = candidate.isAfter(anchor) ? candidate.subtract(1, "year") : candidate;
        } else if (chronoUnit === "month") {
            const startDay = Math.max(1, periodStartPoint || 1);
            const clampedDay = clampDay(anchor.year(), anchor.month() + 1, startDay);
            const candidate = dayjs(`${anchor.year()}-${padTo2Digits(anchor.month() + 1)}-${padTo2Digits(clampedDay)}`).tz(timezoneId);
            periodStart = candidate.isAfter(anchor) ? candidate.subtract(1, "month") : candidate;
        } else if (chronoUnit === "week") {
            const startDow = Math.max(1, Math.min(7, periodStartPoint || 1));
            const candidate = anchor.startOf("week").add(startDow - 1, "day").tz(timezoneId);
            periodStart = candidate.isAfter(anchor) ? candidate.subtract(1, "week") : candidate;
        } else {
            // Fallback: treat as generic unit from anchor
            periodStart = anchor;
        }

        // Move forward in full periods until now is within [periodStart, periodStart+length)
        while (true) {
            const endCandidate = periodStart.add(unitCounts, chronoUnit);
            if (endCandidate.isAfter(now) || endCandidate.isSame(now)) {
                break;
            }
            periodStart = endCandidate;
        }

        // Normalize to midnight in the configured timezone to avoid DST shifting the calendar day
        const endDate = dayjs.tz(periodStart.add(unitCounts, chronoUnit).format("YYYY-MM-DD"), timezoneId);
        return {startDate: periodStart, endDate};
    }

    if (periodType === MembershipTypeEnum.DURATIONAL) {
        const startDate = now;
        let endDate: Dayjs;

        if (chronoUnit === "month") {
            const startDay = startDate.date();
            const startMonth = startDate.month() + 1;
            let endYear = startDate.year();
            let endMonth = startMonth + unitCounts;
            let endDay = startDay;

            while (endMonth > 12) {
                endMonth -= 12;
                endYear += 1;
            }

            if (startDay > 28) {
                const endMonthLength = dayjs(`${endYear}-${padTo2Digits(endMonth)}-01`).daysInMonth();
                if (endMonthLength < startDay) {
                    endDay = endMonthLength;
                }
            }

            endDate = dayjs(`${endYear}-${padTo2Digits(endMonth)}-${padTo2Digits(endDay)}`).tz(timezoneId);
        } else if (chronoUnit === "year") {
            const startDay = startDate.date();
            const startMonth = startDate.month() + 1;
            const endYear = startDate.year() + unitCounts;
            const endDay = (startDay === 29 && startMonth === 2) ? 28 : startDay;
            endDate = dayjs(`${endYear}-${padTo2Digits(startMonth)}-${padTo2Digits(endDay)}`).tz(timezoneId);
        } else {
            endDate = startDate.add(unitCounts, chronoUnit);
        }

        return {startDate, endDate};
    }

    return {startDate: now, endDate: now};
}

export {
    formatDateTime,
    localToUTCDate,
    localToUTCDatetime,
    formatDateTimeWithMs,
    getDefaultMembershipDates,
    getDefaultPeriodPaymentDates,
    getDefaultOneTimePaymentDates
};