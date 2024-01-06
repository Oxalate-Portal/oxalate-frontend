import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button, Divider, Space, Spin } from "antd";
import { ListPayments } from "./ListPayments";
import { AddPayments } from "./AddPayments";
import { paymentAPI } from "../../services/PaymentAPI";
import { useState } from "react";

export function Payments() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);

    function invalidateYearlyPayments() {
        if (window.confirm(t("AdminPayments.confirmInvalidate"))) {
            setLoading(true);
            paymentAPI.resetAllPeriodicPayments()
                    .then((result) => {
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
                    <ListPayments/>
                    <Divider orientation="left">{t("AdminPayments.yearlyResetDivider")}</Divider>
                    <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button danger={true} type={"primary"} onClick={() => invalidateYearlyPayments()}>{t("AdminPayments.yearlyResetButton")}</Button>
                    </Space>
                    <Divider orientation="left">{t("AdminPayments.addPaymentsDivider")}</Divider>
                    <AddPayments/>
                </Spin>
            </div>);
}
