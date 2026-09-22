import {CopyOutlined, PlusOutlined, ReloadOutlined} from "@ant-design/icons";
import {Button, DatePicker, Form, Input, message, Modal, Popconfirm, Space} from "antd";
import type {OxColumnsType} from "../main";
import {OxTable, usePagedTable} from "../main";
import dayjs, {type Dayjs} from "dayjs";
import {useCallback, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {SortDirectionEnum, type TokenCreateRequest, type TokenRefreshRequest, type TokenResponse} from "../../models";
import {tokenAPI} from "../../services";

export function AdminTokens() {
    const {t} = useTranslation();
    const [createOpen, setCreateOpen] = useState(false);
    const [refreshing, setRefreshing] = useState<TokenResponse | null>(null);
    const [newToken, setNewToken] = useState<TokenResponse | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const [refreshForm] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    // Paging, sorting (tokenId, createdAt, expiresAt, description) and the description/token value search are
    // done by the server, so the expiry range filter of the old client-side list is gone.
    const tokenTable = usePagedTable<TokenResponse>((request) => tokenAPI.list(request), {
        messageApi,
        defaultSortBy: "created_at",
        defaultDirection: SortDirectionEnum.DESC,
        defaultPageSize: 25
    });
    const {reload, loading} = tokenTable;

    const create = async (values: { expiresAt: Dayjs; description?: string }) => {
        setSubmitting(true);
        const request: TokenCreateRequest = {
            expires_at: values.expiresAt.toISOString(),
            description: values.description?.trim() || undefined
        };
        try {
            const created = await tokenAPI.createToken(request);
            setNewToken(created);
            setCreateOpen(false);
            form.resetFields();
            messageApi.success(t("AdminTokens.notifications.created"));
            reload();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.create"));
        } finally {
            setSubmitting(false);
        }
    };

    const refresh = async (values: { days: number }) => {
        if (!refreshing?.token_value) return;
        setSubmitting(true);
        const request: TokenRefreshRequest = {token_value: refreshing.token_value, days: Number(values.days)};
        try {
            const result = await tokenAPI.refreshToken(request);
            setNewToken(result);
            setRefreshing(null);
            refreshForm.resetFields();
            messageApi.success(t("AdminTokens.notifications.refreshed"));
            reload();
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.refresh"));
        } finally {
            setSubmitting(false);
        }
    };

    const invalidate = useCallback(async (token: TokenResponse) => {
        if (!token.token_value) return;
        try {
            if (await tokenAPI.invalidateToken(token.token_value)) {
                messageApi.success(t("AdminTokens.notifications.invalidated"));
                reload();
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            messageApi.error(err.response?.data?.message || err.message || t("AdminTokens.errors.invalidate"));
        }
    }, [messageApi, reload, t]);

    const columns: OxColumnsType<TokenResponse> = useMemo(() => [
        {
            title: t("AdminTokens.table.value"), dataIndex: "token_value", key: "token_value", mobile: true, searchable: true,
            render: (value: string | null | undefined, record) => record.token_id === newToken?.token_id ? value : `****${value?.slice(-4) || ""}`
        },
        {
            title: t("AdminTokens.table.created"), dataIndex: "created_at", key: "created_at", sorter: true, sortDirections: ["descend", "ascend"],
            render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm")
        },
        {
            title: t("AdminTokens.table.expiration"),
            dataIndex: "expires_at",
            key: "expires_at",
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm")
        },
        {
            title: t("AdminTokens.table.description"),
            dataIndex: "description",
            key: "description",
            searchable: true,
            sorter: true,
            sortDirections: ["descend", "ascend"],
            render: (value?: string) => value || "-"
        },
        {
            title: t("AdminTokens.table.actions"), key: "actions",
            render: (_: unknown, record) => <Space>
                <Popconfirm title={t("AdminTokens.confirm.refresh")} okText={t("common.button.yes")} cancelText={t("common.button.no")} onConfirm={() => {
                    setRefreshing(record);
                    refreshForm.resetFields();
                }}>
                    <Button type="link" icon={<ReloadOutlined/>}>{t("AdminTokens.actions.refresh")}</Button>
                </Popconfirm>
                <Popconfirm title={t("AdminTokens.confirm.invalidate")} okText={t("common.button.yes")} cancelText={t("common.button.no")}
                            onConfirm={() => void invalidate(record)}>
                    <Button type="link" danger>{t("AdminTokens.actions.invalidate")}</Button>
                </Popconfirm>
            </Space>
        }
    ], [invalidate, newToken, refreshForm, t]);

    return <div className="darkDiv">
        {contextHolder}
        <h4>{t("AdminTokens.title")}</h4>
        <Button type="primary" icon={<PlusOutlined/>} onClick={() => setCreateOpen(true)}>{t("AdminTokens.actions.create")}</Button>
        <Button icon={<ReloadOutlined/>} onClick={reload} loading={loading} style={{marginLeft: 8}}>{t("AdminTokens.actions.reload")}</Button>
        <OxTable<TokenResponse> rowKey="token_id" dataMode={"server"} paged={tokenTable} columns={columns}/>
        <Modal open={createOpen} title={t("AdminTokens.create.title")} onCancel={() => setCreateOpen(false)} footer={null} destroyOnHidden>
            <Form form={form} layout="vertical" onFinish={create}>
                <Form.Item name="expiresAt" label={t("AdminTokens.form.expiration")} rules={[{
                    required: true,
                    message: t("AdminTokens.validation.expiration")
                }, {validator: (_, value: Dayjs) => value && value.isAfter(dayjs()) ? Promise.resolve() : Promise.reject(t("AdminTokens.validation.future"))}]}>
                    <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{width: "100%"}}/>
                </Form.Item>
                <Form.Item name="description" label={t("AdminTokens.form.description")} rules={[{max: 255, message: t("AdminTokens.validation.description")}]}>
                    <Input.TextArea rows={2}/>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>{t("AdminTokens.actions.create")}</Button>
            </Form>
        </Modal>
        <Modal open={!!refreshing} title={t("AdminTokens.refresh.title")} onCancel={() => setRefreshing(null)} footer={null} destroyOnHidden>
            <Form form={refreshForm} layout="vertical" onFinish={refresh}>
                <Form.Item name="days" label={t("AdminTokens.form.days")} initialValue={30}
                           rules={[{required: true, message: t("AdminTokens.validation.days")}, {
                               type: "number",
                               min: 1,
                               max: 3650,
                               message: t("AdminTokens.validation.days")
                           }]}>
                    <Input type="number"/>
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>{t("AdminTokens.actions.refresh")}</Button>
            </Form>
        </Modal>
        <Modal open={!!newToken} title={t("AdminTokens.newToken.title")} onCancel={() => setNewToken(null)}
               footer={<Button onClick={() => setNewToken(null)}>{t("common.button.close")}</Button>}>
            <p>{t("AdminTokens.newToken.warning")}</p>
            <Input value={newToken?.token_value || ""} readOnly
                   suffix={<CopyOutlined onClick={() => newToken?.token_value && void navigator.clipboard?.writeText(newToken.token_value)}/>}/>
        </Modal>
    </div>;
}
