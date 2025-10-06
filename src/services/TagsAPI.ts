import {AbstractAPI} from "./AbstractAPI";
import type {TagRequest, TagResponse} from "../models";

class TagsAPI extends AbstractAPI<TagRequest, TagResponse> {
}

export const tagsAPI = new TagsAPI('/tags');