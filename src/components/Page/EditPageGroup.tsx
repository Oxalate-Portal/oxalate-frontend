import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { PageGroupResponse } from "../../models/responses";
import { UpdateStatusEnum, UpdateStatusVO } from "../../models";
import { Button, Divider, Form, Input, Spin } from "antd";
import { pageGroupMgmtAPI } from "../../services";
import { SubmitResult } from "../main";
import { LanguageUtil } from "../../helpers";
import { PageGroupRequest } from "../../models/requests";

export function EditPageGroup() {
    const {paramId} = useParams();
    const [pageGroupId, setPageGroupId] = useState<number>(0);
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [updateStatus, setUpdateStatus] = useState<UpdateStatusVO>({status: UpdateStatusEnum.NONE, message: ""});
    const [createNewPageGroup, setCreateNewPageGroup] = useState(false);
    const [sendButtonText, setSendButtonText] = useState(t("EditPageGroup.form.button.update"));
    const [pageGroupForm] = Form.useForm();
    const navigate = useNavigate();

    const [pageGroup, setPageGroup] = useState<PageGroupResponse>({
        id: 0,
        pageGroupVersions: LanguageUtil.languages.map((language) => ({
            id: 0,
            pageGroupId: 0,
            language: language.value,
            title: "",
        })),
        pages: []
    });

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
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
    }, [pageGroupId, paramId, t]);

    function onFinish(formData: PageGroupRequest): void {
        console.debug("onFinish:", formData);
        setLoading(true);

        if (createNewPageGroup) {
            pageGroupMgmtAPI.create(formData)
                    .then((response: PageGroupResponse) => {
                        // If we get back an ID, we assume the creation was successful
                        if (response && response.id > 0) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("EditPageGroup.onFinish.create.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("EditPageGroup.onFinish.create.fail")});
                        }
                        setLoading(false);
                    })
                    .catch(e => {
                        console.log(e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                        setLoading(false);
                    });
        } else {
            pageGroupMgmtAPI.update(formData)
                    .then((response: PageGroupResponse) => {
                        // If we get back the same ID as we sent, we assume the update was successful
                        if (response && response.id === pageGroupId) {
                            setUpdateStatus({status: UpdateStatusEnum.OK, message: t("EditPageGroup.onFinish.update.ok")});
                        } else {
                            setUpdateStatus({status: UpdateStatusEnum.FAIL, message: t("EditPageGroup.onFinish.update.fail")});
                        }
                        setLoading(false);
                    })
                    .catch(e => {
                        console.log(e);
                        setUpdateStatus({status: UpdateStatusEnum.FAIL, message: e});
                        setLoading(false);
                    });
        }
    }

    function onFinishFailed(errorInfo: any) {
        console.log("Failed:", errorInfo);
    }

    if (updateStatus.status !== UpdateStatusEnum.NONE) {
        return <SubmitResult updateStatus={updateStatus} navigate={navigate}/>;
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
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

                        <Divider orientation={"left"} key={"pageGroupDividerMain"}>{t("EditPageGroups.form.divider.languages")}</Divider>

                        <Form.List name={"pageGroupVersions"}
                                   key={"page-group-versions"}
                        >
                            {(groupVersions, {add, remove}) => {
                                return (
                                        <>
                                            {groupVersions.map((pageGroupVersion, index) => {
                                                const uniqueKey = `pageGroupDivider${index}${pageGroup.pageGroupVersions[index].language}`;
                                                return (<div key={uniqueKey}>
                                                    <Divider orientation={"left"}
                                                             key={uniqueKey + "-divider"}>{pageGroup.pageGroupVersions[index].language.toUpperCase()}</Divider>
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
                                                            label={t("EditPageGroups.form.pageGroupVersions.label")}
                                                            key={uniqueKey + "-title"}
                                                            tooltip={t("EditPageGroups.form.pageGroupVersions.tooltip")}
                                                            rules={[
                                                                {
                                                                    required: true,
                                                                    message: t("EditPageGroups.form.pageGroupVersions.rules.required")
                                                                },
                                                                {
                                                                    min: 2,
                                                                    message: t("EditPageGroups.form.pageGroupVersions.rules.min")
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
                                    disabled={loading}
                            >
                                {sendButtonText}
                            </Button>
                            <Button
                                    type={"default"}
                                    htmlType={"reset"}
                                    disabled={loading}
                            >{t("common.button.reset")}</Button>
                        </Form.Item>
                    </Form>}
                </Spin>
            </div>
    );
}
