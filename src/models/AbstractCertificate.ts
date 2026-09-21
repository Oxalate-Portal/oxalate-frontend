import type {Dayjs} from "dayjs";

export interface AbstractCertificate {
    id: number;
    user_id: number;
    organization: string;
    certificate_name: string;
    certificate_id: string;
    diver_id: string;
    certification_date: Dayjs;
    classification_id?: number | null;
}
