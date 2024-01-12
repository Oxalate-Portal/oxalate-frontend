import { ReactComponent as Logo } from "../../portal_logo.svg";
import { useSession } from "../../session";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { Tooltip } from "antd";
import i18next from "i18next";
import { useEffect, useState } from "react";
import { checkRoles, LanguageUtil } from "../../helpers";
import { PageGroupResponse } from "../../models/responses";
import { RoleEnum } from "../../models";
import { navigationAPI } from "../../services";

export function NavigationBar() {
    const {userSession, logoutUser, getSessionLanguage, setSessionLanguage} = useSession();

    const {t} = useTranslation();
    const [navigationElements, setNavigationElements] = useState<PageGroupResponse[]>([]);

    useEffect(() => {
        const fetchPaths = async () => {
            const language = getSessionLanguage();

            const navElements = await navigationAPI.getNavigationItems(language);

            if (navElements) {
                setNavigationElements(JSON.parse(JSON.stringify(navElements)));
            }
        };

        window.addEventListener("reloadNavigationEvent", fetchPaths);

        fetchPaths().catch(console.error);

        return () => {
            window.removeEventListener("reloadNavigationEvent", fetchPaths);
        };
    }, [getSessionLanguage]);

    function switchLanguage(language: string) {
        // TODO we need a separate session variable for the language which is not tied to the user session
        setSessionLanguage(language);
        window.dispatchEvent(new Event("reloadNavigationEvent"));
        i18next.changeLanguage(language).then().catch(e => console.log("Failed to load language: " + language + ", error: " + e));
    }

    return (
            <nav className="navbar navbar-expand-lg bg-dark border-bottom border-body" data-bs-theme="dark">
                <div className="container-fluid">
                    <div className="mx-auto order-0">
                        <Tooltip title={process.env.REACT_APP_OXALATE_PAGE_TITLE}>
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
                            {userSession && checkRoles(userSession, [RoleEnum.ROLE_ADMIN]) &&
                                    <li className="nav-item active">
                                        <div className="dropdown">
                                            <button className="nav-item nav-link dropdown-toggle"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false">
                                                {t("nav.administration.title")}
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <NavLink to="/administration/main" className="dropdown-item"
                                                             type="button">{t("nav.administration.readFirst")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/administration/users" className="dropdown-item"
                                                             type="button">{t("nav.administration.members")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/administration/payments" className="dropdown-item"
                                                             type="button">{t("nav.administration.payments")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/administration/statistics" className="dropdown-item"
                                                             type="button">{t("nav.administration.stats")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/administration/audit" className="dropdown-item"
                                                             type="button">{t("nav.administration.audits")}</NavLink>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>}
                            {userSession && checkRoles(userSession, [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) &&
                                    <li className="nav-item active">
                                        <div className="dropdown">
                                            <button className="nav-item nav-link dropdown-toggle"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false">
                                                {t("nav.pageManagement.title")}
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <NavLink to="/administration/page-groups" className="dropdown-item"
                                                             type="button">{t("nav.pageManagement.pages")}</NavLink>
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
                                                {t("nav.events.title")}
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li>
                                                    <NavLink to="/events/main" className="dropdown-item" type="button">{t("nav.events.new")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/events/past" className="dropdown-item" type="button">{t("nav.events.past")}</NavLink>
                                                </li>
                                                {checkRoles(userSession, [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) &&
                                                        <li>
                                                            <NavLink to="/events/add" className="dropdown-item" type="button">{t("nav.events.add")}</NavLink>
                                                        </li>
                                                }
                                                {userSession &&
                                                        <li>
                                                            <NavLink to="/events/dive-stats" className="dropdown-item"
                                                                     type="button">{t("nav.events.yearlyStats")}</NavLink>
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
                                        {LanguageUtil.getLanguages().map(lang => {
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
                                                    <NavLink to="/users/profile" className="dropdown-item" type="button">{t("nav.action.profile")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/users/password" className="dropdown-item"
                                                             type="button">{t("nav.action.changePassword")}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink onClick={logoutUser} to="/" className="dropdown-item"
                                                             type="button">{t("nav.action.logout")}</NavLink>
                                                </li>
                                            </ul>
                                        </div>
                                    </li>}
                            {!userSession &&
                                    <>
                                        <li className="nav-item">
                                            <NavLink to="/login" className="nav-item nav-link">{t("nav.action.login")}</NavLink>
                                        </li>
                                        <li className="nav-item">
                                            <NavLink to="/auth/register" className="nav-item nav-link">{t("nav.action.register")}</NavLink>
                                        </li>
                                    </>
                            }
                        </ul>
                    </div>
                </div>
            </nav>
    );
}
