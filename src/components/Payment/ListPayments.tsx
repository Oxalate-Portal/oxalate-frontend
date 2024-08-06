import { useEffect, useState } from "react";
import { paymentAPI } from "../../services/PaymentAPI";
import { PaymentResponse, PaymentStatusResponse } from "../../models/responses";
import { PaymentTypeEnum } from "../../models";
import { PaymentVO } from "../../models/PaymentVO";
import { Collapse, CollapseProps, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { PaymentListTable } from "./PaymentListTable";

export function ListPayments() {
    const [loading, setLoading] = useState<boolean>(true);
    const [periodPayments, setPeriodPayments] = useState<PaymentVO[]>([]);
    const [oneTimePayments, setOneTimePayments] = useState<PaymentVO[]>([]);
    const [unknownPayments, setUnknownPayments] = useState<PaymentVO[]>([]);
    const {t} = useTranslation();

    const paymentItems: CollapseProps["items"] = [
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

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            paymentAPI.getAllActivePaymentStatus()
                    .then((result: PaymentStatusResponse[]) => {
                        sortPayments(result);
                    })
                    .catch((error) => {
                        console.error("Failed to get payments:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        };

        function sortPayments(arrayList: PaymentStatusResponse[]): void {
            let oneTime: PaymentVO[] = [];
            let period: PaymentVO[] = [];
            let unknown: PaymentVO[] = [];

            for (let i = 0; i < arrayList.length; i++) {
                let paymentListItem = arrayList[i];
                let userId = paymentListItem.userId;
                let userName = paymentListItem.name;

                for (let j = 0; j < paymentListItem.payments.length; j++) {
                    let payment: PaymentResponse = paymentListItem.payments[j];

                    switch (payment.paymentType) {
                        case PaymentTypeEnum.ONE_TIME:
                            oneTime.push({
                                id: payment.id,
                                paymentType: payment.paymentType,
                                userId: userId,
                                name: userName,
                                paymentCount: payment.paymentCount,
                                createdAt: payment.createdAt,
                                expiresAt: payment.expiresAt
                            });
                            break;
                        case PaymentTypeEnum.PERIOD:
                            period.push({
                                id: payment.id,
                                paymentType: payment.paymentType,
                                userId: userId,
                                name: userName,
                                paymentCount: payment.paymentCount,
                                createdAt: payment.createdAt,
                                expiresAt: payment.expiresAt
                            });
                            break;
                        default:
                            unknown.push({
                                id: payment.id,
                                paymentType: payment.paymentType,
                                userId: userId,
                                name: userName,
                                paymentCount: payment.paymentCount,
                                createdAt: payment.createdAt,
                                expiresAt: payment.expiresAt
                            });
                            break;
                    }
                }
            }

            setOneTimePayments(oneTime);
            setPeriodPayments(period);
            setUnknownPayments(unknown);
        }

        fetchPayments().catch(console.error);
    }, []);

    return (
            <Spin spinning={loading}>
                {!loading && <Collapse items={paymentItems}/>}
            </Spin>
    );
}
