import {PageStatusEnum} from "./PageStatusEnum";

export interface AbstractPage {
    id: number;
    pageGroupId: number;
    status: PageStatusEnum;
    creator: number;
    createdAt: Date;
    modifier: number | null;
    modifiedAt: Date | null;
}