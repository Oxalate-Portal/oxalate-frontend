import { Collapse, Spin } from "antd";
import { useTranslation } from "react-i18next";
import { PaymentListTable } from "./PaymentListTable";
import { PaymentTypeEnum } from "../../models";

export function ListPayments() {
    const {t} = useTranslation();

    const paymentItems = [
        {
            key: "one-time-payments",
            label: t("PaymentTypeEnum." + PaymentTypeEnum.ONE_TIME),
            children: <PaymentListTable paymentType={PaymentTypeEnum.ONE_TIME}
                                        keyName={"one_time"}
                                        key={"one_time"}/>
        },
        {
            key: "period-payments",
            label: t("PaymentTypeEnum." + PaymentTypeEnum.PERIOD),
            children: <PaymentListTable paymentType={PaymentTypeEnum.PERIOD}
                                        keyName={"period"}
                                        key={"period"}/>
        }
    ];

    return (
            <Spin spinning={false}>
                <Collapse items={paymentItems}/>
            </Spin>
    );
}