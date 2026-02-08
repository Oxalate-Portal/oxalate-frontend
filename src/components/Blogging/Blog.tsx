import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {pageAPI} from "../../services";
import {type PagedRequest, type PagedResponse, type PageResponse, SortDirectionEnum} from "../../models";
import {Empty, Spin, Typography} from "antd";
import {BlogCard} from "./BlogCard";
import {BlogControls} from "./BlogControls";
import {useSession} from "../../session";

const {Title} = Typography;

export function Blog() {
    const {getSessionLanguage} = useSession();
    const {t} = useTranslation();
    const [sortBy, setSortBy] = useState<string>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirectionEnum>(SortDirectionEnum.DESC);
    const [searchText, setSearchText] = useState<string>("");
    const [caseSensitive, setCaseSensitive] = useState<boolean>(false);
    const [pagedBlogRequest, setPagedBlogRequest] = useState<PagedRequest>({
        page: 0,
        size: 20,
        sort_by: "createdAt",
        direction: SortDirectionEnum.DESC,
        language: getSessionLanguage()
    });
    const [blogs, setBlogs] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [expandedBlogId, setExpandedBlogId] = useState<number | null>(null);
    const [pagedResponse, setPagedResponse] = useState<PagedResponse<PageResponse> | null>(null);

    const fetchBlogs = useCallback((request: PagedRequest, append: boolean = false) => {
        setLoading(true);

        pageAPI.getPagedBlogs(request)
                .then((response) => {
                    setPagedResponse(response);
                    if (append) {
                        setBlogs(prev => [...prev, ...response.content]);
                    } else {
                        setBlogs(response.content);
                    }
                })
                .catch((error) => {
                    console.error("Error fetching blogs:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    useEffect(() => {
        fetchBlogs(pagedBlogRequest);
    }, [pagedBlogRequest, fetchBlogs]);

    const handleSortByChange = (value: string) => {
        setSortBy(value);
        setPagedBlogRequest({
            ...pagedBlogRequest,
            page: 0,
            sort_by: value,
            direction: sortDirection
        });
        setBlogs([]);
    };

    const handleSortDirectionChange = (value: SortDirectionEnum) => {
        setSortDirection(value);
        setPagedBlogRequest({
            ...pagedBlogRequest,
            page: 0,
            direction: value
        });
        setBlogs([]);
    };

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setPagedBlogRequest({
            ...pagedBlogRequest,
            page: 0,
            search: value || undefined,
            case_sensitive: caseSensitive
        });
        setBlogs([]);
    };

    const handleCaseSensitiveChange = (value: boolean) => {
        setCaseSensitive(value);
        if (searchText) {
            setPagedBlogRequest({
                ...pagedBlogRequest,
                page: 0,
                case_sensitive: value
            });
            setBlogs([]);
        }
    };

    const handleLoadMore = () => {
        const nextPage = (pagedResponse?.page ?? 0) + 1;
        const newRequest = {
            ...pagedBlogRequest,
            page: nextPage
        };
        setPagedBlogRequest(newRequest);
        fetchBlogs(newRequest, true);
    };

    const handleBlogClick = (blogId: number) => {
        setExpandedBlogId(expandedBlogId === blogId ? null : blogId);
    };

    const hasMore = pagedResponse ? !pagedResponse.last : false;
    const totalItems = pagedResponse?.total_elements ?? 0;

    return (
            <div className="darkDiv">
                <Title level={2}>{t("Blog.title")}</Title>

                <BlogControls
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        searchText={searchText}
                        caseSensitive={caseSensitive}
                        onSortByChange={handleSortByChange}
                        onSortDirectionChange={handleSortDirectionChange}
                        onSearchChange={handleSearchChange}
                        onCaseSensitiveChange={handleCaseSensitiveChange}
                        totalItems={totalItems}
                />

                <Spin spinning={loading}>
                    {blogs.length === 0 && !loading ? (
                            <Empty description={t("Blog.empty")}/>
                    ) : (
                            blogs.map((blog) => (
                                    <BlogCard
                                            key={blog.id}
                                            blog={blog}
                                            expanded={expandedBlogId === blog.id}
                                            onClick={() => handleBlogClick(blog.id)}
                                    />
                            ))
                    )}
                </Spin>

                <BlogControls
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        searchText={searchText}
                        caseSensitive={caseSensitive}
                        onSortByChange={handleSortByChange}
                        onSortDirectionChange={handleSortDirectionChange}
                        onSearchChange={handleSearchChange}
                        onCaseSensitiveChange={handleCaseSensitiveChange}
                        showLoadMore={true}
                        onLoadMore={handleLoadMore}
                        loading={loading}
                        hasMore={hasMore}
                        totalItems={totalItems}
                />
            </div>
    );
}