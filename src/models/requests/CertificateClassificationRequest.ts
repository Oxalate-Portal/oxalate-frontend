import type {CertificateClassificationResponse} from "../responses";

export type CertificateClassificationRequest = Omit<CertificateClassificationResponse, "id" | "order"> & {
    id: number | null;
    order?: number | null;
};
