import {RoleEnum} from "./RoleEnum";
import {UserStatusEnum} from "./UserStatusEnum";
import {UserTypeEnum} from "./UserTypeEnum";

export interface AbstractUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    registered: Date;
    language: string;
    status: UserStatusEnum;
    privacy: boolean;
    nextOfKin: string;
    approvedTerms: boolean;
    primaryUserType: UserTypeEnum;
}
