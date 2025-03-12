import { useSession } from "../../session";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { PageStatusEnum, RoleEnum } from "../../models";
import { PageGroupResponse } from "../../models/responses";
import { Button, message, Space, Spin, Table } from "antd";
import { checkRoles, getPageGroupTitleByLanguage, pageStatusEnum2Tag } from "../../helpers";
import { Link } from "react-router-dom";
import { pageGroupMgmtAPI } from "../../services";
import { ColumnsType } from "antd/es/table";

export function PageGroups() {
    const {userSession, sessionLanguage} = useSession();
    const [loading, setLoading] = useState<boolean>(true);
    const [pageGroups, setPageGroups] = useState<PageGroupResponse[]>([]);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const columns: ColumnsType<PageGroupResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: t("PageGroups.table.title"),
            dataIndex: "title",
            key: "title",
            render: (_text: string, record: PageGroupResponse) => {
                let language = "fi";

                if (sessionLanguage !== undefined) {
                    language = sessionLanguage;
                }

                let title = getPageGroupTitleByLanguage(language, record);
                return (<b>{title}</b>);
            }
        },
        {
            title: t("PageGroups.table.languageVersions"),
            dataIndex: "languageVersions",
            key: "languageVersions",
            render: (_text: string, record: PageGroupResponse) => {
                return (<>{record.pageGroupVersions.length}</>);
            }
        },
        {
            title: t("PageGroups.table.pageCount"),
            dataIndex: "pageCount",
            key: "pageCount",
            render: (_text: string, record: PageGroupResponse) => {
                return (<>{record.pages.length}</>);
            }
        },
        {
            title: t("PageGroups.table.status"),
            dataIndex: "status",
            key: "status",
            render: (_text: string, record: PageGroupResponse) => pageStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: "",
            key: "action",
            render: (_text: string, record: PageGroupResponse) => {
                let buttonText = t("PageGroups.button.updatePage");
                let pageLink = "/administration/page-groups/" + record.id + "/pages";

                if (record.pages.length === 0) {
                    buttonText = t("PageGroups.button.addPage");
                    pageLink = "/administration/pages/0?pageGroupId=" + record.id;
                }

                return (<Space size="middle">
                    {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) &&
                            record.id !== 1 &&
                            <Link to={"/administration/page-groups/" + record.id}><Button
                                    type={"primary"}>{t("common.button.update")}</Button></Link>}
                    {((record.id === 1 && userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]))
                                    || (record.id !== 1 && userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN]))) &&
                            <Link to={pageLink}><Button>{buttonText}</Button></Link>}
                    {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) &&
                            record.id !== 1 &&
                            record.status !== PageStatusEnum.DELETED  &&
                            <Button danger type={"primary"}
                                    onClick={() => closePageGroup(record.id)}>{t("common.button.close")}</Button>}
                </Space>);
            },
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            pageGroupMgmtAPI.findAll()
                    .then(response => {
                        setPageGroups(response);
                    })
                    .catch((error) => {
                        console.error(error);
                        messageApi.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        };

        fetchData().catch(console.error);
    }, []);

    function closePageGroup(pageGroupId: number) {
        if (window.confirm(t("PageGroups.deletePath.confirm.1") + pageGroupId + "?\n" +
                t("PageGroups.deletePath.confirm.2"))) {
            pageGroupMgmtAPI.delete(pageGroupId)
                    .then(() => {
                        messageApi.success(t("PageGroups.updateStatus.removed"));
                    })
                    .catch((e: any) => {
                        console.error(e);
                        messageApi.error(e);
                    });
        }
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{t("PageGroups.title")}</h4>

                <Spin spinning={loading}>
                    {pageGroups && pageGroups.length > 0 &&
                            <Table dataSource={pageGroups} columns={columns} pagination={false} rowKey="id"/>}
                </Spin>
                <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "right", margin: 12}}>
                    {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ADMIN]) &&
                            <Link to={"/administration/page-groups/0"}><Button
                                    type={"primary"}>{t("PageGroups.button.addGroup")}</Button></Link>}
                </Space>
            </div>
    );
}
