import {UserStatusEnum} from "./UserStatusEnum";
import {UserTypeEnum} from "./UserTypeEnum";

export interface AbstractUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    phoneNumber: string;
    registered: Date;
    language: string;
    status: UserStatusEnum;
    privacy: boolean;
    nextOfKin: string;
    approvedTerms: boolean;
    healthStatementId: number | null;
    primaryUserType: UserTypeEnum;
}
