import type {PageResponse} from "./PageResponse";
import type {AbstractPageGroup} from "../AbstractPageGroup";

export interface PageGroupResponse extends AbstractPageGroup {
    pages: PageResponse[];
}
