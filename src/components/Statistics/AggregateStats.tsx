import {useEffect, useMemo, useState} from "react";
import type {AggregateResponse, MultiYearValueResponse} from "../../models";
import {DiveTypeEnum, UserTypeEnum} from "../../models";
import {statsAPI} from "../../services";
import {Card, Col, Row, Spin} from "antd";
import {Column, Line} from "@ant-design/charts";
import {useTranslation} from "react-i18next";
import {diveTypeEnum2Tag, userTypeEnum2Tag} from "../../tools";
import {OxTable} from "../main";

export function AggregateStats() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AggregateResponse | null>(null);

    useEffect(() => {
        statsAPI.getAggregates()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const totalColumns = [
        {
            title: t("AggregateStats.table.year"),
            dataIndex: "year",
            key: "year",
            mobile: true,
            sorter: (a: { year: number; }, b: { year: number; }) => a.year - b.year
        },
        {
            title: t("AggregateStats.table.value"),
            dataIndex: "value",
            key: "value",
            mobile: true,
            sorter: (a: { value: number; }, b: { value: number; }) => a.value - b.value
        }
    ];

    const eventTypeColumns = [
        {
            title: t("AggregateStats.table.year"),
            dataIndex: "year",
            key: "year",
            mobile: true,
            sorter: (a: { year: number; }, b: { year: number; }) => a.year - b.year
        },
        {
            title: t("AggregateStats.table.type"), dataIndex: "type", key: "type", mobile: true,
            render: (type: DiveTypeEnum, _record: object, index: number) => diveTypeEnum2Tag(type, t, index)
        },
        {title: t("AggregateStats.table.value"), dataIndex: "value", key: "value", sorter: (a: { value: number; }, b: { value: number; }) => a.value - b.value}
    ];

    const diverTypeColumns = [
        {
            title: t("AggregateStats.table.year"),
            dataIndex: "year",
            key: "year",
            mobile: true,
            sorter: (a: { year: number; }, b: { year: number; }) => a.year - b.year
        },
        {
            title: t("AggregateStats.table.type"), dataIndex: "type", key: "type", mobile: true,
            render: (type: UserTypeEnum, _record: object, index: number) => userTypeEnum2Tag(type, t, index)
        },
        {title: t("AggregateStats.table.value"), dataIndex: "value", key: "value", sorter: (a: { value: number; }, b: { value: number; }) => a.value - b.value}
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
        events: withKeys(data?.events_per_year),
        divers: withKeys(data?.divers_per_year)
    }), [data]);

    const typed = useMemo(() => ({
        eventTypes: withKeys(data?.event_types_per_year),
        diverTypes: withKeys(data?.diver_types_per_year)
    }), [data]);

    return (
        <Spin spinning={loading}>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card title={t("AggregateStats.card.eventsPerYear")}>
                        <OxTable pagination={false} size="small" dataSource={totals.events} columns={totalColumns}/>
                        <Column {...totalsConfig(data?.events_per_year)}/>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={t("AggregateStats.card.diversPerYear")}>
                        <OxTable pagination={false} size="small" dataSource={totals.divers} columns={totalColumns}/>
                        <Column {...totalsConfig(data?.divers_per_year)}/>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={t("AggregateStats.card.eventsByTypePerYear")}>
                        <OxTable pagination={false} size="small" dataSource={typed.eventTypes} columns={eventTypeColumns}/>
                        <Line {...lineConfig(data?.event_types_per_year)}/>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title={t("AggregateStats.card.diversByTypePerYear")}>
                        <OxTable pagination={false} size="small" dataSource={typed.diverTypes} columns={diverTypeColumns}/>
                        <Line {...lineConfig(data?.diver_types_per_year)}/>
                    </Card>
                </Col>
            </Row>
        </Spin>
    );
}
