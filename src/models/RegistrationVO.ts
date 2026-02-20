import {UserTypeEnum} from "./UserTypeEnum";

export interface RegistrationVO {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    nextOfKin: string;
    privacy: boolean;
    language: string;
    approvedTerms: boolean;
    healthCheckId: number | null;
    primaryUserType: UserTypeEnum;
}
