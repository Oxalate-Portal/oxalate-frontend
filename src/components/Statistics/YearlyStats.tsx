import {useEffect, useState} from "react";
import type {MultiYearValueResponse} from "../../models";
import {statsAPI} from "../../services";
import {Spin} from "antd";
import {Line} from "@ant-design/charts";

interface YearlyStatsProps {
    typeOfStats: string,
    headerText: string
}

export function YearlyStats({typeOfStats, headerText}: YearlyStatsProps) {
    const [loading, setLoading] = useState(true);
    const [yearlyData, setYearlyData] = useState<MultiYearValueResponse[]>([]);

    useEffect(() => {
        setLoading(true);
        statsAPI.getYearlyStatsData(typeOfStats)
                .then((response) => {
                    setYearlyData(response);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [typeOfStats]);


    const config = {
        data: yearlyData,
        xField: "year",
        yField: "value",
        seriesField: "type",
        point: {
            size: 5,
            shape: "diamond",
        },
        theme: "dark",
        colorField: "type",
        color: ["#F4664A", "#30BF78", "#FAAD14", "#2B8CBE", "#F6BD16", "#A0D911", "#13C2C2", "#FF6F61"]
    };

    return (
            <div>
                <h5>{headerText}</h5>
                <Spin spinning={loading}>
                    <Line {...config} />
                </Spin>
            </div>
    );
}
