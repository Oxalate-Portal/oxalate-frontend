import {AbstractAPI} from "./AbstractAPI";
import {CommentRequest, ReportRequest} from "../models/requests";
import {CommentResponse, ReportResponse} from "../models/responses";

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
}

export const commentAPI = new CommentAPI("/comments");