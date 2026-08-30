import {AbstractAPI} from "./AbstractAPI";
import type {CertificateClassificationAssignmentRequest, CertificateRequest, CertificateResponse, CertificateValueReplacementRequest} from "../models";

export class CertificateAPI extends AbstractAPI<CertificateRequest, CertificateResponse> {
    public async findAllByUserId(userId: number): Promise<CertificateResponse[]> {
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.get<CertificateResponse[]>("/user/" + userId);
        return response.data;
    }

    public async updateClassification(payload: CertificateClassificationAssignmentRequest): Promise<boolean> {
        const response = await this.axiosInstance.put("/classification", payload);
        return response.status === 200;
    }

    public async replaceOrganizations(payload: CertificateValueReplacementRequest): Promise<boolean> {
        const response = await this.axiosInstance.put("/management/organization", payload);
        return response.status === 200;
    }

    public async replaceCertificateNames(payload: CertificateValueReplacementRequest): Promise<boolean> {
        const response = await this.axiosInstance.put("/management/certificate-name", payload);
        return response.status === 200;
    }
}

export const certificateAPI = new CertificateAPI("/certificates");