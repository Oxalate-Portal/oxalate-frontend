import {AbstractAPI} from "./AbstractAPI";
import PageResponse from "../models/responses/PageResponse";

class PageAPI extends AbstractAPI<PageResponse> {

}

const pageAPI = new PageAPI("/pages");
export default pageAPI;