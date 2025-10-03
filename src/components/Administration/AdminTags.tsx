import React, {useEffect, useMemo, useState} from "react";
import {Button, Form, Input, message, Modal, Popconfirm, Select, Space, Table, Tag} from "antd";
import {tagGroupAPI, tagsAPI} from "../../services";
import {TagGroupRequest, TagGroupResponse, TagRequest, TagResponse} from "../../models";
import {useTranslation} from "react-i18next";

type NameKV = { lang: string; value: string };

export function AdminTags() {
    const [data, setData] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<TagResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [groups, setGroups] = useState<TagGroupResponse[]>([]);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupSubmitting, setGroupSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [groupForm] = Form.useForm();
    const {t} = useTranslation();

    const loadTags = () => {
        setLoading(true);
        tagsAPI.findAll()
                .then(setData)
                .catch(err => message.error(err?.response?.data?.message || err.message || t("AdminTags.load.fail")))
                .finally(() => setLoading(false));
    };

    const loadGroups = () => {
        setGroupsLoading(true);
        tagGroupAPI.findAll()
                .then(setGroups)
                .catch(err => message.error(err?.response?.data?.message || err.message || t("AdminTags.load.groups-fail")))
                .finally(() => setGroupsLoading(false));
    };

    useEffect(() => {
        loadTags();
        loadGroups();
    }, []);

    const openAdd = () => {
        setEditing(null);
        setModalOpen(true);
    };

    const openEdit = (record: TagResponse) => {
        setEditing(record);
        setModalOpen(true);
    };

    const listToRecord = (list: NameKV[]): Record<string, string> => {
        const out: Record<string, string> = {};
        (list || []).forEach(({lang, value}) => {
            const k = (lang || "").trim();
            if (k) out[k] = value ?? "";
        });
        return out;
    };

    // Compute initial values for the main Tag form based on editing
    const formInitialValues = useMemo(() => {
        if (editing) {
            const namesList: NameKV[] = Object.entries(editing.names || {}).map(([lang, value]) => ({lang, value}));
            const resolvedGroupId =
                    (editing as any)?.tagGroupId ??
                    groups.find(g => g.code === (editing as any)?.tagGroupCode)?.id;
            return {
                code: editing.code,
                names: namesList.length ? namesList : [{lang: "en", value: ""}],
                tagGroupId: resolvedGroupId
            };
        }
        return {
            code: "",
            names: [{lang: "en", value: ""}],
            tagGroupId: undefined
        };
    }, [editing, groups]);

    const handleSubmit = (submitData: any) => {
        form.validateFields()
                .then((values: { code: string; names: NameKV[]; tagGroupId?: number }) => {
                    console.log("Values", values);
                    setSubmitting(true);
                    const payload: TagRequest = {
                        id: editing?.id ?? 0,
                        code: values.code.trim(),
                        names: listToRecord(values.names || []),
                        tagGroupId: values.tagGroupId ?? (editing as any)?.tagGroupId,
                        tagGroupCode: (editing as any)?.tagGroupCode
                    };
                    const op = editing ? tagsAPI.update(payload) : tagsAPI.create(payload);
                    op.then(() => {
                        message.success(editing ? t("AdminTags.popup.update-success") : t("AdminTags.popup.add-success"));
                        setModalOpen(false);
                        loadTags();
                    })
                            .catch(err => message.error(err?.response?.data?.message || err.message || t("AdminTags.popup.operation-fail")))
                            .finally(() => setSubmitting(false));
                })
                .catch(() => void 0);
    };

    const handleDelete = (record: TagResponse) => {
        setDeletingId(record.id);
        tagsAPI.delete(record.id)
                .then(ok => {
                    if (ok) {
                        message.success(t("AdminTags.popup.remove-success"));
                        loadTags();
                    } else {
                        message.error(t("AdminTags.popup.remove-fail"));
                    }
                })
                .catch(err => message.error(err?.response?.data?.message || err.message || t("AdminTags.popup.remove-fail")))
                .finally(() => setDeletingId(null));
    };

    const columns = useMemo(
            () => [
                {
                    title: t("AdminTags.table.code"),
                    dataIndex: "code",
                    key: "code"
                },
                {
                    title: t("AdminTags.table.names"),
                    dataIndex: "names",
                    key: "names",
                    render: (names: Record<string, string>) => (
                            <Space wrap>
                                {Object.entries(names || {}).map(([lang, value]) => (
                                        <Tag key={lang} color="blue">{`${lang}: ${value}`}</Tag>
                                ))}
                            </Space>
                    )
                },
                {
                    title: t("AdminTags.table.actions.title"),
                    key: "actions",
                    render: (_: any, record: TagResponse) => (
                            <Space>
                                <Button type="link" onClick={() => openEdit(record)}>{t("AdminTags.table.actions.edit")}</Button>
                                <Popconfirm
                                        title={t("AdminTags.popconfirm.delete.title")}
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
                    <Button type="primary" onClick={openAdd}>{t("AdminTags.button.add-tag")}</Button>
                    <Button onClick={loadTags} loading={loading}>{t("AdminTags.button.refresh")}</Button>
                </Space>
                <Table<TagResponse>
                        rowKey="id"
                        loading={loading}
                        dataSource={data}
                        columns={columns as any}
                        pagination={{pageSize: 10}}
                />

                <Modal
                        open={modalOpen}
                        title={editing ? t("AdminTags.modal.title.edit") : t("AdminTags.modal.title.add")}
                        onOk={handleSubmit}
                        onCancel={() => setModalOpen(false)}
                        confirmLoading={submitting}
                        destroyOnHidden
                >
                    <Form form={form} layout="vertical" preserve={false} initialValues={formInitialValues}>
                        <Form.Item
                                name="code"
                                label={t("AdminTags.form.code.label")}
                                rules={[
                                    {required: true, message: t("AdminTags.form.code.rule.required")},
                                    {max: 128, message: t("AdminTags.form.code.rule.max")}
                                ]}
                        >
                            <Input placeholder={t("AdminTags.form.code.placeholder")}/>
                        </Form.Item>

                        <Form.Item name="tagGroupId" label={t("AdminTags.form.tagGroup.label")}>
                            <Space.Compact style={{width: "100%"}}>
                                <Select
                                        allowClear
                                        placeholder={t("AdminTags.form.tagGroup.placeholder")}
                                        loading={groupsLoading}
                                        style={{flex: 1}}
                                        options={(groups || []).map(g => ({value: g.id, label: g.code}))}
                                        onChange={(value) => {
                                            form.setFieldsValue({tagGroupId: value});
                                        }}
                                />
                                <Button onClick={() => {
                                    setGroupModalOpen(true);
                                }}>
                                    {t("AdminTags.form.tagGroup.new-group")}
                                </Button>
                            </Space.Compact>
                        </Form.Item>

                        <Form.List name="names">
                            {(fields, {add, remove}) => (
                                    <>
                                        <Space style={{marginBottom: 8}}>
                                            {t("AdminTags.form.names.label")}
                                            <Button size="small" onClick={() => add({lang: "", value: ""})}>
                                                {t("AdminTags.form.names.add-language")}
                                            </Button>
                                        </Space>
                                        {fields.map(field => (
                                                <Space key={field.key} align="baseline" style={{display: "flex", marginBottom: 8}}>
                                                    <Form.Item
                                                            name={[field.name, "lang"]}
                                                            fieldKey={[field.fieldKey!, "lang"]}
                                                            rules={[{required: true, message: t("AdminTags.form.names.lang.rule.required")}]}
                                                    >
                                                        <Input placeholder={t("AdminTags.form.names.lang.placeholder")}/>
                                                    </Form.Item>
                                                    <Form.Item
                                                            name={[field.name, "value"]}
                                                            fieldKey={[field.fieldKey!, "value"]}
                                                            rules={[{required: true, message: t("AdminTags.form.names.value.rule.required")}]}
                                                    >
                                                        <Input placeholder={t("AdminTags.form.names.value.placeholder")}/>
                                                    </Form.Item>
                                                    <Button danger onClick={() => remove(field.name)}>{t("common.button.delete")}</Button>
                                                </Space>
                                        ))}
                                    </>
                            )}
                        </Form.List>
                    </Form>
                </Modal>

                {/* Inline modal to create a new Tag Group */}
                <Modal
                        open={groupModalOpen}
                        title={t("AdminTags.modal.group-title.add")}
                        onOk={() => {
                            groupForm.validateFields()
                                    .then((values: { code: string; names: NameKV[] }) => {
                                        setGroupSubmitting(true);
                                        const payload = {
                                            id: 0,
                                            code: values.code.trim(),
                                            names: listToRecord(values.names || [])
                                        } as TagGroupRequest;
                                        tagGroupAPI.create(payload)
                                                .then((created: TagGroupResponse) => {
                                                    message.success(t("AdminTags.popup.group-add-success"));
                                                    setGroups(prev => prev.some(g => g.id === created.id) ? prev : [...prev, created]);
                                                    form.setFieldsValue({tagGroupId: created.id});
                                                    setGroupModalOpen(false);
                                                })
                                                .catch(err => message.error(err?.response?.data?.message || err.message || t("AdminTags.popup.group-add-fail")))
                                                .finally(() => setGroupSubmitting(false));
                                    })
                                    .catch(() => void 0);
                        }}
                        onCancel={() => setGroupModalOpen(false)}
                        confirmLoading={groupSubmitting}
                        destroyOnHidden
                >
                    <Form form={groupForm} layout="vertical" preserve={false} initialValues={{code: "", names: [{lang: "en", value: ""}]}}>
                        <Form.Item
                                name="code"
                                label={t("AdminTags.form.code.label")}
                                rules={[
                                    {required: true, message: t("AdminTags.form.code.rule.required")},
                                    {max: 128, message: t("AdminTags.form.code.rule.max")}
                                ]}
                        >
                            <Input placeholder={t("AdminTags.form.group-code.placeholder")}/>
                        </Form.Item>

                        <Form.List name="names">
                            {(fields, {add, remove}) => (
                                    <>
                                        <Space style={{marginBottom: 8}}>
                                            {t("AdminTags.form.names.label")}
                                            <Button size="small" onClick={() => add({lang: "", value: ""})}>
                                                {t("AdminTags.form.names.add-language")}
                                            </Button>
                                        </Space>
                                        {fields.map(field => (
                                                <Space key={field.key} align="baseline" style={{display: "flex", marginBottom: 8}}>
                                                    <Form.Item
                                                            name={[field.name, "lang"]}
                                                            fieldKey={[field.fieldKey!, "lang"]}
                                                            rules={[{required: true, message: t("AdminTags.form.names.lang.rule.required")}]}
                                                    >
                                                        <Input placeholder={t("AdminTags.form.names.lang.placeholder")}/>
                                                    </Form.Item>
                                                    <Form.Item
                                                            name={[field.name, "value"]}
                                                            fieldKey={[field.fieldKey!, "value"]}
                                                            rules={[{required: true, message: t("AdminTags.form.names.value.rule.required")}]}
                                                    >
                                                        <Input placeholder={t("AdminTags.form.names.value.placeholder")}/>
                                                    </Form.Item>
                                                    <Button danger onClick={() => remove(field.name)}>{t("common.button.delete")}</Button>
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
