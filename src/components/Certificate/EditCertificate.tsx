import {useTranslation} from "react-i18next";
import type {CertificateRequest} from "../../models";
import dayjs from "dayjs";
import {useParams} from "react-router-dom";
import {Button, Form, Input, message, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {certificateAPI} from "../../services";

export function EditCertificate() {
    const {paramId} = useParams();
    const {t} = useTranslation();
    const [certificateId, setCertificateId] = useState<number>(0);
    const [messageApi, contextHolder] = message.useMessage();

    const emptyCertificate: CertificateRequest = {
        id: 0,
        userId: 0,
        organization: "",
        certificateName: "",
        certificateId: "",
        diverId: "",
        certificationDate: dayjs().format("YYYY-MM-DD")
    };

    const [certificateForm] = Form.useForm();
    const [certificate, setCertificate] = useState<CertificateRequest>(emptyCertificate);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitButtonText, setSubmitButtonText] = useState<string>(t("EditCertificate.form.button.update"));
    const [diveIdRequired, setDiveIdRequired] = useState<boolean>(true);
    const [certificateIdRequired, setCertificateIdRequired] = useState<boolean>(true);

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
            return;
        }

        let tmpCertificateId = 0;

        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpCertificateId = parseInt(paramId);
            setCertificateId(tmpCertificateId);
        }

        // ID 0 means that we're supposed to create a new certificate
        if (tmpCertificateId !== 0) {
            setLoading(true);
            certificateAPI.findById(tmpCertificateId, null)
                    .then((result) => {
                        const formData: CertificateRequest = {
                            id: result.id,
                            userId: result.userId,
                            organization: result.organization,
                            certificateName: result.certificateName,
                            certificateId: result.certificateId,
                            diverId: result.diverId,
                            certificationDate: result.certificationDate
                        };
                        certificateForm.setFieldsValue(formData);
                        // TODO investigate why the form doesn't get updated automatically when setting the certificate data with this
                        setCertificate(formData);
                    })
                    .catch((error) => {
                        console.error("Failed to retrieve certificate: " + error);
                        messageApi.error(t("EditCertificate.updateCertificate.update.fail"));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            setSubmitButtonText(t("EditCertificate.form.button.add"));
        }

        setLoading(false);
    }, [paramId, certificateForm, t]);


    function updateCertificate(postData: CertificateRequest) {
        setLoading(true);

        if (certificateId !== 0) {
            certificateAPI.update(postData)
                    .then((response) => {
                        // If we get back the same ID as we sent, we assume the update was successful
                        if (response.id === certificateId) {
                            messageApi.success(t("EditCertificate.updateCertificate.update.ok"));
                        } else {
                            messageApi.error(t("EditCertificate.updateCertificate.update.fail"));
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        messageApi.error(e);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            certificateAPI.create(postData)
                    .then((response) => {
                        // If we get back an non-zero positive ID as we sent, we assume the update was successful
                        if (!isNaN(response.id) && response.id > 0) {
                            messageApi.success(t("EditCertificate.updateCertificate.add.ok"));
                        } else {
                            messageApi.error(t("EditCertificate.updateCertificate.add.fail"));
                        }
                    })
                    .catch(e => {
                        console.error(e);
                        messageApi.error(e);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        }
    }

    function updateCertificateFailed(certValues: any) {
        console.error("Update certificate failed: " + JSON.stringify(certValues));
    }

    return (
            <div className="darkDiv">
                {contextHolder}
                <h4>{t("EditCertificate.title")}</h4>
                <p>{certificate.id}</p>
                <Spin spinning={loading}>
                    {certificate && !loading &&
                            <Form
                                    form={certificateForm}
                                    name="certificate"
                                    labelCol={{span: 8}}
                                    wrapperCol={{span: 12}}
                                    style={{maxWidth: 800}}
                                    initialValues={certificate}
                                    onFinish={updateCertificate}
                                    onFinishFailed={updateCertificateFailed}
                                    autoComplete="off"
                                    scrollToFirstError={true}
                                    validateTrigger={["onBlur", "onChange"]}
                            >
                                <Form.Item name={"id"} label={"ID"} style={{display: "none"}}>
                                    <Input type={"text"}/>
                                </Form.Item>
                                <Form.Item name={"organization"}
                                           required={true}
                                           label={t("EditCertificate.form.organization.label")}
                                           tooltip={t("EditCertificate.form.organization.tooltip")}
                                           rules={[
                                               {
                                                   required: true,
                                                   message: t("EditCertificate.form.organization.rules.required")
                                               },
                                               {
                                                   min: 2,
                                                   message: t("EditCertificate.form.organization.rules.min")
                                               }
                                           ]}>
                                    <Input
                                            placeholder={t("EditCertificate.form.organization.placeholder")}/>
                                </Form.Item>
                                <Form.Item name={"certificateName"}
                                           required={true}
                                           label={t("EditCertificate.form.certificateName.label")}
                                           tooltip={t("EditCertificate.form.certificateName.tooltip")}
                                           rules={[
                                               {
                                                   required: true,
                                                   message: t("EditCertificate.form.certificateName.rules.required")
                                               },
                                               {
                                                   min: 4,
                                                   message: t("EditCertificate.form.certificateName.rules.min")
                                               }
                                           ]}>
                                    <Input placeholder={t("EditCertificate.form.certificateName.placeholder")}/>
                                </Form.Item>
                                <Form.Item name={"certificateId"}
                                           required={certificateIdRequired}
                                           label={t("EditCertificate.form.certificateId.label")}
                                           tooltip={t("EditCertificate.form.certificateId.tooltip")}
                                           rules={[
                                               {
                                                   min: 4,
                                                   message: t("EditCertificate.form.certificateId.rules.min")
                                               },
                                               ({getFieldValue}) => ({
                                                   validator(_, value) {
                                                       if (value.length < 4 && getFieldValue("diverId").length < 4) {
                                                           setDiveIdRequired(true);
                                                           setCertificateIdRequired(true);
                                                           return Promise.reject(new Error(t("EditCertificate.form.certificateId.rules.validator")));
                                                       }

                                                       if (value.length > 3) {
                                                           setDiveIdRequired(false);
                                                       }

                                                       if (getFieldValue("diverId") && getFieldValue("diverId").length > 3) {
                                                           setCertificateIdRequired(false);
                                                       }
                                                       return Promise.resolve();
                                                   },
                                               }),
                                           ]}>
                                    <Input placeholder={t("EditCertificate.form.certificateId.placeholder")}/>
                                </Form.Item>
                                <Form.Item name={"diverId"}
                                           required={diveIdRequired}
                                           label={t("EditCertificate.form.diverId.label")}
                                           tooltip={t("EditCertificate.form.diverId.tooltip")}
                                           rules={[
                                               {
                                                   min: 4,
                                                   message: t("EditCertificate.form.diverId.rules.min")
                                               },
                                               ({getFieldValue}) => ({
                                                   validator(_, value) {
                                                       if (value.length < 4 && getFieldValue("certificateId").length < 4) {
                                                           setDiveIdRequired(true);
                                                           setCertificateIdRequired(true);
                                                           return Promise.reject(new Error(t("EditCertificate.form.diverId.rules.validator")));
                                                       }
                                                       if (value.length > 3) {
                                                           setCertificateIdRequired(false);
                                                       }

                                                       if (getFieldValue("certificateId") && getFieldValue("certificateId").length > 3) {
                                                           setDiveIdRequired(false);
                                                       }

                                                       return Promise.resolve();
                                                   },
                                               }),
                                           ]}>
                                    <Input placeholder={t("EditCertificate.form.diverId.placeholder")}/>
                                </Form.Item>
                                <Form.Item name={"certificationDate"}
                                           required={true}
                                           label={t("EditCertificate.form.certificationDate.label")}
                                           rules={[
                                               {
                                                   min: 8,
                                                   message: t("EditCertificate.form.certificationDate.rules.min")
                                               },
                                               {
                                                   max: 10,
                                                   message: t("EditCertificate.form.certificationDate.rules.max")
                                               },
                                               {
                                                   pattern: new RegExp(/^[0-9]{4}-([0-1])?[0-9]-([0-3])?[0-9]$/),
                                                   message: t("EditCertificate.form.certificationDate.rules.pattern")
                                               }
                                           ]}>
                                    <Input placeholder={t("EditCertificate.form.certificationDate.placeholder")}/>
                                </Form.Item>
                                <Space orientation={"horizontal"} size={12} style={{width: "100%", justifyContent: "center"}}>
                                    <Button
                                            type={"primary"}
                                            htmlType={"submit"}
                                            disabled={loading}
                                    >{submitButtonText}</Button>
                                    <Button
                                            type={"default"}
                                            htmlType={"reset"}
                                            disabled={loading}
                                    >{t("common.button.reset")}</Button>
                                </Space>
                            </Form>}
                </Spin>
            </div>
    );
}