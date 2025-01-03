import {UpdateStatusEnum, UpdateStatusVO} from "../../models";
import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Space, Table} from "antd";
import {membershipAPI} from "../../services";
import {MembershipResponse} from "../../models/responses";
import {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";

export function AdminMembers() {
    const [membershipList, setMembershipList] = useState<MembershipResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [searchText, setSearchText] = useState<string>("");
    const navigate = useNavigate();
    const {t} = useTranslation();

    const memberListColumns: ColumnsType<MembershipResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id",
            render: (text: string, record: MembershipResponse) => {
                return (<Link to={"/members/" + record.id + "/show"}>{record.id}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.userId"),
            dataIndex: "userId",
            key: "userId",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.userId - b.userId,
            sortDirections: ["descend", "ascend"],
            render: (text: string, record: MembershipResponse) => {
                return (<Link to={"/users/" + record.userId + "/show"}>{record.userId}</Link>);
            }
        },
        {
            title: t("AdminMembers.table.status"),
            dataIndex: "status",
            key: "status",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.status.localeCompare(b.status),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.type"),
            dataIndex: "type",
            key: "type",
            sorter: (a: MembershipResponse, b: MembershipResponse) => a.type.localeCompare(b.type),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.createdAt"),
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a: MembershipResponse, b: MembershipResponse) => dayjs(a.createdAt).valueOf() -  dayjs(b.createdAt).valueOf(),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.expiresAt"),
            dataIndex: "expiresAt",
            key: "expiresAt",
            sorter: (a: MembershipResponse, b: MembershipResponse) => dayjs(a.expiresAt).valueOf() -  dayjs(b.expiresAt).valueOf(),
            sortDirections: ["descend", "ascend"]
        },
        {
            title: t("AdminMembers.table.actions"),
            key: "actions",
            render: (text: string, record: MembershipResponse) => {
                return (
                        <Space size="small">
                            <Link to={"/members/" + record.id + "/show"}>{t("AdminMembers.table.actions.show")}</Link>
                            <Link to={"/members/" + record.id + "/edit"}>{t("AdminMembers.table.actions.edit")}</Link>
                        </Space>
                );
            }
        }
    ];


    useEffect(() => {
        setLoading(true);
        membershipAPI.findAll()
                .then((response) => {
                    setMembershipList(response);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to load members", error);
                })
                .catch((error) => {
                    console.error("Failed to load members", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <div>
                <h1>{t("AdminMembers.title")}</h1>

                <Table columns={memberListColumns} dataSource={membershipList} loading={loading} rowKey="id"/>
            </div>
    );
}