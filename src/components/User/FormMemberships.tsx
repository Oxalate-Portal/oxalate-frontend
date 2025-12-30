import {Table} from "antd";
import {type MembershipResponse, MembershipTypeEnum} from "../../models";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";
import {membershipStatusEnum2Tag, membershipTypeEnum2Tag} from "../../tools";

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
            render: (_: string, record: MembershipResponse) => membershipTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("FormMemberships.table.status"),
            dataIndex: 'status',
            key: 'membership-status',
            render: (_: string, record: MembershipResponse) => membershipStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("FormMemberships.table.start-date"),
            dataIndex: 'startDate',
            key: 'membership-startDate',
            render: (date: Date, record: MembershipResponse) => {
                return (
                        <>
                            {record.type === MembershipTypeEnum.DURATIONAL || record.type === MembershipTypeEnum.PERIODICAL
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>)
            }
        },
        {
            title: t("FormMemberships.table.end-date"),
            dataIndex: 'endDate',
            key: 'membership-endDate',
            render: (date: Date, record: MembershipResponse) => {
                return (
                        <>
                            {record.type === MembershipTypeEnum.DURATIONAL || record.type === MembershipTypeEnum.PERIODICAL
                                    ? dayjs(date).format("YYYY-MM-DD")
                                    : "-"}
                        </>)
            }
        },
        {
            title: t("FormMemberships.table.created"),
            dataIndex: 'created',
            key: 'membership-created',
            render: (date: Date) => {
                return (<>
                    {date !== null ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-"}
                </>)
            }
        }
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
