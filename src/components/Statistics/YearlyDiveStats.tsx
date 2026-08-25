import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {statsAPI} from "../../services";
import {type DiverListItemResponse, PortalConfigGroupEnum, type YearlyDiversListResponse} from "../../models";
import {Collapse, type CollapseProps, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useSession} from "../../session";

export function YearlyDiveStats() {
    const [loading, setLoading] = useState(true);
    const [yearlyDiveData, setYearlyDiveData] = useState<YearlyDiversListResponse[]>([]);
    const [topListSize, setTopListSize] = useState<number>(100);
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();
    const topDiversListSize = getPortalConfigurationValue(PortalConfigGroupEnum.GENERAL, "top-divers-list-size");

    const columns: ColumnsType<DiverListItemResponse> = useMemo(() => [
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
    ], [t]);

    const collapseItems = useMemo<CollapseProps["items"]>(() => yearlyDiveData.map(yearlyData => ({
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
    })), [columns, yearlyDiveData]);

    useEffect(() => {
        statsAPI.getYearlyDiverList()
                .then((statsRespond) => {
                    setYearlyDiveData(statsRespond);
                    setTopListSize(parseInt(topDiversListSize));
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [topDiversListSize]);

    return (
            <div className={"darkDiv"}>
                <h5>{t("StatsYearlyDives.title-1") + topListSize + t("StatsYearlyDives.title-2")}</h5>

                <Spin spinning={loading}>
                    {!loading && yearlyDiveData.length > 0 && <Collapse items={collapseItems}/>}
                </Spin>
            </div>
    );
}
