import type {Dayjs} from "dayjs";

export interface AbstractFileResponse {
    id: number;
    filename: string;
    creator: string;
    createdAt: Dayjs;
    mimetype: string;
    filesize: number;
    filechecksum: string;
    url: string;
}