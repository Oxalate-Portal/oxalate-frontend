import {PageGroupVersionResponse} from "./responses";

export interface AbstractPageGroup {
    id: number;
    pageGroupVersions: PageGroupVersionResponse[];
}