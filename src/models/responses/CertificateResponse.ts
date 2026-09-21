import type {AbstractCertificate} from "../AbstractCertificate";

export interface CertificateResponse extends AbstractCertificate {
    certificate_photo_url: string;
    classification_title: string | null;
}
