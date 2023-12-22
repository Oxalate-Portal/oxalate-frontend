import UserResponse from "./responses/UserResponse";

interface SessionVO extends UserResponse {
    accessToken: string;
}

export default SessionVO;