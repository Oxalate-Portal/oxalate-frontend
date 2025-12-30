import {type PaymentRequest, type PaymentResponse, PaymentTypeEnum, type PaymentVO} from "../../models";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import {Button, Spin, Table, Tag} from "antd";
import {type ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import {useEffect, useState} from "react";
import {paymentAPI} from "../../services";
import {MinusCircleOutlined, PlusCircleOutlined} from "@ant-design/icons";

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
                                userId: payment.userId,
                                name: payment.name,
                                created: payment.payments[0].created,
                                startDate: payment.payments[0].startDate,
                                endDate: payment.payments[0].endDate,
                                paymentCount: payment.payments[0].paymentCount,
                                paymentType: payment.payments[0].paymentType,
                                boundEvents: payment.payments[0].boundEvents
                            };
                        });
                        setPayments(payments);
                        window.addEventListener("updatePaymentList-" + paymentType, fetchPayments);
                    })
                    .catch((error) => {
                        console.error("Failed to get payments:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }

        fetchPayments();

        return () => {
            window.removeEventListener("updatePaymentList-" + paymentType, fetchPayments);
        };
    }, [paymentType]);

    function updateCount(record: PaymentVO, change: number) {
        setLoading(true);
        record.paymentCount += change;

        const paymentRequest: PaymentRequest = {
            id: record.id,
            userId: record.userId,
            paymentType: record.paymentType,
            paymentCount: record.paymentCount,
            startDate: record.startDate,
            endDate: record.endDate
        };

        paymentAPI.update(paymentRequest)
                .then(() => {
                    window.dispatchEvent(new Event("updatePaymentList-" + record.paymentType));
                })
                .catch((error) => {
                    console.error("Failed to increase payment count:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<PaymentVO> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: "Type",
            dataIndex: "paymentType",
            key: "paymentType",
            render: (_: any, record: PaymentVO) => {
                let color = "";
                let paymentTypeLabel = "";

                if (record.paymentType === PaymentTypeEnum.PERIOD) {
                    color = "green";
                    paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.PERIOD);
                }
                if (record.paymentType === PaymentTypeEnum.ONE_TIME) {
                    color = "blue";
                    paymentTypeLabel = t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME);
                }

                return (
                        <Tag color={color} key={"payment-" + record.paymentType}>
                            {paymentTypeLabel}
                        </Tag>
                );
            }
        },
        {
            title: t("PaymentListTable.table.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a: PaymentVO, b: PaymentVO) => a.name.localeCompare(b.name),
            sortDirections: ["descend", "ascend"],
            render: (_: any, record: PaymentVO) => {
                return (
                        <Link to={"/users/" + record.userId + "/show"}>{record.name}</Link>
                );
            },
        },
        {
            title: t("PaymentListTable.table.paymentDate"),
            dataIndex: "created",
            key: "created",
            sorter: (a: PaymentVO, b: PaymentVO) =>
                    new Date(a.created).getTime() - new Date(b.created).getTime(),
            sortDirections: ["descend", "ascend"],
            render: (_: any, record: PaymentVO) => {
                return (
                        <>{dayjs(record.created).format("YYYY-MM-DD HH:mm")}</>
                );
            },
        },
        {
            title: t("PaymentListTable.table.startDate"),
            dataIndex: "startDate",
            key: "startDate",
            render: (date: Date, record: PaymentResponse) => {
                return (
                        <>
                            {record.startDate !== null
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>)
            },
        },
        {
            title: t("PaymentListTable.table.endDate"),
            dataIndex: "endDate",
            key: "endDate",
            render: (date: Date, record: PaymentResponse) => {
                return (
                        <>
                            {record.endDate !== null
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>)
            },
        },
        {
            title: t("PaymentListTable.table.paymentCount"),
            dataIndex: "paymentCount",
            key: "paymentCount",
            render: (_: any, record: PaymentVO) => {
                if (
                        record.paymentCount === null ||
                        record.paymentType !== PaymentTypeEnum.ONE_TIME
                ) {
                    return <>-</>;
                } else {
                    return (
                            <>
                                <span style={{marginRight: 8}}>{record.paymentCount}</span>
                                <Button
                                        style={{
                                            marginRight: 4,
                                            cursor: "pointer",
                                            border: "none",
                                            background: "transparent",
                                            color: "green",
                                        }}
                                        onClick={() => updateCount(record, 1)}
                                >
                                    <PlusCircleOutlined style={{fontSize: "18px"}}/>
                                </Button>
                                {(record.paymentCount > 0) && <Button
                                        style={{
                                            cursor: "pointer",
                                            border: "none",
                                            background: "transparent",
                                            color: "red",
                                        }}
                                        onClick={() => updateCount(record, -1)}
                                >
                                    <MinusCircleOutlined style={{fontSize: "18px"}}/>
                                </Button>}
                            </>
                    );
                }
            },
        },
    ];

    return (
            <Spin spinning={loading}>
                {!loading && <Table columns={columns}
                                    dataSource={payments}
                                    rowKey={(record) =>
                                            keyName + "-payment-" + record.userId
                                    }
                />}
            </Spin>);
}
