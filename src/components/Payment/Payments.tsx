import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Divider, Space, Spin } from "antd";
import { ListPayments } from "./ListPayments";
import { AddPayments } from "./AddPayments";
import { paymentAPI } from "../../services/PaymentAPI";
import { useEffect, useState } from "react";
import { PaymentStatusResponse } from "../../models/responses";
import { PaymentVO } from "../../models/PaymentVO";
import { PaymentTypeEnum } from "../../models";

export function Payments() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const [periodPayments, setPeriodPayments] = useState<PaymentVO[]>([]);
    const [oneTimePayments, setOneTimePayments] = useState<PaymentVO[]>([]);
    const [unknownPayments, setUnknownPayments] = useState<PaymentVO[]>([]);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const result: PaymentStatusResponse[] = await paymentAPI.getAllActivePaymentStatus();
            sortPayments(result);
        } catch (error) {
            console.error("Failed to get payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const sortPayments = (arrayList: PaymentStatusResponse[]): void => {
        let oneTime: PaymentVO[] = [];
        let period: PaymentVO[] = [];
        let unknown: PaymentVO[] = [];

        for (let i = 0; i < arrayList.length; i++) {
            let paymentListItem = arrayList[i];
            let userId = paymentListItem.userId;
            let userName = paymentListItem.name;

            for (let j = 0; j < paymentListItem.payments.length; j++) {
                let payment = paymentListItem.payments[j];

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
    };

    function invalidatePeriodicalPayments() {
        if (window.confirm(t("AdminPayments.confirmInvalidate"))) {
            setLoading(true);
            paymentAPI.resetAllPeriodicPayments()
                    .then((result) => {
                        fetchPayments();
                        navigate(0);
                    })
                    .catch((error) => {
                        console.error("Failed to reset payments:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    return (
            <div style={{width: "100%", justifyContent: "center"}} className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Divider orientation="left">{t("AdminPayments.activeDivider")}</Divider>
                    <ListPayments
                            periodPayments={periodPayments}
                            oneTimePayments={oneTimePayments}
                            unknownPayments={unknownPayments}
                    />
                    <Divider orientation="left">{t("AdminPayments.yearlyResetDivider")}</Divider>
                    <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button danger={true} type={"primary"} onClick={() => invalidatePeriodicalPayments()}>{t("AdminPayments.yearlyResetButton")}</Button>
                    </Space>
                    <Divider orientation="left">{t("AdminPayments.addPaymentsDivider")}</Divider>
                    <AddPayments fetchPayments={fetchPayments} />
                </Spin>
            </div>
    );
}