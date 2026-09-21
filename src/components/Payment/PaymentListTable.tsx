import {type PaymentRequest, type PaymentResponse, PaymentTypeEnum, type PaymentVO} from "../../models";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {Button, Input, Space, Tag} from "antd";
import {type OxColumnsType, OxTable} from "../main";
import dayjs from "dayjs";
import {type Key, useEffect, useState} from "react";
import {paymentAPI} from "../../services";
import {MinusCircleOutlined, PlusCircleOutlined, SearchOutlined} from "@ant-design/icons";

interface PaymentListPanelProps {
    paymentType: PaymentTypeEnum;
    keyName: string;
}

export function PaymentListTable({paymentType, keyName}: PaymentListPanelProps) {
    const [loading, setLoading] = useState<boolean>(true);
    const [payments, setPayments] = useState<PaymentVO[]>([]);
    const {t} = useTranslation();


    useEffect(() => {
        function fetchPayments() {
            setLoading(true);

            paymentAPI.getAllActivePaymentStatusWithPaymentType(paymentType)
                    .then((result) => {
                        // Convert the PaymentStatusResponse to PaymentVO
                        const payments: PaymentVO[] = result.map((payment) => {
                            return {
                                id: payment.payments[0].id,
                                user_id: payment.user_id,
                                name: payment.name,
                                created: payment.payments[0].created,
                                start_date: payment.payments[0].start_date,
                                end_date: payment.payments[0].end_date,
                                payment_count: payment.payments[0].payment_count,
                                payment_type: payment.payments[0].payment_type,
                                bound_events: payment.payments[0].bound_events
                            };
                        });
                        setPayments(payments);
                    })
                    .catch((error) => {
                        console.error("Failed to get payments:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }

        window.addEventListener("updatePaymentList-" + paymentType, fetchPayments);
        fetchPayments();

        return () => {
            window.removeEventListener("updatePaymentList-" + paymentType, fetchPayments);
        };
    }, [paymentType]);

    function updateCount(record: PaymentVO, change: number) {
        const nextPaymentCount = (record.payment_count ?? 0) + change;

        const paymentRequest: PaymentRequest = {
            id: record.id,
            user_id: record.user_id,
            payment_type: record.payment_type,
            payment_count: nextPaymentCount,
            start_date: dayjs(record.start_date),
            end_date: record.end_date === null ? null : dayjs(record.end_date)
        };

        paymentAPI.update(paymentRequest)
                .then(() => {
                    window.dispatchEvent(new Event("updatePaymentList-" + record.payment_type));
                })
                .catch((error) => {
                    console.error("Failed to increase payment count:", error);
                });
    }

    const columns: OxColumnsType<PaymentVO> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: t("PaymentListTable.table.payment-type"),
            dataIndex: "payment_type",
            key: "payment_type",
            render: (_: string, record: PaymentVO) => {
                let color = "";
                let paymentTypeLabel = "";

                if (record.payment_type === PaymentTypeEnum.PERIODICAL) {
                    color = "green";
                    paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.PERIODICAL);
                }
                if (record.payment_type === PaymentTypeEnum.ONE_TIME) {
                    color = "blue";
                    paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME);
                }

                return (
                    <Tag color={color} key={"payment-" + record.payment_type}>
                            {paymentTypeLabel}
                        </Tag>
                );
            }
        },
        {
            title: t("PaymentListTable.table.name"),
            dataIndex: "name",
            key: "name",
            mobile: true,
            sorter: (a: PaymentVO, b: PaymentVO) => a.name.localeCompare(b.name),
            sortDirections: ["descend", "ascend"],
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => (
                    <div style={{padding: 8}}>
                        <Input
                                placeholder={t("PaymentListTable.table.name")}
                                value={selectedKeys[0]}
                                onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                                onPressEnter={() => confirm()}
                                style={{marginBottom: 8, display: "block"}}
                        />
                        <Space>
                            <Button
                                    type={"primary"}
                                    onClick={() => confirm()}
                                    icon={<SearchOutlined/>}
                                    size="small"
                                    style={{width: 90}}
                            >
                                {t("common.button.search")}
                            </Button>
                            <Button onClick={() => {
                                clearFilters?.();
                                confirm();
                            }} size="small" style={{width: 90}}>
                                {t("common.button.reset")}
                            </Button>
                        </Space>
                    </div>
            ),
            filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
            onFilter: (value: boolean | Key, record: PaymentVO) =>
                    record.name.toLowerCase().includes((value as string).toLowerCase()),
            render: (_: string, record: PaymentVO) => {
                return (<Link to={"/users/" + record.user_id + "/show"}>{record.name}</Link>);
            }
        },
        {
            title: t("PaymentListTable.table.paymentDate"),
            dataIndex: "created",
            key: "created",
            mobile: true,
            sorter: (a: PaymentVO, b: PaymentVO) =>
                    dayjs(a.created).isAfter(dayjs(b.created)) ? 1 : -1,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: PaymentVO) => {
                return (
                        <>{dayjs(record.created).format("YYYY-MM-DD HH:mm")}</>
                );
            }
        },
        {
            title: t("PaymentListTable.table.start-date"),
            dataIndex: "start_date",
            key: "start_date",
            sorter: (a: PaymentVO, b: PaymentVO) =>
                dayjs(a.start_date).isAfter(dayjs(b.start_date)) ? 1 : -1,
            sortDirections: ["descend", "ascend"],
            render: (date: Date, record: PaymentResponse) => {
                return (
                        <>
                            {record.start_date !== null
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>);
            }
        },
        {
            title: t("PaymentListTable.table.end-date"),
            dataIndex: "end_date",
            key: "end_date",
            sorter: (a: PaymentVO, b: PaymentVO) =>
                dayjs(a.end_date).isAfter(dayjs(b.end_date)) ? 1 : -1,
            sortDirections: ["descend", "ascend"],
            render: (date: Date, record: PaymentResponse) => {
                return (
                        <>
                            {record.end_date !== null
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>);
            }
        },
        {
            title: t("PaymentListTable.table.paymentCount"),
            dataIndex: "payment_count",
            key: "payment_count",
            render: (_: string, record: PaymentVO) => {
                if (
                    record.payment_count === null ||
                    record.payment_type !== PaymentTypeEnum.ONE_TIME
                ) {
                    return <>-</>;
                } else {
                    return (
                            <>
                                <span style={{marginRight: 8}}>{record.payment_count}</span>
                                <Button
                                        style={{
                                            marginRight: 4,
                                            cursor: "pointer",
                                            border: "none",
                                            background: "transparent",
                                            color: "green"
                                        }}
                                        onClick={() => updateCount(record, 1)}
                                >
                                    <PlusCircleOutlined style={{fontSize: "18px"}}/>
                                </Button>
                                {(record.payment_count > 0) && <Button
                                        style={{
                                            cursor: "pointer",
                                            border: "none",
                                            background: "transparent",
                                            color: "red"
                                        }}
                                        onClick={() => updateCount(record, -1)}
                                >
                                    <MinusCircleOutlined style={{fontSize: "18px"}}/>
                                </Button>}
                            </>
                    );
                }
            }
        }
    ];

    return (
        <OxTable columns={columns}
                 dataSource={payments}
                 loading={loading}
                 rowKey={(record) =>
                     keyName + "-payment-" + record.user_id + "-" + record.created
                 }
            />);
}
