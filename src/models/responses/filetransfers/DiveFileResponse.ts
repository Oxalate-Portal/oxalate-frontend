import type {AbstractFileResponse} from "./AbstractFileResponse";
import {UploadStatusEnum} from "./UploadStatusEnum";

export interface DiveFileResponse extends AbstractFileResponse {
    eventId: number;
    diveGroupId: number;
    status: UploadStatusEnum;
}