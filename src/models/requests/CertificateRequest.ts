import type {AbstractCertificate} from "../AbstractCertificate";

export type CertificateRequest = Omit<AbstractCertificate, "userId">;
