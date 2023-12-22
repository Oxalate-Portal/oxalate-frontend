import PaymentsResponse from "./PaymentsResponse";
import RoleEnum from "../RoleEnum";
import UserStatusEnum from "../UserStatusEnum";

interface UserResponse {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    registered: boolean;
    diveCount: number;
    payments: PaymentsResponse[];
    approvedTerms: boolean;
    language: string;
    roles: RoleEnum[];
    status: UserStatusEnum;
    privacy: boolean;
    nextOfKin: string;
}

export default UserResponse;