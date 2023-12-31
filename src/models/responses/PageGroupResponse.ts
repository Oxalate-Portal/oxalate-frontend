import {PageGroupVersionResponse} from "./PageGroupVersionResponse";
import {PageResponse} from "./PageResponse";

export interface PageGroupResponse {
    id: number;
    pageGroupVersions: PageGroupVersionResponse[];
    pages: PageResponse[];
}
