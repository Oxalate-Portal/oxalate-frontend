import { PaymentVO } from "../../models/PaymentVO";
import { Collapse, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { PaymentListTable } from "./PaymentListTable";

interface ListPaymentsProps {
    periodPayments: PaymentVO[],
    oneTimePayments: PaymentVO[],
    unknownPayments: PaymentVO[]
}

export function ListPayments({ periodPayments, oneTimePayments, unknownPayments }: ListPaymentsProps) {
    const {t} = useTranslation();

    const paymentItems = [
        {
            key: "one-time-payments",
            label: t("ListPayments.oneTime"),
            children: <PaymentListTable payments={oneTimePayments} keyName={"one_time"} key={"one_time"}/>
        },
        {
            key: "period-payments",
            label: t("ListPayments.period"),
            children: <PaymentListTable payments={periodPayments} keyName={"period"} key={"period"}/>
        },
        {
            key: "unknown-payments",
            label: t("ListPayments.unknown"),
            children: <PaymentListTable payments={unknownPayments} keyName={"unknown"} key={"unknown"}/>
        },
    ];

    return (
            <Spin spinning={false}>
                <Collapse items={paymentItems}/>
            </Spin>
    );
}