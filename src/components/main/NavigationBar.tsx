import {
    ApartmentOutlined,
    AppstoreOutlined,
    BarChartOutlined,
    BellOutlined,
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
    TagOutlined,
    TagsOutlined,
    UnorderedListOutlined,
    UserOutlined
} from "@ant-design/icons";
import {Button, Drawer, Grid, Layout, Menu, type MenuProps, Tooltip} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {NavLink} from "react-router-dom";
import {useSession} from "../../session";
import {checkRoles, LanguageTool} from "../../tools";
import {MembershipTypeEnum, type PageGroupResponse, PortalConfigGroupEnum, RoleEnum} from "../../models";
import {pageAPI} from "../../services";
import {NotificationDropdown} from "../Notification";
import {useBlogMenuItems} from "../Blogging";
// @ts-ignore
import Logo from "../../portal_logo.svg?react";

const {Header} = Layout;
const {useBreakpoint} = Grid;

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
    const [blogEnabled, setBlogEnabled] = useState<boolean>(false);

    const screens = useBreakpoint();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Get the blog menu items from the hook
    const blogMenuItems = useBlogMenuItems(blogEnabled);

    type MenuItem = Required<MenuProps>["items"][number];

    const menuBarItems: MenuItem[] = [
        ...(userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) &&
                [
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
                                label: (
                                        <NavLink to="/administration/blocked-dates">{t("NavigationBar.administration.blocked-dates")}</NavLink>),
                                key: "blocked-dates",
                                icon: <CalendarOutlined/>
                            },
                            {
                                label: t("NavigationBar.administration.comments.title"),
                                key: "comments",
                                icon: <MessageOutlined/>,
                                children: [
                                    {
                                        label: (<NavLink
                                                to="/administration/comment-moderation">{t("NavigationBar.administration.comments.comment-moderation")}</NavLink>),
                                        key: "comments-moderation",
                                        icon: <MessageOutlined/>
                                    },
                                    {
                                        label: (<NavLink to="/administration/comments">{t("NavigationBar.administration.comments.comment-list")}</NavLink>),
                                        key: "comments-list",
                                        icon: <MessageOutlined/>
                                    }
                                ]
                            },

                            {
                                label: t("NavigationBar.administration.tags.title"),
                                key: "tags",
                                icon: <ApartmentOutlined/>,
                                children: [
                                    {
                                        label: (<NavLink to="/administration/tag-groups">{t("NavigationBar.administration.tags.tag-groups")}</NavLink>),
                                        key: "tag-groups",
                                        icon: <TagsOutlined/>
                                    },
                                    {
                                        label: (<NavLink to="/administration/tags">{t("NavigationBar.administration.tags.tag-list")}</NavLink>),
                                        key: "tag-list",
                                        icon: <TagOutlined/>
                                    }
                                ]
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
                                label: (<NavLink to="/administration/notifications">{t("NavigationBar.administration.notifications")}</NavLink>),
                                key: "notifications",
                                icon: <BellOutlined/>
                            },
                            {
                                label: (<NavLink
                                        to="/administration/portal-configuration">{t("NavigationBar.administration.portal-configuration")}</NavLink>),
                                key: "portal-configuration",
                                icon: <SettingOutlined/>
                            }
                        ]
                    },
                    {
                        key: "pageManagement",
                        label: t("NavigationBar.pageManagement.title"),
                        icon: <FileTextOutlined/>,
                        children: [
                            {
                                label: (<NavLink to="/administration/page-groups">{t("NavigationBar.pageManagement.pages")}</NavLink>),
                                key: "pageManagement-pages",
                                icon: <FileOutlined/>
                            },
                            {
                                label: (<NavLink to="/administration/pages/0?pageGroupId=3">{t("NavigationBar.pageManagement.blogs")}</NavLink>),
                                key: "pageManagement-blogs",
                                icon: <FileOutlined/>
                            }
                        ],
                    }
                ] || []),
        ...(userSession &&
                [
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
                ] || []),
        ...(navigationElements.length > 0
                ? navigationElements.map(navigationElement => ({
                    label: navigationElement.pageGroupVersions[0].title,
                    key: `page-group-${navigationElement.id}`,
                    children:
                            navigationElement.pages.map(page =>
                                    (page.pageVersions.length > 0 && {
                                        label: (
                                                <NavLink to={`/pages/${page.id}`} className="dropdown-item">
                                                    {page.pageVersions[0].title}
                                                </NavLink>
                                        ),
                                        key: `page-${navigationElement.id}-${page.id}`,
                                    })
                            )
                }))
                : []),
        // We generate the infoMenuItems from the page versions belonging to the "info" group.
        ...(userSession && forumEnabled &&
                [
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
                ] || []),
        ...(userSession && blogEnabled ? blogMenuItems : []),
        ...(supportedLanguages.length > 0 &&
                [
                    {
                        label: LanguageTool.getLabelByValue(getSessionLanguage()),
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
                    }] || []),
        ...(userSession &&
                [
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
                ]
                ||
                [
                    {
                        label: (<NavLink to="/login" type={"button"}>{t("NavigationBar.action.login")}</NavLink>),
                        key: "user-login",
                        icon: <LoginOutlined/>
                    },
                    {
                        label: (<NavLink to="/auth/register">{t("NavigationBar.action.register")}</NavLink>),
                        key: "user-register",
                        icon: <FormOutlined/>
                    }
                ]),
    ];

    useEffect(() => {
        const fetchPaths = async () => {
            setLoading(true);
            const language = getSessionLanguage();

            pageAPI.getNavigationItems(language)
                    .then(navElements => {
                        if (navElements && navElements.length > 0) {
                            setNavigationElements(JSON.parse(JSON.stringify(navElements)));
                        }
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

            if ((getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "blog-enabled") === "true")) {
                setBlogEnabled(true);
            }
        }

        const languageList = getFrontendConfigurationValue("enabled-language").split(",");
        setSupportedLanguages(languageList.map(lang => {
            return {label: LanguageTool.getLabelByValue(lang), value: lang};
        }));

        return () => {
            window.removeEventListener("reloadNavigationEvent", fetchPaths);
        };
    }, [userSession, getSessionLanguage, getPortalConfigurationValue, getFrontendConfigurationValue]);

    const onClick: MenuProps["onClick"] = e => {
        setCurrent(e.key);
        setDrawerOpen(false);
    };

    return !loading && (
            <Header
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 16px",
                        backgroundColor: "#191919",
                        maxWidth: "100%"
                    }}
            >
                {/* Logo + (desktop) menu */}
                <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            overflow: "hidden"
                        }}
                >
                    <Tooltip title={organizationName}>
                        <div style={{width: 156, height: 64, marginRight: 20}}>
                            <NavLink to={"/"}>
                                <Logo style={{width: "100%", height: "100%"}}/>
                            </NavLink>
                        </div>
                    </Tooltip>

                    {/* show horizontal Menu only on ≥ md */}
                    {screens.md && (
                            <Menu
                                    onClick={onClick}
                                    selectedKeys={[current]}
                                    mode="horizontal"
                                    items={menuBarItems}
                                    style={{width: "100%"}}
                            />
                    )}
                </div>

                {/* Notification bell for logged in users */}
                {userSession && (
                        <div style={{marginRight: screens.md ? 0 : 16}}>
                            <NotificationDropdown/>
                        </div>
                )}

                {/* Hamburger button – hidden on desktop */}
                {!screens.md && (
                        <>
                            <Button
                                    type="text"
                                    icon={<MenuOutlined style={{fontSize: 24}}/>}
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label="Open menu"
                            />
                            <Drawer
                                    placement="right"
                                    onClose={() => setDrawerOpen(false)}
                                    open={drawerOpen}
                                    styles={{body: {padding: "0"}}}
                                    width={260}
                            >
                                <Menu
                                        onClick={onClick}
                                        selectedKeys={[current]}
                                        mode="inline"
                                        items={menuBarItems}
                                        style={{border: "none"}}
                                />
                            </Drawer>
                        </>
                )}
            </Header>
    );
}
