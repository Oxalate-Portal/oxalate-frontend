import {AbstractAPI} from "./AbstractAPI";
import {PageRequest, PageResponse} from "../models";

class PageMgmtAPI extends AbstractAPI<PageRequest, PageResponse> {
}

export const pageMgmtAPI = new PageMgmtAPI("/page-management/pages");