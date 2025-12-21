import {AbstractAPI} from "./AbstractAPI";
import type {ActionResponse, CommentFilterRequest, CommentModerationResponse, CommentRequest, CommentResponse, ReportRequest} from "../models";

class CommentAPI extends AbstractAPI<CommentRequest, CommentResponse> {

    public async findAllForParentId(parentId: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId);
        return response.data;
    }

    public async findAllForParentIdWithDepth(parentId: number, depth: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId + "/" + depth);
        return response.data;
    }

    public async report(reportRequest: ReportRequest): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/report", reportRequest);
        return response.data;
    }

    public async cancelReport(commentId: number): Promise<ActionResponse> {
        const response = await this.axiosInstance.post<ActionResponse>("/cancel-report" + commentId);
        return response.data;
    }

    public async getPendingReports(): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/pending-reports");
        return response.data;
    }

    public async rejectComment(commentId: number): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/reject-comment/" + commentId);
        return response.data;
    }

    public async rejectReports(commentId: number): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/reject-reports/" + commentId);
        return response.data;
    }

    public async acceptReport(reportId: number): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/accept-report/" + reportId);
        return response.data;
    }

    public async dismissReport(reportId: number): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/dismiss-report/" + reportId);
        return response.data;
    }

    public async findFilteredComments(filter: CommentFilterRequest): Promise<CommentResponse[]> {
        const response = await this.axiosInstance.post<CommentResponse[]>("/filter", filter);
        return response.data;
    }
}

export const commentAPI = new CommentAPI("/comments");