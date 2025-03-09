import {CommentResponse} from "./CommentResponse";
import {CommentReportResponse} from "./CommentReportResponse";

export interface CommentModerationResponse extends CommentResponse {
    reports: CommentReportResponse[];
}