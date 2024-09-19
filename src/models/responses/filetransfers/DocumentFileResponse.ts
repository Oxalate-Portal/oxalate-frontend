import {AbstractFileResponse} from "./AbstractFileResponse";
import {UploadStatusEnum} from "./UploadStatusEnum";

export interface DocumentFileResponse extends AbstractFileResponse {
    status: UploadStatusEnum;
}