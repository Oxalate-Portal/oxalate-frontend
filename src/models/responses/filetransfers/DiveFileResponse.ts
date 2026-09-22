import type {AbstractFileResponse} from "./AbstractFileResponse";
import {UploadStatusEnum} from "./UploadStatusEnum";

export interface DiveFileResponse extends AbstractFileResponse {
    event_id: number;
    dive_group_id: number;
    status: UploadStatusEnum;
}
