import {AbstractAPI} from "./AbstractAPI";
import {PageResponse} from "../models/responses";

class PageAPI extends AbstractAPI<PageResponse> {
}

export const pageAPI = new PageAPI("/pages");
