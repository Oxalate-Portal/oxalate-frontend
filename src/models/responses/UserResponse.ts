import {AbstractUser} from "../AbstractUser";
import {PaymentResponse} from "./PaymentResponse";

export interface UserResponse extends AbstractUser {
    diveCount: number;
    payments: PaymentResponse[];
    approvedTerms: boolean;
}
