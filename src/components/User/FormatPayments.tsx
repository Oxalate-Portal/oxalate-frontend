import { Link } from "react-router-dom";
import { formatDateTime } from "../../helpers";
import { useTranslation } from "react-i18next";
import { UserResponse } from "../../models/responses";

interface FormatPaymentsProps {
    userData: UserResponse | undefined;
}

export function FormatPayments(props: FormatPaymentsProps) {
    const {t} = useTranslation();

    if (!props.userData || props.userData.payments === undefined || props.userData.payments.length === 0) {
        return (<><span>{t("FormatPayments.noValid")}</span></>);
    }

    return (<>
        {props.userData.payments.map(payment => {
            if (payment.paymentType === "ONE_TIME") {
                return (<><span
                        key={payment.id}><b>{formatDateTime(payment.createdAt)}:</b> {payment.paymentCount} {t("FormatPayments.singlePayment")}.<br/></span></>);
            }
            if (payment.paymentType === "PERIOD") {
                return (<><span
                        key={payment.id}><b>{formatDateTime(payment.createdAt)}:</b> {t("FormatPayments.yearlyPayment")} {formatDateTime(payment.expiresAt)}).<br/></span></>);
            }

            return (<><span key={payment.id}><b>{t("FormatPayments.unknownPayment")}:</b> {payment.paymentType}.
                {t("FormatPayments.unknownPaymentPlease")} <Link to={"/about/contact"}>{t("FormatPayments.unknownPaymentContact")}</Link>.</span></>);
        })}
    </>);
}
