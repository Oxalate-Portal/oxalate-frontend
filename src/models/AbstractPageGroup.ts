import type {PageGroupVersionResponse} from "./responses";
import {PageStatusEnum} from "./PageStatusEnum";

export interface AbstractPageGroup {
    id: number;
    status: PageStatusEnum;
    page_group_versions: PageGroupVersionResponse[];
}
