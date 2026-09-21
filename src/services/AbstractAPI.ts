import Axios, {type AxiosInstance} from "axios";
import type {PagedRequest, PagedResponse} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";
import {serializeDayjsInObject, transformDatesInObject} from "./dateTransformer";
import {MAX_PAGE_SIZE, type PagedQueryExtraParams, toPagedQueryParams} from "./pagedQuery";
import {getGlobalTimezone} from "./timezoneContext";

export abstract class AbstractAPI<REQUEST, RESPONSE> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            withCredentials: true
        });
        configureAxiosBaseUrl(this.axiosInstance, member);
    }

    public async findAll(params?: Record<string, string | number>): Promise<RESPONSE[]> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<RESPONSE[]>("", {params: params});
        return response.data.map((item) => this.transformResponse(item));
    }

    /**
     * Fetches one page of a server-paged list endpoint. The request fields and the extra parameters are sent as query
     * parameters (undefined and empty values are omitted) and every item of the page content is date-transformed.
     * @param request paging, sorting and search parameters
     * @param extraParams endpoint-specific query parameters, e.g. `{event_id: 12}`
     * @param path path relative to the API member, e.g. `"/past"`; defaults to the member itself
     */
    public async findPaged(request: PagedRequest, extraParams?: PagedQueryExtraParams, path: string = ""): Promise<PagedResponse<RESPONSE>> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<PagedResponse<RESPONSE>>(path, {params: toPagedQueryParams(request, extraParams)});
        return {
            ...response.data,
            content: response.data.content.map((item) => this.transformResponse(item))
        };
    }

    /**
     * Collects every item of a server-paged list endpoint by walking through its pages with the largest allowed page
     * size. Meant for non-table consumers (exports, select options) of endpoints that only exist in paged form.
     */
    protected async findAllPaged(extraParams?: PagedQueryExtraParams, path: string = ""): Promise<RESPONSE[]> {
        const items: RESPONSE[] = [];
        let page = 0;
        let last = false;

        while (!last) {
            const response = await this.findPaged({page, size: MAX_PAGE_SIZE}, extraParams, path);
            items.push(...response.content);
            last = response.last || response.content.length === 0;
            page++;
        }

        return items;
    }

    public async findById(id: number, parameters: string | null): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        let url = "/" + id;

        if (parameters !== null) {
            url = parameters ? url + "?" + parameters : url;
        }
        const response = await this.axiosInstance.get<RESPONSE>(url);
        return this.transformResponse(response.data);
    }

    public async create(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const serializedPayload = this.serializeRequest(payload);
        const response = await this.axiosInstance.post<RESPONSE>("", serializedPayload);
        return this.transformResponse(response.data);
    }

    public async update(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const serializedPayload = this.serializeRequest(payload);
        const response = await this.axiosInstance.put<RESPONSE>("", serializedPayload);
        return this.transformResponse(response.data);
    }

    public async delete(id: number): Promise<boolean> {
        const response = await this.axiosInstance.delete<RESPONSE>("/" + id);
        return response.status === 200;
    }

    /**
     * Transform response data to convert date strings/Date objects to Dayjs instances
     */
    protected transformResponse<T>(data: T): T {
        return transformDatesInObject(data, getGlobalTimezone());
    }

    /**
     * Serialize request data to convert Dayjs objects to ISO strings
     */
    protected serializeRequest<T>(data: T): T {
        return serializeDayjsInObject(data);
    }
}
