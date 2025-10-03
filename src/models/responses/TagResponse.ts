export interface TagResponse {
    id: number;
    code: string;
    names: Record<string, string>;
    tagGroupId?: number;
    tagGroupCode?: string;
}