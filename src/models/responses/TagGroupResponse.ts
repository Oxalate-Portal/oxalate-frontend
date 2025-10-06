import type {TagResponse} from "./TagResponse";
import {TagGroupEnum} from "../TagGroupEnum";

export interface TagGroupResponse {
    id: number;
    code: string;
    names: Record<string, string>;
    tags?: TagResponse[];
    type: TagGroupEnum;
}