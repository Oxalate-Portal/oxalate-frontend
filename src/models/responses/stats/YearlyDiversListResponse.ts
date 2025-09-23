import {DiverListItemResponse} from "./DiverListItemResponse";

export interface YearlyDiversListResponse {
    year: number;
    divers: DiverListItemResponse[];
}