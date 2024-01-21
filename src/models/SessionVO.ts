import {AbstractUser} from "./AbstractUser";

export interface SessionVO extends AbstractUser {
    accessToken: string;
    approvedTerms: boolean;
    diveCount: number;
    expiresAt: Date;
    type: string;
}
