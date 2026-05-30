import Axios, {type AxiosInstance} from "axios";
import type {PagedResponse} from "../models";
import {configureAxiosBaseUrl} from "./configureAxiosBaseUrl";
import {transformDatesInObject, serializeDayjsInObject} from "./dateTransformer";
import {getGlobalTimezone} from "./timezoneContext";

export abstract class AbstractAPI<REQUEST, RESPONSE> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            withCredentials: true
        });
        configureAxiosBaseUrl(this.axiosInstance, member);
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

    public async findAll(params?: Record<string, string | number>): Promise<RESPONSE[]> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<RESPONSE[]>("", {params: params});
        return response.data.map((item) => this.transformResponse(item));
    }

    /**
     * This should be used instead of findAll() when you want to use pagination.
     * @param params
     */
    public async findPageable(params?: Record<string, string | number>): Promise<PagedResponse<RESPONSE>> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PagedResponse<RESPONSE>>("", {params: params});
        const transformedData = this.transformResponse(response.data.data);
        return {
            ...response.data,
            data: transformedData as RESPONSE[]
        };
    }

    public async findById(id: number, parameters: string | null): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        let url = "/" + id;

        if (parameters !== null) {
            url = parameters ? url + "?" + parameters : url;
        }
        const response = await this.axiosInstance.get<RESPONSE>(url);
        return this.transformResponse(response.data);
    }

    public async create(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const serializedPayload = this.serializeRequest(payload);
        const response = await this.axiosInstance.post<RESPONSE>("", serializedPayload);
        return this.transformResponse(response.data);
    }

    public async update(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const serializedPayload = this.serializeRequest(payload);
        const response = await this.axiosInstance.put<RESPONSE>("", serializedPayload);
        return this.transformResponse(response.data);
    }

    public async delete(id: number): Promise<boolean> {
        const response = await this.axiosInstance.delete<RESPONSE>("/" + id);
        return response.status === 200;
    }
}