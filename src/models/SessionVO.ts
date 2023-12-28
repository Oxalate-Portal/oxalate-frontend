import AbstractUser from "./AbstractUser";

interface SessionVO extends AbstractUser {
    accessToken: string;
    type: string;
    expiresAt: Date;
}

export default SessionVO;