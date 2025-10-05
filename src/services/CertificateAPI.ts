import {AbstractAPI} from "./AbstractAPI";
import type {CertificateRequest, CertificateResponse} from "../models";

export class CertificateAPI extends AbstractAPI<CertificateRequest, CertificateResponse> {
    public async findAllByUserId(userId: number): Promise<CertificateResponse[]> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<CertificateResponse[]>("/user/" + userId);
        return response.data;
    }
}

export const certificateAPI = new CertificateAPI("/certificates");