import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { MultiYearValueResponse } from "../../models/responses";
import { statsAPI } from "../../services/StatsAPI";
import { Line } from "@ant-design/charts";
import { Spin } from "antd";

export function YearlyDiveEventsStats() {
    const [loading, setLoading] = useState(true);
    const [yearlyEventData, setYearlyEventData] = useState<MultiYearValueResponse[]>([]);
    const {t} = useTranslation();

    useEffect(() => {
        setLoading(true);
        statsAPI.getYearlyDiveEvents()
                .then((response) => {
                    setYearlyEventData(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    const config = {
        data: yearlyEventData,
        xField: 'year',
        yField: 'value',
        seriesField: 'type',
        point: {
            size: 5,
            shape: 'diamond',
        },
    };

    return (
            <div>
                <h5>{t('StatsYearlyEvents.stats.title')}</h5>
                <Spin spinning={loading}>
                    <Line {...config} />
                </Spin>
            </div>
    );
}
