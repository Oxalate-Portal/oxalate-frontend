import {AbstractAPI} from "./AbstractAPI";
import {CommentRequest} from "../models/requests";
import {CommentResponse} from "../models/responses";

class CommentAPI extends AbstractAPI<CommentRequest, CommentResponse> {

    public async findAllForParentId(parentId: number) {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<CommentResponse[]>("/" + parentId);
        return response.data;
    }

    public async findAllForParentIdWithDepth(parentId: number, depth: number) {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<CommentResponse[]>("/" + parentId + "/" + depth);
        return response.data;
    }
}

export const commentAPI = new CommentAPI("/comments");