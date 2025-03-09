import {AbstractAPI} from "./AbstractAPI";
import {CommentRequest, ReportRequest} from "../models/requests";
import {CommentResponse, ReportResponse} from "../models/responses";
import {CommentModerationResponse} from "../models/responses/CommentModerationResponse";

class CommentAPI extends AbstractAPI<CommentRequest, CommentResponse> {

    public async findAllForParentId(parentId: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId);
        return response.data;
    }

    public async findAllForParentIdWithDepth(parentId: number, depth: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId + "/" + depth);
        return response.data;
    }

    public async report(reportRequest: ReportRequest): Promise<ReportResponse> {
        const response = await this.axiosInstance.post<ReportResponse>("/report", reportRequest);
        return response.data;
    }

    public async cancelReport(commentId: number): Promise<ReportResponse> {
        const response = await this.axiosInstance.post<ReportResponse>("/cancel-report" + commentId);
        return response.data;
    }

    public async getUnhandledReports(): Promise<CommentModerationResponse[]> {
        const response = await this.axiosInstance.get<CommentModerationResponse[]>("/unhandled-reports");
        return response.data;
    }
}

export const commentAPI = new CommentAPI("/comments");