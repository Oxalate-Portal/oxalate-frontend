import {PageStatusEnum} from "./PageStatusEnum";

export interface AbstractPage {
    id: number;
    page_group_id: number;
    status: PageStatusEnum;
    creator: number;
    created_at: Date;
    modifier: number | null;
    modified_at: Date | null;
}
