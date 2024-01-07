import {PageResponse} from "./PageResponse";
import {AbstractPageGroup} from "../AbstractPageGroup";

export interface PageGroupResponse extends AbstractPageGroup {
    pages: PageResponse[];
}
