import {UpdateStatusEnum} from "../UpdateStatusEnum";

export interface FileRemovalResponse {
    status: UpdateStatusEnum;
    message: string;
}