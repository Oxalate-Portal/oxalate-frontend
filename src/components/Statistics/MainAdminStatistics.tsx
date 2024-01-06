import { useTranslation } from "react-i18next";
import { Space } from "antd";
import { YearlyDiveEventsStats } from "./YearlyDiveEventsStats";
import { YearlyRegistrationsStats } from "./YearlyRegistrationsStats";
import { YearlyOrganizersStats } from "./YearlyOrganizersStats";
import { YearlyPaymentsStats } from "./YearlyPaymentsStats";
import { DiveEventReport } from "./DiveEventReport";

export function MainAdminStatistics() {
    const { t } = useTranslation();

    return (
            <div className={'darkDiv'}>
                <h4>{t('StatisticsMain.yearlyStats')}</h4>

                <Space direction={'vertical'} size={40} style={{width: '100%'}}>
                    <YearlyDiveEventsStats/>
                    <YearlyRegistrationsStats/>
                    <YearlyOrganizersStats/>
                    <YearlyPaymentsStats/>
                </Space>

                <h4>{t('StatisticsMain.reports')}</h4>

                <DiveEventReport/>
            </div>
    );
}
