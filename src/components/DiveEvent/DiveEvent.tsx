import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {useSession} from "../../session";
import {useTranslation} from "react-i18next";
import {diveEventAPI, membershipAPI, paymentAPI} from "../../services";
import {
    type DiveEventResponse,
    type EventSubscribeRequest,
    type MembershipResponse,
    type PaymentResponse,
    type PaymentStatusResponse,
    PaymentTypeEnum,
    PortalConfigGroupEnum,
    type UserSessionToken,
    UserTypeEnum
} from "../../models";
import {DiveEventDetails} from "./DiveEventDetails";
import dayjs from "dayjs";
import {Button, Divider, Modal, Select, Space, Spin} from "antd";
import {CommentCanvas} from "../Commenting";

export function DiveEvent() {
    const {paramId} = useParams();
    const [diveEventId, setDiveEventId] = useState<number>(0);
    const [diveEvent, setDiveEvent] = useState<DiveEventResponse | null>(null);
    const {userSession, getPortalConfigurationValue} = useSession();
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [canSubscribe, setCanSubscribe] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [canUnsubscribe, setCanUnsubscribe] = useState(false);
    const [eventCommenting, setEventCommenting] = useState(false);
    // Add modal state + selected user type
    const [selectUserTypeOpen, setSelectUserTypeOpen] = useState(false);
    const [selectedUserType, setSelectedUserType] = useState<UserTypeEnum>(userSession?.primaryUserType || UserTypeEnum.SCUBA_DIVER);

    useEffect(() => {
        if (paramId?.length === 0) {
            console.error("Invalid dive event id:", paramId);
            return;
        }

        let tmpEventId = 0;
        if (paramId !== undefined && !Number.isNaN(parseInt(paramId))) {
            tmpEventId = parseInt(paramId);
            setDiveEventId(tmpEventId);
        }

        if (tmpEventId > 0) {
            setLoading(true);

            diveEventAPI.findById(tmpEventId, null)
                    .then(response => {
                        setDiveEvent(response);
                    })
                    .catch(error => {
                        console.error("Error:", error);
                    });
            setLoading(false);
        } else {
            console.error("Invalid dive event id:", tmpEventId);

        }
    }, [paramId]);

    useEffect(() => {
        async function isUserAllowedToParticipate(userSession: UserSessionToken | null, diveEvent: DiveEventResponse): Promise<boolean> {
            if (!userSession) {
                return false;
            }

            const currentUser = userSession.id;
            const isUserTheOrganizer = diveEvent.organizer?.id === currentUser;
            const isUserAlreadyInEvent = isUserParticipating(userSession, diveEvent);
            const isEventFull = diveEvent.participants?.length >= diveEvent.maxParticipants;
            // If any of these are true, the user should not be able to subscribe
            if (isUserTheOrganizer || isUserAlreadyInEvent || isEventFull) {
                return false;
            }

            // Next we do more heavy checks to see if the user is allowed to participate
            // Check if the event requires valid payment
            if (getPortalConfigurationValue(PortalConfigGroupEnum.PAYMENT, "event-require-payment") === "true") {
                try {
                    const paymentStatusResponse: PaymentStatusResponse = await paymentAPI.findByUserId(userSession.id);

                    const diverPayments: PaymentResponse[] = paymentStatusResponse.payments;

                    if (diverPayments.length === 0) {
                        return false;
                    }

                    // If there are no active one-time payments, we need to make sure the periodical payment is valid when the event takes place
                    const oneTimePayments = diverPayments.filter(payment => {
                        return payment.paymentType === PaymentTypeEnum.ONE_TIME
                                && payment.paymentCount > 0
                                && (payment.endDate === null || !dayjs(payment.endDate).isBefore(dayjs(diveEvent.startTime)));
                    });

                    if (oneTimePayments.length === 0) {
                        const periodicalPayments = diverPayments.filter(payment => payment.paymentType === PaymentTypeEnum.PERIODICAL);
                        const validPeriodicalPayment = periodicalPayments.find(payment => !dayjs(payment.endDate).isBefore(dayjs(diveEvent.startTime)));

                        if (!validPeriodicalPayment) {
                            return false;
                        }
                    }
                } catch (error) {
                    console.error("Error:", error);
                    return false;
                }
            }

            if (getPortalConfigurationValue(PortalConfigGroupEnum.MEMBERSHIP, "event-require-membership") === "true") {
                try {
                    const activeMembership: MembershipResponse[] = await membershipAPI.findByUserId(userSession.id);

                    if (activeMembership.length === 0) {
                        return false;
                    }
                } catch (error) {
                    console.error("Error:", error);
                    return false;
                }
            }

            return true;
        }

        function isUserParticipating(userSession: UserSessionToken | null, diveEvent: DiveEventResponse): boolean {
            if (!userSession) {
                return false;
            }

            const participants = diveEvent.participants?.map(user => user.id);
            return participants?.indexOf(userSession.id) > -1;
        }

        // If the event has passed, we don't want to show the subscribe button
        if (diveEvent) {
            if (dayjs().isAfter(dayjs(diveEvent.startTime).add(diveEvent.eventDuration, "hour"))) {
                setCanSubscribe(false);
                setSubscribing(false);
                return;
            }
            // Diver can only unsubscribe before the event starts
            if (dayjs().isBefore(dayjs(diveEvent.startTime))) {
                setCanUnsubscribe(true);
            }

            isUserAllowedToParticipate(userSession, diveEvent)
                    .then((canSubscribe: boolean) => {
                        setCanSubscribe(canSubscribe);
                    });
            setSubscribing(isUserParticipating(userSession, diveEvent));
        }

        if ((getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled") === "true")
                && (getPortalConfigurationValue(PortalConfigGroupEnum.COMMENTING, "commenting-enabled-features").includes("event"))) {
            setEventCommenting(true);
        }
    }, [userSession, diveEvent]);


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

    function unSubscribeEvent(diveEventId: number) {
        diveEventAPI.unsubscribeUserToEvent(diveEventId)
                .then(response => {
                    setDiveEvent(response);
                    setSubscribing(false);
                })
                .catch(error => {
                    console.error("Error:", error);

                });
    }

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space orientation={"vertical"} size={"large"}>
                        {diveEvent && diveEvent.id !== undefined && <DiveEventDetails eventInfo={diveEvent}/>}
                        {!subscribing && canSubscribe &&
                                <Button
                                        type={"primary"}
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

                        {diveEvent && (diveEventId > 0) && eventCommenting &&
                                <>
                                    <Divider titlePlacement={"left"} orientation={"horizontal"} key={"diveEventCommentDivider"}>Comments</Divider>
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
                        >
                            {Object.values(UserTypeEnum).map(userTypeEnum => (
                                    <Select.Option key={userTypeEnum} value={userTypeEnum}>
                                        {t("UserTypeEnum." + userTypeEnum.toLowerCase())}
                                    </Select.Option>
                            ))}
                        </Select>
                    </Space>
                </Modal>
            </div>
    );
}