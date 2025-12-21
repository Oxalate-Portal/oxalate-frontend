import {UpdateStatusEnum} from "../UpdateStatusEnum";

export interface ActionResponse {
    status: UpdateStatusEnum;
    message: string;
}