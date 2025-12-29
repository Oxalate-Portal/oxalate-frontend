import type {TFunction} from "i18next";
import type {ReactElement, ReactNode} from "react";
import {
    commentStatusEnum2Tag,
    commentTypeEnum2Tag,
    diveEventStatusEnum2Tag,
    diveTypeEnum2Tag,
    membershipStatusEnum2Tag,
    membershipTypeEnum2Tag,
    pageStatusEnum2Tag,
    paymentTypeEnum2Tag,
    reportStatusEnum2Tag,
    roleEnum2Tag,
    userTypeEnum2Tag
} from "../tools";
import {
    CommentStatusEnum,
    CommentTypeEnum,
    DiveEventStatusEnum,
    DiveTypeEnum,
    MembershipStatusEnum,
    MembershipTypeEnum,
    PageStatusEnum,
    PaymentTypeEnum,
    ReportStatusEnum,
    RoleEnum,
    UserTypeEnum
} from "../models";

const makeTFunction = () => Object.assign(
    (key: string) => `translated:${key}`,
    {$TFunctionBrand: undefined}
) as TFunction;

describe("Enum2TagTool", () => {
    const t = makeTFunction();

    const expectTag = (element: ReactElement<{ children: ReactNode; color: string }>, key: string, color: string) => {
        expect(element.props.children).toBe(`translated:${key}`);
        expect(element.props.color).toBe(color);
    };

    describe("diveEventStatusEnum2Tag", () => {
        const cases: Array<[DiveEventStatusEnum, string]> = [
            [DiveEventStatusEnum.DRAFTED, "yellow"],
            [DiveEventStatusEnum.PUBLISHED, "green"],
            [DiveEventStatusEnum.CANCELLED, "red"],
            [DiveEventStatusEnum.HELD, "blue"]
        ];
        cases.forEach(([status, color], index) => {
            it(`renders ${status} with ${color}`, () => {
                const tag = diveEventStatusEnum2Tag(status, t, index);
                expectTag(tag, `DiveEventStatusEnum.${status.toLowerCase()}`, color);
                expect(tag.key).toContain(`${index}`);
            });
        });
    });

    describe("diveTypeEnum2Tag", () => {
        const cases: Array<[DiveTypeEnum, string]> = [
            [DiveTypeEnum.BOAT, "yellow"],
            [DiveTypeEnum.CAVE, "blue"],
            [DiveTypeEnum.CURRENT, "gold"],
            [DiveTypeEnum.OPEN_AND_CAVE, "green"],
            [DiveTypeEnum.OPEN_WATER, "volcano"],
            [DiveTypeEnum.SURFACE, "pink-inverse"]
        ];
        cases.forEach(([type, color], index) => {
            it(`renders ${type} with ${color}`, () => {
                const tag = diveTypeEnum2Tag(type, t, index);
                expectTag(tag, `DiveTypeEnum.${type}`, color);
            });
        });
    });

    describe("membershipStatusEnum2Tag", () => {
        const cases: Array<[MembershipStatusEnum, string]> = [
            [MembershipStatusEnum.ACTIVE, "green"],
            [MembershipStatusEnum.EXPIRED, "orange"],
            [MembershipStatusEnum.CANCELLED, "red"]
        ];
        cases.forEach(([status, color]) => {
            it(`renders ${status} with ${color}`, () => {
                const tag = membershipStatusEnum2Tag(status, t, 0);
                expectTag(tag, `MembershipStatusEnum.${status.toLowerCase()}`, color);
            });
        });
    });

    describe("membershipTypeEnum2Tag", () => {
        const cases: Array<[MembershipTypeEnum, string]> = [
            [MembershipTypeEnum.DISABLED, "red"],
            [MembershipTypeEnum.DURATIONAL, "yellow"],
            [MembershipTypeEnum.PERIODICAL, "blue"],
            [MembershipTypeEnum.PERPETUAL, "green"]
        ];
        cases.forEach(([type, color]) => {
            it(`renders ${type} with ${color}`, () => {
                const tag = membershipTypeEnum2Tag(type, t, 1);
                expectTag(tag, `MembershipTypeEnum.${type.toLowerCase()}`, color);
            });
        });
    });

    describe("pageStatusEnum2Tag", () => {
        const cases: Array<[PageStatusEnum, string]> = [
            [PageStatusEnum.DRAFTED, "blue"],
            [PageStatusEnum.PUBLISHED, "green"],
            [PageStatusEnum.DELETED, "red"]
        ];
        cases.forEach(([status, color]) => {
            it(`renders ${status} with ${color}`, () => {
                const tag = pageStatusEnum2Tag(status, t, 2);
                expectTag(tag, `common.pages.status.${status.toLowerCase()}`, color);
            });
        });
    });

    describe("paymentTypeEnum2Tag", () => {
        const cases: Array<[PaymentTypeEnum, string]> = [
            [PaymentTypeEnum.PERIOD, "green"],
            [PaymentTypeEnum.ONE_TIME, "blue"],
            [PaymentTypeEnum.NONE, "red"]
        ];
        cases.forEach(([type, color]) => {
            it(`renders ${type} with ${color}`, () => {
                const tag = paymentTypeEnum2Tag(type, t, 3);
                expectTag(tag, `PaymentTypeEnum.${type}`, color);
            });
        });
    });

    describe("reportStatusEnum2Tag", () => {
        const cases: Array<[ReportStatusEnum, string]> = [
            [ReportStatusEnum.APPROVED, "green"],
            [ReportStatusEnum.PENDING, "blue"],
            [ReportStatusEnum.CANCELLED, "orange"],
            [ReportStatusEnum.REJECTED, "red"]
        ];
        cases.forEach(([status, color]) => {
            it(`renders ${status} with ${color}`, () => {
                const tag = reportStatusEnum2Tag(status, t, 4);
                expectTag(tag, `ReportStatusEnum.${status.toLowerCase()}`, color);
            });
        });
    });

    describe("roleEnum2Tag", () => {
        const cases: Array<[RoleEnum, string]> = [
            [RoleEnum.ROLE_ANONYMOUS, "red"],
            [RoleEnum.ROLE_USER, "green"],
            [RoleEnum.ROLE_ORGANIZER, "blue"],
            [RoleEnum.ROLE_ADMIN, "cyan"]
        ];
        cases.forEach(([role, color]) => {
            it(`renders ${role} with ${color}`, () => {
                const tag = roleEnum2Tag(role, t, 5);
                expectTag(tag, `common.roles.${role.toLowerCase()}`, color);
            });
        });
    });

    describe("commentStatusEnum2Tag", () => {
        const cases: Array<[CommentStatusEnum, string]> = [
            [CommentStatusEnum.DRAFTED, "blue"],
            [CommentStatusEnum.PUBLISHED, "green"],
            [CommentStatusEnum.HELD_FOR_MODERATION, "orange"],
            [CommentStatusEnum.REJECTED, "red"],
            [CommentStatusEnum.CANCELLED, "red-inverse"]
        ];
        cases.forEach(([status, color]) => {
            it(`renders ${status} with ${color}`, () => {
                const tag = commentStatusEnum2Tag(status, t, 6);
                expectTag(tag, `CommentStatusEnum.${status.toLowerCase()}`, color);
            });
        });
    });

    describe("commentTypeEnum2Tag", () => {
        const cases: Array<[CommentTypeEnum, string]> = [
            [CommentTypeEnum.TOPIC, "green"],
            [CommentTypeEnum.USER_COMMENT, "blue"]
        ];
        cases.forEach(([type, color]) => {
            it(`renders ${type} with ${color}`, () => {
                const tag = commentTypeEnum2Tag(type, t, 7);
                expectTag(tag, `CommentTypeEnum.${type.toLowerCase()}`, color);
            });
        });
    });

    describe("userTypeEnum2Tag", () => {
        const cases: Array<[UserTypeEnum, string]> = [
            [UserTypeEnum.NON_DIVER, "yellow"],
            [UserTypeEnum.SCUBA_DIVER, "green"],
            [UserTypeEnum.FREE_DIVER, "blue"],
            [UserTypeEnum.SNORKLER, "magenta"]
        ];
        cases.forEach(([type, color]) => {
            it(`renders ${type} with ${color}`, () => {
                const tag = userTypeEnum2Tag(type, t, 8);
                expectTag(tag, `UserTypeEnum.${type.toLowerCase()}`, color);
            });
        });
    });

    describe("default color fallbacks", () => {
        it("uses cyan for unknown dive event status", () => {
            const tag = diveEventStatusEnum2Tag("UNKNOWN" as DiveEventStatusEnum, t, 11);
            expect(tag.props.color).toBe("cyan");
        });
        it("uses red for unknown dive type", () => {
            const tag = diveTypeEnum2Tag("UNKNOWN" as DiveTypeEnum, t, 12);
            expect(tag.props.color).toBe("red");
        });
        it("uses red for unknown membership status", () => {
            const tag = membershipStatusEnum2Tag("UNKNOWN" as MembershipStatusEnum, t, 13);
            expect(tag.props.color).toBe("red");
        });
        it("uses red for unknown membership type", () => {
            const tag = membershipTypeEnum2Tag("UNKNOWN" as MembershipTypeEnum, t, 14);
            expect(tag.props.color).toBe("red");
        });
        it("uses red for unknown payment type", () => {
            const tag = paymentTypeEnum2Tag("UNKNOWN" as PaymentTypeEnum, t, 15);
            expect(tag.props.color).toBe("red");
        });
        it("uses red for unknown role", () => {
            const tag = roleEnum2Tag("UNKNOWN" as RoleEnum, t, 16);
            expect(tag.props.color).toBe("red");
        });
        it("uses cyan for unknown report status", () => {
            const tag = reportStatusEnum2Tag("UNKNOWN" as ReportStatusEnum, t, 17);
            expect(tag.props.color).toBe("cyan");
        });
        it("uses cyan for unknown comment status", () => {
            const tag = commentStatusEnum2Tag("UNKNOWN" as CommentStatusEnum, t, 18);
            expect(tag.props.color).toBe("cyan");
        });
        it("uses red for unknown comment type", () => {
            const tag = commentTypeEnum2Tag("UNKNOWN" as CommentTypeEnum, t, 19);
            expect(tag.props.color).toBe("red");
        });
        it("uses red for unknown user type", () => {
            const tag = userTypeEnum2Tag("UNKNOWN" as UserTypeEnum, t, 20);
            expect(tag.props.color).toBe("red");
        });
    });
});
