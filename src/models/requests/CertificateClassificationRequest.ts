import type {CertificateClassificationResponse} from "../responses/CertificateClassificationResponse";

export type CertificateClassificationRequest = Omit<CertificateClassificationResponse, "id" | "order"> & {
    id: number | null;
    order?: number | null;
};
