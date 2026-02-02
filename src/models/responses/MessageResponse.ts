export interface MessageResponse {
    id: number;
    description: string;
    title: string;
    message: string;
    creator: number;
    createdAt: string;
    read?: boolean;
}
