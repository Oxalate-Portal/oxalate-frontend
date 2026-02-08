import {
    type PageGroupResponse,
    type PageResponse,
    PageStatusEnum,
    RoleEnum,
    type RolePermissionResponse,
    type UserSessionToken,
    UserStatusEnum,
    UserTypeEnum
} from "../models";
import {checkRoles, getHighestRole, getPageGroupTitleByLanguage, getPageTitleByLanguage, isAllowedToEditPage} from "../tools";

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
        it('returns anonymous if no roles exist', () => {
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
                id: 2,
                username: "no-role",
                roles: []
            };
            expect(getHighestRole(userVO)).toBe(RoleEnum.ROLE_ANONYMOUS);
        });
    });

    describe('getPageGroupTitleByLanguage', () => {
        const pageGroup: PageGroupResponse = {
            id: 1,
            status: PageStatusEnum.PUBLISHED,
            pageGroupVersions: [
                {id: 11, pageGroupId: 1, title: "English title", language: "en"},
                {id: 12, pageGroupId: 1, title: "Suomenkielinen", language: "fi"}
            ],
            pages: []
        };

        it('returns matching title when language exists', () => {
            expect(getPageGroupTitleByLanguage("fi", pageGroup)).toBe("Suomenkielinen");
        });

        it('returns empty string when language missing', () => {
            expect(getPageGroupTitleByLanguage("sv", pageGroup)).toBe("");
        });
    });

    describe('getPageTitleByLanguage', () => {
        const page: PageResponse = {
            id: 1,
            pageGroupId: 1,
            status: PageStatusEnum.PUBLISHED,
            pageVersions: [
                {id: 21, pageId: 2, language: "en", title: "Page EN", ingress: "", body: ""},
                {id: 22, pageId: 2, language: "de", title: "Seite DE", ingress: "", body: ""}
            ],
            rolePermissions: [],
            creator: 1,
            createdAt: new Date(),
            modifier: null,
            modifiedAt: null
        } as const;

        it('returns title for existing language', () => {
            expect(getPageTitleByLanguage("de", page)).toBe("Seite DE");
        });

        it('returns empty when language not found', () => {
            expect(getPageTitleByLanguage("fi", page)).toBe("");
        });
    });

    describe('isAllowedToEditPage', () => {
        const pageRoles: RolePermissionResponse[] = [
            {id: 31, pageId: 3, role: RoleEnum.ROLE_ORGANIZER, readPermission: true, writePermission: true},
            {id: 32, pageId: 3, role: RoleEnum.ROLE_USER, readPermission: true, writePermission: false}
        ];

        const baseSession: UserSessionToken = {
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
            id: 5,
            username: "editor",
            roles: [RoleEnum.ROLE_ORGANIZER]
        };

        it('returns true when session has write permission role', () => {
            expect(isAllowedToEditPage(baseSession, pageRoles)).toBe(true);
        });

        it('returns false when no write permission exists', () => {
            const updated = {...baseSession, roles: [RoleEnum.ROLE_USER]};
            expect(isAllowedToEditPage(updated, pageRoles)).toBe(false);
        });
    });
});