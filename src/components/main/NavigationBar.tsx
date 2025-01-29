/// <reference types="vite-plugin-svgr/client" />
import { useSession } from "../../session";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { Tooltip } from "antd";
import i18next from "i18next";
import { useEffect, useState } from "react";
import { checkRoles, LanguageUtil } from "../../helpers";
import { PageGroupResponse } from "../../models/responses";
import { MembershipTypeEnum, PortalConfigGroupEnum, RoleEnum } from "../../models";
import { pageAPI } from "../../services";
import Logo from "../../portal_logo.svg?react";

export function NavigationBar() {
    const {userSession, logoutUser, getSessionLanguage, organizationName, setSessionLanguage, getPortalConfigurationValue, getFrontendConfigurationValue} = useSession();
    const [membershipType, setMembershipType] = useState<MembershipTypeEnum>(MembershipTypeEnum.DISABLED);

    const {t} = useTranslation();
    const [navigationElements, setNavigationElements] = useState<PageGroupResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [supportedLanguages, setSupportedLanguages] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        const fetchPaths = async () => {
            setLoading(true);
            const language = getSessionLanguage();

            pageAPI.getNavigationItems(language)
                    .then(navElements => {
                        setNavigationElements(JSON.parse(JSON.stringify(navElements)));
                        window.addEventListener("reloadNavigationEvent", fetchPaths);
                    })
                    .catch(e => {
                        console.error("Failed to load navigation items: " + e);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        };

        fetchPaths().catch(console.error);

        if (userSession) {
            const membershipTypeString = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "membership-type");
            setMembershipType(membershipTypeString.toUpperCase() as MembershipTypeEnum);
        }

        const languageList = getFrontendConfigurationValue("enabled-language").split(",");
        setSupportedLanguages(languageList.map(lang => {
            return {label: LanguageUtil.getLabelByValue(lang), value: lang};
        }));

        return () => {
            window.removeEventListener("reloadNavigationEvent", fetchPaths);
        };
    }, [userSession, getSessionLanguage, getPortalConfigurationValue, getFrontendConfigurationValue]);

    function switchLanguage(language: string) {
        setSessionLanguage(language);
        window.dispatchEvent(new Event("reloadNavigationEvent"));

        i18next.changeLanguage(language)
                .then()
                .catch(e => {
                    console.error("Failed to load language: " + language + ", error: " + e)
                });
    }

    return (
            <>
                {!loading && <nav className="navbar navbar-expand-lg bg-dark border-bottom border-body" data-bs-theme="dark">
                    <div className="container-fluid">
                        <div className="mx-auto order-0">
                            <Tooltip title={organizationName}>
                                <div style={{width: "156px", height: "64px", marginRight: "20px"}}>
                                    <NavLink to={"/"}><Logo
                                            style={{width: "100%", height: "100%"}}
                                    /></NavLink>
                                </div>
                            </Tooltip>
                        </div>
                        <div>
                            <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
                                    data-bs-target=".dual-collapse2">
                                <span className="navbar-toggler-icon"/>
                            </button>
                        </div>
                        <div className="navbar-collapse collapse w-100 order-2 order-md-0 dual-collapse2">
                            <ul className="navbar-nav me-auto">
                                {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) &&
                                        <li className="nav-item active">
                                            <div className="dropdown">
                                                <button className="nav-item nav-link dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                    {t("NavigationBar.administration.title")}
                                                </button>
                                                <ul className="dropdown-menu">
                                                    <li>
                                                        <NavLink to="/administration/main" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.readFirst")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/users" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.users")}</NavLink>
                                                    </li>
                                                    {membershipType !== MembershipTypeEnum.DISABLED
                                                            && <li>
                                                                <NavLink to="/administration/members" className="dropdown-item"
                                                                         type="button">{t("NavigationBar.administration.members")}</NavLink>
                                                            </li>}
                                                    <li>
                                                        <NavLink to="/administration/payments" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.payments")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/blocked-dates" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.blocked-dates")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/statistics" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.stats")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/audit" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.audits")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/files" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.files")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/download" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.download")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/administration/portal-configuration" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.administration.portal-configuration")}</NavLink>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>}
                                {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) &&
                                        <li className="nav-item active">
                                            <div className="dropdown">
                                                <button className="nav-item nav-link dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                    {t("NavigationBar.pageManagement.title")}
                                                </button>
                                                <ul className="dropdown-menu">
                                                    <li>
                                                        <NavLink to="/administration/page-groups" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.pageManagement.pages")}</NavLink>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>}
                                {userSession &&
                                        <li className="nav-item active">
                                            <div className="dropdown">
                                                <button className="nav-item nav-link dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false">
                                                    {t("NavigationBar.events.title")}
                                                </button>
                                                <ul className="dropdown-menu">
                                                    <li>
                                                        <NavLink to="/events/main" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.events.new")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/events/past" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.events.past")}</NavLink>
                                                    </li>
                                                    {checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) &&
                                                            <li>
                                                                <NavLink to="/events/add" className="dropdown-item"
                                                                         type="button">{t("NavigationBar.events.add")}</NavLink>
                                                            </li>
                                                    }
                                                    {userSession &&
                                                            <li>
                                                                <NavLink to="/events/dive-stats" className="dropdown-item"
                                                                         type="button">{t("NavigationBar.events.yearlyStats")}</NavLink>
                                                            </li>
                                                    }
                                                </ul>
                                            </div>
                                        </li>}
                                {navigationElements && navigationElements.map(navigationElement => {
                                    return (
                                            <li className="nav-item active" key={navigationElement.id}>
                                                <div className="dropdown">
                                                    <button className="nav-item nav-link dropdown-toggle"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false">{navigationElement.pageGroupVersions[0].title}</button>
                                                    <ul className="dropdown-menu">
                                                        {navigationElement.pages && navigationElement.pages.map(page => {
                                                            return (
                                                                    <li key={page.id}>
                                                                        <NavLink to={"/pages/" + page.id} className="dropdown-item"
                                                                                 type="button">{page.pageVersions[0].title}</NavLink>
                                                                    </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </li>
                                    );
                                })}
                                {userSession &&
                                        <li className="nav-item active">
                                            <div className="dropdown">
                                                <button className="nav-item nav-link dropdown-toggle"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false">{t("NavigationBar.forum.title")}</button>
                                                <ul className="dropdown-menu">
                                                    <li>
                                                        <NavLink to={"/forum"} className="dropdown-item"
                                                                 type="button">{t("NavigationBar.forum.link")}</NavLink>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>}
                            </ul>
                        </div>
                        <div className="navbar-collapse collapse w-100 order-3 dual-collapse2">
                            <ul className="navbar-nav ms-auto">
                                <li className="nav-item active">
                                    <div className="dropdown">
                                        <button className="nav-item nav-link dropdown-toggle"
                                                data-bs-toggle="dropdown"
                                                aria-expanded="false"
                                        >
                                            {getSessionLanguage() === undefined ? "Valitse kieli 🌐" : LanguageUtil.getLabelByValue(getSessionLanguage())}
                                        </button>
                                        <ul className="dropdown-menu dropdown-menu-end">
                                            {supportedLanguages.map(lang => {
                                                return (
                                                        <li
                                                                key={lang.value}
                                                                className="dropdown-item"
                                                                onClick={() => switchLanguage(lang.value)}
                                                                style={{cursor: "pointer"}}
                                                        >
                                                            {lang.label}
                                                        </li>);
                                            })}
                                        </ul>
                                    </div>
                                </li>
                                {userSession &&
                                        <li className="nav-item active">
                                            <div className="dropdown">
                                                <button className="nav-item nav-link dropdown-toggle"
                                                        data-bs-toggle="dropdown" aria-expanded="false">
                                                    {userSession.firstName} {userSession.lastName}
                                                </button>
                                                <ul className="dropdown-menu dropdown-menu-end">
                                                    <li>
                                                        <NavLink to="/users/profile" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.action.profile")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/users/password" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.action.changePassword")}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink onClick={logoutUser} to="/" className="dropdown-item"
                                                                 type="button">{t("NavigationBar.action.logout")}</NavLink>
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>}
                                {!userSession &&
                                        <>
                                            <li className="nav-item">
                                                <NavLink to="/login" className="nav-item nav-link">{t("NavigationBar.action.login")}</NavLink>
                                            </li>
                                            <li className="nav-item">
                                                <NavLink to="/auth/register" className="nav-item nav-link">{t("NavigationBar.action.register")}</NavLink>
                                            </li>
                                        </>
                                }
                            </ul>
                        </div>
                    </div>
                </nav>}
            </>
    );
}
