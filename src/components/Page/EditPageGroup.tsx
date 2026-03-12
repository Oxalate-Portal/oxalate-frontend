import {useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {type OptionItemVO, type PageGroupRequest, type PageGroupResponse, PageStatusEnum} from "../../models";
import {Button, Divider, Form, Input, message, Select, Spin} from "antd";
import {pageGroupMgmtAPI} from "../../services";
import {useSession} from "../../session";

export function EditPageGroup() {
    const {paramId} = useParams();
    const [pageGroupId, setPageGroupId] = useState<number>(0);
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [createNewPageGroup, setCreateNewPageGroup] = useState(false);
    const [sendButtonText, setSendButtonText] = useState(t("EditPageGroup.form.button.update"));
    const [pageGroupForm] = Form.useForm();
    const {getFrontendConfigurationValue} = useSession();
    const [messageApi, contextHolder] = message.useMessage();

    const languageList = getFrontendConfigurationValue("enabled-language").split(",");

    const [pageGroup, setPageGroup] = useState<PageGroupResponse>({
        id: 0,
        pageGroupVersions: languageList.map((language) => ({
            id: 0,
            pageGroupId: 0,
            language: language,
            title: "",
        })),
        status: PageStatusEnum.DRAFTED,
        pages: []
    });

    const statusOptions: OptionItemVO[] = [
        {value: PageStatusEnum.DRAFTED, label: t("common.pages.status.drafted")},
        {value: PageStatusEnum.PUBLISHED, label: t("common.pages.status.published")},
        {value: PageStatusEnum.DELETED, label: t("common.pages.status.deleted")},
    ];

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid page group id:", paramId);
            return;
        }

        let tmpPageGroupId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpPageGroupId = parseInt(paramId);
            setPageGroupId(tmpPageGroupId);
        }

        if (tmpPageGroupId > 0) {
            setLoading(true);
            pageGroupMgmtAPI.findById(tmpPageGroupId, null)
                    .then(response => {
                        // Filter the page group versions to only include the languages that are enabled in the frontend
                        response.pageGroupVersions = response.pageGroupVersions.filter(pg => languageList.includes(pg.language));
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
    }, [pageGroupId, paramId, t, languageList]);

    function getErrorMessage(error: unknown): string {
        if (typeof error === "string") {
            return error;
        }

        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === "object" && error !== null) {
            const maybeError = error as { message?: unknown; response?: { data?: unknown; status?: number } };
            if (typeof maybeError.message === "string") {
                return maybeError.message;
            }

            if (typeof maybeError.response?.data === "string") {
                return maybeError.response.data;
            }

            if (typeof maybeError.response?.status === "number") {
                return `HTTP ${maybeError.response.status}`;
            }
        }

        return "Unknown error";
    }

    function onFinish(formData: PageGroupRequest): void {
        setSubmitting(true);

        const normalizedFormData: PageGroupRequest = {
            ...formData,
            pageGroupVersions: (formData.pageGroupVersions ?? []).map((version, index) => ({
                id: version.id ?? 0,
                title: version.title,
                language: version.language ?? pageGroup.pageGroupVersions[index]?.language ?? languageList[index] ?? "",
                pageGroupId: version.pageGroupId ?? formData.id ?? pageGroupId ?? 0,
            })),
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
                        console.error(e);
                        messageApi.error(`${t("EditPageGroup.onFinish.create.fail")} ${getErrorMessage(e)}`);
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
                        console.error(e);
                        messageApi.error(`${t("EditPageGroup.onFinish.update.fail")} ${getErrorMessage(e)}`);
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
                            labelCol={{span: 8}}
                            wrapperCol={{span: 12}}
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

                        <Form.List name={"pageGroupVersions"}
                                   key={"page-group-versions"}
                        >
                            {(groupVersions, {add: _add, remove: _remove}) => {
                                return (
                                        <>
                                            {groupVersions.map((groupVersion) => {
                                                const language = pageGroupForm.getFieldValue(["pageGroupVersions", groupVersion.name, "language"]) ??
                                                        pageGroup.pageGroupVersions[groupVersion.name]?.language ?? "";
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
                                                            name={[groupVersion.name, "pageGroupId"]}
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
                                wrapperCol={{
                                    offset: 8,
                                    span: 16,
                                }}
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
