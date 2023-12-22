import PaymentTypeEnum from "../PaymentTypeEnum";

interface PaymentsResponse {
    id: number;
    paymentType: PaymentTypeEnum;
    paymentCount: number;
    createdAt: Date;
    expiresAt: Date;
}

export default PaymentsResponse;