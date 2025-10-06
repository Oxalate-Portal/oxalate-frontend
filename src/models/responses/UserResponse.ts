import type {AbstractUser} from "../AbstractUser";
import type {PaymentResponse} from "./PaymentResponse";
import type {MembershipResponse} from "./MembershipResponse";
import type {TagResponse} from "./TagResponse";

export interface UserResponse extends AbstractUser {
    diveCount: number;
    payments: PaymentResponse[];
    memberships: MembershipResponse[];
    tags?: TagResponse[];
}
