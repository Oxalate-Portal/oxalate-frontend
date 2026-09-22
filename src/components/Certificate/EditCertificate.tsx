import {useTranslation} from "react-i18next";
import {useResponsiveFormLayout} from "../main";
import type {CertificateRequest} from "../../models";
import dayjs from "dayjs";
import {AutoComplete, Button, Form, Input, message, Modal, Space, Spin} from "antd";
import {useEffect, useMemo, useState} from "react";
import {certificateAPI} from "../../services";

interface EditCertificateProps {
    certificateId: number;
    open: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

function formatFetchedCertificationDate(date: CertificateRequest["certification_date"] | string): string {
    if (typeof date === "string") {
        return date;
    }

    return date.toISOString().slice(0, 10);
}

export function EditCertificate({certificateId, open, onClose, onSaved}: EditCertificateProps) {
    const formLayout = useResponsiveFormLayout(8, 12);
    const {t} = useTranslation();
    const [messageApi, contextHolder] = message.useMessage();

    const emptyCertificate = useMemo<CertificateRequest>(() => ({
        id: 0,
        organization: "",
        certificate_name: "",
        certificate_id: "",
        diver_id: "",
        certification_date: dayjs()
    }), []);

    const [certificateForm] = Form.useForm();
    const [certificate, setCertificate] = useState<CertificateRequest>(emptyCertificate);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitButtonText, setSubmitButtonText] = useState<string>(t("EditCertificate.form.button.update"));
    const [diveIdRequired, setDiveIdRequired] = useState<boolean>(true);
    const [certificateIdRequired, setCertificateIdRequired] = useState<boolean>(true);
    const [organizationOptions, setOrganizationOptions] = useState<{ value: string; label: string }[]>([]);
    const [certificateNameOptions, setCertificateNameOptions] = useState<{ value: string; label: string }[]>([]);

    function searchSuggestions(searchTerm: string, type: "certificateName" | "organization") {
        if (!searchTerm.trim()) {
            if (type === "certificateName") {
                setCertificateNameOptions([]);
            } else {
                setOrganizationOptions([]);
            }
            return;
        }

        const search = type === "certificateName"
            ? certificateAPI.findCertificateNames(searchTerm)
            : certificateAPI.findOrganizations(searchTerm);
        search.then(values => {
            const options = values.map(value => ({value, label: value}));
            if (type === "certificateName") {
                setCertificateNameOptions(options);
            } else {
                setOrganizationOptions(options);
            }
        }).catch(error => {
            console.error("Failed to retrieve certificate suggestions: " + error);
            messageApi.error(t("EditCertificate.form.suggestions.fail"));
        });
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        // ID 0 means that we're supposed to create a new certificate
        if (certificateId !== 0) {

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(true);
            certificateAPI.findById(certificateId, null)
                .then((result) => {
                    const formData: CertificateRequest = {
                        id: result.id,
                        organization: result.organization,
                        certificate_name: result.certificate_name,
                        certificate_id: result.certificate_id,
                        diver_id: result.diver_id,
                        certification_date: result.certification_date
                    };
                    certificateForm.setFieldsValue({
                        ...formData,
                        certification_date: formatFetchedCertificationDate(result.certification_date)
                    });
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
            setCertificate(emptyCertificate);
            setSubmitButtonText(t("EditCertificate.form.button.add"));
            setLoading(false);
        }
        // Form, translation, and message instances are stable application services.

    }, [certificateForm, certificateId, emptyCertificate, messageApi, open, t]);


    function updateCertificate(postData: CertificateRequest) {
        setLoading(true);

        if (certificateId !== 0) {
            certificateAPI.update(postData)
                .then((response) => {
                    // If we get back the same ID as we sent, we assume the update was successful
                    if (response.id === certificateId) {
                        messageApi.success(t("EditCertificate.updateCertificate.update.ok"));
                        onSaved?.();
                        onClose();
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
                        onSaved?.();
                        onClose();
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

    function updateCertificateFailed(certValues: { errorFields: { errors: string[] }[] }) {
        console.error("Update certificate failed: " + JSON.stringify(certValues));
    }

    return (
        <Modal
            title={t("EditCertificate.title")}
            open={open}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={800}
        >
            {contextHolder}
            <Spin spinning={loading}>
                {certificate && !loading &&
                    <Form
                        form={certificateForm}
                        name="certificate"
                        {...formLayout}
                        style={{maxWidth: 800}}
                        initialValues={{
                            ...certificate,
                            certification_date: certificate.id === 0
                                ? typeof certificate.certification_date === "string"
                                    ? certificate.certification_date
                                    : certificate.certification_date.format("YYYY-MM-DD")
                                : formatFetchedCertificationDate(certificate.certification_date)
                        }}
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
                            <AutoComplete
                                options={organizationOptions}
                                showSearch={{onSearch: value => searchSuggestions(value, "organization")}}
                                placeholder={t("EditCertificate.form.organization.placeholder")}/>
                        </Form.Item>
                        <Form.Item name={"certificate_name"}
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
                            <AutoComplete
                                options={certificateNameOptions}
                                showSearch={{onSearch: value => searchSuggestions(value, "certificateName")}}
                                placeholder={t("EditCertificate.form.certificateName.placeholder")}/>
                        </Form.Item>
                        <Form.Item name={"certificate_id"}
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
                                               if (value.length < 4 && getFieldValue("diver_id").length < 4) {
                                                   setDiveIdRequired(true);
                                                   setCertificateIdRequired(true);
                                                   return Promise.reject(new Error(t("EditCertificate.form.certificateId.rules.validator")));
                                               }

                                               if (value.length > 3) {
                                                   setDiveIdRequired(false);
                                               }

                                               if (getFieldValue("diver_id") && getFieldValue("diver_id").length > 3) {
                                                   setCertificateIdRequired(false);
                                               }
                                               return Promise.resolve();
                                           }
                                       })
                                   ]}>
                            <Input placeholder={t("EditCertificate.form.certificateId.placeholder")}/>
                        </Form.Item>
                        <Form.Item name={"diver_id"}
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
                                               if (value.length < 4 && getFieldValue("certificate_id").length < 4) {
                                                   setDiveIdRequired(true);
                                                   setCertificateIdRequired(true);
                                                   return Promise.reject(new Error(t("EditCertificate.form.diverId.rules.validator")));
                                               }
                                               if (value.length > 3) {
                                                   setCertificateIdRequired(false);
                                               }

                                               if (getFieldValue("certificate_id") && getFieldValue("certificate_id").length > 3) {
                                                   setDiveIdRequired(false);
                                               }

                                               return Promise.resolve();
                                           }
                                       })
                                   ]}>
                            <Input placeholder={t("EditCertificate.form.diverId.placeholder")}/>
                        </Form.Item>
                        <Form.Item name={"certification_date"}
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
                                           pattern: /^\d{4}-\d{2}-\d{2}$/,
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
        </Modal>
    );
}
