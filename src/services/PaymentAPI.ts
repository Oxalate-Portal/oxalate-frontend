import {AbstractAPI} from "./AbstractAPI";
import {PaymentRequest, PaymentResponse, PaymentStatusResponse, PaymentTypeEnum} from "../models";

class PaymentAPI extends AbstractAPI<PaymentRequest, PaymentResponse> {

    public async getAllActivePaymentStatus(): Promise<PaymentStatusResponse[]> {
        const response = await this.axiosInstance.get<PaymentStatusResponse[]>('/active');
        return response.data;
    }

    public async getAllActivePaymentStatusWithPaymentType(paymentType: PaymentTypeEnum): Promise<PaymentStatusResponse[]> {
        const response = await this.axiosInstance.get<PaymentStatusResponse[]>('/active/' + paymentType);
        return response.data;
    }

    public async resetAllPayments(type: PaymentTypeEnum): Promise<boolean> {
        const response = await this.axiosInstance.get<void>('/reset?paymentType=' + type);
        return response.status === 200;
    }

    async findByUserId(userId: number): Promise<PaymentStatusResponse> {
        const response = await this.axiosInstance.get<PaymentStatusResponse>('/user/' + userId);
        return response.data;
    }
}

export const paymentAPI = new PaymentAPI('/payments');