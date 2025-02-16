import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Collapse, CollapseProps, Spin } from "antd";
import { statsAPI } from "../../services";
import { EventPeriodReportResponse } from "../../models/responses";
import { BiannualEventReportTable } from "./BiannualEventReportTable";

export function DiveEventReport() {
    const [loading, setLoading] = useState<boolean>(true);
    const [eventReports, setEventReports] = useState<EventPeriodReportResponse[]>([]);
    const {t} = useTranslation();

    const [collapseItems, setCollapseItems] = useState<CollapseProps["items"]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            statsAPI.getDiveEventReports()
                    .then(response => {
                        setEventReports(response);
                        const items = response.map(report => ({
                            key: report.period,
                            label: report.period,
                            children: <BiannualEventReportTable events={report.events} childKey={report.period} key={report.period + "-item"}/>
                        }));
                        setCollapseItems(items);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        };

        fetchData().catch(console.error);
    }, []);

    return (
            <div>
                <h4>{t("ReportEvents.title")}</h4>
                <Spin spinning={loading}>
                    {eventReports.length > 0 && <Collapse items={collapseItems}/>}
                </Spin>
            </div>
    );
}
