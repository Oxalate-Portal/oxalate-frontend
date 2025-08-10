import {Collapse, Spin} from "antd";
import {useTranslation} from "react-i18next";
import {PaymentListTable} from "./PaymentListTable";
import {PaymentTypeEnum, PortalConfigGroupEnum} from "../../models";
import {useSession} from "../../session";

export function ListPayments() {
    const {t} = useTranslation();
    const {getPortalConfigurationValue} = useSession();

    let paymentItems = [
        {
            key: "period-payments",
            label: t("PaymentTypeEnum." + PaymentTypeEnum.PERIOD),
            children: <PaymentListTable paymentType={PaymentTypeEnum.PERIOD}
                                        keyName={"period"}
                                        key={"period"}/>
        }
    ];

    if (getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "single-payment-enabled") === "true") {
        paymentItems = [
            {
                key: "one-time-payments",
                label: t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME),
                children: <PaymentListTable paymentType={PaymentTypeEnum.ONE_TIME}
                                            keyName={"one_time"}
                                            key={"one_time"}/>
            },
            paymentItems[0]
        ];
    }

    return (
            <Spin spinning={false}>
                <Collapse items={paymentItems}/>
            </Spin>
    );
}