import type {Dayjs} from "dayjs";

export interface AbstractFileResponse {
    id: number;
    filename: string;
    creator: string;
    created_at: Dayjs;
    mimetype: string;
    filesize: number;
    filechecksum: string;
    url: string;
}
