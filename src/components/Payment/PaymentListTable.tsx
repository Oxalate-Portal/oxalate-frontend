import { PaymentVO } from "../../models/PaymentVO";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Table } from "antd";
import { type ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

interface PaymentListPanelProps {
    payments: PaymentVO[],
    keyName: string
}

export function PaymentListTable({payments, keyName}: PaymentListPanelProps) {
    const {t} = useTranslation();

    const columns: ColumnsType<PaymentVO> = [
        {
            title: "#",
            dataIndex: "userId",
            key: "userId",
            render: (_: any, record: PaymentVO) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.userId}</Link>);
            }
        },
        {
            title: t("AdminOrgAdminPaymentListPanel.table.name"),
            dataIndex: "name",
            key: "name",
            sorter: (a: PaymentVO, b: PaymentVO) => a.name.localeCompare(b.name),
            sortDirections: ["descend", "ascend"],
            render: (_: any, record: PaymentVO) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.name}</Link>);
            }
        },
        {
            title: t("AdminOrgAdminPaymentListPanel.table.paymentDate"),
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a: PaymentVO, b: PaymentVO) => (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
            sortDirections: ["descend", "ascend"],
            render: (_: any, record: PaymentVO) => {
                return (<>{dayjs(record.createdAt).format("YYYY-MM-DD HH:mm")}</>);
            }
        },
        {
            title: t("AdminOrgAdminPaymentListPanel.table.expirationDate"),
            dataIndex: "expiresAt",
            key: "expiresAt",
            render: (_: any, record: PaymentVO) => {
                if (record.paymentCount === null) {
                    return (<>{dayjs(record.expiresAt).format("YYYY-MM-DD HH:mm")}</>);
                } else {
                    return (<>-</>);
                }
            }
        },
        {
            title: t("AdminOrgAdminPaymentListPanel.table.paymentCount"),
            dataIndex: "paymentCount",
            key: "paymentCount",
            render: (_: any, record: PaymentVO) => {
                if (record.paymentCount === null) {
                    return (<>-</>);
                } else {
                    return (<>{record.paymentCount}</>);
                }
            }
        },
    ];

    return (
            <Table
                    columns={columns}
                    dataSource={payments}
                    rowKey={record => keyName + "-payment-" + record.userId}
            />
    );
}
