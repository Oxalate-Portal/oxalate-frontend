import {useTranslation} from "react-i18next";
import {type PaymentResponse, PaymentTypeEnum, type UserResponse} from "../../models";
import dayjs from "dayjs";
import {paymentTypeEnum2Tag} from "../../tools";
import {OxTable} from "../main";

interface FormatPaymentsProps {
    userData: UserResponse | undefined;
}

export function FormPayments(props: FormatPaymentsProps) {
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
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.id - b.id
        },
        {
            title: t("FormatPayments.table.paymentType"),
            dataIndex: "payment_type",
            key: "payment_type",
            render: (type: PaymentTypeEnum, record: PaymentResponse) => paymentTypeEnum2Tag(type, t, record.id),
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.payment_type.localeCompare(b.payment_type)
        },
        {
            title: t("FormatPayments.table.paymentCount"),
            dataIndex: "payment_count",
            key: "payment_count",
            render: (count: number, record: PaymentResponse) =>
                record.payment_type === PaymentTypeEnum.ONE_TIME ? count : "-",
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.payment_count - b.payment_count
        },
        {
            title: t("FormatPayments.table.start-date"),
            dataIndex: "start_date",
            key: "start_date",
            mobile: true,
            render: (date: Date) => {
                return (<>
                    {dayjs(date).format("YYYY-MM-DD")}
                </>);
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => dayjs(a.start_date).unix() - dayjs(b.start_date).unix()
        },
        {
            title: t("FormatPayments.table.end-date"),
            dataIndex: "end_date",
            key: "end_date",
            render: (date: Date, record: PaymentResponse) => {
                return (
                    <>
                        {record.end_date !== null
                            ? dayjs(date).format("YYYY-MM-DD")
                            : "-"}
                    </>);
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => {
                if (a.end_date === null && b.end_date === null) {
                    return 0;
                } else if (a.end_date === null) {
                    return 1;
                } else if (b.end_date === null) {
                    return -1;
                } else {
                    return dayjs(a.end_date).unix() - dayjs(b.end_date).unix();
                }
            }
        },
        {
            title: t("FormatPayments.table.created"),
            dataIndex: "created",
            key: "created",
            render: (date: Date) => {
                return (<>
                    {dayjs(date).format("YYYY-MM-DD HH:mm")}
                </>);
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => dayjs(a.created).unix() - dayjs(b.created).unix()
        }
    ];

    // Extract payment data
    const dataSource = props.userData.payments.map((payment) => ({
        key: payment.id,
        ...payment
    }));

    return (
        <OxTable
            dataSource={dataSource}
            columns={columns}
            pagination={false}
            bordered={true}
        />
    );
}
