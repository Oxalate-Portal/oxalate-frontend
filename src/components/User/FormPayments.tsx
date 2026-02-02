import {Table} from "antd";
import {useTranslation} from "react-i18next";
import {type PaymentResponse, PaymentTypeEnum, type UserResponse} from "../../models";
import dayjs from "dayjs";
import {paymentTypeEnum2Tag} from "../../tools";

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
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.id - b.id,
        },
        {
            title: t("FormatPayments.table.paymentType"),
            dataIndex: "paymentType",
            key: "paymentType",
            render: (type: PaymentTypeEnum, record: PaymentResponse) => paymentTypeEnum2Tag(type, t, record.id),
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.paymentType.localeCompare(b.paymentType),
        },
        {
            title: t("FormatPayments.table.paymentCount"),
            dataIndex: "paymentCount",
            key: "paymentCount",
            render: (count: number, record: PaymentResponse) =>
                    record.paymentType === PaymentTypeEnum.ONE_TIME ? count : "-",
            sorter: (a: PaymentResponse, b: PaymentResponse) => a.paymentCount - b.paymentCount,
        },
        {
            title: t("FormatPayments.table.start-date"),
            dataIndex: "startDate",
            key: "startDate",
            render: (date: Date, _record: PaymentResponse) => {
                return (<>
                    {dayjs(date).format("YYYY-MM-DD")}
                </>)
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(),
        },
        {
            title: t("FormatPayments.table.end-date"),
            dataIndex: "endDate",
            key: "endDate",
            render: (date: Date, record: PaymentResponse) => {
                return (
                        <>
                            {record.endDate !== null
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>)
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => {
                if (a.endDate === null && b.endDate === null) {
                    return 0;
                } else if (a.endDate === null) {
                    return 1;
                } else if (b.endDate === null) {
                    return -1;
                } else {
                    return dayjs(a.endDate).unix() - dayjs(b.endDate).unix();
                }
            }
        },
        {
            title: t("FormatPayments.table.created"),
            dataIndex: "created",
            key: "created",
            render: (date: Date, _record: PaymentResponse) => {
                return (<>
                    {dayjs(date).format("YYYY-MM-DD HH:mm")}
                </>)
            },
            sorter: (a: PaymentResponse, b: PaymentResponse) => dayjs(a.created).unix() - dayjs(b.created).unix(),
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
