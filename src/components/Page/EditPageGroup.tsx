import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useResponsiveFormLayout} from "../main";
import {useEffect, useMemo, useState} from "react";
import {type OptionItemVO, type PageGroupRequest, type PageGroupResponse, PageStatusEnum} from "../../models";
import {Button, Divider, Form, Input, message, Select, Spin} from "antd";
import {pageGroupMgmtAPI} from "../../services";
import {useSession} from "../../session";

export function EditPageGroup() {
    const {paramId} = useParams();
    const [pageGroupId, setPageGroupId] = useState<number>(0);
    const {t} = useTranslation();
    const formLayout = useResponsiveFormLayout(8, 12);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [createNewPageGroup, setCreateNewPageGroup] = useState(false);
    const [sendButtonText, setSendButtonText] = useState(t("EditPageGroup.form.button.update"));
    const [pageGroupForm] = Form.useForm();
    const {getFrontendConfigurationValue} = useSession();
    const [messageApi, contextHolder] = message.useMessage();
    const enabledLanguages = getFrontendConfigurationValue("enabled-language");
    const languageList = useMemo(() => enabledLanguages.split(","), [enabledLanguages]);

    const [pageGroup, setPageGroup] = useState<PageGroupResponse>({
        id: 0,
        page_group_versions: languageList.map((language) => ({
            id: 0,
            page_group_id: 0,
            language: language,
            title: ""
        })),
        status: PageStatusEnum.DRAFTED,
        pages: []
    });

    const statusOptions: OptionItemVO[] = [
        {value: PageStatusEnum.DRAFTED, label: t("common.pages.status.drafted")},
        {value: PageStatusEnum.PUBLISHED, label: t("common.pages.status.published")},
        {value: PageStatusEnum.DELETED, label: t("common.pages.status.deleted")}
    ];

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid page group id:", paramId);
            return;
        }

        let tmpPageGroupId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpPageGroupId = parseInt(paramId);

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setPageGroupId(tmpPageGroupId);
        }

        if (tmpPageGroupId > 0) {
            pageGroupMgmtAPI.findById(tmpPageGroupId, null)
                .then(response => {
                    // Filter the page group versions to only include the languages that are enabled in the frontend
                    response.page_group_versions = response.page_group_versions.filter(pg => enabledLanguages.split(",").includes(pg.language));
                    setPageGroup(response);
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
            setCreateNewPageGroup(true);
            setSendButtonText(t("EditPageGroup.form.button.create"));
        }
        // The route and configuration value are the only inputs that control the load.

    }, [paramId, enabledLanguages, t]);

    function onFinish(formData: PageGroupRequest): void {
        setSubmitting(true);

        const normalizedFormData: PageGroupRequest = {
            ...formData,
            page_group_versions: (formData.page_group_versions ?? []).map((version, index) => ({
                id: version.id ?? 0,
                title: version.title,
                language: version.language ?? pageGroup.page_group_versions[index]?.language ?? languageList[index] ?? "",
                page_group_id: version.page_group_id ?? formData.id ?? pageGroupId ?? 0
            }))
        };

        if (createNewPageGroup) {
            pageGroupMgmtAPI.create(normalizedFormData)
                .then((response: PageGroupResponse) => {
                    // If we get back an ID, we assume the creation was successful
                    if (response && response.id > 0) {
                        messageApi.success(t("EditPageGroup.onFinish.create.ok"));
                    } else {
                        messageApi.error(t("EditPageGroup.onFinish.create.fail"));
                    }
                    setSubmitting(false);
                })
                .catch((e: unknown) => {
                    console.error("Creating the page group failed:", e);
                    messageApi.error(t("EditPageGroup.onFinish.create.fail"));
                    setSubmitting(false);
                });
        } else {
            pageGroupMgmtAPI.update(normalizedFormData)
                .then((response: PageGroupResponse) => {
                    // If we get back the same ID as we sent, we assume the update was successful
                    if (response && response.id === pageGroupId) {
                        messageApi.success(t("EditPageGroup.onFinish.update.ok"));
                    } else {
                        messageApi.error(t("EditPageGroup.onFinish.update.fail"));
                    }
                    setSubmitting(false);
                })
                .catch((e: unknown) => {
                    console.error("Updating the page group failed:", e);
                    messageApi.error(t("EditPageGroup.onFinish.update.fail"));
                    setSubmitting(false);
                });
        }
    }

    function onFinishFailed(errorInfo: { errorFields: { errors: string[] }[] }) {
        console.error("Failed:", errorInfo);
    }

    return (
        <div className={"darkDiv"}>
            {contextHolder}
            <Spin spinning={loading || submitting}>
                {!loading && <Form
                    form={pageGroupForm}
                    {...formLayout}
                    style={{maxWidth: 1200}}
                    name={"PageGroupForm"}
                    autoComplete={"off"}
                    initialValues={pageGroup}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                >
                    <Form.Item name={"id"}
                               hidden={true}
                               key={"pageGroupIdItem"}
                    >
                        <Input type={"text"} key={"pageGroupId"}/>
                    </Form.Item>

                    <Divider titlePlacement={"left"} orientation={"horizontal"}
                             key={"pageGroupDividerMain"}>{t("EditPageGroup.form.divider.languages")}</Divider>

                    <Form.List name={"page_group_versions"}
                               key={"page-group-versions"}
                    >
                        {}
                        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                        {(groupVersions, {add: _add, remove: _remove}) => {
                            return (
                                <>
                                    {groupVersions.map((groupVersion) => {
                                        const language = pageGroupForm.getFieldValue(["page_group_versions", groupVersion.name, "language"]) ??
                                            pageGroup.page_group_versions[groupVersion.name]?.language ?? "";
                                        const uniqueKey = `pageGroupDivider${groupVersion.key}${language}`;
                                        return (<div key={uniqueKey}>
                                            <Divider titlePlacement={"left"} orientation={"horizontal"}
                                                     key={uniqueKey + "-divider"}>{language.toUpperCase()}</Divider>
                                            <Form.Item
                                                name={[groupVersion.name, "id"]}
                                                label={"ID"}
                                                key={uniqueKey + "-id"}
                                                hidden={true}
                                            >
                                                <Input type={"text"} disabled={true} key={uniqueKey + "-id-input"}/>
                                            </Form.Item>
                                            <Form.Item
                                                name={[groupVersion.name, "language"]}
                                                key={uniqueKey + "-language"}
                                                hidden={true}
                                            >
                                                <Input type={"text"} key={uniqueKey + "-language-input"}/>
                                            </Form.Item>
                                            <Form.Item
                                                name={[groupVersion.name, "page_group_id"]}
                                                key={uniqueKey + "-page-group-id"}
                                                hidden={true}
                                            >
                                                <Input type={"text"} key={uniqueKey + "-page-group-id-input"}/>
                                            </Form.Item>
                                            <Form.Item
                                                name={[groupVersion.name, "title"]}
                                                label={t("EditPageGroup.form.pageGroupVersions.label")}
                                                key={uniqueKey + "-title"}
                                                tooltip={t("EditPageGroup.form.pageGroupVersions.tooltip")}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: t("EditPageGroup.form.pageGroupVersions.rules.required")
                                                    },
                                                    {
                                                        min: 2,
                                                        message: t("EditPageGroup.form.pageGroupVersions.rules.min")
                                                    }
                                                ]}
                                            >
                                                <Input type={"text"} key={uniqueKey + "-title-input"}/>
                                            </Form.Item>
                                        </div>);
                                    })}
                                </>
                            );
                        }}
                    </Form.List>
                    <Form.Item name={"status"}
                               required
                               label={t("EditPageGroup.form.status.label")}
                               tooltip={t("EditPageGroup.form.status.tooltip")}
                               key={"page-group-status"}
                               rules={[
                                   {
                                       required: true,
                                       message: t("EditPageGroup.form.status.rules.required")
                                   }
                               ]}
                    >
                        <Select options={statusOptions}/>
                    </Form.Item>
                    <Form.Item
                        wrapperCol={{xs: {offset: 0, span: 24}, sm: {offset: 8, span: 16}}}
                        key={"pageGroupButtonItem"}
                    >
                        <Button
                            type={"primary"}
                            htmlType={"submit"}
                            disabled={loading || submitting}
                        >
                            {sendButtonText}
                        </Button>
                        <Button
                            type={"default"}
                            htmlType={"reset"}
                            disabled={loading || submitting}
                        >{t("common.button.reset")}</Button>
                    </Form.Item>
                </Form>}
            </Spin>
        </div>
    );
}
