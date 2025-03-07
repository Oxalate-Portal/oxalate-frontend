import {AbstractAPI} from "./AbstractAPI";
import {CommentRequest} from "../models/requests";
import {CommentResponse} from "../models/responses";

class CommentAPI extends AbstractAPI<CommentRequest, CommentResponse> {

    public async findAllForParentId(parentId: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId);
        return response.data;
    }

    public async findAllForParentIdWithDepth(parentId: number, depth: number): Promise<CommentResponse> {
        const response = await this.axiosInstance.get<CommentResponse>("/" + parentId + "/" + depth);
        return response.data;
    }
}

export const commentAPI = new CommentAPI("/comments");