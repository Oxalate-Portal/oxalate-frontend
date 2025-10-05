import type {CertificateResponse} from "../CertificateResponse";

export interface DownloadCertificateResponse extends CertificateResponse {
    memberName: string;
}