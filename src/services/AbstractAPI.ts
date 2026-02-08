import Axios, {type AxiosInstance} from "axios";
import type {PagedResponse} from "../models";

export abstract class AbstractAPI<REQUEST, RESPONSE> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member,
            withCredentials: true
        });
    }

    public async findAll(params?: Record<string, string | number>): Promise<RESPONSE[]> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<RESPONSE[]>("", {params: params});
        return response.data;
    }

    /**
     * This should be used instead of findAll() when you want to use pagination.
     * @param params
     */
    public async findPageable(params?: Record<string, string | number>): Promise<PagedResponse<RESPONSE>> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PagedResponse<RESPONSE>>("", {params: params});
        return response.data;
    }

    public async findById(id: number, parameters: string | null): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        let url = "/" + id;

        if (parameters !== null) {
            url = parameters ? url + "?" + parameters : url;
        }
        const response = await this.axiosInstance.get<RESPONSE>(url);
        return response.data;
    }

    public async create(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<RESPONSE>("", payload);
        return response.data;
    }

    public async update(payload: REQUEST): Promise<RESPONSE> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<RESPONSE>("", payload);
        return response.data;
    }

    public async delete(id: number): Promise<boolean> {
        const response = await this.axiosInstance.delete<RESPONSE>("/" + id);
        return response.status === 200;
    }
}