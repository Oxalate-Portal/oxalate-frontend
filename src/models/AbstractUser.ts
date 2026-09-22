import {UserStatusEnum} from "./UserStatusEnum";
import {UserTypeEnum} from "./UserTypeEnum";

export interface AbstractUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string | null;
    phone_number: string;
    registered: Date;
    language: string;
    status: UserStatusEnum;
    privacy: boolean;
    next_of_kin: string;
    approved_terms: boolean;
    health_statement_id: number | null;
    primary_user_type: UserTypeEnum;
    certificate_classification_title?: string | null;
}
