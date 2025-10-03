import {TagResponse} from "./TagResponse";

export interface TagGroupResponse {
    id: number;
    code: string;
    names: Record<string, string>;
    tags?: TagResponse[];
}