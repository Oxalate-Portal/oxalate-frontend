import {Button, Form, Input, Modal, Select} from "antd";
import {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {diveGroupAPI} from "../../services";
import {useSession} from "../../session";
import {type DiveGroupRequest, type DiveGroupResponse, DiveGroupTypeEnum, type ListUserResponse, type UserResponse} from "../../models";
import {isMemberOfDiveGroup} from "./DiveGroupTable";
import {DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY, resolveDiveGroupDescriptionMaxLength} from "./DiveGroupDetailsModal";

interface DiveGroupFormModalProps {
    open: boolean;
    eventId: number;
    participants: ListUserResponse[];
    eventOrganizer?: UserResponse | null;
    diveGroups: DiveGroupResponse[];
    canAssignOwner: boolean;
    onCancel: () => void;
    onCreated: (diveGroup: DiveGroupResponse) => void;
}

interface DiveGroupFormData {
    name: string;
    description?: string;
    groupType?: DiveGroupTypeEnum;
    ownerId?: number | null;
    memberIds?: number[];
}

export function DiveGroupFormModal({open, eventId, participants, eventOrganizer, diveGroups, canAssignOwner, onCancel, onCreated}: DiveGroupFormModalProps) {
    const {t} = useTranslation();
    const {userSession, getFrontendConfigurationValue} = useSession();
    const [form] = Form.useForm<DiveGroupFormData>();
    const [submitting, setSubmitting] = useState(false);
    const [failed, setFailed] = useState(false);
    const descriptionMaxLength = resolveDiveGroupDescriptionMaxLength(getFrontendConfigurationValue(DIVE_GROUP_DESCRIPTION_MAX_LENGTH_KEY));
    const availableParticipants = useMemo(() => participants.filter((participant) =>
        !diveGroups.some((diveGroup) => diveGroup.ownerId === participant.id || isMemberOfDiveGroup(diveGroup, participant.id))
    ), [diveGroups, participants]);
    const availableOwners = useMemo(() => eventOrganizer && !diveGroups.some((diveGroup) =>
        diveGroup.ownerId === eventOrganizer.id || isMemberOfDiveGroup(diveGroup, eventOrganizer.id))
        ? [...availableParticipants, {id: eventOrganizer.id, name: eventOrganizer.firstName + " " + eventOrganizer.lastName}]
        : availableParticipants, [availableParticipants, diveGroups, eventOrganizer]);
    const ownerOptions = useMemo(() => canAssignOwner
            ? availableOwners
            : availableParticipants.filter((participant) => participant.id === userSession?.id),
        [availableOwners, availableParticipants, canAssignOwner, userSession?.id]);
    const selectedOwnerId = Form.useWatch("ownerId", form);
    const effectiveOwnerId = selectedOwnerId ?? userSession?.id;
    const memberOptions = useMemo(() => availableParticipants.filter((participant) => participant.id !== effectiveOwnerId),
        [availableParticipants, effectiveOwnerId]);

    useEffect(() => {
        if (open && userSession?.id && ownerOptions.some((participant) => participant.id === userSession.id)) {
            form.setFieldsValue({ownerId: userSession.id});
        }
    }, [form, open, ownerOptions, userSession?.id]);

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
            name: values.name,
            groupType: values.groupType ?? DiveGroupTypeEnum.NORMAL
        };

        const description = (values.description ?? "").trim();

        if (description.length > 0) {
            diveGroupRequest.description = description;
        }

        if (canAssignOwner && values.ownerId) {
            diveGroupRequest.ownerId = values.ownerId;
        }

        const memberIds = (values.memberIds ?? []).filter((memberId) => memberId !== effectiveOwnerId);

        if (memberIds.length > 0) {
            diveGroupRequest.memberIds = memberIds;
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
                            name={"description"}
                            label={t("DiveEvent.diveGroup.form.description.label")}
                            tooltip={t("DiveEvent.diveGroup.form.description.tooltip")}
                            rules={[
                                {max: descriptionMaxLength, message: t("DiveEvent.diveGroup.form.description.rules.maxLength", {max: descriptionMaxLength})}
                            ]}
                    >
                        <Input.TextArea
                                rows={4}
                                showCount
                                maxLength={descriptionMaxLength}
                                placeholder={t("DiveEvent.diveGroup.form.description.placeholder")}/>
                    </Form.Item>

                <Form.Item
                    name={"groupType"}
                    label={t("DiveEvent.diveGroup.form.groupType.label")}
                    tooltip={t("DiveEvent.diveGroup.form.groupType.tooltip")}
                    initialValue={DiveGroupTypeEnum.NORMAL}
                >
                    <Select
                        options={Object.values(DiveGroupTypeEnum).map((groupType) => ({
                            value: groupType,
                            label: t("DiveGroupTypeEnum." + groupType.toLowerCase())
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name={"ownerId"}
                    label={t("DiveEvent.diveGroup.form.owner.label")}
                    tooltip={t("DiveEvent.diveGroup.form.owner.tooltip")}
                    rules={canAssignOwner
                        ? [{required: true, message: t("DiveEvent.diveGroup.form.owner.placeholder")}]
                        : undefined}
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

                <Form.Item
                    name={"memberIds"}
                    label={t("DiveEvent.diveGroup.form.members.label")}
                    tooltip={t("DiveEvent.diveGroup.form.members.tooltip")}
                >
                    <Select
                        mode={"multiple"}
                        allowClear
                        placeholder={t("DiveEvent.diveGroup.form.members.placeholder")}
                        options={memberOptions.map((participant) => ({
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
