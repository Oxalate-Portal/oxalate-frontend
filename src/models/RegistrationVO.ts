import {UserTypeEnum} from "./UserTypeEnum";

export interface RegistrationVO {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    next_of_kin: string;
    privacy: boolean;
    language: string;
    approved_terms: boolean;
    health_statement_id: number | null;
    primary_user_type: UserTypeEnum;
}
