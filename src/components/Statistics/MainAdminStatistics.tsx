import { useTranslation } from "react-i18next";
import { Space } from "antd";
import { DiveEventReport } from "./DiveEventReport";
import { YearlyStats } from "./YearlyStats";

export function MainAdminStatistics() {
    const {t} = useTranslation();

    return (
            <div className={"darkDiv"}>
                <h4>{t("StatisticsMain.yearlyStats")}</h4>

                <Space direction={"vertical"} size={40} style={{width: "100%"}}>
                    <YearlyStats typeOfStats={"events"} headerText={t("StatsYearlyEvents.stats.title")}/>
                    <YearlyStats typeOfStats={"registrations"} headerText={t("StatsYearlyRegistrations.stats.title")}/>
                    <YearlyStats typeOfStats={"organizers"} headerText={t("StatsOrganizers.stats.title")}/>
                    <YearlyStats typeOfStats={"payments"} headerText={t("StatsPayments.stats.title")}/>
                </Space>

                <h4>{t("StatisticsMain.reports")}</h4>

                <DiveEventReport/>
            </div>
    );
}
