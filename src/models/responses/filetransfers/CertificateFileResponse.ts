import {AbstractFileResponse} from "./AbstractFileResponse";

export interface CertificateFileResponse extends AbstractFileResponse {
    certificateId: number;
}