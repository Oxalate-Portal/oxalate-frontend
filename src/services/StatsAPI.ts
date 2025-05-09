import {AbstractAPI} from "./AbstractAPI";
import {EventPeriodReportResponse, MultiYearValueResponse, YearlyDiversListResponse} from "../models/responses";

/**
 * This class is used to make API calls to the /stats endpoint. We only retrieve data from this endpoint so there is no request payload, yet.
 */

class StatsAPI extends AbstractAPI<void, MultiYearValueResponse[]> {
    public async getYearlyDiverList(): Promise<YearlyDiversListResponse[]> {
        const response = await this.axiosInstance.get<YearlyDiversListResponse[]>('/yearly-diver-list');
        return response.data;
    }

    public async getDiveEventReports(): Promise<EventPeriodReportResponse[]> {
        const response = await this.axiosInstance.get<EventPeriodReportResponse[]>('/event-report');
        return response.data;
    }

    public async getYearlyStatsData(type: string): Promise<MultiYearValueResponse[]> {
        const response = await this.axiosInstance.get<MultiYearValueResponse[]>('/yearly-' + type);
        return response.data;
    }
}

export const statsAPI = new StatsAPI('/stats');