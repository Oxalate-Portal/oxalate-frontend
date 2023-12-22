import ActionResultEnum from "../ActionResultEnum";

interface LoginResponse {
    status: ActionResultEnum;
    message: string;
}

export default LoginResponse;