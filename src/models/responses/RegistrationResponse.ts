import {ResultEnum} from "../ResultEnum";

export interface RegistrationResponse {
    status: ResultEnum;
    token: string;
}
