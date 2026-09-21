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

describe("OxalateTool.ts Tests", () => {
    describe("checkRoles", () => {
        const userRoles = [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_USER];

        it("returns true when user has the required role", () => {
            expect(checkRoles(userRoles, [RoleEnum.ROLE_ADMIN])).toBe(true);
        });

        it("returns false when user does not have the required role", () => {
            expect(checkRoles(userRoles, [RoleEnum.ROLE_ORGANIZER])).toBe(false);
        });

        it("returns false when input roles are null", () => {
            expect(checkRoles(null, [RoleEnum.ROLE_USER])).toBe(false);
        });
    });

    describe("getHighestRole", () => {
        it("returns the highest role from a list", () => {
            const roles = [RoleEnum.ROLE_USER, RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN];
            const userVO: UserSessionToken = {
                access_token: "",
                approved_terms: false,
                dive_count: 0,
                expires_at: new Date(),
                first_name: "",
                health_statement_id: 1,
                language: "",
                last_name: "",
                memberships: [],
                next_of_kin: "",
                payments: [],
                phone_number: "",
                primary_user_type: UserTypeEnum.SCUBA_DIVER,
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
        it("returns anonymous if no roles exist", () => {
            const userVO: UserSessionToken = {
                access_token: "",
                approved_terms: false,
                dive_count: 0,
                expires_at: new Date(),
                first_name: "",
                health_statement_id: null,
                language: "",
                last_name: "",
                memberships: [],
                next_of_kin: "",
                payments: [],
                phone_number: "",
                primary_user_type: UserTypeEnum.SCUBA_DIVER,
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

    describe("getPageGroupTitleByLanguage", () => {
        const pageGroup: PageGroupResponse = {
            id: 1,
            status: PageStatusEnum.PUBLISHED,
            page_group_versions: [
                {id: 11, page_group_id: 1, title: "English title", language: "en"},
                {id: 12, page_group_id: 1, title: "Suomenkielinen", language: "fi"}
            ],
            pages: []
        };

        it("returns matching title when language exists", () => {
            expect(getPageGroupTitleByLanguage("fi", pageGroup)).toBe("Suomenkielinen");
        });

        it("returns empty string when language missing", () => {
            expect(getPageGroupTitleByLanguage("sv", pageGroup)).toBe("");
        });
    });

    describe("getPageTitleByLanguage", () => {
        const page: PageResponse = {
            id: 1,
            page_group_id: 1,
            status: PageStatusEnum.PUBLISHED,
            page_versions: [
                {id: 21, page_id: 2, language: "en", title: "Page EN", ingress: "", body: ""},
                {id: 22, page_id: 2, language: "de", title: "Seite DE", ingress: "", body: ""}
            ],
            role_permissions: [],
            creator: 1,
            created_at: new Date(),
            modifier: null,
            modified_at: null
        } as const;

        it("returns title for existing language", () => {
            expect(getPageTitleByLanguage("de", page)).toBe("Seite DE");
        });

        it("returns empty when language not found", () => {
            expect(getPageTitleByLanguage("fi", page)).toBe("");
        });
    });

    describe("isAllowedToEditPage", () => {
        const pageRoles: RolePermissionResponse[] = [
            {id: 31, page_id: 3, role: RoleEnum.ROLE_ORGANIZER, read_permission: true, write_permission: true},
            {id: 32, page_id: 3, role: RoleEnum.ROLE_USER, read_permission: true, write_permission: false}
        ];

        const baseSession: UserSessionToken = {
            access_token: "",
            approved_terms: false,
            dive_count: 0,
            expires_at: new Date(),
            first_name: "",
            health_statement_id: 1,
            language: "",
            last_name: "",
            memberships: [],
            next_of_kin: "",
            payments: [],
            phone_number: "",
            primary_user_type: UserTypeEnum.SCUBA_DIVER,
            privacy: false,
            registered: new Date(),
            status: UserStatusEnum.ACTIVE,
            type: "",
            id: 5,
            username: "editor",
            roles: [RoleEnum.ROLE_ORGANIZER]
        };

        it("returns true when session has write permission role", () => {
            expect(isAllowedToEditPage(baseSession, pageRoles)).toBe(true);
        });

        it("returns false when no write permission exists", () => {
            const updated = {...baseSession, roles: [RoleEnum.ROLE_USER]};
            expect(isAllowedToEditPage(updated, pageRoles)).toBe(false);
        });
    });

    describe("healthStatementId field", () => {
        const createSession = (overrides: Partial<UserSessionToken> = {}): UserSessionToken => ({
            access_token: "",
            approved_terms: false,
            dive_count: 0,
            expires_at: new Date(),
            first_name: "",
            health_statement_id: null,
            language: "",
            last_name: "",
            memberships: [],
            next_of_kin: "",
            payments: [],
            phone_number: "",
            primary_user_type: UserTypeEnum.SCUBA_DIVER,
            privacy: false,
            registered: new Date(),
            status: UserStatusEnum.ACTIVE,
            type: "",
            id: 1,
            username: "testuser",
            roles: [RoleEnum.ROLE_USER],
            ...overrides
        });

        it("can be set to a numeric value", () => {
            const session = createSession({health_statement_id: 42});
            expect(session.health_statement_id).toBe(42);
        });

        it("can be set to null", () => {
            const session = createSession({health_statement_id: null});
            expect(session.health_statement_id).toBeNull();
        });

        it("defaults to null in the helper", () => {
            const session = createSession();
            expect(session.health_statement_id).toBeNull();
        });

        it("is preserved when spreading a session", () => {
            const session = createSession({health_statement_id: 7});
            const copy = {...session};
            expect(copy.health_statement_id).toBe(7);
        });

        it("can be overridden when spreading a session", () => {
            const session = createSession({health_statement_id: 7});
            const updated = {...session, health_statement_id: null};
            expect(updated.health_statement_id).toBeNull();
        });

        it("does not affect role resolution", () => {
            const withCheck = createSession({health_statement_id: 1, roles: [RoleEnum.ROLE_ADMIN]});
            const withoutCheck = createSession({health_statement_id: null, roles: [RoleEnum.ROLE_ADMIN]});
            expect(getHighestRole(withCheck)).toBe(RoleEnum.ROLE_ADMIN);
            expect(getHighestRole(withoutCheck)).toBe(RoleEnum.ROLE_ADMIN);
        });
    });
});
