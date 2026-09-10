import {Button, Form, Input, Modal, Select} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {diveGroupAPI} from "../../services";
import {useSession} from "../../session";
import type {DiveGroupRequest, DiveGroupResponse, ListUserResponse} from "../../models";
import {isMemberOfDiveGroup} from "./DiveGroupTable";

interface DiveGroupFormModalProps {
    open: boolean;
    eventId: number;
    participants: ListUserResponse[];
    diveGroups: DiveGroupResponse[];
    canAssignOwner: boolean;
    onCancel: () => void;
    onCreated: (diveGroup: DiveGroupResponse) => void;
}

interface DiveGroupFormData {
    name: string;
    ownerId?: number | null;
}

export function DiveGroupFormModal({open, eventId, participants, diveGroups, canAssignOwner, onCancel, onCreated}: DiveGroupFormModalProps) {
    const {t} = useTranslation();
    const {userSession} = useSession();
    const [form] = Form.useForm<DiveGroupFormData>();
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);
    const availableParticipants = participants.filter((participant) =>
            !diveGroups.some((diveGroup) => isMemberOfDiveGroup(diveGroup, participant.id))
    );
    const ownerOptions = canAssignOwner
            ? availableParticipants
            : availableParticipants.filter((participant) => participant.id === userSession?.id);

    useEffect(() => {
        if (open && userSession?.id) {
            form.setFieldsValue({ownerId: userSession.id});
        }
    }, [form, open, userSession?.id]);

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

                    <Form.Item
                            name={"ownerId"}
                            label={t("DiveEvent.diveGroup.form.owner.label")}
                            tooltip={t("DiveEvent.diveGroup.form.owner.tooltip")}
                    >
                        <Select
                                allowClear={canAssignOwner}
                                disabled={!canAssignOwner}
                                placeholder={t("DiveEvent.diveGroup.form.owner.placeholder")}
                                options={ownerOptions.map((participant) => ({
                                    value: participant.id,
                                    label: participant.name
                                }))}
                        />
                    </Form.Item>

                    {failed && <div role={"alert"}>{t("DiveEvent.diveGroup.error.create")}</div>}

                    <Button onClick={handleCancel} key={"dive-group-cancel-button"}>{t("common.button.cancel")}</Button>
                    <Button type={"primary"} htmlType={"submit"} loading={submitting} key={"dive-group-submit-button"}>
                        {t("DiveEvent.diveGroup.form.submit")}
                    </Button>
                </Form>
            </Modal>
    );
}
