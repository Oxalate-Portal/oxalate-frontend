import {Dayjs} from "dayjs";
import type {PaymentResponse} from "./PaymentResponse";
import {UserTypeEnum} from "../UserTypeEnum";
import type {TagResponse} from "./TagResponse";

export interface ListUserResponse {
    id: number;
    name: string;
    event_dive_count: number;
    created_at: Dayjs;
    payments: PaymentResponse[];
    membership_active: boolean;
    user_type: UserTypeEnum;
    certificate_classification_title?: string | null;
    tags?: TagResponse[];
}
