
// Copied from https://bobbyhadz.com/blog/javascript-format-date-yyyy-mm-dd-hh-mm-ss

import {RoleEnum, SessionVO} from "../models";
import {PageGroupResponse, RolePermissionResponse} from "../models/responses";

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

/**
 * Check if the user has one of the given roles. There must be separate checking of roles in the backend. This is merely used to show or hide components in the frontend.
 * @param sessionVO SessionVO object
 * @param userRoles Array of short name roles (ADMIN, ORGANIZER, USER) to check if they're present.
 * @returns {boolean} Whether or not the user is of the given role(s).
 */
function checkRoles(sessionVO: SessionVO, userRoles: RoleEnum[]): boolean {
    for (let i = 0; i < userRoles.length; i++) {
        if (sessionVO.roles.indexOf(userRoles[i]) !== -1) {
            return true;
        }
    }

    return false;
}

function getPageGroupTitleByLanguage(language: string, pageGroup: PageGroupResponse) {
    let returnValue = '';

    for (let i = 0; i < pageGroup.pageGroupVersions.length; i++) {
        if (pageGroup.pageGroupVersions[i].language === language) {
            returnValue = pageGroup.pageGroupVersions[i].title;
            break;
        }
    }

    return (returnValue);
}

function getPageTitleByLanguage(language: string, page: any) {
    let returnValue = '';
    for (let i = 0; i < page.pageVersions.length; i++) {
        if (page.pageVersions[i].language === language) {
            returnValue = page.pageVersions[i].title;
            break;
        }
    }
    return (returnValue);
}

function getHighestRole(sessionVO: SessionVO): RoleEnum {
    if (sessionVO.roles.indexOf(RoleEnum.ROLE_ADMIN) !== -1) {
        return RoleEnum.ROLE_ADMIN;
    } else if (sessionVO.roles.indexOf(RoleEnum.ROLE_ORGANIZER) !== -1) {
        return RoleEnum.ROLE_ORGANIZER;
    } else if (sessionVO.roles.indexOf(RoleEnum.ROLE_USER) !== -1) {
        return RoleEnum.ROLE_USER;
    } else {
        return RoleEnum.ROLE_ANONYMOUS;
    }
}

function isAllowedToEditPage(sessionVO: SessionVO, pageRoles: RolePermissionResponse[]) {
    for (let i = 0; i < pageRoles.length; i++) {
        if (sessionVO.roles.indexOf(pageRoles[i].role) !== -1 && pageRoles[i].writePermission) {
            return true;
        }
    }

    return false;
}

export {
    formatDateTime,
    formatDateTimeWithMs,
    checkRoles,
    getPageGroupTitleByLanguage,
    getPageTitleByLanguage,
    getHighestRole,
    isAllowedToEditPage
};
