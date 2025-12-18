import {Link, useParams} from "react-router-dom";
import {useSession} from "../../session";
import {useEffect, useState} from "react";
import {type PageResponse, PageStatusEnum, RoleEnum, type RolePermissionResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {Alert, Button, message, Space, Spin, Table} from "antd";
import {checkRoles, getPageGroupTitleByLanguage, getPageTitleByLanguage, isAllowedToEditPage, pageStatusEnum2Tag, roleEnum2Tag} from "../../helpers";
import dayjs from "dayjs";
import type {ColumnsType} from "antd/es/table";
import {pageGroupMgmtAPI, pageMgmtAPI} from "../../services";

export function Pages() {
    const {paramId} = useParams();
    const [pageGroupId, setPageGroupId] = useState<number>(0);
    const {userSession, sessionLanguage} = useSession();
    const [loading, setLoading] = useState<boolean>(true);
    const [pages, setPages] = useState<PageResponse[]>([]);
    const [pageGroupTitle, setPageGroupTitle] = useState<string>("");
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

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
            render: (_text: string, record: PageResponse) => pageStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("Pages.table.rolePermissions"),
            dataIndex: "rolePermissions",
            key: "rolePermissions",
            render: (_: any, record: PageResponse) => (
                    <>
                        {record.rolePermissions
                                .slice()
                                .sort((a, b) => a.role.localeCompare(b.role))
                                .map((rolePermission: RolePermissionResponse) =>
                                        roleEnum2Tag(rolePermission.role, t, rolePermission.id)
                                )}
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
                                            record.status !== PageStatusEnum.DELETED &&
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
                            messageApi.success(t("Pages.updateStatus.ok"));
                            window.dispatchEvent(new Event("reloadNavigationEvent"));
                        } else {
                            messageApi.error(t("Pages.updateStatus.fail"));
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                        messageApi.error(e);
                    });
        }
    }

    return (
            <div className={"darkDiv"}>
                {contextHolder}
                <h4>{pageGroupTitle}-{t("Pages.title")}</h4>

                {pages && pages.length === 0 && <Alert key={"info"} showIcon={true} message={t("Pages.alert.noPages")}/>}
                {pages && pages.length > 0 && <Spin spinning={loading}>
                    {pages && pages.length > 0 && <Table dataSource={pages} columns={columns} pagination={false} rowKey="id"/>}
                </Spin>}

                {pageGroupId !== 1 &&
                        <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "right", margin: 12}}>
                            <Link to={"/administration/pages/0?pageGroupId=" + pageGroupId}><Button
                                    type={"primary"}>{t("Pages.button.addPage")}</Button></Link>
                        </Space>}
            </div>
    );
}