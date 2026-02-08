import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {NavLink} from "react-router-dom";
import type {MenuProps} from "antd";
import {Spin} from "antd";
import {pageAPI} from "../../services";
import {type PagedRequest, type PageResponse, SortDirectionEnum} from "../../models";
import {useSession} from "../../session";
import {BlogOutlined} from "../../icons";

type MenuItem = Required<MenuProps>["items"][number];

interface BlogMenuItemProps {
    blogEnabled: boolean;
}

export function BlogMenuItem({blogEnabled}: BlogMenuItemProps) {
    const {t} = useTranslation();
    const {getSessionLanguage} = useSession();
    const [blogPosts, setBlogPosts] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!blogEnabled) {
            return;
        }

        const fetchBlogPosts = async () => {
            setLoading(true);
            setError(false);

            const pagedRequest: PagedRequest = {
                page: 0,
                size: 10,
                sort_by: "createdAt",
                direction: SortDirectionEnum.DESC,
                language: getSessionLanguage()
            };

            try {
                const response = await pageAPI.getPagedBlogs(pagedRequest);
                setBlogPosts(response.content);
            } catch (err) {
                console.error("Error fetching blog posts for menu:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPosts();
    }, [blogEnabled, getSessionLanguage]);

    const getMenuItems = (): MenuItem[] => {
        if (!blogEnabled) {
            return [];
        }

        const children: MenuItem[] = [];

        if (loading) {
            children.push({
                label: (
                        <Spin size="small">
                            <span style={{marginLeft: 8}}>{t("BlogMenuItem.loading")}</span>
                        </Spin>
                ),
                key: "blog-loading",
                disabled: true
            });
        } else if (error) {
            children.push({
                label: t("BlogMenuItem.error"),
                key: "blog-error",
                disabled: true
            });
        } else if (blogPosts.length === 0) {
            children.push({
                label: t("BlogMenuItem.empty"),
                key: "blog-empty",
                disabled: true
            });
        } else {
            blogPosts.forEach((post) => {
                const title = post.pageVersions.length > 0
                        ? post.pageVersions[0].title
                        : t("BlogMenuItem.untitled");

                children.push({
                    label: (
                            <NavLink to={`/pages/${post.id}`}>
                                {title}
                            </NavLink>
                    ),
                    key: `blog-post-${post.id}`,
                    icon: <BlogOutlined/>
                });
            });
        }

        // Add "View All" link at the bottom
        children.push({
            type: "divider"
        });

        children.push({
            label: (
                    <NavLink to="/blog">
                        {t("BlogMenuItem.viewAll")}
                    </NavLink>
            ),
            key: "blog-view-all",
            icon: <BlogOutlined/>
        });

        return [
            {
                label: t("NavigationBar.blog.title"),
                key: "blog",
                icon: <BlogOutlined/>,
                children: children
            }
        ];
    };

    return getMenuItems();
}

export function useBlogMenuItems(blogEnabled: boolean): MenuItem[] {
    const {t} = useTranslation();
    const {getSessionLanguage} = useSession();
    const [blogPosts, setBlogPosts] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        if (!blogEnabled) {
            return;
        }

        const fetchBlogPosts = async () => {
            setLoading(true);
            setError(false);

            const pagedRequest: PagedRequest = {
                page: 0,
                size: 10,
                sort_by: "createdAt",
                direction: SortDirectionEnum.DESC,
                language: getSessionLanguage()
            };

            try {
                const response = await pageAPI.getPagedBlogs(pagedRequest);
                setBlogPosts(response.content);
            } catch (err) {
                console.error("Error fetching blog posts for menu:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogPosts();
    }, [blogEnabled, getSessionLanguage]);

    if (!blogEnabled) {
        return [];
    }

    const children: MenuItem[] = [];

    if (loading) {
        children.push({
            label: (
                    <Spin size="small">
                        <span style={{marginLeft: 8}}>{t("BlogMenuItem.loading")}</span>
                    </Spin>
            ),
            key: "blog-loading",
            disabled: true
        });
    } else if (error) {
        children.push({
            label: t("BlogMenuItem.error"),
            key: "blog-error",
            disabled: true
        });
    } else if (blogPosts.length === 0) {
        children.push({
            label: t("BlogMenuItem.empty"),
            key: "blog-empty",
            disabled: true
        });
    } else {
        blogPosts.forEach((post) => {
            const title = post.pageVersions.length > 0
                    ? post.pageVersions[0].title
                    : t("BlogMenuItem.untitled");

            children.push({
                label: (
                        <NavLink to={`/pages/${post.id}`}>
                            {title}
                        </NavLink>
                ),
                key: `blog-post-${post.id}`,
                icon: <BlogOutlined/>
            });
        });
    }

    // Add "View All" link at the bottom
    children.push({
        type: "divider"
    });

    children.push({
        label: (
                <NavLink to="/blog">
                    {t("BlogMenuItem.viewAll")}
                </NavLink>
        ),
        key: "blog-view-all",
        icon: <BlogOutlined/>
    });

    return [
        {
            label: t("NavigationBar.blog.title"),
            key: "blog",
            icon: <BlogOutlined/>,
            children: children
        }
    ];
}

