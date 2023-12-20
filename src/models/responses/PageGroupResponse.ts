import PageGroupVersionResponse from "./PageGroupVersionResponse";
import PageResponse from "./PageResponse";

interface PageGroupResponse {
    id: number;
    pageGroupVersions: PageGroupVersionResponse[];
    pages: PageResponse[];
}

export default PageGroupResponse;