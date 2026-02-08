import {type PageGroupResponse, type PageResponse, RoleEnum, type RolePermissionResponse, type UserSessionToken} from "../models";


/**
 * Check if the user roles (haystack) has one of the given roles (needles). There must be separate checking of roles in the backend.
 * This is merely used to show or hide components in the frontend.
 * @param haystack This is the list of roles the user has. Can be also null in which case we return false immediately.
 * @param needles List of roles that we're looking for
 * @returns {boolean} Whether or not the user is of the given role(s).
 */
function checkRoles(haystack: RoleEnum[] | null, needles: RoleEnum[]): boolean {
    if (haystack === null) {
        return false;
    }

    for (let i = 0; i < needles.length; i++) {
        if (haystack.indexOf(needles[i]) !== -1) {
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

function getPageTitleByLanguage(language: string, page: PageResponse) {
    let returnValue = '';
    for (let i = 0; i < page.pageVersions.length; i++) {
        if (page.pageVersions[i].language === language) {
            returnValue = page.pageVersions[i].title;
            break;
        }
    }
    return (returnValue);
}

function getHighestRole(sessionVO: UserSessionToken): RoleEnum {
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

function isAllowedToEditPage(sessionVO: UserSessionToken, pageRoles: RolePermissionResponse[]) {
    for (let i = 0; i < pageRoles.length; i++) {
        if (sessionVO.roles.indexOf(pageRoles[i].role) !== -1 && pageRoles[i].writePermission) {
            return true;
        }
    }

    return false;
}

export {
    checkRoles,
    getPageGroupTitleByLanguage,
    getPageTitleByLanguage,
    getHighestRole,
    isAllowedToEditPage,
};
