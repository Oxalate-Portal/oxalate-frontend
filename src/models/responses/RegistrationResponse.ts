import ResultEnum from "../ResultEnum";

interface RegistrationResponse {
    status: ResultEnum;
    token: string;
}

export default RegistrationResponse;