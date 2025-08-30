import {AbstractUser} from "../AbstractUser";
import {PaymentResponse} from "./PaymentResponse";
import {MembershipResponse} from "./MembershipResponse";

export interface UserResponse extends AbstractUser {
    diveCount: number;
    payments: PaymentResponse[];
    memberships: MembershipResponse[];
}
