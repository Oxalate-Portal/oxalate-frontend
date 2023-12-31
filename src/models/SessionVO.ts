import AbstractUser from "./AbstractUser";

export interface SessionVO extends AbstractUser {
    accessToken: string;
    type: string;
    expiresAt: Date;
}
