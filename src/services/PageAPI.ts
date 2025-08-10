import {AbstractAPI} from "./AbstractAPI";
import {PageGroupResponse, PageRequest, PageResponse} from "../models";

class PageAPI extends AbstractAPI<PageRequest, PageResponse> {
    async getNavigationItems(language: string): Promise<PageGroupResponse[] | void> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';

        const response = await this.axiosInstance.get("/navigation-elements?language=" + language);

        if (response.status === 200 && response.data.length > 0) {
            return response.data;
        } else {
            if (response.status !== 200) {
                console.error("The response status was " + response.status + ":", response);
            }
        }
    }
}

export const pageAPI = new PageAPI("/pages");