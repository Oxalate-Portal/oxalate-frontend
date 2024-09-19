export interface AbstractFileResponse {
    id: number;
    filename: string;
    creator: string;
    createdAt: Date;
    mimetype: string;
    filesize: number;
    filechecksum: string;
    url: string;
}