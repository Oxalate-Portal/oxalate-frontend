import type {AbstractFileResponse} from "./AbstractFileResponse";
import {UploadStatusEnum} from "./UploadStatusEnum";

export interface PageFileResponse extends AbstractFileResponse {
    pageId: number;
    language: string;
    status: UploadStatusEnum;
}