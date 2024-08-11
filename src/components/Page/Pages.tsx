import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../session";
import { useEffect, useState } from "react";
import { PageResponse, RolePermissionResponse } from "../../models/responses";
import { useTranslation } from "react-i18next";
import { RoleEnum, UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { Alert, Button, Space, Spin, Table, Tag } from "antd";
import { checkRoles, getPageGroupTitleByLanguage, getPageTitleByLanguage, isAllowedToEditPage } from "../../helpers";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";
import { pageGroupMgmtAPI, pageMgmtAPI } from "../../services";
import { SubmitResult } from "../main";
import { PageStatusTag } from "./PageStatusTag";

export function Pages() {
    const {paramId} = useParams();
    const [pageGroupId, setPageGroupId] = useState<number>(0);
    const {userSession, sessionLanguage} = useSession();
    const [loading, setLoading] = useState<boolean>(true);
    const [pages, setPages] = useState<PageResponse[]>([]);
    const [pageGroupTitle, setPageGroupTitle] = useState<string>("");
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const {t} = useTranslation();
    const navigate = useNavigate();

    const columns: ColumnsType<PageResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: t("Pages.table.title"),
            dataIndex: "title",
            key: "title",
            render: (_text: string, record: PageResponse) => {
                let language = "fi";
                if (sessionLanguage) {
                    language = sessionLanguage;
                }
                let title = getPageTitleByLanguage(language, record);
                return (<b>{title}</b>);
            }
        },
        {
            title: t("Pages.table.languageVersions"),
            dataIndex: "languageVersions",
            key: "languageVersions",
            render: (_text: string, record: PageResponse) => {
                return (<>{record.pageVersions.length}</>);
            }
        },
        {
            title: t("Pages.table.createdAt"),
            dataIndex: "createdAt",
            key: "createdAt",
            render: (_text: string, record: PageResponse) => {
                return (<>{dayjs(record.createdAt).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: t("Pages.table.modifiedAt"),
            dataIndex: "modifiedAt",
            key: "modifiedAt",
            render: (_text: string, record: PageResponse) => {
                return (<>{record.modifiedAt != null && dayjs(record.modifiedAt).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: t("Pages.table.status"),
            dataIndex: "status",
            key: "status",
            render: (_text: string, record: PageResponse) => {
                return (<PageStatusTag pageStatus={record.status} recordId={record.id}/>);
            },
        },
        {
            title: t("Pages.table.rolePermissions"),
            dataIndex: "rolePermissions",
            key: "rolePermissions",
            render: (_: any, record: PageResponse) => (
                    <>
                        {record.rolePermissions.map((rolePermission: RolePermissionResponse) => {
                            let color = "";
                            let roleLabel = "";
                            let suffix = (rolePermission.readPermission ? "R" : "") + (rolePermission.writePermission ? "W" : "");

                            if (rolePermission.role === RoleEnum.ROLE_ANONYMOUS) {
                                color = "red";
                                roleLabel = t("common.roles.anonymous");
                            }
                            if (rolePermission.role === RoleEnum.ROLE_USER) {
                                color = "green";
                                roleLabel = t("common.roles.user");
                            }
                            if (rolePermission.role === RoleEnum.ROLE_ORGANIZER) {
                                color = "blue";
                                roleLabel = t("common.roles.organizer");
                            }
                            if (rolePermission.role === RoleEnum.ROLE_ADMIN) {
                                color = "cyan";
                                roleLabel = t("common.roles.administrator");
                            }

                            return (
                                    <Tag color={color} key={rolePermission.role}>
                                        {roleLabel} {suffix}
                                    </Tag>
                            );
                        })}
                    </>
            ),
        },
        {
            title: "",
            key: "action",
            render: (_: any, record: PageResponse) => (
                    <Space size="middle">
                        {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])
                                && isAllowedToEditPage(userSession, record.rolePermissions) &&
                                <>
                                    <Link to={"/administration/pages/" + record.id}><Button
                                            type={"primary"}>{t("common.button.update")}</Button></Link>
                                    {pageGroupId !== 1 &&
                                            <Button danger type={"primary"}
                                                    onClick={() => closePage(record.id)}>{t("common.button.close")}</Button>}
                                </>
                        }
                    </Space>
            ),
        }
    ];

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive page id:", paramId);
            return;
        }

        let tmpPageGroupId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpPageGroupId = parseInt(paramId);
            setPageGroupId(tmpPageGroupId);
        }

        setLoading(true);
        pageGroupMgmtAPI.findById(tmpPageGroupId, null)
                .then(response => {
                    setPages(response.pages);

                    let lang = "fi";

                    if (sessionLanguage) {
                        lang = sessionLanguage;
                    }

                    setPageGroupTitle(getPageGroupTitleByLanguage(lang, response));
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [paramId, sessionLanguage]);

    function closePage(pageId: number) {
        if (window.confirm(t("Pages.closePage.confirm") + pageId + "?")) {
            pageMgmtAPI.delete(pageId)
                    .then((result: boolean) => {
                        if (result) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("Pages.updateStatus.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("Pages.updateStatus.fail")});
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                    });
        }
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        if (updateStatus.status === UpdateStatusEnum.OK) {
            window.dispatchEvent(new Event("reloadNavigationEvent"));
        }

        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <div className={"darkDiv"}>
                <h4>{pageGroupTitle}-{t("Pages.title")}</h4>

                {pages && pages.length === 0 && <Alert key={"info"} showIcon={true} message={t("Pages.alert.noPages")}/>}
                {pages && pages.length > 0 && <Spin spinning={loading}>
                    {pages && pages.length > 0 && <Table dataSource={pages} columns={columns} pagination={false} rowKey="id"/>}
                </Spin>}

                {pageGroupId !== 1 &&
                        <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "right", margin: 12}}>
                            <Link to={"/administration/pages/0?pageGroupId=" + pageGroupId}><Button
                                    type={"primary"}>{t("Pages.button.addPage")}</Button></Link>
                        </Space>}
            </div>
    );
}