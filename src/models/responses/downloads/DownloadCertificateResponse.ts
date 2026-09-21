import type {CertificateResponse} from "../CertificateResponse";

export interface DownloadCertificateResponse extends CertificateResponse {
    member_name: string;
}
