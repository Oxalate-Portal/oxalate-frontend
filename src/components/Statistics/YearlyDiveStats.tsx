import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { statsAPI } from "../../services";
import { DiverListItemResponse, YearlyDiversListResponse } from "../../models/responses";
import { Collapse, CollapseProps, Spin, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useSession } from "../../session";
import { PortalConfigGroupEnum } from "../../models";

export function YearlyDiveStats() {
    const [loading, setLoading] = useState(true);
    const [yearlyDiveData, setYearlyDiveData] = useState<YearlyDiversListResponse[]>([]);
    const [topListSize, setTopListSize] = useState<number>(100);
    const {t} = useTranslation();
    const [collapseItems, setCollapseItems] = useState<CollapseProps["items"]>([]);
    const {getPortalConfigurationValue} = useSession();

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
            Promise.all([
                statsAPI.getYearlyDiverList()
            ])
                    .then(([statsRespond]) => {
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
                                             rowKey={(record) => `${yearlyData.year}-diver-${record.userId}`}/>
                        }));
                        setCollapseItems(items);

                        setTopListSize(parseInt(getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "top-divers-list-size")));
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
