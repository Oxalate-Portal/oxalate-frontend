import dayjs, {Dayjs} from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {checkRoles, formatDateTime, formatDateTimeWithMs, getHighestRole, localToUTCDate, localToUTCDatetime} from "../tools";
import {RoleEnum, type UserSessionToken, UserStatusEnum, UserTypeEnum} from "../models";

// Initialize plugins once for all tests
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

describe('OxalateTool.ts Tests', () => {
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

    describe('formatDateTime tools', () => {
        const sample = dayjs("2020-01-01T12:34:56.789");

        it('formatDateTime returns a non-empty string', () => {
            const s = formatDateTime(sample as any);
            expect(typeof s).toBe("string");
            expect(s.length).toBeGreaterThan(0);
            expect(s).toContain("2020"); // stable substring
        });

        it('formatDateTimeWithMs returns a non-empty string', () => {
            const s = formatDateTimeWithMs(sample as any);
            expect(typeof s).toBe("string");
            expect(s.length).toBeGreaterThan(0);
            expect(s).toContain("2020");
        });
    });

    // We need to take the local 2020-01-01T00:00:00.000 date of whatever timezone the test happens to run in, and the return value of the localToUTCDatetime
    // function should return a Date object that represents the same time string in time at the given timezone. So if the input date is
    // 2020-01-01T00:00:00.000+0200 (i.e. Finnish time), then the return value should for Australia/Lindeman be 2020-01-01T00:00:00.000+1000.
    describe('localToUTCDatetime', () => {
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

    describe('localToUTCDate', () => {
        it('returns a valid Dayjs for the given timezone at local date', () => {
            const timeZone = "Australia/Lindeman";
            const inputDate: Dayjs = dayjs("2020-06-15"); // date-only
            const res = localToUTCDate(inputDate, timeZone);
            // Basic sanity checks to execute function body
            expect(dayjs.isDayjs(res)).toBe(true);
            expect(Number.isNaN(res.valueOf())).toBe(false);
        });
    });

    describe('getHighestRole', () => {
        it('returns the highest role from a list', () => {
            const roles = [RoleEnum.ROLE_USER, RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN];
            const userVO: UserSessionToken = {
                accessToken: "",
                approvedTerms: false,
                diveCount: 0,
                expiresAt: new Date(),
                firstName: "",
                language: "",
                lastName: "",
                memberships: [],
                nextOfKin: "",
                payments: [],
                phoneNumber: "",
                primaryUserType: UserTypeEnum.SCUBA_DIVER,
                privacy: false,
                registered: new Date(),
                status: UserStatusEnum.ACTIVE,
                type: "",
                id: 1,
                username: "testuser",
                roles: roles
            };
            const top = getHighestRole(userVO);
            expect(top).toBe(RoleEnum.ROLE_ADMIN);
        });

        it('handles empty or null lists gracefully', () => {
            const userVO: UserSessionToken = {
                accessToken: "",
                approvedTerms: false,
                diveCount: 0,
                expiresAt: new Date(),
                firstName: "",
                language: "",
                lastName: "",
                memberships: [],
                nextOfKin: "",
                payments: [],
                phoneNumber: "",
                primaryUserType: UserTypeEnum.SCUBA_DIVER,
                privacy: false,
                registered: new Date(),
                status: UserStatusEnum.ACTIVE,
                type: "",
                id: 1,
                username: "testuser",
                roles: []
            };
            expect(getHighestRole(userVO)).toBeDefined();
        });
    });
});