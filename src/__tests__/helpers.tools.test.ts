import {checkRoles} from "../helpers";
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

});