import {Button, Form, Input, Modal} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {diveGroupAPI} from "../../services";
import {useSession} from "../../session";
import type {DiveGroupDetailsRequest, DiveGroupResponse} from "../../models";

/**
 * Fallback used when the frontend configuration has not been loaded yet or does not contain the key. The backend
 * enforces the configured limit regardless of what the client sends.
 */
export const DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH = 8000;
export const DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY = "dive-group-description-max-length";

/**
 * Resolves the maximum length of a dive group description from a raw frontend configuration value. Anything that is
 * not a positive integer falls back to the default.
 */
export function resolveDiveGroupDescriptionMaxLength(configuredValue: string | null | undefined): number {
    const parsed = parseInt(configuredValue ?? "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DIVE_GROUP_DESCRIPTION_MAX_LENGTH;
}

interface DiveGroupDetailsModalProps {
    open: boolean;
    diveGroup: DiveGroupResponse | null;
    onCancel: () => void;
    onUpdated: (diveGroup: DiveGroupResponse) => void;
}

interface DiveGroupDetailsFormData {
    name: string;
    description?: string;
}

/**
 * Lets a member of a dive group edit the name and description of the group. The modal only submits the two editable
 * fields; ownership and group type are managed elsewhere.
 */
export function DiveGroupDetailsModal({open, diveGroup, onCancel, onUpdated}: DiveGroupDetailsModalProps) {
    const {t} = useTranslation();
    const {getFrontendConfigurationValue} = useSession();
    const [form] = Form.useForm<DiveGroupDetailsFormData>();
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);
    const descriptionMaxLength = resolveDiveGroupDescriptionMaxLength(getFrontendConfigurationValue(DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY));

    useEffect(() => {
        if (open && diveGroup) {
            form.setFieldsValue({name: diveGroup.name, description: diveGroup.description ?? ""});
        }
    }, [diveGroup, form, open]);

    function handleCancel(): void {
        form.resetFields();
        setFailed(false);
        onCancel();
    }

    async function onFinish(values: DiveGroupDetailsFormData): Promise<void> {
        if (!diveGroup) {
            return;
        }

        setSubmitting(true);
        setFailed(false);

        const description = (values.description ?? "").trim();
        const diveGroupDetailsRequest: DiveGroupDetailsRequest = {
            name: values.name,
            description: description.length > 0 ? description : null
        };

        try {
            const updated = await diveGroupAPI.updateDiveGroupDetails(diveGroup.id, diveGroupDetailsRequest);
            form.resetFields();
            onUpdated(updated);
        } catch (error) {
            console.error("Error:", error);
            setFailed(true);
        } finally {
            setSubmitting(false);
        }
    }

    return (
            <Modal
                    open={open}
                    title={t("DiveEvent.diveGroup.edit.title")}
                    onCancel={handleCancel}
                    footer={null}
                    destroyOnHidden
            >
                <Form<DiveGroupDetailsFormData>
                        form={form}
                        layout={"vertical"}
                        onFinish={onFinish}
                        autoComplete={"off"}
                        name={"diveGroupDetailsForm"}
                >
                    <Form.Item
                            name={"name"}
                            label={t("DiveEvent.diveGroup.form.name.label")}
                            tooltip={t("DiveEvent.diveGroup.form.name.tooltip")}
                            rules={[
                                {required: true, whitespace: true, message: t("DiveEvent.diveGroup.form.name.rules.required")},
                                {max: 255, message: t("DiveEvent.diveGroup.form.name.rules.maxLength")}
                            ]}
                    >
                        <Input placeholder={t("DiveEvent.diveGroup.form.name.placeholder")}/>
                    </Form.Item>

                    <Form.Item
                            name={"description"}
                            label={t("DiveEvent.diveGroup.form.description.label")}
                            tooltip={t("DiveEvent.diveGroup.form.description.tooltip")}
                            rules={[
                                {max: descriptionMaxLength, message: t("DiveEvent.diveGroup.form.description.rules.maxLength", {max: descriptionMaxLength})}
                            ]}
                    >
                        <Input.TextArea
                                rows={6}
                                showCount
                                maxLength={descriptionMaxLength}
                                placeholder={t("DiveEvent.diveGroup.form.description.placeholder")}/>
                    </Form.Item>

                    {failed && <div role={"alert"}>{t("DiveEvent.diveGroup.error.update")}</div>}

                    <Button onClick={handleCancel} key={"dive-group-details-cancel-button"}>{t("common.button.cancel")}</Button>
                    <Button type={"primary"} htmlType={"submit"} loading={submitting} key={"dive-group-details-submit-button"}>
                        {t("DiveEvent.diveGroup.edit.submit")}
                    </Button>
                </Form>
            </Modal>
    );
}
