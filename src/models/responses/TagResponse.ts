export interface TagResponse {
    id: number;
    code: string;
    names: Record<string, string>;
    tag_group_id?: number;
    tag_group_code?: string;
}
