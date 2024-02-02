import {AbstractAPI} from "./AbstractAPI";
import {PageGroupResponse, PageResponse} from "../models/responses";
import {PageRequest} from "../models/requests";

class PageAPI extends AbstractAPI<PageRequest, PageResponse> {
    async getNavigationItems(language: string): Promise<PageGroupResponse[]|void> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get("/navigation-elements?language=" + language);

        if (response.status === 200 && response.data.length > 0) {
            console.debug("Received navigation pages:", response.data);
            return response.data;
        } else {
            if (response.status !== 200) {
                console.info("The response status was " + response.status + ": " + JSON.stringify(response));
            } else {
                console.info("The response did not contain data.token: " + JSON.stringify(response));
            }
        }
    }
}

export const pageAPI = new PageAPI("/pages");