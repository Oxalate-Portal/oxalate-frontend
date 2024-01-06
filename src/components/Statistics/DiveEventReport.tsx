import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Spin } from "antd";
import { statsAPI } from "../../services/StatsAPI";
import { EventPeriodReportResponse } from "../../models/responses";
import { BiannualEventReport } from "./BiannualEventReport";

export function DiveEventReport() {
    const [loading, setLoading] = useState<boolean>(true);
    const [eventReports, setEventReports] = useState<EventPeriodReportResponse[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            statsAPI.getDiveEventReports()
                    .then(response => {
                        setEventReports(response);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }

        fetchData().catch(console.error);
    }, []);

    return (
            <div>
                <h4>{t('ReportEvents.title')}</h4>
                <Spin spinning={loading}>
                    {/* eslint-disable-next-line react/jsx-no-undef */}
                    {eventReports.length > 0 && eventReports.map(report => (<BiannualEventReport report={report} key={report.period}/>))}
                </Spin>
            </div>
    );
}
