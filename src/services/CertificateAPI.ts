import {AbstractAPI} from "./AbstractAPI";
import {CertificateResponse} from "../models/responses";
import {CertificateRequest} from "../models/requests";

export class CertificateAPI extends AbstractAPI<CertificateRequest, CertificateResponse> {
    public async findAllByUserId(userId: number): Promise<CertificateResponse[]> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<CertificateResponse[]>("/user/" + userId);
        return response.data;
    }
}

export const certificateAPI = new CertificateAPI("/certificates");