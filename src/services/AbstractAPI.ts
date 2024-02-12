import Axios, {AxiosInstance} from "axios";
import {SessionVO} from "../models";
import {PageableResponse} from "../models/responses";

export abstract class AbstractAPI<REQUEST, RESPONSE> {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${process.env.REACT_APP_API_URL}` + member
        });
    }

    public async findAll(params?: Record<string, any>): Promise<RESPONSE[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<RESPONSE[]>("", {params: params});
        return response.data;
    }

    /**
     * This should be used instead of findAll() when you want to use pagination.
     * @param params
     */
    public async findPageable(params?: Record<string, any>): Promise<PageableResponse<RESPONSE>> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<PageableResponse<RESPONSE>>("", {params: params});
        return response.data;
    }

    public async findById(id: number, parameters: string | null): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        let url = "/" + id;

        if (parameters !== null) {
            url = parameters ? url + "?" + parameters : url;
        }
        const response = await this.axiosInstance.get<RESPONSE>(url);
        return response.data;
    }

    public async create(payload: REQUEST): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<RESPONSE>("", payload);
        return response.data;
    }

    public async update(payload: REQUEST): Promise<RESPONSE> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.put<RESPONSE>("", payload);
        return response.data;
    }

    public async delete(id: number): Promise<boolean> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.delete<RESPONSE>("/" + id);
        return response.status === 200;
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: SessionVO = JSON.parse(localStorage.getItem("user") || "{}");

        if (session && session.accessToken) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.accessToken;
        }
    }
}