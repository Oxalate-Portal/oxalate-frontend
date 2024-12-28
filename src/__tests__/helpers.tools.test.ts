import dayjs, {Dayjs} from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {checkRoles, localToUTCDatetime} from "../helpers";
import {RoleEnum} from "../models";

describe('tools.ts Tests', () => {
    describe('checkRoles', () => {
        const userRoles = [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_USER];

        it('returns true when user has the required role', () => {
            expect(checkRoles(userRoles, [RoleEnum.ROLE_ADMIN])).toBe(true);
        });

        it('returns false when user does not have the required role', () => {
            expect(checkRoles(userRoles, [RoleEnum.ROLE_ORGANIZER])).toBe(false);
        });

        it('returns false when input roles are null', () => {
            expect(checkRoles(null, [RoleEnum.ROLE_USER])).toBe(false);
        });
    });

    // We need to take the local 2020-01-01T00:00:00.000 date of whatever timezone the test happens to run in, and the return value of the localToUTCDatetime
    // function should return a Date object that represents the same time string in time at the given timezone. So if the input date is
    // 2020-01-01T00:00:00.000+0200 (i.e. Finnish time), then the return value should for Australia/Lindeman be 2020-01-01T00:00:00.000+1000.
    describe('localToUTCDatetime', () => {
        dayjs.extend(customParseFormat);
        dayjs.extend(utc);
        dayjs.extend(timezone);
        // Timezone has +1000 offset
        const timeZone = "Australia/Lindeman";
        const inputDate: Dayjs = dayjs("2020-01-01T00:00:00.000");
        // This is the epoch of "2020-01-01T00:00:00.000" at the given timezone, see https://www.epochconverter.com/timezones?q=1577800800&tz=Australia%2FLindeman
        const expectedEpoch: number = 1577800800000;
        const methodResponse: Dayjs = localToUTCDatetime(inputDate, timeZone);

        it('Get the epoch of received date in the given timezone', () => {
            expect(methodResponse.valueOf()).toBe(expectedEpoch);
        });
    });
});