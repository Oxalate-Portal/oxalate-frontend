import {AbstractUser} from "../AbstractUser";
import {PaymentResponse} from "./PaymentResponse";
import {MembershipResponse} from "./MembershipResponse";
import {TagResponse} from "./TagResponse";

export interface UserResponse extends AbstractUser {
    diveCount: number;
    payments: PaymentResponse[];
    memberships: MembershipResponse[];
    tags?: TagResponse[];
}
