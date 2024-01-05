import {AbstractAPI} from "./AbstractAPI";
import {PageResponse} from "../models/responses";
import {PageRequest} from "../models/requests/PageRequest";

class PageAPI extends AbstractAPI<PageRequest, PageResponse> {
}

export const pageAPI = new PageAPI("/pages");