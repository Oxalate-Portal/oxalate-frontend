import {AbstractAPI} from "./AbstractAPI";
import {PageResponse} from "../models/responses";
import {PageRequest} from "../models/requests";

class PageMgmtAPI extends AbstractAPI<PageRequest, PageResponse> {
}

export const pageMgmtAPI = new PageMgmtAPI("/page-management/pages");