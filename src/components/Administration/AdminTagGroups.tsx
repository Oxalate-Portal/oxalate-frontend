import {useEffect, useMemo, useState} from "react";
import {Button, Form, Input, message, Modal, Popconfirm, Space, Table, Tag} from "antd";
import {tagGroupAPI} from "../../services";
import type {TagGroupRequest, TagGroupResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {useSession} from "../../session";

type NameKV = { lang: string; value: string };

export function AdminTagGroups() {
    const [data, setData] = useState<TagGroupResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<TagGroupResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [form] = Form.useForm();
    const {t} = useTranslation();
    const {getFrontendConfigurationValue} = useSession();
    const [configuredLangs, setConfiguredLangs] = useState<string[]>([]);

    useEffect(() => {
        const langs = (getFrontendConfigurationValue("enabled-language") || "")
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
        setConfiguredLangs(langs);
    }, [getFrontendConfigurationValue]);

    const loadGroups = () => {
        setLoading(true);
        tagGroupAPI.findAll()
                .then(setData)
                .catch(() => message.error(t("AdminTagGroups.load.fail")))
                .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const openAdd = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (record: TagGroupResponse) => {
        setEditing(record);
        setModalOpen(true);
    };

    const namesToList = (names?: Record<string, string>): NameKV[] =>
            Object.entries(names || {}).map(([lang, value]) => ({lang, value}));

    const buildNamesFromConfig = (existing?: Record<string, string>): NameKV[] => {
        const langs = configuredLangs.length ? configuredLangs : ["en"];
        return langs.map(lang => ({lang, value: existing?.[lang] ?? ""}));
    };

    const formInitialValues = useMemo(() => {
        if (editing) {
            return {code: editing.code, names: buildNamesFromConfig(editing.names)};
        }
        return {code: "", names: buildNamesFromConfig()};
    }, [editing, configuredLangs]);

    // Ensure names array matches configured languages and fill lang codes whenever modal opens or langs change
    useEffect(() => {
        if (!modalOpen) return;
        form.setFieldsValue({
            code: editing?.code ?? form.getFieldValue("code") ?? "",
            names: buildNamesFromConfig(editing?.names)
        });
    }, [modalOpen, configuredLangs, editing, form]);

    const listToRecord = (list: NameKV[]): Record<string, string> => {
        const out: Record<string, string> = {};
        (list || []).forEach(({lang, value}) => {
            const k = (lang || "").trim();
            if (k) out[k] = value ?? "";
        });
        return out;
    };

    const handleSubmit = () => {
        form.validateFields()
                .then((values: { code: string; names: NameKV[] }) => {
                    setSubmitting(true);
                    const payload: TagGroupRequest = {
                        id: editing?.id ?? 0,
                        code: values.code.trim(),
                        names: listToRecord(values.names || [])
                    };
                    const op = editing ? tagGroupAPI.update(payload) : tagGroupAPI.create(payload);
                    op.then(() => {
                        message.success(editing ? t("AdminTagGroups.popup.update-success") : t("AdminTagGroups.popup.add-success"));
                        setModalOpen(false);
                        loadGroups();
                    })
                            .catch(() => message.error(t("AdminTagGroups.popup.operation-fail")))
                            .finally(() => setSubmitting(false));
                })
                .catch(() => void 0);
    };

    const handleDelete = (record: TagGroupResponse) => {
        setDeletingId(record.id);
        tagGroupAPI.delete(record.id)
                .then(ok => {
                    if (ok) {
                        message.success(t("AdminTagGroups.popup.remove-success"));
                        loadGroups();
                    } else {
                        message.error(t("AdminTagGroups.popup.remove-fail"));
                    }
                })
                .catch(() => message.error(t("AdminTagGroups.popup.remove-fail")))
                .finally(() => setDeletingId(null));
    };

    const columns = useMemo(
            () => [
                {title: t("AdminTagGroups.table.code"), dataIndex: "code", key: "code"},
                {
                    title: t("AdminTagGroups.table.names"),
                    dataIndex: "names",
                    key: "names",
                    render: (names: Record<string, string>) => (
                            <Space wrap>
                                {Object.entries(names || {}).map(([lang, value]) => (
                                        <Tag key={lang} color="purple">{`${lang}: ${value}`}</Tag>
                                ))}
                            </Space>
                    )
                },
                {
                    title: t("AdminTagGroups.table.actions.title"),
                    key: "actions",
                    render: (_: any, record: TagGroupResponse) => (
                            <Space>
                                <Button type="link" onClick={() => openEdit(record)}>{t("AdminTagGroups.table.actions.edit")}</Button>
                                <Popconfirm
                                        title={t("AdminTagGroups.popconfirm.delete.title")}
                                        okButtonProps={{danger: true, loading: deletingId === record.id}}
                                        onConfirm={() => handleDelete(record)}
                                >
                                    <Button type="link" danger loading={deletingId === record.id}>{t("common.button.delete")}</Button>
                                </Popconfirm>
                            </Space>
                    )
                }
            ],
            [deletingId, t]
    );

    return (
            <div className={"darkDiv"}>
                <Space style={{marginBottom: 16}}>
                    <Button type="primary" onClick={openAdd}>{t("AdminTagGroups.button.add-group")}</Button>
                    <Button onClick={loadGroups} loading={loading}>{t("AdminTagGroups.button.refresh")}</Button>
                </Space>
                <Table<TagGroupResponse>
                        rowKey="id"
                        loading={loading}
                        dataSource={data}
                        columns={columns as any}
                        pagination={{pageSize: 10}}
                />

                <Modal
                        open={modalOpen}
                        title={editing ? t("AdminTagGroups.modal.title.edit") : t("AdminTagGroups.modal.title.add")}
                        onOk={handleSubmit}
                        onCancel={() => setModalOpen(false)}
                        confirmLoading={submitting}
                        destroyOnClose
                >
                    <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
                        <Form.Item
                                name="code"
                                label={t("AdminTagGroups.form.code.label")}
                                rules={[
                                    {required: true, message: t("AdminTagGroups.form.code.rule.required")},
                                    {max: 128, message: t("AdminTagGroups.form.code.rule.max")}
                                ]}
                        >
                            <Input placeholder={t("AdminTagGroups.form.code.placeholder")}/>
                        </Form.Item>

                        <Form.List name="names">
                            {() => (
                                    <>
                                        <Space style={{marginBottom: 8}}>
                                            {t("AdminTagGroups.form.names.label")}
                                        </Space>
                                        {configuredLangs.map((lang, idx) => (
                                                <Space key={lang} align="baseline" style={{display: "flex", marginBottom: 8}}>
                                                    {/* Hidden bound field ensures the lang code is submitted */}
                                                    <Form.Item name={["names", idx, "lang"]} initialValue={lang} hidden>
                                                        <Input/>
                                                    </Form.Item>
                                                    {/* Visible read-only input shows the code */}
                                                    <Input readOnly value={lang}/>
                                                    <Form.Item
                                                            name={["names", idx, "value"]}
                                                            rules={[{required: true, message: t("AdminTagGroups.form.names.value.rule.required")}]}
                                                    >
                                                        <Input placeholder={t("AdminTagGroups.form.names.value.placeholder")}/>
                                                    </Form.Item>
                                                </Space>
                                        ))}
                                    </>
                            )}
                        </Form.List>
                    </Form>
                </Modal>
            </div>
    );
}
