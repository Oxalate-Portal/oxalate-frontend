import type {TFunction} from "i18next";
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
import {Tag} from "antd";
import type {JSX} from "react";
import type {PresetColorType} from "antd/es/_util/colors";

export function diveEventStatusEnum2Tag(status: DiveEventStatusEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const labelText = t("DiveEventStatusEnum." + status.toLowerCase());

    switch (status) {
        case DiveEventStatusEnum.DRAFTED:
            color = "yellow";
            break;
        case DiveEventStatusEnum.PUBLISHED:
            color = "green";
            break;
        case DiveEventStatusEnum.CANCELLED:
            color = "red";
            break;
        case DiveEventStatusEnum.HELD:
            color = "blue";
            break;
        default:
            color = "cyan";
    }

    return (<Tag color={color} key={`divetype-${recordId}`}>{labelText}</Tag>);
}

export function diveTypeEnum2Tag(type: DiveTypeEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const labelText = t("DiveTypeEnum." + type.toLowerCase());

    switch (type) {
        case DiveTypeEnum.BOAT:
            color = "yellow";
            break;
        case DiveTypeEnum.CAVE:
            color = "blue";
            break;
        case DiveTypeEnum.CURRENT:
            color = "gold";
            break;
        case DiveTypeEnum.OPEN_AND_CAVE:
            color = "green";
            break;
        case DiveTypeEnum.OPEN_WATER:
            color = "volcano";
            break;
        case DiveTypeEnum.SURFACE:
            color = "pink-inverse";
            break;
        default:
            color = "red";
    }

    return (<Tag color={color} key={`divetype-${recordId}`}>{labelText}</Tag>);
}

export function membershipStatusEnum2Tag(status: MembershipStatusEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("MembershipStatusEnum." + status.toLowerCase());

    switch (status) {
        case MembershipStatusEnum.ACTIVE:
            color = "green";
            break;
        case MembershipStatusEnum.EXPIRED:
            color = "orange";
            break;
        case MembershipStatusEnum.CANCELLED:
            color = "red";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"membership-status-" + recordId}>{label}</Tag>);
}

export function membershipTypeEnum2Tag(type: MembershipTypeEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("MembershipTypeEnum." + type.toLowerCase());

    switch (type) {
        case MembershipTypeEnum.DISABLED:
            color = "red";
            break;
        case MembershipTypeEnum.DURATIONAL:
            color = "yellow";
            break;
        case MembershipTypeEnum.PERIODICAL:
            color = "blue";
            break;
        case MembershipTypeEnum.PERPETUAL:
            color = "green";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"membership-type-" + recordId}>{label}</Tag>);
}

export function pageStatusEnum2Tag(status: PageStatusEnum, t: TFunction, recordId: number): JSX.Element {
    let color = "";
    const label = t("common.pages.status." +status.toLowerCase());

    switch (status) {
        case PageStatusEnum.DRAFTED:
            color = "blue";
            break;
        case PageStatusEnum.PUBLISHED:
            color = "green";
            break;
        case PageStatusEnum.DELETED:
            color = "red";
            break;
    }

    return (<Tag color={color} key={recordId + "-status-" + status + "-" + recordId}>{label}</Tag>);

}

export function paymentTypeEnum2Tag(type: PaymentTypeEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("PaymentTypeEnum." + type);

    switch(type) {
        case PaymentTypeEnum.PERIODICAL:
            color = "green";
            break;
        case PaymentTypeEnum.ONE_TIME:
            color = "blue";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"payment-type-" + recordId}>{label}</Tag>);
}

export function reportStatusEnum2Tag(status: ReportStatusEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("ReportStatusEnum." + status.toLowerCase());

    switch(status) {
        case ReportStatusEnum.APPROVED:
            color = "green";
            break;
        case ReportStatusEnum.CANCELLED:
            color = "orange";
            break;
        case ReportStatusEnum.PENDING:
            color = "blue";
            break;
        case ReportStatusEnum.REJECTED:
            color = "red";
            break;
        default:
            color = "cyan";
            break;
    }

    return (<Tag color={color} key={"report-status-" + recordId}>{label}</Tag>);
}

export function roleEnum2Tag(role: RoleEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("common.roles." + role.toLowerCase());

    switch(role) {
        case RoleEnum.ROLE_ANONYMOUS:
            color = "red";
            break;
        case RoleEnum.ROLE_USER:
            color = "green";
            break;
        case RoleEnum.ROLE_ORGANIZER:
            color = "blue";
            break;
        case RoleEnum.ROLE_ADMIN:
            color = "cyan";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"role-label-" + recordId + "-" + role.toLowerCase()}>{label}</Tag>);
}

export function commentStatusEnum2Tag(status: CommentStatusEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("CommentStatusEnum." + status.toLowerCase());

    switch(status) {
        case CommentStatusEnum.DRAFTED:
            color = "blue";
            break;
        case CommentStatusEnum.PUBLISHED:
            color = "green";
            break;
        case CommentStatusEnum.HELD_FOR_MODERATION:
            color = "orange";
            break;
        case CommentStatusEnum.REJECTED:
            color = "red";
            break;
        case CommentStatusEnum.CANCELLED:
            color = "red-inverse";
            break;
        default:
            color = "cyan";
            break;
    }

    return (<Tag color={color} key={"comment-status-" + recordId}>{label}</Tag>);
}

export function commentTypeEnum2Tag(type: CommentTypeEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("CommentTypeEnum." + type.toLowerCase());

    switch(type) {
        case CommentTypeEnum.TOPIC:
            color = "green";
            break;
        case CommentTypeEnum.USER_COMMENT:
            color = "blue";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"comment-type-" + recordId}>{label}</Tag>);
}

export function userTypeEnum2Tag(type: UserTypeEnum, t: TFunction, recordId: number): JSX.Element {
    let color: PresetColorType;
    const label = t("UserTypeEnum." + type.toLowerCase());
    switch (type) {
        case UserTypeEnum.NON_DIVER:
            color = "yellow";
            break;
        case UserTypeEnum.SCUBA_DIVER:
            color = "green";
            break;
        case UserTypeEnum.FREE_DIVER:
            color = "blue";
            break;
        case UserTypeEnum.SNORKLER:
            color = "magenta";
            break;
        default:
            color = "red";
            break;
    }

    return (<Tag color={color} key={"user-type-" + recordId}>{label}</Tag>);
}
