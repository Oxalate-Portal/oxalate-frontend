import {AbstractAPI} from "./AbstractAPI";
import {PaymentRequest} from "../models/requests";
import {PaymentResponse} from "../models/responses";
import {PaymentStatusResponse} from "../models/responses/PaymentStatusResponse";

class PaymentAPI extends AbstractAPI<PaymentRequest, PaymentResponse> {

    public async getAllActivePaymentStatus(): Promise<PaymentStatusResponse[]> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<PaymentStatusResponse[]>('/active');
        return response.data;
    }
    public async resetAllPeriodicPayments(): Promise<boolean> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<void>('/event-report');
        return response.status === 200;
    }
}

export const paymentAPI = new PaymentAPI('/payments');