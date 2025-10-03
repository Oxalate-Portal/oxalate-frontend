import {AbstractAPI} from "./AbstractAPI";
import {TagGroupRequest, TagGroupResponse} from "../models";

class TagGroupAPI extends AbstractAPI<TagGroupRequest, TagGroupResponse> {

}

export const tagGroupAPI = new TagGroupAPI("/tag-groups");