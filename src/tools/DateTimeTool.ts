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
    const membershipType: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-type");
    const membershipPeriodUnit: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-unit");
    const membershipPeriodStartPoint: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-start-point");
    const membershipPeriodStart: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-start");
    const membershipPeriodLength: string = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-period-length");
    const timezoneId: string = getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "timezone") || dayjs.tz.guess();

    const now = dayjs().tz(timezoneId);
    const unitCounts = parseInt(membershipPeriodLength, 10);
    const periodStartPoint = parseInt(membershipPeriodStartPoint, 10);
    const chronoUnit = (membershipPeriodUnit || "").toLowerCase() as dayjs.ManipulateType;

    if (membershipType === MembershipTypeEnum.DISABLED || membershipType === MembershipTypeEnum.PERPETUAL) {
        return {startDate: now, endDate: null};
    }

    if (membershipType === MembershipTypeEnum.PERIODICAL) {
        let periodStart = dayjs(membershipPeriodStart).tz(timezoneId);
        // Align to the current period
        while (periodStart.add(unitCounts, chronoUnit).isBefore(now)) {
            periodStart = periodStart.add(unitCounts, chronoUnit);
        }
        // Respect configured start point offset if any
        const adjustedStart = periodStart.add(periodStartPoint || 0, chronoUnit);
        const endDate = adjustedStart.add(unitCounts, chronoUnit);
        return {startDate: now, endDate};
    }

    if (membershipType === MembershipTypeEnum.DURATIONAL) {
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
    getDefaultMembershipDates
};