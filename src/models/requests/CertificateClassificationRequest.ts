import type {CertificateClassificationResponse} from "../responses/CertificateClassificationResponse";

export type CertificateClassificationRequest = Omit<CertificateClassificationResponse, "id"> & {
    id: number | null;
};
