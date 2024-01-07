import {AbstractAPI} from "./AbstractAPI";
import {PageGroupRequest} from "../models/requests";
import {PageGroupResponse} from "../models/responses";

class PageGroupMgmtAPI extends AbstractAPI<PageGroupRequest, PageGroupResponse> {
}

export const pageGroupMgmtAPI = new PageGroupMgmtAPI("/page-management/page-groups");