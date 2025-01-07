import { Table, Tag } from "antd";
import { MembershipResponse } from "../../models/responses";
import { useTranslation } from "react-i18next";
import { MembershipStatusEnum, MembershipTypeEnum } from "../../models";
import dayjs from "dayjs";

interface FormMembershipsProps {
    membershipList?: MembershipResponse[];
}

export function FormMemberships({membershipList}: FormMembershipsProps) {
    const {t} = useTranslation();
    const sortedMembershipList = membershipList?.slice().sort((a, b) => dayjs(b.expiresAt).valueOf() - dayjs(a.expiresAt).valueOf());

    const columns = [
        {
            title: t("FormMemberships.table.id"),
            dataIndex: 'id',
            key: 'membership-id',
        },
        {
            title: t("FormMemberships.table.type"),
            dataIndex: 'type',
            key: 'membership-type',
            render: (_: string, record: MembershipResponse) => {
                // Show tag with status
                let color: string;
                let label = t("MembershipStatusEnum." + record.status.toLowerCase());

                switch (record.status) {
                    case MembershipStatusEnum.ACTIVE:
                        color = "green";
                        break;
                    case MembershipStatusEnum.EXPIRED:
                        color = "orange";
                        break;
                    case MembershipStatusEnum.CANCELLED:
                        color = "red";
                        break;
                    default:
                        color = "red";
                        break;
                }

                return (<Tag color={color} key={"membership-status-" + record.id}>{label}</Tag>);
            }
        },
        {
            title: t("FormMemberships.table.status"),
            dataIndex: 'status',
            key: 'membership-status',
            render: (_: string, record: MembershipResponse) => {
                let color: string;
                let label = t("MembershipTypeEnum." + record.type.toLowerCase());

                switch (record.type) {
                    case MembershipTypeEnum.DISABLED:
                        color = "red";
                        break;
                    case MembershipTypeEnum.DURATIONAL:
                        color = "yellow";
                        break;
                    case MembershipTypeEnum.PERIODICAL:
                        color = "blue";
                        break;
                    case MembershipTypeEnum.PERPETUAL:
                        color = "green";
                        break;
                    default:
                        color = "red";
                        break;
                }
                return (<Tag color={color} key={"membership-type-" + record.id}>{label}</Tag>);
            }
        },
        {
            title: t("FormMemberships.table.created-at"),
            dataIndex: 'createdAt',
            key: 'membership-createdAt',
        },
        {
            title: t("FormMemberships.table.expires-at"),
            dataIndex: 'expiresAt',
            key: 'expiresAt',
        },
    ];

    return (
            <>
                <Table
                        columns={columns}
                        dataSource={sortedMembershipList}
                        pagination={false}
                        rowKey={(record) => record.id} key={"membership-table"}
                        bordered={true}
                />
            </>
    );
}
