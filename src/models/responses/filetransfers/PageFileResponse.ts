import type {AbstractFileResponse} from "./AbstractFileResponse";
import {UploadStatusEnum} from "./UploadStatusEnum";

export interface PageFileResponse extends AbstractFileResponse {
    page_id: number;
    language: string;
    status: UploadStatusEnum;
}
