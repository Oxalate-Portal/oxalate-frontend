import {Link, useParams} from "react-router-dom";
import {useSession} from "../../session";
import {useEffect, useState} from "react";
import {type PageResponse, PageStatusEnum, RoleEnum, type RolePermissionResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {Alert, Button, message, Space, Spin} from "antd";
import {checkRoles, getPageGroupTitleByLanguage, getPageTitleByLanguage, isAllowedToEditPage, pageStatusEnum2Tag, roleEnum2Tag} from "../../tools";
import dayjs from "dayjs";
import {type OxColumnsType, OxTable} from "../main";
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

    const columns: OxColumnsType<PageResponse> = [
        {
            title: "#",
            dataIndex: "id",
            key: "id"
        },
        {
            title: t("Pages.table.title"),
            dataIndex: "title",
            key: "title",
            mobile: true,
            render: (_text: string, record: PageResponse) => {
                let language = "fi";
                if (sessionLanguage) {
                    language = sessionLanguage;
                }
                const title = getPageTitleByLanguage(language, record);
                return (<b>{title}</b>);
            }
        },
        {
            title: t("Pages.table.languageVersions"),
            dataIndex: "languageVersions",
            key: "languageVersions",
            render: (_text: string, record: PageResponse) => {
                return (<>{record.page_versions.length}</>);
            }
        },
        {
            title: t("Pages.table.createdAt"),
            dataIndex: "created_at",
            key: "created_at",
            render: (_text: string, record: PageResponse) => {
                return (<>{dayjs(record.created_at).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: t("Pages.table.modifiedAt"),
            dataIndex: "modified_at",
            key: "modified_at",
            render: (_text: string, record: PageResponse) => {
                return (<>{record.modified_at != null && dayjs(record.modified_at).format("YYYY.MM.DD HH:mm")}</>);
            }
        },
        {
            title: t("Pages.table.status"),
            dataIndex: "status",
            key: "status",
            filters: Object.values(PageStatusEnum).map((value) => ({text: t(`PageStatusEnum.${value.toLowerCase()}`), value})),
            render: (_text: string, record: PageResponse) => pageStatusEnum2Tag(record.status, t, record.id)
        },
        {
            title: t("Pages.table.rolePermissions"),
            dataIndex: "role_permissions",
            key: "role_permissions",
            filters: Object.values(RoleEnum).map((value) => ({text: t(`common.roles.${value.toLowerCase()}`), value})),
            render: (_: string, record: PageResponse) => (
                <>
                    {record.role_permissions
                        .slice()
                        .sort((a, b) => a.role.localeCompare(b.role))
                        .map((rolePermission: RolePermissionResponse) =>
                            roleEnum2Tag(rolePermission.role, t, rolePermission.id)
                        )}
                </>
            )
        },
        {
            title: "",
            key: "action",
            render: (_: string, record: PageResponse) => (
                <Space size={"middle"}>
                    {userSession && checkRoles(userSession.roles, [RoleEnum.ROLE_ORGANIZER, RoleEnum.ROLE_ADMIN])
                        && isAllowedToEditPage(userSession, record.role_permissions) &&
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
            )
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

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPageGroupId(tmpPageGroupId);
        }

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

            {pages && pages.length === 0 && <Alert key={"info"} showIcon={true} title={t("Pages.alert.noPages")}/>}
            {pages && pages.length > 0 && <Spin spinning={loading}>
                {pages && pages.length > 0 && <OxTable dataSource={pages} columns={columns} pagination={false} rowKey="id"/>}
            </Spin>}

            {pageGroupId !== 1 &&
                <Space orientation={"horizontal"} size={12} style={{width: "98%", justifyContent: "right", margin: 12}}>
                    <Link to={"/administration/pages/0?pageGroupId=" + pageGroupId}><Button
                        type={"primary"}>{t("Pages.button.addPage")}</Button></Link>
                </Space>}
        </div>
    );
}
