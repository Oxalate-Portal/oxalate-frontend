import { useTranslation } from "react-i18next";
import { OptionItemVO, PageStatusEnum, RoleEnum, UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { useSession } from "../../session";
import { getHighestRole, getPageGroupTitleByLanguage, LanguageUtil } from "../../helpers";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Checkbox, Divider, Form, Input, Select, Space } from "antd";
import { PageGroupResponse, PageResponse, RolePermissionResponse } from "../../models/responses";
import { pageGroupMgmtAPI, pageMgmtAPI } from "../../services";
import { SubmitResult } from "../main";
import { PageRequest } from "../../models/requests";
import dayjs from "dayjs";
import { PageBodyEditor } from "./PageBodyEditor";

export function EditPage() {
    const {paramId} = useParams();
    const {userSession, sessionLanguage} = useSession();
    const {t} = useTranslation();
    const navigate = useNavigate();

    const [pageId, setPageId] = useState<number>(0);
    const [pageGroupOptions, setPageGroupOptions] = useState<OptionItemVO[]>([]);
    const [loading, setLoading] = useState(true);
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [createNewPage, setCreateNewPage] = useState<boolean>(false);
    const [sendButtonText, setSendButtonText] = useState<string>(t("EditPage.form.button.update"));
    const [pageForm] = Form.useForm();
    const [formTitleKey, setFormTitleKey] = useState<string>("EditPage.title.new");

    const searchParams = new URLSearchParams(window.location.search);
    let queryPageGroupId = searchParams.get("pageGroupId");
    let tmpPageGroupId: number = 0;

    if (queryPageGroupId !== null && queryPageGroupId?.length !== 0 && !Number.isNaN(parseInt(queryPageGroupId))) {
        tmpPageGroupId = parseInt(queryPageGroupId);
    }

    const highestRole: RoleEnum = userSession ? getHighestRole(userSession) : RoleEnum.ROLE_ANONYMOUS;
    const [userRole] = useState<RoleEnum>(highestRole);

    const [pageData, setPageData] = useState<PageResponse>(() => {
        const basePageData: PageResponse = {
            id: 0,
            pageGroupId: tmpPageGroupId,
            status: PageStatusEnum.DRAFTED,
            pageVersions: LanguageUtil.languages.map((language) => ({
                id: 0,
                pageId: 0,
                language: language.value,
                title: "",
                ingress: "",
                body: ""
            })),
            rolePermissions: [
                {
                    id: 0,
                    pageId: 0,
                    role: RoleEnum.ROLE_ANONYMOUS,
                    readPermission: true,
                    writePermission: false
                }
            ],
            creator: 0,
            createdAt: dayjs().toDate(),
            modifier: null,
            modifiedAt: null
        };

        if (highestRole !== RoleEnum.ROLE_ANONYMOUS) {
            // Add additional role permission
            basePageData.rolePermissions.push({
                id: 0,
                pageId: 0,
                role: highestRole,
                readPermission: true,
                writePermission: true
            });
        }

        return basePageData;
    });

    const statusOptions: OptionItemVO[] = [
        {value: PageStatusEnum.DRAFTED, label: t("common.pages.status.drafted")},
        {value: PageStatusEnum.PUBLISHED, label: t("common.pages.status.published")},
        {value: PageStatusEnum.DELETED, label: t("common.pages.status.deleted")},
    ];

    const roleOptions: OptionItemVO[] = [
        {value: RoleEnum.ROLE_ANONYMOUS, label: t("common.roles.anonymous")},
        {value: RoleEnum.ROLE_USER, label: t("common.roles.user")},
        {value: RoleEnum.ROLE_ORGANIZER, label: t("common.roles.organizer")},
        {value: RoleEnum.ROLE_ADMIN, label: t("common.roles.administrator")}
    ];


    useEffect(() => {
        function populatePageGroups(data: PageGroupResponse[]) {
            let pageGroups = [];

            for (let i = 0; i < data.length; i++) {
                let title = getPageGroupTitleByLanguage(sessionLanguage, data[i]);
                pageGroups.push({value: data[i].id, label: title});
            }

            setPageGroupOptions(pageGroups);
        }

        if (paramId === undefined || paramId?.length === 0) {
            console.error("Invalid page id:", paramId);
            return;
        }

        let tmpPageId = 0;
        if (!Number.isNaN(parseInt(paramId))) {
            tmpPageId = parseInt(paramId);
            setPageId(tmpPageId);
        }

        if (tmpPageId > 0) {
            setLoading(true);
            setCreateNewPage(false);
            setFormTitleKey("EditPage.title.update");

            Promise.all([
                pageGroupMgmtAPI.findAll(),
                pageMgmtAPI.findById(tmpPageId, null)
            ])
                    .then((data) => {
                        // Page group selection box data
                        populatePageGroups(data[0]);
                        // Page data
                        setPageData(data[1]);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            setCreateNewPage(true);

            pageGroupMgmtAPI.findAll()
                    .then((result) => {
                        // Page group selection box data
                        populatePageGroups(result);
                        setCreateNewPage(true);
                        setSendButtonText(t("EditPage.form.button.create"));
                    })
                    .catch((error) => {
                        console.error(error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }, [paramId, sessionLanguage, t]);

    function onFinish(formData: PageRequest): void {
        setLoading(true);

        if (createNewPage) {
            pageMgmtAPI.create(formData)
                    .then((response: PageResponse) => {
                        // If we get back an ID, we assume the creation was successful
                        if (response && response.id > 0) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("EditPage.onFinish.create.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("EditPage.onFinish.create.fail")});
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            pageMgmtAPI.update(formData)
                    .then((response) => {
                        // If we get back the same ID as we sent, we assume the update was successful
                        if (response && response.id === pageId) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("EditPage.onFinish.update.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("EditPage.onFinish.update.fail")});
                        }
                        setLoading(false);
                    })
                    .catch(e => {
                        console.error(e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                        setLoading(false);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    function onFinishFailed(errorInfo: any) {
        console.error("Failed:", errorInfo);
    }

    const validatePermissions = (rule: any, value: any, index: number) => {
        const readPermissionValue = pageForm.getFieldValue(["rolePermissions", index, "readPermission"]);
        const writePermissionValue = pageForm.getFieldValue(["rolePermissions", index, "writePermission"]);

        if (readPermissionValue === false && writePermissionValue === true) {
            return Promise.reject(t("EditPage.form.rolePermissions.readPermission.rules.writeRequiresRead"));
        }

        if (readPermissionValue === false && writePermissionValue === false) {
            return Promise.reject(t("EditPage.form.rolePermissions.readPermission.rules.leastReadRequired"));
        }

        return Promise.resolve();
    };

    const validateRoleDuplicates = (rule: any, value: RoleEnum, index: number) => {

        if (value === RoleEnum.ROLE_ANONYMOUS || value === RoleEnum.ROLE_USER) {
            // Disable the write permission checkbox
            pageForm.setFieldValue(["rolePermissions", index, "writePermission"], false);
            pageForm.getFieldInstance(["rolePermissions", index, "writePermission"]).input.disabled = true;
        } else {
            // Enable the write permission for non-anonymous
            pageForm.getFieldInstance(["rolePermissions", index, "writePermission"]).input.disabled = false;
        }

        const allRolePermissions: RolePermissionResponse[] = pageForm.getFieldValue("rolePermissions");
        const roles: RoleEnum[] = allRolePermissions.map((item: RolePermissionResponse) => item.role);
        const countRoles: Record<RoleEnum, number> = roles.reduce((acc, role) => {
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<RoleEnum, number>);

        for (const role in countRoles) {
            if (countRoles.hasOwnProperty(role)) {
                const typedRole = role as RoleEnum;
                if (countRoles[typedRole] > 1) {
                    return Promise.reject(t("EditPage.form.rolePermissions.role.rules.noDuplicates"));
                }
            }
        }

        return Promise.resolve();
    };

    function validatePageEditorContent(rule: any, value: string) {
        if (value && value.trim() !== "") {
            return Promise.resolve();
        }

        return Promise.reject(t("EditPage.form.page-versions.body.rules.min"));
    }

    // We use this to get back from success/fail update
    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <div className={"darkDiv"} key={"pageDiv"}>
                <h4 key={"pageHeader"}>{t(formTitleKey)}</h4>
                {!loading && pageData &&
                        <Form
                                form={pageForm}
                                labelCol={{span: 8}}
                                wrapperCol={{span: 22}}
                                style={{maxWidth: 1800}}
                                name={"PageForm"}
                                autoComplete={"off"}
                                initialValues={pageData}
                                onFinish={onFinish}
                                onFinishFailed={onFinishFailed}
                        >
                            <Form.Item name={"id"} hidden={true} key={"page-id"}>
                                <Input type={"text"}/>
                            </Form.Item>
                            <Form.Item name={"status"}
                                       required
                                       label={t("EditPage.form.status.label")}
                                       tooltip={t("EditPage.form.status.tooltip")}
                                       key={"page-status"}
                                       rules={[
                                           {
                                               required: true,
                                               message: t("EditPage.form.status.rules.required")
                                           }
                                       ]}
                            >
                                <Select options={statusOptions}/>
                            </Form.Item>
                            <Form.Item name={"pageGroupId"}
                                       label={t("EditPage.form.pageGroupId.label")}
                                       tooltip={t("EditPage.form.pageGroupId.tooltip")}
                                       key={"page-pageGroupId"}
                                       rules={[
                                           {
                                               required: true,
                                               message: t("EditPage.form.pageGroupId.rules.required")
                                           }
                                       ]}
                            >
                                <Select options={pageGroupOptions} placeholder={t("EditPage.form.pageGroupId.placeholder")}/>
                            </Form.Item>
                            <Divider orientation={"left"}
                                     key={"page-lang-divider"}>{t("EditPage.form.divider.languages")}</Divider>
                            <Form.List name={"pageVersions"}
                                       key={"page-versions"}
                            >
                                {(versions, {add, remove}) => {
                                    return (
                                            <>
                                                {versions.map((_pageVersion, index) => {
                                                    const uniqueKey = `pageVersion-${index}-${pageData.pageVersions[index].language}`;

                                                    return (<div key={uniqueKey}>
                                                        <Divider orientation={"left"}
                                                                 key={uniqueKey + "-divider"}>{pageData.pageVersions[index].language.toUpperCase()}</Divider>
                                                        <Form.Item
                                                                name={[index, "id"]}
                                                                label={"ID"}
                                                                key={uniqueKey + "-id"}
                                                                hidden={true}
                                                        >
                                                            <Input type={"text"} disabled={true} key={uniqueKey + "-id-input"}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "title"]}
                                                                label={t("EditPage.form.page-versions.title.label")}
                                                                key={uniqueKey + "title"}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message: t("EditPage.form.page-versions.title.rules.required")
                                                                    },
                                                                    {
                                                                        min: 2,
                                                                        message: t("EditPage.form.page-versions.title.rules.min")
                                                                    }
                                                                ]}
                                                        >
                                                            <Input type={"text"} key={uniqueKey + "title-input"}
                                                                   placeholder={t("EditPage.form.page-versions.title.placeholder")}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "ingress"]}
                                                                label={t("EditPage.form.page-versions.ingress.label")}
                                                                key={uniqueKey + "ingress"}
                                                        >
                                                            <Input type={"text"} key={uniqueKey + "ingress-input"}
                                                                   placeholder={t("EditPage.form.page-versions.ingress.placeholder")}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "body"]}
                                                                label={t("EditPage.form.page-versions.body.label")}
                                                                key={uniqueKey + "body"}
                                                                rules={[
                                                                    {validator: validatePageEditorContent}
                                                                ]}
                                                        >
                                                            <PageBodyEditor key={uniqueKey + "body-editor"}
                                                                            language={pageData.pageVersions[index].language}
                                                                            pageId={pageData.pageVersions[index].pageId}
                                                                            onChange={(data: string) => pageForm.setFieldsValue({"index": {body: data}})}
                                                                            value={pageForm.getFieldValue(["index", "body"])}
                                                            />
                                                        </Form.Item>
                                                    </div>);
                                                })}
                                            </>
                                    );
                                }}
                            </Form.List>

                            <Divider orientation={"left"} key={"divider-roles"}>{t("EditPage.form.divider.permissions")}</Divider>
                            <Form.List name={"rolePermissions"}
                                       key={"page-roles"}
                            >
                                {(rolePermissions, {add, remove}) => {
                                    return (
                                            <>
                                                {rolePermissions.map((rolePermission, index) => {
                                                    const uniqueKey = `pageRole-${index}`;
                                                    let isDisabledRole = false;
                                                    // This will freeze the role of the user so that it can not be modified
                                                    if (userRole === pageForm.getFieldValue(["rolePermissions", index, "role"])) {
                                                        isDisabledRole = true;
                                                    }

                                                    return (<div key={uniqueKey}>
                                                        <Form.Item
                                                                name={[index, "id"]}
                                                                label={"ID"}
                                                                key={uniqueKey + "-id"}
                                                                hidden={true}
                                                        >
                                                            <Input type={"text"} disabled={true} key={uniqueKey + "-id-item"}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                wrapperCol={{offset: 8, span: 12,}}
                                                                key={uniqueKey + "-divider"}
                                                        >
                                                            <Divider orientation={"left"} key={uniqueKey + "-divider-item"}></Divider>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "readPermission"]}
                                                                label={t("EditPage.form.rolePermissions.readPermission.label")}
                                                                valuePropName={"checked"}
                                                                key={uniqueKey + "-read"}
                                                                tooltip={t("EditPage.form.rolePermissions.readPermission.tooltip")}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message: t("EditPage.form.rolePermissions.readPermission.rules.required")
                                                                    },
                                                                    {
                                                                        validator: (rule, value) => validatePermissions(rule, value, index)
                                                                    }
                                                                ]}
                                                        >
                                                            <Checkbox style={{lineHeight: "32px"}} key={uniqueKey + "-read-check"}
                                                                      disabled={isDisabledRole}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "writePermission"]}
                                                                label={t("EditPage.form.rolePermissions.writePermission.label")}
                                                                valuePropName={"checked"}
                                                                key={uniqueKey + "-write"}
                                                                tooltip={t("EditPage.form.rolePermissions.writePermission.tooltip")}
                                                                dependencies={[index, "role"]}
                                                                rules={[
                                                                    {validator: (rule, value) => validatePermissions(rule, value, index)}
                                                                ]}
                                                        >
                                                            <Checkbox style={{lineHeight: "32px"}} key={uniqueKey + "-write-check"}
                                                                      disabled={isDisabledRole}/>
                                                        </Form.Item>
                                                        <Form.Item
                                                                name={[index, "role"]}
                                                                label={t("EditPage.form.rolePermissions.role.label")}
                                                                key={uniqueKey + "-role"}
                                                                tooltip={t("EditPage.form.rolePermissions.role.tooltip")}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message: t("EditPage.form.rolePermissions.role.rules.required")
                                                                    },
                                                                    {
                                                                        validator: (rule, value) => validateRoleDuplicates(rule, value, index)
                                                                    }
                                                                ]}
                                                        >
                                                            <Select options={roleOptions} key={uniqueKey + "-role-select"}
                                                                    disabled={isDisabledRole}/>
                                                        </Form.Item>
                                                        {rolePermissions.length > 1 && !isDisabledRole &&
                                                                <Form.Item wrapperCol={{offset: 8, span: 12,}}
                                                                           key={uniqueKey + "-button"}
                                                                >
                                                                    <Button
                                                                            danger
                                                                            onClick={() => remove(rolePermission.name)}
                                                                            key={uniqueKey + "-button-remove"}
                                                                    >
                                                                        {t("common.button.delete")}
                                                                    </Button>
                                                                </Form.Item>}
                                                    </div>);
                                                })}
                                                {rolePermissions.length < 4 && <Form.Item wrapperCol={{offset: 8, span: 12,}}>
                                                    <Button type={"dashed"} onClick={() => add()} block>
                                                        {t("EditPage.form.button.addPermission")}
                                                    </Button>
                                                </Form.Item>}
                                            </>
                                    );
                                }}
                            </Form.List>

                            <Divider orientation={"left"} key={"page-meta-divider"}>{t("EditPage.form.divider.metadata")}</Divider>
                            <Form.Item
                                    name={"creator"}
                                    label={t("EditPage.form.metadata.creator")}
                                    key={"page-creator"}>
                                <Input type={"text"} disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                    name={"createdAt"}
                                    label={t("EditPage.form.metadata.createdAt")}
                                    key={"page-createdAt"}>
                                <Input type={"text"} disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                    name={"modifier"}
                                    label={t("EditPage.form.metadata.modifier")}
                                    key={"page-modifier"}>
                                <Input type={"text"} disabled={true}/>
                            </Form.Item>
                            <Form.Item
                                    name={"modifiedAt"}
                                    label={t("EditPage.form.metadata.modifiedAt")}
                                    key={"page-modifiedAt"}>
                                <Input type={"text"} disabled={true}/>
                            </Form.Item>
                            <Space direction={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                                <Button
                                        type={"primary"}
                                        htmlType={"submit"}
                                        disabled={loading}
                                >{sendButtonText}</Button>
                                <Button
                                        type={"default"}
                                        htmlType={"reset"}
                                        disabled={loading}
                                >{t("common.button.reset")}</Button>
                            </Space>
                        </Form>
                }
            </div>
    );
}