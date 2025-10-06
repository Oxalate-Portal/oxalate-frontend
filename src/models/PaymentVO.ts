import type {PaymentResponse} from "./responses";

export interface PaymentVO extends PaymentResponse {
    name: string;
}