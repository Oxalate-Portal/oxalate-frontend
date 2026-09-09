import {Button, Form, Input, Modal, Select} from "antd";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {diveGroupAPI} from "../../services";
import type {DiveGroupRequest, DiveGroupResponse, ListUserResponse} from "../../models";

interface DiveGroupFormModalProps {
    open: boolean;
    eventId: number;
    participants: ListUserResponse[];
    canAssignOwner: boolean;
    onCancel: () => void;
    onCreated: (diveGroup: DiveGroupResponse) => void;
}

interface DiveGroupFormData {
    name: string;
    ownerId?: number | null;
}

export function DiveGroupFormModal({open, eventId, participants, canAssignOwner, onCancel, onCreated}: DiveGroupFormModalProps) {
    const {t} = useTranslation();
    const [form] = Form.useForm<DiveGroupFormData>();
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);

    function handleCancel(): void {
        form.resetFields();
        setFailed(false);
        onCancel();
    }

    async function onFinish(values: DiveGroupFormData): Promise<void> {
        setSubmitting(true);
        setFailed(false);

        const diveGroupRequest: DiveGroupRequest = {
            eventId: eventId,
            name: values.name
        };

        if (canAssignOwner && values.ownerId) {
            diveGroupRequest.ownerId = values.ownerId;
        }

        try {
            const diveGroup = await diveGroupAPI.createDiveGroup(diveGroupRequest);
            form.resetFields();
            onCreated(diveGroup);
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
                    title={t("DiveEvent.diveGroup.modal.title")}
                    onCancel={handleCancel}
                    footer={null}
                    destroyOnHidden
            >
                <Form<DiveGroupFormData>
                        form={form}
                        layout={"vertical"}
                        onFinish={onFinish}
                        autoComplete={"off"}
                        name={"diveGroupForm"}
                >
                    <Form.Item
                            name={"name"}
                            label={t("DiveEvent.diveGroup.form.name.label")}
                            tooltip={t("DiveEvent.diveGroup.form.name.tooltip")}
                            rules={[
                                {required: true, message: t("DiveEvent.diveGroup.form.name.rules.required")},
                                {max: 255, message: t("DiveEvent.diveGroup.form.name.rules.maxLength")}
                            ]}
                    >
                        <Input placeholder={t("DiveEvent.diveGroup.form.name.placeholder")}/>
                    </Form.Item>

                    {canAssignOwner && (
                            <Form.Item
                                    name={"ownerId"}
                                    label={t("DiveEvent.diveGroup.form.owner.label")}
                                    tooltip={t("DiveEvent.diveGroup.form.owner.tooltip")}
                            >
                                <Select
                                        allowClear
                                        placeholder={t("DiveEvent.diveGroup.form.owner.placeholder")}
                                        options={participants.map((participant) => ({
                                            value: participant.id,
                                            label: participant.name
                                        }))}
                                />
                            </Form.Item>
                    )}

                    {failed && <div role={"alert"}>{t("DiveEvent.diveGroup.error.create")}</div>}

                    <Button onClick={handleCancel} key={"dive-group-cancel-button"}>{t("common.button.cancel")}</Button>
                    <Button type={"primary"} htmlType={"submit"} loading={submitting} key={"dive-group-submit-button"}>
                        {t("DiveEvent.diveGroup.form.submit")}
                    </Button>
                </Form>
            </Modal>
    );
}
