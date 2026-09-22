import type {MultiYearValueResponse} from "./MultiYearValueResponse.ts";

export interface AggregateResponse {
    events_per_year: MultiYearValueResponse[];
    event_types_per_year: MultiYearValueResponse[];
    divers_per_year: MultiYearValueResponse[];
    diver_types_per_year: MultiYearValueResponse[];
}
