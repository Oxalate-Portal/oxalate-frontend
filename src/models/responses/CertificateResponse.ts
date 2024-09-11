import {AbstractCertificate} from "../AbstractCertificate";

export interface CertificateResponse extends AbstractCertificate {
    certificatePhotoUrl: string;
}