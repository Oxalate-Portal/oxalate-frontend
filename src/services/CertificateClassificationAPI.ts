import {AbstractAPI} from "./AbstractAPI";
import type {CertificateClassificationRequest, CertificateClassificationResponse} from "../models";
import type {AxiosResponse} from "axios";

class CertificateClassificationAPI extends AbstractAPI<CertificateClassificationRequest, CertificateClassificationResponse> {
    public async reorder(requests: CertificateClassificationRequest[]): Promise<boolean> {
        const response: AxiosResponse<void> = await this.axiosInstance.put("/order", requests);
        return response.status === 200;
    }
}

export const certificateClassificationAPI = new CertificateClassificationAPI("/certificate-classifications");
