import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { statsAPI } from "../../services/StatsAPI";
import { YearlyDiversListResponse } from "../../models/responses";
import { Collapse, Spin, Table } from "antd";

const {Panel} = Collapse;

export function YearlyDiveStats() {
    const [loading, setLoading] = useState(true);
    const [yearlyDiveData, setYearlyDiveData] = useState<YearlyDiversListResponse[]>([]);
    const {t} = useTranslation();

    const columns = [
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
            statsAPI.getYearlyDiverList()
                    .then(response => {
                        setYearlyDiveData(response);
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
                <h5>{t("StatsYearlyDives.title")}</h5>

                <Spin spinning={loading}>
                    <Collapse>
                        {!loading && yearlyDiveData.length > 0 && yearlyDiveData.map(yearlyData =>
                                <Panel header={yearlyData.year} key={yearlyData.year}>
                                    {yearlyData.divers.length > 0 && <Table dataSource={yearlyData.divers}
                                                                            columns={columns}
                                                                            pagination={{
                                                                                defaultPageSize: 10,
                                                                                hideOnSinglePage: true,
                                                                                showSizeChanger: true,
                                                                                showQuickJumper: true,
                                                                                pageSizeOptions: ["5", "10", "20", "30", "50"]
                                                                            }}
                                                                            key={"table" + yearlyData.year}
                                                                            rowKey={"id" + yearlyData.year}/>}
                                </Panel>)}
                    </Collapse>
                </Spin>
            </div>
    );
}
