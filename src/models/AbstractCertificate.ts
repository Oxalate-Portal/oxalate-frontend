import type {Dayjs} from "dayjs";

export interface AbstractCertificate {
    id: number;
    userId: number;
    organization: string;
    certificateName: string;
    certificateId: string;
    diverId: string;
    certificationDate: Dayjs;
}