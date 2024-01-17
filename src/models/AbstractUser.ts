import {PaymentResponse} from "./responses";
import {RoleEnum} from "./RoleEnum";
import {UserStatusEnum} from "./UserStatusEnum";

export interface AbstractUser {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    registered: Date;
    diveCount: number;
    payments: PaymentResponse[];
    approvedTerms: boolean;
    language: string;
    roles: RoleEnum[];
    status: UserStatusEnum;
    privacy: boolean;
    nextOfKin: string;
}
