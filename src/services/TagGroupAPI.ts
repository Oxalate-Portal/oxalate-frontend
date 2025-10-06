import {AbstractAPI} from "./AbstractAPI";
import type {TagGroupRequest, TagGroupResponse} from "../models";

class TagGroupAPI extends AbstractAPI<TagGroupRequest, TagGroupResponse> {

}

export const tagGroupAPI = new TagGroupAPI("/tag-groups");