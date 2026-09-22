import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Button, Space} from "antd";
import {membershipAPI} from "../../services";
import {type MembershipResponse, MembershipStatusEnum, MembershipTypeEnum, SortDirectionEnum} from "../../models";
import type {OxColumnsType} from "../main";
import {OxTable, usePagedTable} from "../main";
import dayjs, {Dayjs} from "dayjs";
import {AddMemberships} from "./AddMemberships";
import {membershipStatusEnum2Tag, membershipTypeEnum2Tag} from "../../tools";

/** Formats a Dayjs date for a table cell; a missing date renders as an empty cell instead of "Invalid Date". */
function formatDate(date: Dayjs | null | undefined, format: string): string {
    return date ? dayjs(date).format(format) : "";
}

export function AdminMemberships() {
    const {t} = useTranslation();
    // Paging, sorting and the member name search are done by the server; the search matches first and last names.
    const membershipTable = usePagedTable<MembershipResponse>((request) => membershipAPI.findPaged(request), {
        defaultSortBy: "user_id",
        defaultDirection: SortDirectionEnum.ASC,
        defaultPageSize: 10
    });

    const memberListColumns: OxColumnsType<MembershipResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            sorter: true,
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.userId"),
            dataIndex: "user_id",
            key: "user_id",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.user_id + "/show"}>{record.user_id}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.username"),
            dataIndex: "username",
            key: "username",
            mobile: true,
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (_: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.user_id + "/show"}>{record.username}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(MembershipStatusEnum).map((value) => ({text: t(`MembershipStatusEnum.${value.toLowerCase()}`), value})),
            render: (_: string, record: MembershipResponse) => membershipStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("AdminMembers.table.type"),
            dataIndex: "type",
            key: "type",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            filters: Object.values(MembershipTypeEnum).map((value) => ({text: t(`MembershipTypeEnum.${value.toLowerCase()}`), value})),
            render: (_: string, record: MembershipResponse) => membershipTypeEnum2Tag(record.type, t, record.id)
        },
        {
            title: t("AdminMembers.table.start-date"),
            dataIndex: "start_date",
            key: "start_date",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (date: Dayjs | null) => formatDate(date, "YYYY-MM-DD")
        },
        {
            title: t("AdminMembers.table.end-date"),
            dataIndex: "end_date",
            key: "end_date",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (date: Dayjs | null) => formatDate(date, "YYYY-MM-DD")
        },
        {
            title: t("AdminMembers.table.created"),
            dataIndex: "created",
            key: "created",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (date: Dayjs | null) => formatDate(date, "YYYY-MM-DD HH:mm")
        },
        {
            title: t("AdminMembers.table.actions.title"),
            key: "actions",
            render: (_: string, record: MembershipResponse) => {
                return (
                    <Space size="small">
                        <Button type={"primary"} href={"/administration/members/" + record.id + "/edit"}>{t("common.button.edit")}</Button>
                    </Space>
                );
            }
        }
    ];

    return (
        <div className={"darkDiv"}>
            <Space orientation={"vertical"} size={12} style={{width: "100%"}}>
                {membershipTable.contextHolder}
                <h1>{t("AdminMembers.title")}</h1>

                <OxTable columns={memberListColumns}
                         dataMode={"server"}
                         paged={membershipTable}
                         rowKey="id"
                />
                <AddMemberships onMembershipAdded={membershipTable.reload}/>
            </Space>
        </div>
    );
}
