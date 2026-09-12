import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {diveEventAPI, diveGroupAPI, membershipAPI, paymentAPI} from "../../services";
import {
    type DiveEventResponse,
    type DiveGroupResponse,
    type EventSubscribeRequest,
    type MembershipResponse,
    MembershipStatusEnum,
    PaymentExpirationTypeEnum,
    type PaymentResponse,
    type PaymentStatusResponse,
    PaymentTypeEnum,
    PortalConfigGroupEnum,
    RoleEnum,
    type UserSessionToken,
    UserTypeEnum
} from "../../models";
import {DiveEventDetails} from "./DiveEventDetails";
import {DiveGroupFormModal} from "./DiveGroupFormModal";
import {DiveGroupTable, findDiveGroupOfUser, findDiveGroupOwnedByUser, isMemberOfDiveGroup} from "./DiveGroupTable";
import {checkRoles} from "../../tools";
import dayjs from "dayjs";
import {Alert, Button, Divider, Modal, Select, Space, Spin} from "antd";
import {CommentCanvas} from "../Commenting";
import {HealthStatementConfirmationModal} from "../main";

interface ParticipationCheckResult {
    canSubscribe: boolean;
    missingMembership: boolean;
    missingPayment: boolean;
    missingHealthStatement: boolean;
}

async function loadDiveGroups(
        eventId: number,
        setDiveGroupsLoading: (loading: boolean) => void,
        setDiveGroups: (groups: DiveGroupResponse[]) => void
): Promise<void> {
    setDiveGroupsLoading(true);

    try {
        const groups = await diveGroupAPI.getDiveGroupsByEventId(eventId);
        setDiveGroups(Array.isArray(groups) ? groups : []);
    } catch (error) {
        console.error("Error:", error);
        setDiveGroups([]);
    } finally {
        setDiveGroupsLoading(false);
    }
}

export function DiveEvent() {
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const {userSession, getPortalConfigurationValue} = useSession();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [canSubscribe, setCanSubscribe] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [isInWaitingList, setIsInWaitingList] = useState(false);
    const [isEventFull, setIsEventFull] = useState(false);
    const [canUnsubscribe, setCanUnsubscribe] = useState(false);
    const [eventCommenting, setEventCommenting] = useState(false);
    const [missingMembership, setMissingMembership] = useState(false);
    const [missingPayment, setMissingPayment] = useState(false);
    const [missingHealthStatement, setMissingHealthStatement] = useState(false);
    const [showHealthStatementModal, setShowHealthStatementModal] = useState(false);
    // Add modal state + selected user type
    const [selectUserTypeOpen, setSelectUserTypeOpen] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState<UserTypeEnum>(userSession?.primaryUserType || UserTypeEnum.SCUBA_DIVER);
    // Dive group state
    const [diveGroups, setDiveGroups] = useState<DiveGroupResponse[]>([]);
    const [diveGroupsLoading, setDiveGroupsLoading] = useState<boolean>(false);
    const [diveGroupModalOpen, setDiveGroupModalOpen] = useState<boolean>(false);

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
            return;
        }

        let tmpEventId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpEventId = parseInt(paramId);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDiveEventId(tmpEventId);
        }

        if (tmpEventId > 0) {
            diveEventAPI.findById(tmpEventId, null)
                    .then(response => {
                        setDiveEvent(response);
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
        } else {
            console.error("Invalid dive event id:", tmpEventId);
            setLoading(false);
        }
    }, [paramId]);

    useEffect(() => {
        async function isUserAllowedToParticipate(userSession: UserSessionToken | null, diveEvent: DiveEventResponse): Promise<ParticipationCheckResult> {
            const result: ParticipationCheckResult = {
                canSubscribe: false,
                missingMembership: false,
                missingPayment: false,
                missingHealthStatement: false,
            };

            if (!userSession) {
                return result;
            }

            const currentUser = userSession.id;
            const isUserTheOrganizer = diveEvent.organizer?.id === currentUser;
            const isUserAlreadyInEvent = isUserParticipating(userSession, diveEvent);
            // If any of these are true, the user cannot subscribe directly.
            if (isUserTheOrganizer || isUserAlreadyInEvent) {
                return result;
            }

            // Check health statement
            if (userSession.healthStatementId === null) {
                result.missingHealthStatement = true;
            }

            // Check if the event requires valid payment
            const requiresPayment = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "event-require-payment") === "true";
            const requiresMembership = getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "event-require-membership") === "true";

            let hasActiveMembership = !requiresMembership;
            if (requiresMembership) {
                try {
                    const activeMembership: MembershipResponse[] = await membershipAPI.findByUserId(userSession.id);
                    hasActiveMembership = activeMembership.some(membership => membership.status === MembershipStatusEnum.ACTIVE);
                } catch (error) {
                    console.error("Error:", error);
                    hasActiveMembership = false;
                }
            }

            let hasValidPayment = !requiresPayment;

            if (requiresPayment) {
                try {
                    const paymentStatusResponse: PaymentStatusResponse = await paymentAPI.findByUserId(userSession.id);
                    const diverPayments: PaymentResponse[] = paymentStatusResponse.payments;

                    // Either payment type (one-time or periodical) can satisfy the payment requirement.
                    // A one-time payment must still have remaining uses.
                    hasValidPayment = false;

                    const oneTimeEnabled = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "one-time-expiration-type").toUpperCase() !== PaymentExpirationTypeEnum.DISABLED;
                    if (oneTimeEnabled) {
                        const validOneTimePayments = diverPayments.filter(payment =>
                                payment.paymentType === PaymentTypeEnum.ONE_TIME
                                && payment.paymentCount !== null
                                && payment.paymentCount > 0
                                && (payment.endDate === null || !dayjs(payment.endDate).isBefore(dayjs(diveEvent.startTime)))
                        );
                        if (validOneTimePayments.length > 0) {
                            hasValidPayment = true;
                        }
                    }

                    const periodicalEnabled = getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "periodical-payment-method-type").toUpperCase() !== PaymentExpirationTypeEnum.DISABLED;
                    if (periodicalEnabled) {
                        const periodicalPayments = diverPayments.filter(payment => payment.paymentType === PaymentTypeEnum.PERIODICAL);
                        const validPeriodicalPayment = periodicalPayments.find(payment =>
                                !dayjs(payment.endDate).isBefore(dayjs(diveEvent.startTime))
                        );
                        if (validPeriodicalPayment) {
                            hasValidPayment = true;
                        }
                    }

                } catch (error) {
                    console.error("Error:", error);
                    hasValidPayment = false;
                }
            }

            result.missingMembership = requiresMembership && !hasActiveMembership;
            result.missingPayment = requiresPayment && !hasValidPayment;

            result.canSubscribe = !result.missingMembership && !result.missingPayment && !result.missingHealthStatement;
            return result;
        }

        function isUserParticipating(userSession: UserSessionToken | null, diveEvent: DiveEventResponse): boolean {
            if (!userSession) {
                return false;
            }

            const participants = diveEvent.participants?.map(user => user.id);
            return participants?.indexOf(userSession.id) > -1;
        }

        function isUserWaiting(userSession: UserSessionToken | null, diveEvent: DiveEventResponse): boolean {
            if (!userSession) {
                return false;
            }

            const waitingList = diveEvent.waitingList?.map(user => user.id);
            return waitingList?.indexOf(userSession.id) > -1;
        }

        // If the event has passed, we don't want to show the subscribe button
        if (diveEvent) {
            if (dayjs().isAfter(dayjs(diveEvent.startTime).add(diveEvent.eventDuration, "hour"))) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCanSubscribe(false);
                setSubscribing(false);
                setCanUnsubscribe(false);
                setIsInWaitingList(false);
                return;
            }
            // Diver can only unsubscribe before the event starts
            if (dayjs().isBefore(dayjs(diveEvent.startTime))) {
                setCanUnsubscribe(true);
            }

            setIsEventFull((diveEvent.participants?.length || 0) >= diveEvent.maxParticipants);
            setIsInWaitingList(isUserWaiting(userSession, diveEvent));

            isUserAllowedToParticipate(userSession, diveEvent)
                    .then((checkResult: ParticipationCheckResult) => {
                        setCanSubscribe(checkResult.canSubscribe);
                        setMissingMembership(checkResult.missingMembership);
                        setMissingPayment(checkResult.missingPayment);
                        setMissingHealthStatement(checkResult.missingHealthStatement);
                    });
            setSubscribing(isUserParticipating(userSession, diveEvent));
        }

        if ((getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled") === "true")
                && (getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled-features").includes("event"))) {
            setEventCommenting(true);
        }
    }, [userSession, diveEvent, getPortalConfigurationValue]);


    function subscribeEvent(diveEventId: number, userType: UserTypeEnum) {
        const eventSubscribeRequest: EventSubscribeRequest = {
            diveEventId: diveEventId,
            userType: userType
        };
        diveEventAPI.subscribeUserToEvent(eventSubscribeRequest)
                .then(response => {
                    setDiveEvent(response);
                    setSubscribing(true);
                })
                .catch(error => {
                    console.error("Error:", error);
                });
    }

    async function unSubscribeEvent(diveEventId: number): Promise<void> {
        try {
            const response = await diveEventAPI.unsubscribeUserToEvent(diveEventId);
            setDiveEvent(response);
            setSubscribing(false);
            await loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    function joinWaitingList(diveEventId: number) {
        diveEventAPI.joinWaitingList(diveEventId)
                .then(response => {
                    setDiveEvent(response);
                    setIsInWaitingList(true);
                })
                .catch(error => {
                    console.error("Error:", error);
                });
    }

    function leaveWaitingList(diveEventId: number) {
        diveEventAPI.leaveWaitingList(diveEventId)
                .then(response => {
                    setDiveEvent(response);
                    setIsInWaitingList(false);
                })
                .catch(error => {
                    console.error("Error:", error);
                });
    }

    useEffect(() => {
        if (diveEventId > 0 && (userSession?.id ?? 0) > 0) {
            loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
        }
    }, [diveEventId, userSession?.id]);

    async function joinDiveGroup(diveGroupId: number): Promise<void> {
        try {
            await diveGroupAPI.joinDiveGroup(diveGroupId);
        } catch (error) {
            console.error("Error:", error);
        }

        await loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
    }

    async function leaveDiveGroup(diveGroupId: number): Promise<void> {
        try {
            await diveGroupAPI.leaveDiveGroup(diveGroupId);
        } catch (error) {
            console.error("Error:", error);
        }

        await loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
    }

    async function deleteDiveGroup(diveGroupId: number): Promise<void> {
        try {
            await diveGroupAPI.deleteDiveGroup(diveGroupId);
        } catch (error) {
            console.error("Error:", error);
        }

        await loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
    }

    async function reorderDiveGroups(diveGroupIds: number[]): Promise<void> {
        try {
            const reordered = await diveGroupAPI.reorderDiveGroups(diveEventId, diveGroupIds);
            setDiveGroups(reordered);
            return;
        } catch (error) {
            console.error("Error:", error);
        }

        // The optimistic order of the table is discarded by reloading the authoritative order from the backend
        await loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
    }

    function onDiveGroupCreated(): void {
        setDiveGroupModalOpen(false);
        loadDiveGroups(diveEventId, setDiveGroupsLoading, setDiveGroups);
    }

    const currentUserId = userSession?.id ?? 0;
    const ownsDiveGroup = findDiveGroupOwnedByUser(diveGroups, currentUserId) !== null;
    const belongsToDiveGroup = findDiveGroupOfUser(diveGroups, currentUserId) !== null;
    const isEventOrganizer = checkRoles(userSession?.roles ?? null, [RoleEnum.ROLE_ORGANIZER])
            && diveEvent?.organizer?.id === currentUserId;
    const isAdministrator = checkRoles(userSession?.roles ?? null, [RoleEnum.ROLE_ADMIN]);
    const canAssignDiveGroupOwner = isAdministrator || isEventOrganizer;
    // The backend only lets the organizer of this very dive event, or an administrator, set the dive group order
    const canReorderDiveGroups = currentUserId > 0
            && (isAdministrator || isEventOrganizer);
    const hasJoinedEvent = diveEvent?.participants?.some(participant => participant.id === currentUserId) ?? false;
    const hasAvailableDiveGroupOwner = (diveEvent?.participants ?? []).some((participant) =>
            !diveGroups.some((diveGroup) => diveGroup.ownerId === participant.id || isMemberOfDiveGroup(diveGroup, participant.id))
    ) || (diveEvent?.organizer !== null && diveEvent?.organizer !== undefined
            && !diveGroups.some((diveGroup) => diveGroup.ownerId === diveEvent.organizer.id
                    || isMemberOfDiveGroup(diveGroup, diveEvent.organizer.id)));
    const canCreateDiveGroup = currentUserId > 0 && diveEventId > 0
            && hasAvailableDiveGroupOwner
            && (canAssignDiveGroupOwner || (hasJoinedEvent && !belongsToDiveGroup && !ownsDiveGroup));

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space orientation={"vertical"} size={"large"}>
                        {diveEvent && diveEvent.id !== undefined && <DiveEventDetails eventInfo={diveEvent}/>}
                        {!subscribing && !canSubscribe && (missingMembership || missingPayment || missingHealthStatement) && (
                                <Space orientation={"vertical"}>
                                    {missingMembership && (
                                            <Alert type={"warning"} showIcon title={t("DiveEvent.requiresMembership")}/>
                                    )}
                                    {missingPayment && (
                                            <Alert type={"warning"} showIcon title={t("DiveEvent.requiresPayment")}/>
                                    )}
                                    {missingHealthStatement && (
                                            <Space>
                                                <Alert type={"warning"} showIcon title={t("DiveEvent.requiresHealthStatement")}/>
                                                <Button onClick={() => setShowHealthStatementModal(true)}>
                                                    {t("DiveEvent.approveHealthStatement")}
                                                </Button>
                                            </Space>
                                    )}
                                </Space>
                        )}
                        <Space key={"diveEventButtonRow"}>
                            {!subscribing && isInWaitingList && canUnsubscribe &&
                                    <Button
                                            type={"primary"}
                                            style={{background: "#ff4d4f", borderColor: "#ff4d4f"}}
                                            onClick={() => leaveWaitingList(diveEventId)}
                                            key={diveEventId + "-leave-wl-button"}>
                                        {t("DiveEvent.waitingList.leaveButton")}
                                    </Button>
                            }
                            {!subscribing && !isInWaitingList && canSubscribe && isEventFull &&
                                    <Button
                                            type={"primary"}
                                            style={{background: "#faad14", borderColor: "#faad14"}}
                                            onClick={() => joinWaitingList(diveEventId)}
                                            key={diveEventId + "-join-wl-button"}>
                                        {t("DiveEvent.waitingList.joinButton")}
                                    </Button>
                            }
                            {!subscribing && !isInWaitingList && canSubscribe && !isEventFull &&
                                    <Button
                                            type={"primary"}
                                            style={{background: "#52c41a", borderColor: "#52c41a"}}
                                            onClick={() => {
                                                setSelectedUserType(userSession?.primaryUserType || UserTypeEnum.SCUBA_DIVER);
                                                setSelectUserTypeOpen(true);
                                            }}
                                            key={diveEventId + "-sub-button"}>
                                        {t("DiveEvent.subscribe.button")}
                                    </Button>
                            }
                            {subscribing && canUnsubscribe &&
                                    <Button
                                            type={"primary"}
                                            onClick={() => unSubscribeEvent(diveEventId)}
                                            key={diveEventId + "unsub-button"}>{t("DiveEvent.unsubscribe.button")}</Button>
                            }
                            {canCreateDiveGroup &&
                                    <Button
                                            onClick={() => setDiveGroupModalOpen(true)}
                                            key={diveEventId + "-create-dive-group-button"}>
                                        {t("DiveEvent.diveGroup.createButton")}
                                    </Button>
                            }
                        </Space>

                        {userSession && diveGroups.length > 0 &&
                                <DiveGroupTable
                                        diveGroups={diveGroups}
                                        loading={diveGroupsLoading}
                                        currentUserId={currentUserId}
                                        canJoinDiveGroup={hasJoinedEvent}
                                        canReorderDiveGroups={canReorderDiveGroups}
                                        onJoin={joinDiveGroup}
                                        onLeave={leaveDiveGroup}
                                        onDelete={deleteDiveGroup}
                                        onReorder={reorderDiveGroups}
                                        key={diveEventId + "-dive-group-table"}/>
                        }

                        {diveEvent && (diveEventId > 0) && eventCommenting &&
                                <>
                                    <Divider titlePlacement={"left"} orientation={"horizontal"}
                                             key={"diveEventCommentDivider"}>{t("DiveEvent.comments")}</Divider>
                                    {/* Allow commenting only until the event has ended meaning event.startTime + event.eventDuration hours in hours */}
                                    <CommentCanvas commentId={diveEvent.eventCommentId}
                                                   allowComment={dayjs(diveEvent.startTime).add(diveEvent.eventDuration, "hour").isAfter(dayjs())}/>
                                </>}
                    </Space>
                </Spin>

                {/* Modal for selecting user type */}
                <Modal
                        open={selectUserTypeOpen}
                        title={t("DiveEvent.subscribe.label")}
                        onCancel={() => setSelectUserTypeOpen(false)}
                        onOk={() => {
                            subscribeEvent(diveEventId, selectedUserType);
                            setSelectUserTypeOpen(false);
                        }}
                        okText={t("DiveEvent.subscribe.button")}
                        cancelText={t("common.button.cancel")}
                        destroyOnHidden
                >
                    <Space orientation={"vertical"} style={{width: "100%"}}>
                        <span>{t("DiveEvent.subscribe.mainText")}</span>
                        <Select
                                value={selectedUserType}
                                onChange={(val: UserTypeEnum) => setSelectedUserType(val)}
                                style={{width: "100%"}}
                                options={Object.values(UserTypeEnum).map((userTypeEnum) => ({
                                    value: userTypeEnum,
                                    label: t("UserTypeEnum." + userTypeEnum.toLowerCase())
                                }))}
                        />
                    </Space>
                </Modal>

                <HealthStatementConfirmationModal
                        open={showHealthStatementModal}
                        onConfirm={() => setShowHealthStatementModal(false)}
                        onCancel={() => setShowHealthStatementModal(false)}
                        registration={false}
                />

                <DiveGroupFormModal
                        open={diveGroupModalOpen}
                        eventId={diveEventId}
                        participants={diveEvent?.participants ?? []}
                        eventOrganizer={diveEvent?.organizer}
                        diveGroups={diveGroups}
                        canAssignOwner={canAssignDiveGroupOwner}
                        onCancel={() => setDiveGroupModalOpen(false)}
                        onCreated={onDiveGroupCreated}
                />
            </div>
    );
}
