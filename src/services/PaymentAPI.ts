import {AbstractAPI} from "./AbstractAPI";
import {PaymentRequest} from "../models/requests";
import {PaymentResponse, PaymentStatusResponse} from "../models/responses";

class PaymentAPI extends AbstractAPI<PaymentRequest, PaymentResponse> {

    public async getAllActivePaymentStatus(): Promise<PaymentStatusResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PaymentStatusResponse[]>('/active');
        return response.data;
    }

    public async resetAllPeriodicPayments(): Promise<boolean> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<void>('/reset');
        return response.status === 200;
    }
}

export const paymentAPI = new PaymentAPI('/payments');