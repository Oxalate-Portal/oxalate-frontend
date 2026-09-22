import type {AbstractUser} from "../AbstractUser";
import type {PaymentResponse} from "./PaymentResponse";
import type {MembershipResponse} from "./MembershipResponse";
import type {TagResponse} from "./TagResponse";

export interface UserResponse extends AbstractUser {
    dive_count: number;
    payments: PaymentResponse[];
    memberships: MembershipResponse[];
    tags?: TagResponse[];
}
