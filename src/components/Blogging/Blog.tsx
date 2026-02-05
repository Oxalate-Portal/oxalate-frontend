import {useEffect, useState} from "react";
import {pageAPI} from "../../services";
import {type PagedRequest, type PageResponse} from "../../models";

export function Blog() {
    const [pagedBlogRequest, setPagedBlogRequest] = useState<PagedRequest>(
            {
                page: 0,
                size: 20
            });
    const [blogs, setBlogs] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);


    useEffect(() => {
        setLoading(true);

        pageAPI.getPagedBlogs(pagedBlogRequest)
                .then((response) => {
                    setBlogs(response.content);
                })
                .catch((error) => {
                    console.error("Error fetching blogs:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [pagedBlogRequest]);

    return (<div className="darkDiv">
        <Spin spinning={loading}>
            Blog Component
        </Spin>
    </div>);
}