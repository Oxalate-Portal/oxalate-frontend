import {useCallback, useEffect, useMemo, useState} from "react";
import {AutoComplete, Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tabs} from "antd";
import {useTranslation} from "react-i18next";
import {useSession} from "../../session";
import {certificateAPI, certificateClassificationAPI} from "../../services";
import type {CertificateClassificationRequest, CertificateClassificationResponse, CertificateValueReplacementRequest} from "../../models";

type TitleValue = { lang: string; value: string };

export function AdminCertificateClassifications() {
    const {t} = useTranslation();
    const {getFrontendConfigurationValue} = useSession();
    const [data, setData] = useState<CertificateClassificationResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<CertificateClassificationResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [certificateNameOptions, setCertificateNameOptions] = useState<{ value: string }[]>([]);
    const [organizationOptions, setOrganizationOptions] = useState<{ value: string }[]>([]);
    const [form] = Form.useForm();
    const [assignmentForm] = Form.useForm();
    const [organizationForm] = Form.useForm();
    const [certificateNameForm] = Form.useForm();

    const languages = useMemo(() => {
        const configured = (getFrontendConfigurationValue("enabled-language") || "")
                .split(",").map(value => value.trim()).filter(Boolean);
        return configured.length ? configured : ["en"];
    }, [getFrontendConfigurationValue]);

    const load = useCallback(() => {
        setLoading(true);
        certificateClassificationAPI.findAll()
                .then(setData)
                .catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.load.fail")))
                .finally(() => setLoading(false));
    }, [t]);

    useEffect(() => {
        // Loading is an external synchronization and intentionally starts on mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    const titleFields = (titles?: Record<string, string>): TitleValue[] =>
            languages.map(lang => ({lang, value: titles?.[lang] || ""}));

    const openModal = (record: CertificateClassificationResponse | null) => {
        setEditing(record);
        form.setFieldsValue({
            titles: titleFields(record?.titles),
            description: record?.description || ""
        });
        setModalOpen(true);
    };

    const submit = () => {
        form.validateFields().then((values: { titles: TitleValue[]; description: string }) => {
            setSubmitting(true);
            const titles = Object.fromEntries(languages.map((lang, index) => [lang, values.titles?.[index]?.value || ""]));
            const payload: CertificateClassificationRequest = {
                id: editing?.id || null,
                titles,
                description: values.description || ""
            };
            const operation = editing ? certificateClassificationAPI.update(payload) : certificateClassificationAPI.create(payload);
            operation.then(() => {
                message.success(t(editing ? "AdminCertificateClassifications.popup.update-success" : "AdminCertificateClassifications.popup.add-success"));
                setModalOpen(false);
                load();
            }).catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.popup.operation-fail")))
                    .finally(() => setSubmitting(false));
        }).catch(() => void 0);
    };

    const remove = (id: number) => {
        setDeletingId(id);
        certificateClassificationAPI.delete(id)
                .then(ok => ok ? (message.success(t("AdminCertificateClassifications.popup.remove-success")), load()) : message.error(t("AdminCertificateClassifications.popup.remove-fail")))
                .catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.popup.remove-fail")))
                .finally(() => setDeletingId(null));
    };

    const columns = useMemo(() => [
        {
            title: t("AdminCertificateClassifications.table.titles"),
            key: "titles",
            render: (_: unknown, record: CertificateClassificationResponse) => (
                    <Space wrap>{Object.entries(record.titles || {}).map(([lang, title]) => <span key={lang}>{lang}: {title}</span>)}</Space>
            )
        },
        {title: t("AdminCertificateClassifications.table.description"), dataIndex: "description", key: "description"},
        {
            title: t("AdminCertificateClassifications.table.actions"),
            key: "actions",
            render: (_: unknown, record: CertificateClassificationResponse) => (
                    <Space>
                        <Button type="link" onClick={() => openModal(record)}>{t("common.button.edit")}</Button>
                        <Popconfirm title={t("AdminCertificateClassifications.delete.confirm")} onConfirm={() => remove(record.id)}>
                            <Button danger type="link" loading={deletingId === record.id}>{t("common.button.delete")}</Button>
                        </Popconfirm>
                    </Space>
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [deletingId, t]);

    const submitAssignment = (values: { certificateId?: number; certificateName?: string; classificationId?: number }) => {
        certificateAPI.updateClassification({
            certificateId: values.certificateId || null,
            certificateName: values.certificateName || null,
            classificationId: values.classificationId || null
        }).then(() => message.success(t("AdminCertificateClassifications.assignment.success")))
                .catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.assignment.fail")));
    };

    const submitReplacement = (field: "organization" | "certificate-name", values: { existingValues: string; newValue: string }) => {
        const payload: CertificateValueReplacementRequest = {
            existingValues: values.existingValues.split(",").map(value => value.trim()).filter(Boolean),
            newValue: values.newValue.trim()
        };
        const operation = field === "organization"
                ? certificateAPI.replaceOrganizations(payload)
                : certificateAPI.replaceCertificateNames(payload);
        operation.then(() => message.success(t("AdminCertificateClassifications.replacement.success")))
                .catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.replacement.fail")));
    };

    const searchSuggestions = (searchTerm: string, type: "certificateName" | "organization") => {
        if (!searchTerm.trim()) {
            if (type === "certificateName") {
                setCertificateNameOptions([]);
            } else {
                setOrganizationOptions([]);
            }
            return;
        }

        const search = type === "certificateName" ? certificateAPI.findCertificateNames(searchTerm) : certificateAPI.findOrganizations(searchTerm);
        search.then(values => {
            const options = values.map(value => ({value}));
            if (type === "certificateName") {
                setCertificateNameOptions(options);
            } else {
                setOrganizationOptions(options);
            }
        }).catch(error => message.error(error?.response?.data?.message || error.message || t("AdminCertificateClassifications.suggestions.fail")));
    };

    return <div className="darkDiv">
        <h4>{t("AdminCertificateClassifications.title")}</h4>
        <Tabs items={[
            {
                key: "classifications",
                label: t("AdminCertificateClassifications.tabs.classifications"),
                children: <>
                    <Space style={{marginBottom: 16}}>
                        <Button type="primary" onClick={() => openModal(null)}>{t("AdminCertificateClassifications.button.add")}</Button>
                        <Button onClick={load} loading={loading}>{t("AdminCertificateClassifications.button.refresh")}</Button>
                    </Space>
                    <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{pageSize: 10}}/>
                </>
            },
            {
                key: "assignment",
                label: t("AdminCertificateClassifications.tabs.assignment"),
                children: <Form form={assignmentForm} layout="vertical" onFinish={submitAssignment} style={{maxWidth: 500}}>
                    <Form.Item name="certificateId" label={t("AdminCertificateClassifications.assignment.certificateId")}><Input type="number"/></Form.Item>
                    <Form.Item name="certificateName" label={t("AdminCertificateClassifications.assignment.certificateName")}>
                        <AutoComplete options={certificateNameOptions} showSearch={{onSearch: searchTerm => searchSuggestions(searchTerm, "certificateName")}}/>
                    </Form.Item>
                    <Form.Item name="classificationId" label={t("AdminCertificateClassifications.assignment.classification")}
                               rules={[{required: true, message: t("AdminCertificateClassifications.validation.required")}]}>
                        <Select options={data.map(item => ({value: item.id, label: Object.values(item.titles || {})[0] || String(item.id)}))}/>
                    </Form.Item>
                    <Button type="primary" htmlType="submit">{t("AdminCertificateClassifications.assignment.submit")}</Button>
                </Form>
            },
            {
                key: "replacement",
                label: t("AdminCertificateClassifications.tabs.replacement"),
                children: <Space orientation="vertical" style={{width: "100%"}}>
                    {(["organization", "certificate-name"] as const).map(field => <Form key={field} layout="vertical"
                                                                                        onFinish={values => submitReplacement(field, values)}
                                                                                        form={field === "organization" ? organizationForm : certificateNameForm}
                                                                                        style={{maxWidth: 500}}>
                        <Form.Item name="existingValues" label={t("AdminCertificateClassifications.replacement.existing")}
                                   rules={[{required: true, message: t("AdminCertificateClassifications.validation.required")}]}>
                            <AutoComplete
                                    options={field === "organization" ? organizationOptions : certificateNameOptions}
                                    showSearch={{onSearch: searchTerm => searchSuggestions(searchTerm, field === "organization" ? "organization" : "certificateName")}}
                                    placeholder={t("AdminCertificateClassifications.replacement.existing-placeholder")}
                            />
                        </Form.Item>
                        <Form.Item name="newValue" label={t("AdminCertificateClassifications.replacement.new")}
                                   rules={[{required: true, message: t("AdminCertificateClassifications.validation.required")}]}><Input/></Form.Item>
                        <Button htmlType="submit">{t(field === "organization" ? "AdminCertificateClassifications.replacement.organization" : "AdminCertificateClassifications.replacement.certificateName")}</Button>
                    </Form>)}
                </Space>
            }
        ]}/>
        <Modal open={modalOpen} title={t(editing ? "AdminCertificateClassifications.modal.edit" : "AdminCertificateClassifications.modal.add")} onOk={submit}
               onCancel={() => setModalOpen(false)} confirmLoading={submitting} destroyOnHidden>
            <Form form={form} layout="vertical">
                {languages.map((lang, index) => <Form.Item key={lang} name={["titles", index, "value"]}
                                                           label={`${t("AdminCertificateClassifications.form.title")} (${lang})`}
                                                           rules={[{required: true, message: t("AdminCertificateClassifications.validation.required")}]}>
                    <Input/>
                </Form.Item>)}
                <Form.Item name="description" label={t("AdminCertificateClassifications.form.description")}><Input.TextArea rows={3}/></Form.Item>
            </Form>
        </Modal>
    </div>;
}
