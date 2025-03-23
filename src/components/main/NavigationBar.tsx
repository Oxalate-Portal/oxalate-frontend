import {
    AppstoreOutlined,
    BarChartOutlined,
    CalendarOutlined,
    ContainerOutlined,
    DownloadOutlined,
    FileOutlined,
    FileTextOutlined,
    FormOutlined,
    GlobalOutlined,
    HistoryOutlined,
    LoginOutlined,
    MenuOutlined,
    MessageOutlined,
    PlusOutlined,
    ScheduleOutlined,
    SettingOutlined,
    SnippetsOutlined,
    UnorderedListOutlined,
    UserOutlined
} from "@ant-design/icons";
import { Layout, Menu, MenuProps, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useSession } from "../../session";
import { checkRoles, LanguageUtil } from "../../helpers";
import { MembershipTypeEnum, PortalConfigGroupEnum, RoleEnum } from "../../models";
import { PageGroupResponse } from "../../models/responses";
import { pageAPI } from "../../services";
import Logo from "../../portal_logo.svg?react";

const {Header} = Layout;

export function NavigationBar() {
    const {
        userSession,
        logoutUser,
        getSessionLanguage,
        organizationName,
        setSessionLanguage,
        getPortalConfigurationValue,
        getFrontendConfigurationValue
    } = useSession();
    const [current, setCurrent] = useState("mail");
    const {t} = useTranslation();

    const [navigationElements, setNavigationElements] = useState<PageGroupResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [membershipType, setMembershipType] = useState<MembershipTypeEnum>(MembershipTypeEnum.DISABLED);
    const [supportedLanguages, setSupportedLanguages] = useState<{ label: string; value: string }[]>([]);
    const [forumEnabled, setForumEnabled] = useState<boolean>(false);

    const adminMenuItems: MenuProps["items"] = [
        {
            label: t("NavigationBar.administration.title"),
            key: "admin",
            icon: <SnippetsOutlined/>,
            children: [
                {
                    label: (<NavLink to="/administration/main">{t("NavigationBar.administration.readFirst")}</NavLink>),
                    key: "layout",
                    icon: <FormOutlined/>
                },
                {
                    label: (<NavLink to="/administration/users">{t("NavigationBar.administration.users")}</NavLink>),
                    key: "users",
                    icon: <AppstoreOutlined/>
                },
                    ...(membershipType !== MembershipTypeEnum.DISABLED && [{
                    label: (<NavLink to="/administration/members">{t("NavigationBar.administration.members")}</NavLink>),
                    key: "members",
                    icon: <ContainerOutlined/>
                }] || []),
                {
                    label: (<NavLink to="/administration/payments">{t("NavigationBar.administration.payments")}</NavLink>),
                    key: "payments",
                    icon: <FileTextOutlined/>
                },
                {
                    label: (<NavLink to="/administration/blocked-dates">{t("NavigationBar.administration.blocked-dates")}</NavLink>),
                    key: "blocked-dates",
                    icon: <CalendarOutlined/>
                },
                {
                    label: (<NavLink to="/administration/comment-moderation">{t("NavigationBar.administration.comment-moderation")}</NavLink>),
                    key: "comment-moderation",
                    icon: <MessageOutlined/>
                },
                {
                    label: (<NavLink to="/administration/statistics">{t("NavigationBar.administration.stats")}</NavLink>),
                    key: "stats",
                    icon: <BarChartOutlined/>
                },
                {
                    label: (<NavLink to="/administration/audit">{t("NavigationBar.administration.audits")}</NavLink>),
                    key: "audits",
                    icon: <HistoryOutlined/>
                },
                {
                    label: (<NavLink to="/administration/files">{t("NavigationBar.administration.files")}</NavLink>),
                    key: "files",
                    icon: <FileOutlined/>
                },
                {
                    label: (<NavLink to="/administration/download">{t("NavigationBar.administration.download")}</NavLink>),
                    key: "download",
                    icon: <DownloadOutlined/>
                },
                {
                    label: (<NavLink to="/administration/portal-configuration">{t("NavigationBar.administration.portal-configuration")}</NavLink>),
                    key: "portal-configuration",
                    icon: <SettingOutlined/>
                }
            ]
        }
    ];

    const pageManagementMenuItems: MenuProps["items"] = [
        {
            key: "pageManagement",
            label: t("NavigationBar.pageManagement.title"),
            icon: <FileTextOutlined/>,
            children: [
                {
                    key: "pages",
                    label: "Pages",
                    icon: <FileOutlined/>,
                    children: [
                        {
                            key: "pageList",
                            label: "Page List",
                            icon: <UnorderedListOutlined/>,
                        },
                        {
                            key: "pageCreate",
                            label: "Create Page",
                            icon: <PlusOutlined/>,
                        },
                    ],
                },
                {
                    key: "menuManagement",
                    label: "Menu Management",
                    icon: <MenuOutlined/>,
                    children: [
                        {
                            key: "menuList",
                            label: "Menu List",
                            icon: <UnorderedListOutlined/>,
                        },
                        {
                            key: "menuCreate",
                            label: "Create Menu",
                            icon: <PlusOutlined/>,
                        },
                    ],
                },
            ],
        },
    ];

    const diveEventMenuItems: MenuProps["items"] = [
        {
            label: t("NavigationBar.events.title"),
            key: "diveEvents",
            icon: <CalendarOutlined/>,
            children: [
                {
                    label: (<NavLink to={"/events/main"}>{t("NavigationBar.events.new")}</NavLink>),
                    key: "events-new",
                    icon: <ScheduleOutlined/>,
                },
                {
                    label: (<NavLink to={"/events/past"}>{t("NavigationBar.events.past")}</NavLink>),
                    key: "events-past",
                    icon: <UnorderedListOutlined/>,
                },
                ...(userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN, RoleEnum.ROLE_ORGANIZER]) ? [{
                    label: (<NavLink to="/events/add">{t("NavigationBar.events.add")}</NavLink>),
                    key: "events-add",
                    icon: <PlusOutlined/>
                }] : []),
                {
                    label: (<NavLink to="/events/dive-stats">{t("NavigationBar.events.yearlyStats")}</NavLink>),
                    key: "events-dive-stats",
                    icon: <BarChartOutlined/>,
                },
            ],
        },
    ];

    // We generate the infoMenuItems from the page versions belonging to the "info" group.
    const pageMenus: MenuProps["items"][] = navigationElements.map(navigationElement => {
        return [{
            label: navigationElement.pageGroupVersions[0].title,
            key: `pagegroup-${navigationElement.id}`,
            children: navigationElement.pages.map(page => ({
                label: (
                        <NavLink to={`/pages/${page.id}`} className="dropdown-item" type="button">
                            {page.pageVersions[0].title}
                        </NavLink>
                ),
                key: `page-${navigationElement.id}-${page.id}`
            }))
        }];
    });

    const forumMenuItems: MenuProps["items"] = [
        {
            label: t("NavigationBar.forum.title"),
            key: "forum",
            icon: <SnippetsOutlined/>,
            children: [
                {
                    label: (<NavLink to="/forum">{t("NavigationBar.forum.link")}</NavLink>),
                    key: "forum-main",
                    icon: <FormOutlined/>
                }
            ]
        }
    ];

    const userMenuItems: MenuProps["items"] = [
        {
            label: userSession ? userSession.firstName + " " + userSession.lastName : "",
            key: "profile",
            icon: <UserOutlined/>,
            children: [
                {
                    label: (<NavLink to="/users/profile">{t("NavigationBar.action.profile")}</NavLink>),
                    key: "profile-account",
                    icon: <SettingOutlined/>
                },
                {
                    label: (<NavLink to="/users/password">{t("NavigationBar.action.changePassword")}</NavLink>),
                    key: "profile-changePassword",
                    icon: <SettingOutlined/>
                },
                {
                    label: (<NavLink onClick={logoutUser} to="/">{t("NavigationBar.action.logout")}</NavLink>),
                    key: "profile-logout",
                    icon: <LoginOutlined/>
                }
            ]
        }
    ];

    const loginMenuItems: MenuProps["items"] = [
        {
            label: (<NavLink to="/login" type={"button"}>{t("NavigationBar.action.login")}</NavLink>),
            key: "user-login",
            icon: <LoginOutlined/>
        }
    ];

    const registerMenuItems: MenuProps["items"] = [
        {
            label: (<NavLink to="/auth/register">{t("NavigationBar.action.register")}</NavLink>),
            key: "user-register",
            icon: <FormOutlined/>
        }
    ];

    const languageMenuItems: MenuProps["items"] = [
        {
            label: LanguageUtil.getLabelByValue(getSessionLanguage()),
            key: "language-menu-main",
            icon: <GlobalOutlined/>,
            children: supportedLanguages.map(lang => {
                return {
                    label: lang.label,
                    key: lang.value,
                    onClick: () => {
                        setSessionLanguage(lang.value);
                    }
                };
            })
        }
    ];


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

            if ((getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled") === "true")
                    && (getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled-features").includes("forum"))) {
                setForumEnabled(true);
            }
        }

        const languageList = getFrontendConfigurationValue("enabled-language").split(",");
        setSupportedLanguages(languageList.map(lang => {
            return {label: LanguageUtil.getLabelByValue(lang), value: lang};
        }));

        return () => {
            window.removeEventListener("reloadNavigationEvent", fetchPaths);
        };
    }, [userSession, getSessionLanguage, getPortalConfigurationValue, getFrontendConfigurationValue]);

    const onClick: MenuProps["onClick"] = (e) => {
        setCurrent(e.key);
    };

    return (
            <>
                {!loading && <Header
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            maxWidth: "100%",
                            backgroundColor: "#191919",
                            padding: "0 16px"
                        }}
                        key={"topBarHeader"}
                >
                    {/* Left Menus */}
                    <div style={{display: "flex", gap: "10px", flex: 1, flexWrap: "nowrap", overflow: "hidden"}}>
                        <Tooltip title={organizationName}>
                            <div style={{width: "156px", height: "64px", marginRight: "20px"}}>
                                <NavLink to={"/"}><Logo
                                        style={{width: "100%", height: "100%"}}
                                /></NavLink>
                            </div>
                        </Tooltip>
                        {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) && (
                                <>
                                    <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={adminMenuItems} key={"adminMenu"}
                                          style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "140px"}}/>
                                    <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={pageManagementMenuItems} key={"pageMenu"}
                                          style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "180px"}}/>
                                </>
                        )}
                        {userSession && (
                                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={diveEventMenuItems} key={"diveEventMenu"}
                                      style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "140px"}}/>
                        )}
                        {pageMenus.length > 0 &&
                                pageMenus.map((menu, index) => (
                                        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={menu} key={`infoMenu-${index}`}
                                              style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "140px"}}/>
                                ))}
                        {forumEnabled &&
                                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={forumMenuItems} key={"forumMenu"}
                                      style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "140px"}}/>
                        }
                    </div>

                    {/* Right Menus */}
                    <div style={{display: "flex", gap: "10px", alignItems: "center", whiteSpace: "nowrap"}}>
                        <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={languageMenuItems} key={"languageMenu"}
                              style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "130px"}}/>
                        {userSession && (
                                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={userMenuItems} key={"userMenu"}
                                      style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "180px"}}/>
                        )}
                        {!userSession && (
                                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={loginMenuItems} key={"loginMenu"}
                                      style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "110px"}}/>
                        )}
                        {!userSession && (
                                <Menu onClick={onClick} selectedKeys={[current]} mode="horizontal" items={registerMenuItems} key={"registerMenu"}
                                      style={{width: "fit-content", whiteSpace: "nowrap", minWidth: "110px"}}/>
                        )}
                    </div>
                </Header>}
            </>
    );
}
