import type {AbstractFileResponse} from "./AbstractFileResponse";

export interface CertificateFileResponse extends AbstractFileResponse {
    certificate_id: number;
}
