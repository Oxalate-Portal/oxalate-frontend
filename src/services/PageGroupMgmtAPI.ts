import {AbstractAPI} from "./AbstractAPI";
import {PageGroupRequest, PageGroupResponse} from "../models";

class PageGroupMgmtAPI extends AbstractAPI<PageGroupRequest, PageGroupResponse> {
}

export const pageGroupMgmtAPI = new PageGroupMgmtAPI("/page-management/page-groups");