export interface CommentRequest {
    id: number;
    title: string;
    body: string;
    parentCommentId: number;
}

