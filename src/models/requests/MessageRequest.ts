export interface MessageRequest {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    createdAt?: string;
    recipients?: number[];
    sendAll?: boolean;
}
