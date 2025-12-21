import type {ActionResponse} from "./ActionResponse.ts";

export interface RegistrationResponse extends ActionResponse {
    token: string;
}
