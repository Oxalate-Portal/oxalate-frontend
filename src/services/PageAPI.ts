import {AbstractAPI} from "./AbstractAPI";
import type {PagedRequest, PagedResponse, PageGroupResponse, PageRequest, PageResponse} from "../models";

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

    async getPagedBlogs(pagedRequest: PagedRequest): Promise<PagedResponse<PageResponse>> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PagedResponse<PageResponse>>("/blogs", pagedRequest);
        return response.data;
    }
}

export const pageAPI = new PageAPI("/pages");