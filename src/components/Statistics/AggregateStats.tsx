import {useEffect, useMemo, useState} from "react";
import type {AggregateResponse, MultiYearValueResponse} from "../../models";
import {statsAPI} from "../../services";
import {Card, Col, Row, Spin, Table} from "antd";
import {Column, Line} from "@ant-design/charts";

export function AggregateStats() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AggregateResponse | null>(null);

    useEffect(() => {
        setLoading(true);
        statsAPI.getAggregates()
                .then(setData)
                .catch(console.error)
                .finally(() => setLoading(false));
    }, []);

    const totalColumns = [
        {title: "Year", dataIndex: "year", key: "year", sorter: (a: { year: number; }, b: { year: number; }) => a.year - b.year},
        {title: "Value", dataIndex: "value", key: "value", sorter: (a: { value: number; }, b: { value: number; }) => a.value - b.value}
    ];

    const typeColumns = [
        {title: "Year", dataIndex: "year", key: "year", sorter: (a: { year: number; }, b: { year: number; }) => a.year - b.year},
        {title: "Type", dataIndex: "type", key: "type"},
        {title: "Value", dataIndex: "value", key: "value", sorter: (a: { value: number; }, b: { value: number; }) => a.value - b.value}
    ];

    const withKeys = (rows: MultiYearValueResponse[] = []) =>
            rows.map((r, idx) => ({...r, key: `${r.type || "total"}-${r.year}-${idx}`}));

    const totalsConfig = (rows: MultiYearValueResponse[] = []) => ({
        data: rows.map(r => ({...r, type: r.type || "total"})),
        xField: "year",
        yField: "value",
        seriesField: "type",
        columnWidthRatio: 0.6,
        theme: "dark"
    });

    const lineConfig = (rows: MultiYearValueResponse[] = []) => ({
        data: rows,
        xField: "year",
        yField: "value",
        seriesField: "type",
        colorField: "type",
        point: {size: 4, shape: "diamond"},
        theme: "dark",
        legend: {position: "top"},
        color: ["#F4664A", "#30BF78", "#FAAD14", "#2B8CBE", "#F6BD16", "#A0D911", "#13C2C2", "#FF6F61"]
    });

    const totals = useMemo(() => ({
        events: withKeys(data?.eventsPerYear),
        divers: withKeys(data?.diversPerYear)
    }), [data]);

    const typed = useMemo(() => ({
        eventTypes: withKeys(data?.eventTypesPerYear),
        diverTypes: withKeys(data?.diverTypesPerYear)
    }), [data]);

    return (
            <Spin spinning={loading}>
                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Card title="Events per Year">
                            <Table pagination={false} size="small" dataSource={totals.events} columns={totalColumns}/>
                            <Column {...totalsConfig(data?.eventsPerYear)}/>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Divers per Year">
                            <Table pagination={false} size="small" dataSource={totals.divers} columns={totalColumns}/>
                            <Column {...totalsConfig(data?.diversPerYear)}/>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Events by Type per Year">
                            <Table pagination={false} size="small" dataSource={typed.eventTypes} columns={typeColumns}/>
                            <Line {...lineConfig(data?.eventTypesPerYear)}/>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Divers by Type per Year">
                            <Table pagination={false} size="small" dataSource={typed.diverTypes} columns={typeColumns}/>
                            <Line {...lineConfig(data?.diverTypesPerYear)}/>
                        </Card>
                    </Col>
                </Row>
            </Spin>
    );
}
