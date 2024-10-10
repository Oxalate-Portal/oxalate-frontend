import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { statsAPI } from "../../services/StatsAPI";
import { DiverListItemResponse, FrontendConfigurationResponse, YearlyDiversListResponse } from "../../models/responses";
import { Collapse, CollapseProps, Spin, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { portalConfigurationAPI } from "../../services";

export function YearlyDiveStats() {
    const [loading, setLoading] = useState(true);
    const [yearlyDiveData, setYearlyDiveData] = useState<YearlyDiversListResponse[]>([]);
    const [topListSize, setTopListSize] = useState<number>(100);
    const {t} = useTranslation();
    const [collapseItems, setCollapseItems] = useState<CollapseProps["items"]>([]);

    const columns: ColumnsType<DiverListItemResponse> = [
        {
            title: t("StatsYearlyDives.table.position"),
            dataIndex: "position",
            key: "position"
        },
        {
            title: t("StatsYearlyDives.table.userName"),
            dataIndex: "userName",
            key: "userName"
        },
        {
            title: t("StatsYearlyDives.table.diveCount"),
            dataIndex: "diveCount",
            key: "diveCount"
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            Promise.all([statsAPI.getYearlyDiverList(),
            portalConfigurationAPI.getFrontendConfiguration()])
                    .then(([statsRespond, portalConfig]) => {
                        setYearlyDiveData(statsRespond);
                        const items = statsRespond.map(yearlyData => ({
                            key: yearlyData.year + "-divedata-table",
                            label: yearlyData.year,
                            children: <Table dataSource={yearlyData.divers}
                                             columns={columns}
                                             pagination={{
                                                 defaultPageSize: 10,
                                                 hideOnSinglePage: true,
                                                 showSizeChanger: true,
                                                 showQuickJumper: true,
                                                 pageSizeOptions: ["5", "10", "20", "30", "50"]
                                             }}
                                             key={"table" + yearlyData.year}
                                             rowKey={"id" + yearlyData.year}/>
                        }));
                        setCollapseItems(items);

                        const topDiverListConfig: FrontendConfigurationResponse | undefined = portalConfig.find(config => config.key === "top-divers-list-size");
                        if (topDiverListConfig !== undefined) {
                            setTopListSize(parseInt(topDiverListConfig.value));
                        }
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
            <div className={"darkDiv"}>
                <h5>{t("StatsYearlyDives.title-1") + topListSize + t("StatsYearlyDives.title-2")}</h5>

                <Spin spinning={loading}>
                    {!loading && yearlyDiveData.length > 0 && <Collapse items={collapseItems}/>}
                </Spin>
            </div>
    );
}
