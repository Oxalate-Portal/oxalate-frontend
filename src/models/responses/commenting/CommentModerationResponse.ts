import type {CommentResponse} from "./CommentResponse";
import type {CommentReportResponse} from "./CommentReportResponse";

export interface CommentModerationResponse extends CommentResponse {
    reports: CommentReportResponse[];
}