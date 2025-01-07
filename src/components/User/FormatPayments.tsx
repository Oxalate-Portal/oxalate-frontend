import React from "react";
import { Table, Tag } from "antd";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PaymentResponse, UserResponse } from "../../models/responses";
import { PaymentTypeEnum } from "../../models";
import dayjs from "dayjs";

interface FormatPaymentsProps {
    userData: UserResponse | undefined;
}

export function FormatPayments(props: FormatPaymentsProps) {
    const {t} = useTranslation();

    if (!props.userData || !props.userData.payments || props.userData.payments.length === 0) {
        return (
                <span>{t("FormatPayments.noValid")}</span>
        );
    }

    // Define table columns
    const columns = [
        {
            title: t("FormatPayments.table.id"),
            dataIndex: "id",
            key: "id",
        },
        {
            title: t("FormatPayments.table.paymentType"),
            dataIndex: "paymentType",
            key: "paymentType",
            render: (type: PaymentTypeEnum) => {
                if (type === PaymentTypeEnum.ONE_TIME) {
                    return <Tag color="blue">{t("FormatPayments.table.singlePayment")}</Tag>;
                }
                if (type === PaymentTypeEnum.PERIOD) {
                    return <Tag color="green">{t("FormatPayments.table.periodPayment")}</Tag>;
                }
                return (
                        <>
                            <Tag color="red">{t("FormatPayments.table.unknownPayment")}</Tag>
                            <Link to="/about/contact">
                                {t("FormatPayments.table.unknownPaymentContact")}
                            </Link>
                        </>
                );
            },
        },
        {
            title: t("FormatPayments.table.paymentCount"),
            dataIndex: "paymentCount",
            key: "paymentCount",
            render: (count: number, record: PaymentResponse) =>
                    record.paymentType === PaymentTypeEnum.ONE_TIME ? count : "-",
        },
        {
            title: t("FormatPayments.table.startDate"),
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date: Date, record: PaymentResponse) => {
                return (<>
                    {record.paymentType === PaymentTypeEnum.PERIOD
                            ? dayjs(date).format("YYYY-MM-DD")
                            : "-"}
                </>)
            },
        },
        {
            title: t("FormatPayments.table.expirationDate"),
            dataIndex: "expiresAt",
            key: "expiresAt",
            render: (date: Date, record: PaymentResponse) => {
                return (
                    <>
                        {record.paymentType === PaymentTypeEnum.PERIOD
                                ? dayjs(date).format("YYYY-MM-DD")
                                : "-"}
                    </>)
            }
        },
    ];

    // Extract payment data
    const dataSource = props.userData.payments.map((payment) => ({
        key: payment.id,
        ...payment,
    }));

    return (
            <Table
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    bordered={true}
            />
    );
}
