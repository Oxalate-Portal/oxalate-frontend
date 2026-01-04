import type {MultiYearValueResponse} from "./MultiYearValueResponse.ts";

export interface AggregateResponse {
    eventsPerYear: MultiYearValueResponse[];
    eventTypesPerYear: MultiYearValueResponse[];
    diversPerYear: MultiYearValueResponse[];
    diverTypesPerYear: MultiYearValueResponse[];
}