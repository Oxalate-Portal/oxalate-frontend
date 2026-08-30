import type {AbstractCertificate} from "../AbstractCertificate";

export interface CertificateResponse extends AbstractCertificate {
    certificatePhotoUrl: string;
    classificationTitle: string | null;
}