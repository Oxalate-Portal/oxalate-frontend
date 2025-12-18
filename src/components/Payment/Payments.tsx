import {useTranslation} from "react-i18next";
import {Button, Divider, Space, Spin} from "antd";
import {ListPayments} from "./ListPayments";
import {AddPayments} from "./AddPayments";
import {paymentAPI} from "../../services";
import {useState} from "react";
import {PaymentTypeEnum, PortalConfigGroupEnum} from "../../models";
import {useSession} from "../../session";

export function Payments() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(false);
    const {getPortalConfigurationValue} = useSession();

    function invalidatePayments(type: PaymentTypeEnum) {
        if (window.confirm(t("AdminPayments.confirmInvalidate"))) {
            setLoading(true);
            paymentAPI.resetAllPayments(type)
                    .then((result) => {
                        if (result) {
                            const event = new CustomEvent("paymentListUpdated", {
                                detail: {paymentType: PaymentTypeEnum.PERIOD},
                            });
                            window.dispatchEvent(event);
                        }
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
                    <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                        <Button danger={true} type={"primary"}
                                onClick={() => invalidatePayments(PaymentTypeEnum.PERIOD)}>{t("AdminPayments.reset-periodical-button")}</Button>
                        {getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "single-payment-enabled") === "true" &&
                                <Button danger={true} type={"primary"}
                                        onClick={() => invalidatePayments(PaymentTypeEnum.ONE_TIME)}>{t("AdminPayments.reset-one-time-button")}</Button>}
                    </Space>
                    <Divider orientation="left">{t("AdminPayments.addPaymentsDivider")}</Divider>
                    <AddPayments/>
                </Spin>
            </div>
    );
}