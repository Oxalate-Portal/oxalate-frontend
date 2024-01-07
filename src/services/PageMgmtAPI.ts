import {AbstractAPI} from "./AbstractAPI";
import {PageRequest} from "../models/requests/PageRequest";
import {PageResponse} from "../models/responses";

class PageMgmtAPI extends AbstractAPI<PageRequest, PageResponse> {
}

export const pageMgmtAPI = new PageMgmtAPI("/page-management/pages");